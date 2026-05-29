/**
 * Piano pulizia doppioni (solo report, non modifica il catalogo).
 * Esclude formulari liturgici fissi (Kyrie, Gloria, Santo, Alleluia, Credo, Agnello…).
 *
 * Run: npx tsx scripts/plan-duplicate-cleanup.ts
 * Apply (dopo approvazione): npx tsx scripts/plan-duplicate-cleanup.ts --apply
 */
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Song } from "../src/types";
import { SONGS } from "../src/songs/index";

const HIDDEN_KEY = "canzoniere_hidden_songs";

/** Formulari liturgici: stesso testo possibile, melodie/arrangiamenti diversi → non toccare. */
const LITURGICAL_EXACT = new Set([
  "kyrie",
  "kyrie eleison",
  "gloria",
  "gloria a dio",
  "gloria in excelsis deo",
  "gloria gloria",
  "credo",
  "credo in dio padre",
  "santo",
  "santo santo santo",
  "alleluia",
  "agnello di dio",
  "agnus dei",
  "mistero della fede",
  "memoriale",
  "epiclisi",
  "osanna",
  "santo il signore",
  "signore pieta",
  "signore pietà",
]);

const LITURGICAL_PREFIX = [
  "kyrie",
  "gloria",
  "credo",
  "alleluia",
  "agnello di dio",
  "santo",
  "signore pieta",
];

function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`´']/g, "'")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLyricsContent(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`´']/g, "'")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function songLyricsBody(song: Song): string {
  return song.lines
    .filter((ln) => ln.type === "lyrics")
    .map((ln) => normalizeLyricsContent(ln.text))
    .filter(Boolean)
    .join(" ");
}

