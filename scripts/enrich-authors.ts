/**
 * Arricchisce i canti senza subtitle (autore/compositore) via ricerca web.
 *
 * Run:
 *   npm run enrich-authors                    # esporta coda + processa batch 0
 *   npm run enrich-authors -- --offset 30 --batch 30
 *   npm run enrich-authors -- --apply         # applica match ad alta confidenza
 *   npm run enrich-authors -- --propagate-title  # copia subtitle da varianti stesso titolo
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Song, SongLine } from "../src/types";
import { SONGS } from "../src/songs/index";

const ORIGINAL_IDS = new Set([
  "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11",
  "b1", "b2", "b3", "b4", "b5", "b5mi", "b6", "b7", "b8", "b9",
]);

const QUEUE_PATH = join(__dirname, "author-enrichment-queue.json");
const REPORT_PATH = join(__dirname, "author-enrichment-report.json");
const IMPORTED_PATH = join(__dirname, "../src/songs/imported.ts");
const INDEX_PATH = join(__dirname, "../src/songs/index.ts");

type Confidence = "high" | "medium" | "low" | "not_found" | "traditional";

interface QueueItem {
  id: string;
  code: string;
  title: string;
  sectionId: string;
  firstLyricsLine: string;
  lyricsSnippet: string;
}

interface EnrichmentResult {
  id: string;
  title: string;
  author?: string;
  confidence: Confidence;
  sources: string[];
  queries: string[];
  lyricsMatch: boolean;
  notes?: string;
  processedAt: string;
}

interface Report {
  updatedAt: string;
  results: Record<string, EnrichmentResult>;
}

/** Normalizza nomi autore verso convenzione canzoniere. */
const AUTHOR_ALIASES: Record<string, string> = {
  "marco frisina": "m. frisina",
  frisina: "m. frisina",
  "m frisina": "m. frisina",
  "m. frisina": "m. frisina",
  "fr. buttazzo": "f. buttazzo",
  buttazzo: "f. buttazzo",
  "fabio buttazzo": "f. buttazzo",
  "f buttazzo": "f. buttazzo",
  "f. buttazzo": "f. buttazzo",
  "gen verde": "Gen Verde",
  "gen rosso": "Gen Rosso",
  giombini: "Giombini",
  "marcello giombini": "Giombini",
  "marco giombini": "Giombini",
  "claudio chieffo": "Claudio Chieffo",
  chieffo: "Claudio Chieffo",
  "d. ricci": "D. Ricci",
  "daniele ricci": "D. Ricci",
  "don ricci": "D. Ricci",
  ricci: "D. Ricci",
  emberti: "Emberti",
  gialloreti: "Gialloreti",
  "emberti / gialloreti": "Emberti / Gialloreti",
  "piero sansoni": "Piero Sansoni",
  sansoni: "Piero Sansoni",
  "beny conte": "Beny Conte",
  "g. ferrante": "G. Ferrante",
  "don paolo auricchio": "Don Paolo Auricchio",
  auricchio: "Don Paolo Auricchio",
  "marco sequeri": "Sequeri",
  sequeri: "Sequeri",
  "paolo auricchio": "Don Paolo Auricchio",
  "luigi giussani": "Luigi Giussani",
  giussani: "Luigi Giussani",
  "raoul follereau": "Raoul Follereau",
  follereau: "Raoul Follereau",
  "david haas": "David Haas",
  haas: "David Haas",
  "marty haugen": "Marty Haugen",
  haugen: "Marty Haugen",
  "taizé": "Taizé",
  taize: "Taizé",
  "alberto marani": "Alberto Marani",
  marani: "Alberto Marani",
  "a. marani": "Alberto Marani",
  "domenico machetta": "D. Machetta",
  "d. machetta": "D. Machetta",
  machetta: "D. Machetta",
  "don machetta": "D. Machetta",
  "amelio cimini": "Amelio Cimini",
  cimini: "Amelio Cimini",
  mellino: "Mellino",
  zambuto: "Matteo Zambuto",
  "matteo zambuto": "Matteo Zambuto",
  "enrico casati": "Enrico Casati",
  casati: "Enrico Casati",
  "giosy cento": "Giosy Cento",
  "g. cento": "Giosy Cento",
  cento: "Giosy Cento",
  "pino fanelli": "Pino Fanelli",
  fanelli: "Pino Fanelli",
  "francesco buttazzo": "f. buttazzo",
  "pierangelo sequeri": "Sequeri",
  sequeri: "Sequeri",
  "p. sequeri": "Sequeri",
  "pietro janin": "Pietro Janin",
  janin: "Pietro Janin",
  "s. martinez": "S. Martinez",
  martinez: "S. Martinez",
  "m. c. pecoraro": "M. C. Pecoraro",
  pecoraro: "M. C. Pecoraro",
  "riz ortolani": "R. Ortolani",
  ortolani: "R. Ortolani",
  "r. ortolani": "R. Ortolani",
  "c. baglioni": "C. Baglioni & R. Ortolani",
  baglioni: "C. Baglioni & R. Ortolani",
};

