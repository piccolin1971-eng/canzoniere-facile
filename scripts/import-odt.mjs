/**
 * Import songs from ODT songbooks into src/songs/imported.ts
 * Run: node scripts/import-odt.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { odtToText } from "./parse-odt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const ODT_FILES = [
  {
    path: "c:/Users/picco/Desktop/Canzonieri/Solo per te io canto - Libretto canti con accordi - 2018.odt",
    source: "solo-per-te",
    codePrefix: "SP",
    parser: "soloPerTe",
  },
  {
    path: "c:/Users/picco/Desktop/Canzonieri/librettocantichiesa_diamogustoallavita_2022ok.odt",
    source: "diamogusto",
    codePrefix: "DG",
    parser: "diamogusto",
  },
];

const NOTE_PREFIX = /^(intro|intr\.?|finale|fin\.?|rit\.|rit:|parlato|\[|t:|f:|m:|strum)/i;
const PAGE_MARK = /^(- \d+ -|\d+ of \d+--?|-- \d+ of \d+ --)$/;
const TITLE_RE = /^(\d+)\.\s+(.+)$/;
const LIB_TITLE = /^(\d{3})\.\s+(.+)$/;
const METADATA_RE =
  /Autore sconosciuto|20\d{2}-\d{2}-\d{2}T|Sistemare posizioni|Indice personalizzato|Creative Commons|altervista|Ultimo aggiornamento|Questo documento|scaricat/i;
const AUTHOR_VARIANT_RE =
  /\((?:f\.|g\.|m\.|d\.|l\.|s\.|a\.|p\.|c\.|b\.|gen\s|rns|pa\.|in\s+[A-Za-z#-]|c\.\s|m\.\s|p\.\s|g\.\s|d\.\s|l\.\s|s\.\s|a\.\s|b\.\s)/i;
const LYRIC_TITLE_REJECT =
  /^[\*\s]|\.{2,}|\b2x\b$|,\s*(Signore|Cristo|alleluia|pietà|noi|tu|ti|di)\b|^(abbi|accogli|ti |noi |la |il |che |per |con |una |e |a )/i;

const SOLFEGE_ROOT = /^(Do|Re|Mi|Fa|Sol|La|Si)(?:#|b|-)?(?:\d+|\+|\(.*)?$/i;

function fixEncoding(s) {
  return s
    .replace(/\uFFFD/g, "'")
    .replace(/�/g, "'")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, "...")
    .trim();
}

function normTitle(s) {
  return fixEncoding(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(title, subtitle) {
  const base = normTitle(subtitle ? `${title} ${subtitle}` : title)
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return base || "canto";
}

function isCatalogTitle(numStr, rest) {
  const letters = rest.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 3) return false;
  const upper = (rest.match(/[A-ZÀ-Ú]/g) || []).length;
  return upper / letters.length >= 0.72;
}

function tokenIsChord(tok) {
  const cleaned = tok.replace(/^\//, "").replace(/^\(/, "");
  if (SOLFEGE_ROOT.test(cleaned)) return true;
  if (tok.includes("/")) {
    return tok.split("/").every((p) => {
      const x = p.replace(/^\(/, "").replace(/\)$/, "");
      return SOLFEGE_ROOT.test(x);
    });
  }
  return false;
}

function isChordLine(line) {
  const t = line.trim();
  if (!t || NOTE_PREFIX.test(t)) return false;
  if (/^\d+\.\s/.test(t) && !/\([^)]+\)/.test(t)) return false;
  if (/^[a-zà-ù].*[,:;!?]$/.test(t)) return false;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.length > 24) return false;
  let chordish = 0;
  for (const tok of tokens) if (tokenIsChord(tok)) chordish++;
  if (chordish === 0) return false;
  return chordish / tokens.length >= 0.5;
}

function toActChordToken(tok) {
  const slashParts = tok.split("/");
  return slashParts
    .map((part, i) => {
      let p = part;
      if (i > 0 && !p.startsWith("(") && /^[A-Za-z]/.test(p)) p = p;
      const m = p.match(/^(\/)?([A-Za-z]{1,4})(#|b|-)?(\d+|\+|\(.*)?$/);
      if (!m) return p.toUpperCase();
      const prefix = m[1] || "";
      let note = m[2];
      let acc = m[3] || "";
      const tail = m[4] || "";
      note = note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
      const map = { Do: "DO", Re: "RE", Mi: "MI", Fa: "FA", Sol: "SOL", La: "LA", Si: "SI" };
      let out = map[note] || note.toUpperCase();
      if (acc === "b") {
        const flatMap = { DO: "DO-", RE: "RE-", MI: "MI-", FA: "FA-", SOL: "SOL-", LA: "LA-", SI: "SI-" };
        out = flatMap[out] || out + "b";
      } else if (acc === "-") out += "-";
      else if (acc === "#") out += "#";
      return prefix + out + tail;
    })
    .join("/");
}

function formatChords(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return tokens.map(toActChordToken).join("  ");
}

function classifyLine(line) {
  const t = fixEncoding(line);
  if (!t) return null;
  if (PAGE_MARK.test(t)) return null;
  if (METADATA_RE.test(t)) return null;
  if (/^\d+\s+[A-Z].+-\s+\d+\s+-$/.test(t)) return null;
  if (/^\/\/Libretto|^C a n t i|^della celebrazione|^edizione \d{4}$/i.test(t)) return null;
  if (NOTE_PREFIX.test(t) || /^\[.+\]$/.test(t)) {
    const note = t.startsWith("[") ? t : `[${t.replace(/:$/, "").toUpperCase()}]`;
    return { type: "note", text: note };
  }
  if (/^(intro|intr|finale|fin\.?|rit\.?):?\s/i.test(t)) {
    return { type: "note", text: `[${t.replace(/:$/, "").toUpperCase()}]` };
  }
  if (isChordLine(t)) return { type: "chords", text: formatChords(t) };
  return { type: "lyrics", text: t };
}

function splitTitle(raw) {
  const t = fixEncoding(raw);
  const multi = [...t.matchAll(/\(([^)]+)\)/g)];
  if (multi.length >= 2) {
    const last = multi[multi.length - 1][1];
    if (/^in\s+[A-Za-z#-]+$/i.test(last.trim())) {
      const titlePart = t.slice(0, multi[multi.length - 1].index).trim();
      const authorPart = multi
        .slice(0, -1)
        .map((m) => m[1])
        .join(" / ");
      return { title: titlePart.replace(/\s*\([^)]+\)\s*$/, "").trim() || titlePart, subtitle: `${authorPart} (${last})` };
    }
  }
  const paren = t.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (paren) return { title: paren[1].trim(), subtitle: paren[2].trim() };
  return { title: t, subtitle: undefined };
}

function isSoloPerTeTitle(line, nextLine) {
  const t = fixEncoding(line.trim());
  const next = fixEncoding((nextLine || "").trim());
  if (!t || t.length > 100 || METADATA_RE.test(t)) return false;
  if (PAGE_MARK.test(t) || NOTE_PREFIX.test(t) || isChordLine(t)) return false;
  if (LYRIC_TITLE_REJECT.test(t)) return false;
  if (/^\([^)]+\)\s*$/.test(t)) return false;
  if (/[.!?]\s*$/.test(t) && !/\([^)]+\)\s*$/.test(t)) return false;

  const tm = t.match(TITLE_RE);
  if (tm && isCatalogTitle(tm[1], tm[2])) return true;

  const beforeParen = t.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (!beforeParen || beforeParen.length < 2) return false;

  if (AUTHOR_VARIANT_RE.test(t)) return true;

  if (/^(intro|intr\.?)/i.test(next) && t.length <= 40 && t.split(/\s+/).length <= 6) {
    if (/^[A-ZÀ-Ú]/.test(t) && !/,/.test(t.replace(/\([^)]*\)/g, ""))) return true;
  }
  return false;
}

function parseSoloPerTe(text, source) {
  const lines = text.split("\n");
  const songs = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (isSoloPerTeTitle(trimmed, lines[i + 1])) {
      if (current?.lines.length) songs.push(current);
      const tm = trimmed.match(TITLE_RE);
      const raw = tm ? tm[2] : trimmed;
      const { title, subtitle } = splitTitle(raw);
      current = { title, subtitle, lines: [], source };
      continue;
    }
    if (!current) continue;
    const cl = classifyLine(trimmed);
    if (cl) current.lines.push(cl);
  }
  if (current?.lines.length) songs.push(current);
  return songs;
}

function parseDiamogustoIndex(text) {
  const titles = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\d+\s+(.+?)\t\d+$/);
    if (m) titles.push(fixEncoding(m[1].trim()));
  }
  return titles;
}

function parseDiamogusto(text, source) {
  const indexTitles = parseDiamogustoIndex(text);
  const titleByNorm = new Map(indexTitles.map((t) => [normTitle(t), t]));
  const bodyEnd = text.indexOf("Indice personalizzato");
  const body = bodyEnd > 0 ? text.slice(0, bodyEnd) : text;
  const lines = body.split("\n");
  const songs = [];
  let current = null;

  for (const raw of lines) {
    const trimmed = fixEncoding(raw.trim());
    if (!trimmed || METADATA_RE.test(trimmed)) continue;
    const canonical = titleByNorm.get(normTitle(trimmed));
    if (canonical) {
      if (current?.lines.length) songs.push(current);
      const { title, subtitle } = splitTitle(canonical);
      current = { title, subtitle, lines: [], source };
      continue;
    }
    if (!current) continue;
    const cl = classifyLine(trimmed);
    if (cl) current.lines.push(cl);
  }
  if (current?.lines.length) songs.push(current);
  return songs;
}

function guessSection(title, subtitle) {
  const full = `${title} ${subtitle || ""}`.toLowerCase();
  if (/avvento|natale|adeste|stelle|bethlem|noel|pastor|presepe/.test(full)) return "N";
  if (/pasqua|risort|quaresima|croce|passion|venerdì santo/.test(full)) return "P";
  if (/ave maria|maria|marian|madre/.test(full)) return "M";
  if (/kyrie|pietà|peniten|perdon|scusa signore|confession/.test(full)) return "A";
  if (/^gloria|gloria,|gloria a|gloria in excelsis|il signore è la luce/.test(full)) return "B";
  if (/agnello di dio|agnus dei/.test(full)) return "L";
  if (/^santo[^a-z]|sanctus|santo il signore/.test(full)) return "G";
  if (/alleluia|halleluia/.test(full)) return "D";
  if (/offertorio|offriamo|mistero della fede|pane del ciel|su questo altare|accogli i nostri/.test(full))
    return "E";
  if (/pace|shalom|scambio/.test(full)) return "H";
  if (/salmo|cantico|acclamate al signore|laudate|innalzate|i cieli narrano/.test(full)) return "C";
  if (/lode|dossologia|amen/.test(full)) return "F";
  return "C";
}

function loadExistingCatalog() {
  const existing = [];
  for (const rel of ["src/songs/index.ts", "src/songs/imported.ts"]) {
    const text = readFileSync(join(ROOT, rel), "utf8");
    const blocks = text.split(/\n  \{/);
    for (const block of blocks.slice(1)) {
      const idM = block.match(/^\s*id:\s*"([^"]+)"/m);
      const titleM = block.match(/^\s*title:\s*"((?:\\.|[^"\\])*)"/m);
      const subM = block.match(/^\s*subtitle:\s*"((?:\\.|[^"\\])*)"/m);
      if (!idM || !titleM) continue;
      existing.push({
        id: idM[1],
        title: titleM[1].replace(/\\"/g, '"'),
        subtitle: subM?.[1]?.replace(/\\"/g, '"'),
      });
    }
  }
  return existing;
}

function isDuplicate(title, subtitle, existing) {
  const n = normTitle(title);
  const ns = subtitle ? normTitle(subtitle) : "";
  return existing.some((e) => {
    const en = normTitle(e.title);
    const es = e.subtitle ? normTitle(e.subtitle) : "";
    if (n !== en) return false;
    if (es && ns) return es === ns || ns.includes(es) || es.includes(ns);
    if (es || ns) return false;
    return true;
  });
}

function songQualityOk(song) {
  if (/^\([^)]+\)\s*$/.test(song.title.trim())) return "paren-only title";
  if (song.lines.length < 4) return "too few lines";
  const lyrics = song.lines.filter((l) => l.type === "lyrics");
  const chords = song.lines.filter((l) => l.type === "chords");
  if (lyrics.length < 2) return "too few lyrics";
  if (chords.length < 1) return "missing chords";
  if (LYRIC_TITLE_REJECT.test(song.title)) return "bad title";
  return null;
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function genSong(song, id, sectionId, code) {
  const lines = song.lines
    .map((l) => {
      if (l.type === "chords") return `      c("${esc(l.text)}"),`;
      if (l.type === "note") return `      n("${esc(l.text)}"),`;
      return `      l("${esc(l.text)}"),`;
    })
    .join("\n");
  const subtitle = song.subtitle ? `\n    subtitle: "${esc(song.subtitle)}",` : "";
  return `  {
    id: "${id}",
    code: "${code}",
    title: "${esc(song.title)}",${subtitle}
    sectionId: "${sectionId}",
    lines: [
${lines}
    ],
  },`;
}

function appendToImported(newBlocks) {
  const importedPath = join(ROOT, "src/songs/imported.ts");
  let content = readFileSync(importedPath, "utf8");
  content = content.trimEnd();
  if (!content.endsWith("];")) throw new Error("imported.ts does not end with ];");
  content = content.slice(0, -2).trimEnd();
  if (content.endsWith(",")) content = content.slice(0, -1);
  content += ",\n" + newBlocks.join("\n") + "\n];\n";
  writeFileSync(importedPath, content, "utf8");
}

const existing = loadExistingCatalog();
const usedIds = new Set(existing.map((s) => s.id));
const usedNormKeys = new Set(existing.map((s) => `${normTitle(s.title)}|${normTitle(s.subtitle || "")}`));

const report = {
  sources: {},
  added: [],
  skipped: [],
  parseIssues: [],
  firstNewId: null,
};

for (const odt of ODT_FILES) {
  const text = odtToText(odt.path);
  writeFileSync(join(__dirname, `${odt.source}.txt`), text, "utf8");

  const parsed = odt.parser === "diamogusto" ? parseDiamogusto(text, odt.source) : parseSoloPerTe(text, odt.source);

  report.sources[odt.source] = {
    parsed: parsed.length,
    added: 0,
    skippedDuplicate: 0,
    skippedQuality: 0,
  };

  let seq = 1;
  for (const song of parsed) {
    const q = songQualityOk(song);
    if (q) {
      report.skipped.push({ title: song.title, subtitle: song.subtitle, reason: q, source: odt.source });
      report.sources[odt.source].skippedQuality++;
      if (parsed.length < 300) report.parseIssues.push({ title: song.title, source: odt.source, issue: q });
      continue;
    }

    const key = `${normTitle(song.title)}|${normTitle(song.subtitle || "")}`;
    if (usedNormKeys.has(key) || isDuplicate(song.title, song.subtitle, existing)) {
      report.skipped.push({ title: song.title, subtitle: song.subtitle, reason: "duplicate", source: odt.source });
      report.sources[odt.source].skippedDuplicate++;
      continue;
    }

    const sectionId = guessSection(song.title, song.subtitle);
    let baseId = slugify(song.title, song.subtitle);
    let id = baseId;
    let n = 2;
    while (usedIds.has(id)) id = `${baseId}-${n++}`;
    usedIds.add(id);
    usedNormKeys.add(key);
    existing.push({ id, title: song.title, subtitle: song.subtitle });

    const code = `${odt.codePrefix}${String(seq++).padStart(3, "0")}`;
    const block = genSong(song, id, sectionId, code);
    report.added.push({ id, title: song.title, subtitle: song.subtitle, source: odt.source, block });
    report.sources[odt.source].added++;
    if (!report.firstNewId) report.firstNewId = id;
  }
}

if (report.added.length) appendToImported(report.added.map((s) => s.block));

writeFileSync(
  join(__dirname, "import-odt-report.json"),
  JSON.stringify(
    {
      addedFromSoloPerTe: report.sources["solo-per-te"]?.added ?? 0,
      addedFromDiamogusto: report.sources["diamogusto"]?.added ?? 0,
      skippedDuplicate: report.skipped.filter((s) => s.reason === "duplicate").length,
      skippedQuality: report.skipped.filter((s) => s.reason !== "duplicate").length,
      firstNewId: report.firstNewId,
      sampleAdded: report.added.slice(0, 20).map((s) => ({ id: s.id, title: s.title, subtitle: s.subtitle })),
      parseIssues: report.parseIssues.slice(0, 40),
      sources: report.sources,
    },
    null,
    2,
  ),
  "utf8",
);

console.log("=== Import ODT ===");
for (const [src, stats] of Object.entries(report.sources)) {
  console.log(`${src}: parsed=${stats.parsed} added=${stats.added} dup=${stats.skippedDuplicate} quality=${stats.skippedQuality}`);
}
console.log(`Total added: ${report.added.length}`);
console.log(`First new id: ${report.firstNewId}`);