function levenshtein(a: string, b: string): number {
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

function lyricsSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function isTruncatedLyrics(shorter: string, longer: string): boolean {
  if (shorter.length < 80 || shorter.length >= longer.length) return false;
  if (longer.startsWith(shorter)) return true;
  if (shorter.length / longer.length < 0.55) return false;
  return lyricsSimilarity(shorter, longer.slice(0, shorter.length + 40)) >= 0.94;
}

export function isLiturgicalExempt(song: Song): boolean {
  const t = normalizeTitle(song.title);
  if (LITURGICAL_EXACT.has(t)) return true;
  for (const p of LITURGICAL_PREFIX) {
    if (t === p || t.startsWith(`${p} `)) return true;
  }
  return false;
}

function lyricsBodyHash(song: Song): string {
  const body = songLyricsBody(song);
  if (body.length < 40) return "";
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

function scoreKeeper(song: Song): number {
  let score = song.lines.length;
  if (song.subtitle) score += 5;
  if (!/^(longarone|seminario|frate-jacopa|atteso)-/.test(song.id)) score += 20;
  if (song.code && !song.code.startsWith("LG") && !song.code.startsWith("SM") && !song.code.startsWith("FJ")) {
    score += 10;
  }
  return score;
}

function pickKeeper(songs: Song[]): Song {
  return [...songs].sort((a, b) => scoreKeeper(b) - scoreKeeper(a))[0];
}

type CleanupGroup = {
  reason: "exact_lyrics" | "same_title" | "truncated" | "near_lyrics";
  keep: { id: string; code: string; title: string; subtitle?: string; lines: number };
  remove: { id: string; code: string; title: string; subtitle?: string; lines: number }[];
  preview: string;
  skippedLiturgical: boolean;
};

function songBrief(s: Song) {
  return {
    id: s.id,
    code: s.code,
    title: s.title,
    subtitle: s.subtitle,
    lines: s.lines.length,
  };
}

function groupHasLiturgical(songs: Song[]): boolean {
  return songs.some(isLiturgicalExempt);
}

// --- build groups ---
const byNormTitle = new Map<string, Song[]>();
const byLyricsHash = new Map<string, Song[]>();

for (const s of SONGS) {
  const nt = normalizeTitle(s.title);
  if (!byNormTitle.has(nt)) byNormTitle.set(nt, []);
  byNormTitle.get(nt)!.push(s);

  const h = lyricsBodyHash(s);
  if (h) {
    if (!byLyricsHash.has(h)) byLyricsHash.set(h, []);
    byLyricsHash.get(h)!.push(s);
  }
}

const groups: CleanupGroup[] = [];
const removeIds = new Set<string>();

// Same normalized title, multiple songs (non-liturgical only)
for (const [, songs] of byNormTitle) {
  if (songs.length < 2) continue;
  if (groupHasLiturgical(songs)) continue;

  const keeper = pickKeeper(songs);
  const toRemove = songs.filter((s) => s.id !== keeper.id);
  if (!toRemove.length) continue;

  groups.push({
    reason: "same_title",
    keep: songBrief(keeper),
    remove: toRemove.map(songBrief),
    preview: normalizeTitle(keeper.title),
    skippedLiturgical: false,
  });
  for (const s of toRemove) removeIds.add(s.id);
}

// Exact lyrics, different title
for (const [, songs] of byLyricsHash) {
  const uniq = [...new Map(songs.map((s) => [s.id, s])).values()];
  if (uniq.length < 2) continue;
  if (groupHasLiturgical(uniq)) continue;

  const titles = new Set(uniq.map((s) => normalizeTitle(s.title)));
  if (titles.size < 2) continue;

  const keeper = pickKeeper(uniq);
  const toRemove = uniq.filter((s) => s.id !== keeper.id && !removeIds.has(s.id));
  if (!toRemove.length) continue;

  groups.push({
    reason: "exact_lyrics",
    keep: songBrief(keeper),
    remove: toRemove.map(songBrief),
    preview: songLyricsBody(keeper).slice(0, 80),
    skippedLiturgical: false,
  });
  for (const s of toRemove) removeIds.add(s.id);
}

// Truncated duplicates (cross-title) — prefix bucket, no O(n²) near_lyrics scan
const PREFIX_LEN = 80;
const bodies = SONGS.map((s) => ({ song: s, body: songLyricsBody(s) })).filter((x) => x.body.length >= 80);
const byPrefix = new Map<string, { song: Song; body: string }[]>();

for (const entry of bodies) {
  const key = entry.body.slice(0, PREFIX_LEN);
  if (!byPrefix.has(key)) byPrefix.set(key, []);
  byPrefix.get(key)!.push(entry);
}

for (const [, bucket] of byPrefix) {
  if (bucket.length < 2) continue;
  bucket.sort((a, b) => a.body.length - b.body.length);

  for (let i = 0; i < bucket.length; i++) {
    for (let j = i + 1; j < bucket.length; j++) {
      const { song: sa, body: la } = bucket[i];
      const { song: sb, body: lb } = bucket[j];
      if (normalizeTitle(sa.title) === normalizeTitle(sb.title)) continue;
      if (isLiturgicalExempt(sa) || isLiturgicalExempt(sb)) continue;
      if (removeIds.has(sa.id) || removeIds.has(sb.id)) continue;
      if (!isTruncatedLyrics(la, lb)) continue;

      const keeper = sb;
      const drop = sa;
      if (removeIds.has(drop.id)) continue;

      groups.push({
        reason: "truncated",
        keep: songBrief(keeper),
        remove: [songBrief(drop)],
        preview: lb.slice(0, 80),
        skippedLiturgical: false,
      });
      removeIds.add(drop.id);
    }
  }
}

const skippedLiturgicalCount = [...byNormTitle.values()].filter(
  (songs) => songs.length > 1 && groupHasLiturgical(songs),
).length;

const plan = {
  generatedAt: new Date().toISOString(),
  totalSongs: SONGS.length,
  liturgicalGroupsSkipped: skippedLiturgicalCount,
  groupsToClean: groups.length,
  songsToHide: removeIds.size,
  groups,
  hideIds: [...removeIds].sort(),
};

const outPath = join(__dirname, "plan-duplicate-cleanup.json");
writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");

console.log("=== Piano pulizia doppioni ===\n");
console.log(`Canti totali: ${plan.totalSongs}`);
console.log(`Gruppi liturgici esclusi (stesso titolo): ${plan.liturgicalGroupsSkipped}`);
console.log(`Gruppi da pulire: ${plan.groupsToClean}`);
console.log(`Canti da nascondere: ${plan.songsToHide}`);
console.log(`\nPiano: ${outPath}`);

if (groups.length) {
  console.log("\n--- Anteprima (max 20) ---");
  for (const g of groups.slice(0, 20)) {
    console.log(
      `[${g.reason}] KEEP "${g.keep.title}" (${g.keep.id})  →  rimuovi: ${g.remove.map((r) => r.title).join(", ")}`,
    );
  }
  if (groups.length > 20) console.log(`... +${groups.length - 20} gruppi`);
}

const apply = process.argv.includes("--apply");
if (apply) {
  if (!removeIds.size) {
    console.log("\nNessun canto da nascondere.");
    process.exit(0);
  }
  const hiddenPath = join(__dirname, "..", "src", "hidden-from-cleanup.json");
  writeFileSync(hiddenPath, JSON.stringify([...removeIds].sort(), null, 2), "utf8");
  console.log(`\nLista hide salvata in ${hiddenPath}`);
  console.log("Per applicare in app: unire in AsyncStorage canzoniere_hidden_songs o eseguire apply script dedicato.");
  console.log("(Usa l'app: Elimina canto sui singoli, oppure prossimo passo script merge.)");
}