const AUTHOR_BLOCKLIST = new Set([
  "vivere", "liturgia", "liturgico", "liturgica", "sacra", "testo", "accordi",
  "coro", "youtube", "pdf", "canto", "canti", "inno", "salmo", "messaggio",
  "vangelo", "rit", "strofa", "verso", "pagina", "video", "download",
  "nuoro", "openai", "chatgpt", "chat gpt", "privacy", "termini", "personaggi",
  "irving", "lazio", "suoni",
]);

const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Timeout ${FETCH_TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const KNOWN_AUTHOR_RE =
  /\b(?:Marco Frisina|Fr\.?\s*Buttazzo|Fabio Buttazzo|Francesco Buttazzo|Gen Verde|Gen Rosso|Marcello Giombini|Marco Giombini|Giombini|Claudio Chieffo|Daniele Ricci|Don Ricci|D\. Ricci|Emberti|Gialloreti|Piero Sansoni|Beny Conte|G\. Ferrante|Paolo Auricchio|Don Paolo Auricchio|Marco Sequeri|Pierangelo Sequeri|Sequeri|Luigi Giussani|Raoul Follereau|David Haas|Marty Haugen|Taizé|Taize|Alberto Marani|A\. Marani|Domenico Machetta|D\. Machetta|Amelio Cimini|Mellino|Matteo Zambuto|Enrico Casati|Giosy Cento|G\. Cento|Pino Fanelli|Pietro Janin|S\. Martinez|M\. C\. Pecoraro|Riz Ortolani|R\. Ortolani|C\. Baglioni)\b/gi;

const TRADITIONAL_RE =
  /\b(?:tradizionale|trad\.?|canto tradizionale|canto popolare|anonimo|antico inno|inno antico|melodia tradizionale|wikisource)\b/i;

const PAREN_AUTHOR_RE =
  /\(([A-ZÀ-ÿ][A-Za-zÀ-ÿ.'\-\s]{2,35})\)/g;

const INITIAL_SURNAME_RE =
  /\b([A-Z]\.\s*[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)?)\b/g;

const AUTHOR_LABEL_RE =
  /(?:autore|compositore|comp\.|arr\.|arrangiatore|scritto da|testo di|musica di)\s*[:\-]?\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ.'\-\s]{2,40})/gi;

const TITLE_AUTHOR_RE =
  /[-–—]\s*([A-ZÀ-ÿ][A-Za-zÀ-ÿ.'\-\s]{2,35})\s*(?:[-–—|]|$)/;

function parseArgs(): {
  batch: number;
  offset: number;
  apply: boolean;
  exportOnly: boolean;
  delayMs: number;
  propagateTitle: boolean;
} {
  const args = process.argv.slice(2);
  let batch = 25;
  let offset = 0;
  let apply = false;
  let exportOnly = false;
  let delayMs = 1200;
  let propagateTitle = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--batch" && args[i + 1]) batch = Math.max(1, parseInt(args[++i], 10) || batch);
    else if (a === "--offset" && args[i + 1]) offset = Math.max(0, parseInt(args[++i], 10) || 0);
    else if (a === "--delay" && args[i + 1]) delayMs = Math.max(500, parseInt(args[++i], 10) || delayMs);
    else if (a === "--apply") apply = true;
    else if (a === "--export-only") exportOnly = true;
    else if (a === "--propagate-title") propagateTitle = true;
  }
  return { batch, offset, apply, exportOnly, delayMs, propagateTitle };
}

function normalizeTitleKey(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`´']/g, "'")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function titlesFuzzyMatch(a: string, b: string): boolean {
  const na = normalizeTitleKey(a);
  const nb = normalizeTitleKey(b);
  if (!na || !nb || na === nb) return na === nb;
  if (na.length < 6 || nb.length < 6) return false;
  const dist = titleLevenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return dist <= 2 || 1 - dist / maxLen >= 0.92;
}

const TITLE_EMBEDDED_AUTHOR: [RegExp, string][] = [
  [/\(Gen Verde\)/i, "Gen Verde"],
  [/\(Gen Rosso\)/i, "Gen Rosso"],
  [/\(gen verde\)/i, "Gen Verde"],
  [/\(gen rosso\)/i, "Gen Rosso"],
  [/\(m\.?\s*frisina\)/i, "m. frisina"],
  [/\(f\.?\s*buttazzo\)/i, "f. buttazzo"],
  [/\(Giombini\)/i, "Giombini"],
  [/\(Taiz[ée]\)/i, "Taizé"],
  [/\bGen Verde\b/i, "Gen Verde"],
  [/\bGen Rosso\b/i, "Gen Rosso"],
  [/\bbiagioli\b/i, "biagioli"],
  [/\bbuttazzo\b/i, "f. buttazzo"],
  [/\bfrisina\b/i, "m. frisina"],
  [/\bgiombini\b/i, "Giombini"],
  [/\bsequeri\b/i, "Sequeri"],
  [/\bmachetta\b/i, "D. Machetta"],
  [/\bD\. Ricci\b/i, "D. Ricci"],
  [/\bVerbum Panis\b/i, "Gen Verde"],
  [/\bTaiz[ée]\b/i, "Taizé"],
];

function authorFromEmbeddedTitle(title: string): string | undefined {
  for (const [re, author] of TITLE_EMBEDDED_AUTHOR) {
    if (re.test(title)) return author;
  }
  const paren = title.match(/\(([A-Za-zÀ-ÿ.'\-\s]{3,40})\)/);
  if (paren) return canonicalAuthor(paren[1]);
  return undefined;
}

function propagateSubtitlesFromSiblings(): { applied: { id: string; title: string; subtitle: string; via: string }[] } {
  const applied: { id: string; title: string; subtitle: string; via: string }[] = [];
  const subtitleById = new Map<string, string>();

  const byExact = new Map<string, Song[]>();
  for (const s of SONGS) {
    const k = normalizeTitleKey(s.title);
    if (!k) continue;
    if (!byExact.has(k)) byExact.set(k, []);
    byExact.get(k)!.push(s);
  }

  for (const [, group] of byExact) {
    const withSub = group.filter((s) => s.subtitle?.trim());
    const without = group.filter((s) => !s.subtitle?.trim());
    if (withSub.length !== 1 || !without.length) continue;
    const sub = withSub[0].subtitle!.trim();
    for (const s of without) {
      if (!subtitleById.has(s.id)) {
        subtitleById.set(s.id, sub);
        applied.push({ id: s.id, title: s.title, subtitle: sub, via: "exact-title" });
      }
    }
  }

  const withoutSub = SONGS.filter((s) => !s.subtitle?.trim() && !subtitleById.has(s.id));
  for (const song of withoutSub) {
    const fuzzySiblings = SONGS.filter(
      (s) => s.id !== song.id && titlesFuzzyMatch(song.title, s.title),
    );
    const withSub = fuzzySiblings.filter((s) => s.subtitle?.trim());
    if (withSub.length !== 1) continue;
    const sub = withSub[0].subtitle!.trim();
    subtitleById.set(song.id, sub);
    applied.push({ id: song.id, title: song.title, subtitle: sub, via: "fuzzy-title" });
  }

  for (const song of SONGS) {
    if (song.subtitle?.trim() || subtitleById.has(song.id)) continue;
    const fromTitle = authorFromEmbeddedTitle(song.title);
    if (fromTitle) {
      subtitleById.set(song.id, fromTitle);
      applied.push({ id: song.id, title: song.title, subtitle: fromTitle, via: "title-embedded" });
    }
  }

  if (!subtitleById.size) return { applied };

  const imported = SONGS.filter((s) => !ORIGINAL_IDS.has(s.id)).map((s) =>
    subtitleById.has(s.id) ? { ...s, subtitle: subtitleById.get(s.id) } : s,
  );

  const header = `import { Song, SongLine } from "../types";

const c = (text: string): SongLine => ({ type: "chords", text });
const l = (text: string): SongLine => ({ type: "lyrics", text });
const n = (text: string): SongLine => ({ type: "note", text });

export const IMPORTED_SONGS: Song[] = [
`;
  writeFileSync(IMPORTED_PATH, header + imported.map(serializeSong).join("\n") + "\n];\n", "utf8");

  let indexSrc = readFileSync(INDEX_PATH, "utf8");
  for (const id of [...subtitleById.keys()].filter((id) => ORIGINAL_IDS.has(id))) {
    const sub = subtitleById.get(id)!;
    const idRe = new RegExp(
      `(id:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*\\n\\s*code:[^\\n]+\\n\\s*title:[^\\n]+\\n)(?!\\s*subtitle:)`,
    );
    if (idRe.test(indexSrc)) {
      indexSrc = indexSrc.replace(idRe, `$1    subtitle: "${escapeTs(sub)}",\n`);
    }
  }
  writeFileSync(INDEX_PATH, indexSrc, "utf8");

  return { applied };
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`´']/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function firstLyrics(song: Song): { line: string; snippet: string } {
  const lyrics = song.lines.filter((ln) => ln.type === "lyrics").map((ln) => ln.text.trim());
  const line = lyrics[0] ?? "";
  const snippet = lyrics.slice(0, 2).join(" ").slice(0, 120);
  return { line, snippet };
}

function buildQueue(): QueueItem[] {
  return SONGS.filter((s) => !s.subtitle?.trim()).map((s) => {
    const { line, snippet } = firstLyrics(s);
    return {
      id: s.id,
      code: s.code,
      title: s.title,
      sectionId: s.sectionId,
      firstLyricsLine: line,
      lyricsSnippet: snippet,
    };
  });
}

function loadReport(): Report {
  if (!existsSync(REPORT_PATH)) {
    return { updatedAt: new Date().toISOString(), results: {} };
  }
  return JSON.parse(readFileSync(REPORT_PATH, "utf8")) as Report;
}

function saveReport(report: Report): void {
  report.updatedAt = new Date().toISOString();
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
}

function canonicalAuthor(raw: string): string | undefined {
  let cleaned = raw
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?|]+$/g, "")
    .replace(/^(don|fra|p\.|d\.|a\.|m\.|g\.)\s+/i, (m) => m.toLowerCase());
  if (!cleaned || cleaned.length < 3) return undefined;
  const lower = cleaned.toLowerCase();
  if (AUTHOR_BLOCKLIST.has(lower)) return undefined;
  if (TRADITIONAL_RE.test(lower)) return "Trad.";
  for (const [key, val] of Object.entries(AUTHOR_ALIASES)) {
    if (lower === key) return val;
  }
  for (const [key, val] of Object.entries(AUTHOR_ALIASES)) {
    if (lower.includes(key) && key.length >= 5) return val;
  }
  const bad = ["testo", "musica", "canto", "liturgia", "salmo", "inno", "coro", "youtube", "pdf", "accordi"];
  if (bad.some((b) => lower === b || lower.startsWith(b + " "))) return undefined;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 4 || words.length === 0) return undefined;
  if (words.length === 1 && words[0].length < 5) return undefined;
  if (words.every((w) => w.length <= 2)) return undefined;
  return cleaned;
}

function authorFromUrl(url: string): string | undefined {
  const slug = url.toLowerCase();
  for (const [key, val] of Object.entries(AUTHOR_ALIASES)) {
    const slugKey = key.replace(/\s+/g, "-").replace(/\./g, "");
    if (slug.includes(slugKey)) return val;
  }
  const m = slug.match(/-([a-z])-([a-z]{4,})(?:[/?#]|$)/);
  if (m) {
    const initial = m[1].toUpperCase();
    const surname = m[2].charAt(0).toUpperCase() + m[2].slice(1);
    return canonicalAuthor(`${initial}. ${surname}`);
  }
  return undefined;
}

function extractAuthorsFromText(text: string, url = ""): string[] {
  const found = new Set<string>();
  const decoded = decodeHtml(text);

  for (const m of decoded.matchAll(KNOWN_AUTHOR_RE)) {
    const c = canonicalAuthor(m[0]);
    if (c) found.add(c);
  }

  for (const m of decoded.matchAll(AUTHOR_LABEL_RE)) {
    const c = canonicalAuthor(m[1]);
    if (c) found.add(c);
  }

  for (const m of decoded.matchAll(PAREN_AUTHOR_RE)) {
    const inner = m[1].trim();
    if (/^(RC|DO|RE|MI|LA|SOL|SI|FA|in Do|in La|III|II|I Lit)/i.test(inner)) continue;
    const c = canonicalAuthor(inner);
    if (c) found.add(c);
  }

  for (const m of decoded.matchAll(INITIAL_SURNAME_RE)) {
    const c = canonicalAuthor(m[1]);
    if (c) found.add(c);
  }

  const titleMatch = decoded.match(TITLE_AUTHOR_RE);
  if (titleMatch) {
    const c = canonicalAuthor(titleMatch[1]);
    if (c) found.add(c);
  }

  if (url) {
    const fromUrl = authorFromUrl(url);
    if (fromUrl) found.add(fromUrl);
  }

  return [...found];
}

function lyricsInText(lyricsSnippet: string, text: string): boolean {
  if (!lyricsSnippet || lyricsSnippet.length < 12) return false;
  const normLyrics = normalizeText(lyricsSnippet);
  const normText = normalizeText(text);
  const words = normLyrics.split(" ").filter((w) => w.length > 3);
  if (words.length < 3) return normText.includes(normLyrics.slice(0, 30));
  const hits = words.filter((w) => normText.includes(w)).length;
  return hits / words.length >= 0.55;
}

interface SearchHit {
  title: string;
  snippet: string;
  url: string;
}

async function webSearchDdg(query: string): Promise<SearchHit[]> {
  const res = await fetchWithTimeout("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "it-IT,it;q=0.9",
    },
    body: `q=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
  const html = await res.text();
  if (html.length < 800) throw new Error(`DDG risposta vuota (${html.length} byte)`);
  const titles = [...html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/g)].map((m) =>
    decodeHtml(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()),
  );
  const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)].map((m) =>
    decodeHtml(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()),
  );
  const urls = [...html.matchAll(/class="result__url"[^>]*>([\s\S]*?)<\/a>/g)].map((m) =>
    decodeHtml(m[1].replace(/<[^>]+>/g, "").trim()),
  );
  const n = Math.max(titles.length, snippets.length, urls.length);
  const hits: SearchHit[] = [];
  for (let i = 0; i < n; i++) {
    hits.push({ title: titles[i] ?? "", snippet: snippets[i] ?? "", url: urls[i] ?? "" });
  }
  return hits;
}

async function webSearchBing(query: string): Promise<SearchHit[]> {
  const res = await fetchWithTimeout(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=it-IT`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "it-IT,it;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Bing HTTP ${res.status}`);
  const html = await res.text();
  const blocks = [...html.matchAll(/<li class="b_algo"[\s\S]*?<\/li>/g)];
  return blocks.slice(0, 10).map((b) => {
    const title = b[0].match(/<h2>\s*<a[^>]*>([\s\S]*?)<\/a>/);
    const snippet = b[0].match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const url = b[0].match(/<cite[^>]*>([\s\S]*?)<\/cite>/);
    return {
      title: decodeHtml(title?.[1]?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() ?? ""),
      snippet: decodeHtml(snippet?.[1]?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() ?? ""),
      url: decodeHtml(url?.[1]?.replace(/<[^>]+>/g, "").trim() ?? ""),
    };
  }).filter((h) => h.title || h.snippet);
}

async function webSearch(query: string): Promise<SearchHit[]> {
  try {
    const ddg = await webSearchDdg(query);
    if (ddg.length) return ddg;
  } catch {
    /* fallback */
  }
  return webSearchBing(query);
}

function buildQueries(item: QueueItem): string[] {
  const title = item.title.replace(/"/g, "").trim();
  const line = item.firstLyricsLine.replace(/"/g, "").slice(0, 80).trim();
  const queries = [
    `"${title}" site:animatamente.net OR site:arquen.it OR site:cantoeprego.it autore`,
    `"${title}" canti liturgici autore compositore`,
    `"${title}" "${line.slice(0, 50)}" autore`,
  ].filter((q) => q.length > 10);
  return [...new Set(queries)];
}

function scoreResult(
  authorVotes: Map<string, number>,
  sources: string[],
  lyricsMatch: boolean,
  traditionalHits: number,
): { author?: string; confidence: Confidence; notes?: string } {
  if (traditionalHits >= 2 && !authorVotes.size) {
    return { author: "Trad.", confidence: "traditional", notes: "Segnalato tradizionale da più fonti" };
  }

  const sorted = [...authorVotes.entries()].sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    if (traditionalHits === 1) {
      return { confidence: "low", notes: "Possibile tradizionale, non confermato" };
    }
    return { confidence: "not_found" };
  }

  const [topAuthor, topVotes] = sorted[0];
  const secondVotes = sorted[1]?.[1] ?? 0;

  if (topVotes >= 2 && topVotes > secondVotes) {
    if (lyricsMatch) return { author: topAuthor, confidence: "high" };
    return { author: topAuthor, confidence: "medium", notes: "Autore concorde ma testo non verificato" };
  }

  if (topVotes >= 1 && lyricsMatch && topVotes > secondVotes) {
    return { author: topAuthor, confidence: topVotes >= 2 ? "high" : "medium" };
  }

  if (topVotes >= 1 && !secondVotes) {
    return { author: topAuthor, confidence: lyricsMatch ? "medium" : "low" };
  }

  return {
    author: topAuthor,
    confidence: "low",
    notes: `Autori discordi: ${sorted.map(([a, v]) => `${a}(${v})`).join(", ")}`,
  };
}

async function enrichSong(item: QueueItem, delayMs: number): Promise<EnrichmentResult> {
  const authorVotes = new Map<string, number>();
  const sources: string[] = [];
  const queries = buildQueries(item);
  let lyricsMatch = false;
  let traditionalHits = 0;

  for (const query of queries) {
    try {
      const hits = await webSearch(query);
      const combined = hits.map((h) => `${h.title} ${h.snippet}`).join(" ");
      if (lyricsInText(item.lyricsSnippet || item.firstLyricsLine, combined)) lyricsMatch = true;
      if (TRADITIONAL_RE.test(combined)) traditionalHits++;

      for (const hit of hits) {
        const blob = `${hit.title} ${hit.snippet}`;
        const authors = [
          ...extractAuthorsFromText(blob, hit.url),
          ...extractAuthorsFromText(hit.title, hit.url),
        ];
        const unique = [...new Set(authors)];
        if (unique.length) sources.push(hit.url || hit.title.slice(0, 80));
        for (const a of unique) {
          authorVotes.set(a, (authorVotes.get(a) ?? 0) + 1);
        }
      }
    } catch (e) {
      sources.push(`error: ${e instanceof Error ? e.message : String(e)}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const { author, confidence, notes } = scoreResult(authorVotes, sources, lyricsMatch, traditionalHits);

  return {
    id: item.id,
    title: item.title,
    author,
    confidence,
    sources: [...new Set(sources)].slice(0, 8),
    queries,
    lyricsMatch,
    notes,
    processedAt: new Date().toISOString(),
  };
}

function escapeTs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function lineFn(ln: SongLine): string {
  const t = escapeTs(ln.text);
  if (ln.type === "chords") return `      c("${t}"),`;
  if (ln.type === "note") return `      n("${t}"),`;
  return `      l("${t}"),`;
}

function serializeSong(song: Song): string {
  const lines: string[] = ["  {"];
  lines.push(`    id: "${escapeTs(song.id)}",`);
  lines.push(`    code: "${escapeTs(song.code)}",`);
  lines.push(`    title: "${escapeTs(song.title)}",`);
  if (song.subtitle) lines.push(`    subtitle: "${escapeTs(song.subtitle)}",`);
  lines.push(`    sectionId: "${escapeTs(song.sectionId)}",`);
  if (song.themes?.length) {
    lines.push(`    themes: [${song.themes.map((t) => `"${escapeTs(t)}"`).join(", ")}],`);
  }
  lines.push("    lines: [");
  for (const ln of song.lines) lines.push(lineFn(ln));
  lines.push("    ],");
  lines.push("  },");
  return lines.join("\n");
}

function isBlockedAuthor(author: string): boolean {
  const lower = author.toLowerCase().trim();
  if (AUTHOR_BLOCKLIST.has(lower)) return true;
  return [...AUTHOR_BLOCKLIST].some((b) => b.length >= 5 && lower.includes(b));
}

function applyHighConfidence(report: Report): { applied: EnrichmentResult[]; skipped: string[] } {
  const toApply = Object.values(report.results).filter(
    (r) =>
      r.confidence === "high" &&
      r.author &&
      r.author !== "Trad." &&
      !isBlockedAuthor(r.author),
  );
  const applied: EnrichmentResult[] = [];
  const skipped: string[] = [];

  const subtitleById = new Map<string, string>();
  for (const r of toApply) {
    const song = SONGS.find((s) => s.id === r.id);
    if (!song) {
      skipped.push(`${r.id}: canto non trovato`);
      continue;
    }
    if (song.subtitle?.trim()) {
      skipped.push(`${r.id}: subtitle già presente`);
      continue;
    }
    subtitleById.set(r.id, r.author!);
    applied.push(r);
  }

  if (!subtitleById.size) return { applied, skipped };

  const imported = SONGS.filter((s) => !ORIGINAL_IDS.has(s.id)).map((s) =>
    subtitleById.has(s.id) ? { ...s, subtitle: subtitleById.get(s.id) } : s,
  );

  const header = `import { Song, SongLine } from "../types";

const c = (text: string): SongLine => ({ type: "chords", text });
const l = (text: string): SongLine => ({ type: "lyrics", text });
const n = (text: string): SongLine => ({ type: "note", text });

export const IMPORTED_SONGS: Song[] = [
`;
  writeFileSync(IMPORTED_PATH, header + imported.map(serializeSong).join("\n") + "\n];\n", "utf8");

  const indexOriginalIds = [...subtitleById.keys()].filter((id) => ORIGINAL_IDS.has(id));
  if (indexOriginalIds.length) {
    let indexSrc = readFileSync(INDEX_PATH, "utf8");
    for (const id of indexOriginalIds) {
      const sub = subtitleById.get(id)!;
      const idRe = new RegExp(`(id:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*\\n\\s*code:[^\\n]+\\n\\s*title:[^\\n]+\\n)(?!\\s*subtitle:)`);
      if (idRe.test(indexSrc)) {
        indexSrc = indexSrc.replace(idRe, `$1    subtitle: "${escapeTs(sub)}",\n`);
      } else {
        skipped.push(`${id}: patch index.ts fallita`);
      }
    }
    writeFileSync(INDEX_PATH, indexSrc, "utf8");
  }

  return { applied, skipped };
}

async function main(): Promise<void> {
  const { batch, offset, apply, exportOnly, delayMs, propagateTitle } = parseArgs();

  const queue = buildQueue();
  writeFileSync(
    QUEUE_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), total: queue.length, items: queue }, null, 2),
    "utf8",
  );
  console.log(`Coda: ${queue.length} canti senza subtitle → ${QUEUE_PATH}`);

  if (propagateTitle) {
    const { applied } = propagateSubtitlesFromSiblings();
    console.log("\n=== Propagate subtitle (siblings / title) ===");
    console.log(`Applicati: ${applied.length}`);
    for (const r of applied) {
      console.log(`  ${r.id}: "${r.title}" → ${r.subtitle} (${r.via})`);
    }
    return;
  }

  if (apply) {
    const report = loadReport();
    const { applied, skipped } = applyHighConfidence(report);
    console.log("\n=== Apply subtitle (solo high) ===");
    console.log(`Applicati: ${applied.length}`);
    for (const r of applied.slice(0, 20)) {
      console.log(`  ${r.id}: "${r.title}" → ${r.author}`);
    }
    if (applied.length > 20) console.log(`  ... +${applied.length - 20}`);
    if (skipped.length) console.log(`Saltati: ${skipped.join("; ")}`);
    return;
  }

  if (exportOnly) return;

  const report = loadReport();
  const pending = queue.filter((item) => !report.results[item.id]);
  const slice = pending.slice(offset, offset + batch);
  console.log(
    `\nBatch offset=${offset} size=${slice.length} pending=${pending.length} (delay ${delayMs}ms)\n`,
  );

  let processed = 0;
  for (const item of slice) {
    process.stdout.write(`[${processed + 1}/${slice.length}] ${item.code} ${item.title.slice(0, 50)}... `);
    const result = await enrichSong(item, delayMs);
    report.results[item.id] = result;
    saveReport(report);
    console.log(`${result.confidence}${result.author ? ` → ${result.author}` : ""}`);
    processed++;
  }

  const all = Object.values(report.results);
  const stats = {
    processed: all.length,
    high: all.filter((r) => r.confidence === "high").length,
    medium: all.filter((r) => r.confidence === "medium").length,
    low: all.filter((r) => r.confidence === "low").length,
    traditional: all.filter((r) => r.confidence === "traditional").length,
    not_found: all.filter((r) => r.confidence === "not_found").length,
  };

  console.log("\n=== Report ===");
  console.log(JSON.stringify(stats, null, 2));
  console.log(`\nProssimo batch: npm run enrich-authors -- --offset ${offset + batch} --batch ${batch}`);
  console.log(`Apply: npm run enrich-authors -- --apply`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
