/**
 * Quality check: duplicates (doppioni) and refusi in Canzoniere Facile song DB.
 * Run: npx tsx scripts/check-songs.ts
 */
import { createHash } from "crypto";
import { writeFileSync } from "fs";
import { join } from "path";
import type { Song, SongLine } from "../src/types";
import { SONGS } from "../src/songs/index";

const ENCODING_ARTIFACTS = [
  /â€™/g,
  /â€˜/g,
  /â€œ/g,
  /â€/g,
  /Ã©/g,
  /Ã¨/g,
  /Ã¬/g,
  /Ã²/g,
  /Ã¹/g,
  /Ã /g,
  /ï¿½/g,
  /â€“/g,
  /â€"/g,
];

const CHORD_PATTERN =
  /^[\s/0-9A-Ga-g#b\-+°dimmajMAJaug susadd()]*$/;

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

function lyricsSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function isTruncatedLyrics(shorter: string, longer: string): boolean {
  if (shorter.length < 80 || shorter.length >= longer.length) return false;
  if (longer.startsWith(shorter)) return true;
  const ratio = shorter.length / longer.length;
  if (ratio < 0.55) return false;
  return lyricsSimilarity(shorter, longer.slice(0, shorter.length + 40)) >= 0.94;
}

function lyricsFingerprint(song: Song): string {
  return song.lines
    .filter((ln) => ln.type === "lyrics")
    .map((ln) => normalizeLyricsContent(ln.text))
    .join("|");
}

function lyricsBodyHash(song: Song): string {
  const body = songLyricsBody(song);
  if (body.length < 40) return "";
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

function lyricsBucketKey(body: string): string {
  if (body.length < 40) return "";
  const prefix = body.slice(0, 48);
  const lenBucket = Math.floor(body.length / 80);
  return `${lenBucket}:${prefix}`;
}

function contentHash(song: Song): string {
  const payload = song.lines.map((ln) => `${ln.type}:${ln.text}`).join("\n");
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function lineLooksLikeChordOnly(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 120) return false;
  if (/[a-zàèéìòù]{4,}/i.test(t) && !/^[\s/0-9A-G#b\-+]+$/i.test(t)) return false;
  return CHORD_PATTERN.test(t.replace(/\s+/g, " "));
}

function checkRefusi(song: Song) {
  const issues: { kind: string; detail: string; lineIndex?: number }[] = [];

  if (/^\d+\.\s/.test(song.title.trim())) {
    issues.push({ kind: "title_verse_number", detail: song.title });
  }

  for (let i = 0; i < song.lines.length; i++) {
    const ln = song.lines[i];
    const text = ln.text;

    if (!text.trim()) {
      issues.push({ kind: "empty_line", detail: `type=${ln.type}`, lineIndex: i });
    }

    for (const re of ENCODING_ARTIFACTS) {
      if (re.test(text)) {
        issues.push({
          kind: "encoding_artifact",
          detail: text.slice(0, 80),
          lineIndex: i,
        });
        break;
      }
    }

    if (i > 0) {
      const prev = song.lines[i - 1];
      if (prev.text === text && prev.type === ln.type) {
        issues.push({
          kind: "duplicate_consecutive",
          detail: text.slice(0, 60),
          lineIndex: i,
        });
      }
    }

    if (ln.type === "chords") {
      const next = song.lines[i + 1];
      if (!next || next.type !== "lyrics") {
        const hasMoreChords = song.lines.slice(i + 1).some((x) => x.type === "lyrics");
        if (!hasMoreChords && lineLooksLikeChordOnly(text)) {
          issues.push({
            kind: "chords_without_lyrics_tail",
            detail: text.slice(0, 60),
            lineIndex: i,
          });
        }
      }
    }

    if (ln.type === "lyrics" && /^[\s/0-9A-G#b\-+°]+$/i.test(text.trim()) && text.trim().length > 2) {
      issues.push({ kind: "lyrics_looks_like_chords", detail: text.slice(0, 60), lineIndex: i });
    }
  }

  return issues;
}

function nearDuplicateThreshold(a: string, b: string): boolean {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return false;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen < 8) return false;
  const dist = levenshtein(na, nb);
  const ratio = dist / maxLen;
  return dist <= 3 || ratio <= 0.12;
}

// --- analysis ---
const byId = new Map<string, Song[]>();
const byNormTitle = new Map<string, Song[]>();
const byContentHash = new Map<string, Song[]>();
const byLyricsFp = new Map<string, Song[]>();
const byLyricsBodyHash = new Map<string, Song[]>();
const byLyricsBucket = new Map<string, Song[]>();

for (const s of SONGS) {
  if (!byId.has(s.id)) byId.set(s.id, []);
  byId.get(s.id)!.push(s);

  const nt = normalizeTitle(s.title);
  if (!byNormTitle.has(nt)) byNormTitle.set(nt, []);
  byNormTitle.get(nt)!.push(s);

  const h = contentHash(s);
  if (!byContentHash.has(h)) byContentHash.set(h, []);
  byContentHash.get(h)!.push(s);

  const fp = lyricsFingerprint(s);
  if (fp.length > 40) {
    if (!byLyricsFp.has(fp)) byLyricsFp.set(fp, []);
    byLyricsFp.get(fp)!.push(s);
  }

  const bodyHash = lyricsBodyHash(s);
  if (bodyHash) {
    if (!byLyricsBodyHash.has(bodyHash)) byLyricsBodyHash.set(bodyHash, []);
    byLyricsBodyHash.get(bodyHash)!.push(s);
  }

  const body = songLyricsBody(s);
  const bucket = lyricsBucketKey(body);
  if (bucket) {
    if (!byLyricsBucket.has(bucket)) byLyricsBucket.set(bucket, []);
    byLyricsBucket.get(bucket)!.push(s);
  }
}

const duplicateIds = [...byId.entries()].filter(([, v]) => v.length > 1);
const duplicateTitles = [...byNormTitle.entries()].filter(([, v]) => v.length > 1);
const duplicateHashes = [...byContentHash.entries()].filter(([, v]) => v.length > 1);
const duplicateLyrics = [...byLyricsFp.entries()].filter(([, v]) => v.length > 1);
const duplicateLyricsBody = [...byLyricsBodyHash.entries()].filter(([, v]) => v.length > 1);

type SongRef = { id: string; code: string; title: string; subtitle?: string; lineCount: number };

function songRef(s: Song): SongRef {
  return {
    id: s.id,
    code: s.code,
    title: s.title,
    subtitle: s.subtitle,
    lineCount: s.lines.length,
  };
}

function uniqueById(songs: Song[]): Song[] {
  const seen = new Set<string>();
  return songs.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

/** Same lyrics body, different normalized title (true cross-title duplicates). */
const crossTitleExactLyrics = duplicateLyricsBody
  .map(([hash, songs]) => {
    const uniq = uniqueById(songs);
    const titles = new Set(uniq.map((s) => normalizeTitle(s.title)));
    if (titles.size <= 1 && uniq.length <= 1) return null;
    return {
      hash,
      preview: songLyricsBody(uniq[0]).slice(0, 100),
      songs: uniq.map(songRef),
    };
  })
  .filter(Boolean) as {
  hash: string;
  preview: string;
  songs: SongRef[];
}[];

/** High lyrics similarity, different normalized title. */
const crossTitleNearLyrics: {
  similarity: number;
  kind: "near" | "truncated";
  a: SongRef;
  b: SongRef;
  preview: string;
}[] = [];

const nearSeen = new Set<string>();

for (const [, bucketSongs] of byLyricsBucket) {
  const uniq = uniqueById(bucketSongs);
  for (let i = 0; i < uniq.length; i++) {
    for (let j = i + 1; j < uniq.length; j++) {
      const sa = uniq[i];
      const sb = uniq[j];
      if (normalizeTitle(sa.title) === normalizeTitle(sb.title)) continue;

      const la = songLyricsBody(sa);
      const lb = songLyricsBody(sb);
      if (la.length < 60 || lb.length < 60) continue;

      const pairKey = [sa.id, sb.id].sort().join("|");
      if (nearSeen.has(pairKey)) continue;

      let kind: "near" | "truncated" | null = null;
      let sim = lyricsSimilarity(la, lb);

      if (isTruncatedLyrics(la, lb) || isTruncatedLyrics(lb, la)) {
        kind = "truncated";
        sim = Math.max(sim, 0.96);
      } else if (sim >= 0.88) {
        kind = "near";
      }

      if (!kind) continue;
      nearSeen.add(pairKey);
      crossTitleNearLyrics.push({
        similarity: Math.round(sim * 1000) / 1000,
        kind,
        a: songRef(sa),
        b: songRef(sb),
        preview: la.slice(0, 80),
      });
    }
  }
}

crossTitleNearLyrics.sort((x, y) => y.similarity - x.similarity);

const nearDuplicates: { a: Song; b: Song; distance: number }[] = [];
for (let i = 0; i < SONGS.length; i++) {
  for (let j = i + 1; j < SONGS.length; j++) {
    const sa = SONGS[i];
    const sb = SONGS[j];
    if (normalizeTitle(sa.title) === normalizeTitle(sb.title)) continue;
    if (nearDuplicateThreshold(sa.title, sb.title)) {
      nearDuplicates.push({
        a: sa,
        b: sb,
        distance: levenshtein(normalizeTitle(sa.title), normalizeTitle(sb.title)),
      });
    }
  }
}

const allRefusi: { song: Song; issues: ReturnType<typeof checkRefusi> }[] = [];
for (const s of SONGS) {
  const issues = checkRefusi(s);
  if (issues.length) allRefusi.push({ song: s, issues });
}

const report = {
  totalSongs: SONGS.length,
  duplicateIds: duplicateIds.map(([id, songs]) => ({
    id,
    songs: songs.map((s) => ({ id: s.id, code: s.code, title: s.title })),
  })),
  duplicateTitles: duplicateTitles.map(([title, songs]) => ({
    normalizedTitle: title,
    songs: songs.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      lineCount: s.lines.length,
    })),
  })),
  duplicateContentHash: duplicateHashes.map(([hash, songs]) => ({
    hash,
    songs: songs.map((s) => ({ id: s.id, code: s.code, title: s.title })),
  })),
  duplicateLyricsFingerprint: duplicateLyrics.map(([fp, songs]) => ({
    preview: fp.slice(0, 80),
    songs: songs.map((s) => ({ id: s.id, code: s.code, title: s.title })),
  })),
  duplicateLyricsBodyHash: duplicateLyricsBody.map(([hash, songs]) => ({
    hash,
    preview: songLyricsBody(songs[0]).slice(0, 80),
    songs: songs.map((s) => ({ id: s.id, code: s.code, title: s.title, subtitle: s.subtitle })),
  })),
  crossTitleExactLyrics,
  crossTitleNearLyrics: crossTitleNearLyrics.slice(0, 200),
  crossTitleNearLyricsTotal: crossTitleNearLyrics.length,
  nearDuplicateTitles: nearDuplicates
    .sort((x, y) => x.distance - y.distance)
    .map(({ a, b, distance }) => ({
      distance,
      a: { id: a.id, code: a.code, title: a.title, lines: a.lines.length },
      b: { id: b.id, code: b.code, title: b.title, lines: b.lines.length },
    })),
  refusiSummary: {
    songsWithIssues: allRefusi.length,
    byKind: {} as Record<string, number>,
  },
  refusi: allRefusi.map(({ song, issues }) => ({
    id: song.id,
    code: song.code,
    title: song.title,
    issues,
  })),
};

for (const { issues } of allRefusi) {
  for (const iss of issues) {
    report.refusiSummary.byKind[iss.kind] =
      (report.refusiSummary.byKind[iss.kind] ?? 0) + 1;
  }
}

const outPath = join(__dirname, "check-songs-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log("=== Canzoniere Facile — check songs ===\n");
console.log(`Totale canti: ${report.totalSongs}`);
console.log(`ID duplicati: ${report.duplicateIds.length}`);
console.log(`Titoli normalizzati duplicati: ${report.duplicateTitles.length}`);
console.log(`Hash contenuto identico: ${report.duplicateContentHash.length}`);
console.log(`Fingerprint testo identico: ${report.duplicateLyricsFingerprint.length}`);
console.log(`Testo normalizzato identico (titoli diversi): ${report.crossTitleExactLyrics.length} gruppi`);
console.log(
  `Testo quasi uguale / troncato (titoli diversi): ${report.crossTitleNearLyricsTotal} coppie`,
);
console.log(`Coppie titolo quasi-duplicato: ${report.nearDuplicateTitles.length}`);
console.log(`Canti con refusi/issue: ${report.refusiSummary.songsWithIssues}`);
console.log(`\nReport: ${outPath}`);

if (report.duplicateIds.length) {
  console.log("\n--- ID duplicati (CRITICO) ---");
  for (const d of report.duplicateIds) console.log(JSON.stringify(d));
}
if (report.crossTitleExactLyrics.length) {
  console.log("\n--- Stesso testo, titolo diverso (esatto) ---");
  for (const d of report.crossTitleExactLyrics.slice(0, 25)) {
    console.log(
      d.songs.map((s) => `${s.title}${s.subtitle ? ` (${s.subtitle})` : ""} [${s.id}]`).join("  ==  "),
    );
  }
  if (report.crossTitleExactLyrics.length > 25) {
    console.log(`... +${report.crossTitleExactLyrics.length - 25} gruppi`);
  }
}
if (report.crossTitleNearLyrics.length) {
  console.log("\n--- Testo quasi uguale / troncato, titolo diverso ---");
  for (const d of report.crossTitleNearLyrics.slice(0, 25)) {
    console.log(
      `[${d.kind} ${Math.round(d.similarity * 100)}%] "${d.a.title}" [${d.a.id}]  <->  "${d.b.title}" [${d.b.id}]`,
    );
  }
  if (report.crossTitleNearLyricsTotal > 25) {
    console.log(`... +${report.crossTitleNearLyricsTotal - 25} coppie`);
  }
}
if (report.duplicateTitles.length) {
  console.log("\n--- Stesso titolo (varianti / tonalità) ---");
  for (const d of report.duplicateTitles.slice(0, 15)) {
    console.log(`"${d.normalizedTitle}": ${d.songs.length} versioni`);
  }
  if (report.duplicateTitles.length > 15) {
    console.log(`... +${report.duplicateTitles.length - 15} titoli`);
  }
}
