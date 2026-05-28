/**
 * Apply high-confidence quality fixes and regenerate imported.ts.
 * Run: npx tsx scripts/apply-quality-fixes.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";
import type { Song, SongLine } from "../src/types";
import { SONGS } from "../src/songs/index";

const ORIGINAL_IDS = new Set([
  "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11",
  "b1", "b2", "b3", "b4", "b5", "b5mi", "b6", "b7", "b8", "b9",
]);

const REMOVE_IDS = new Set([
  "dio-si-e-fatto-come-noi",
  "il-cantico-dei-redenti",
  "io-non-son-degno",
]);

/** Catalog number leaked from PDF import (e.g. "296 . Title" or "209. Title"). */
const CATALOG_MERGE = /^\d{3}\s*\.\s+/;

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

function trimMergedTail(song: Song): { song: Song; trimmed: boolean; marker?: string } {
  const idx = song.lines.findIndex(
    (ln) => ln.type === "lyrics" && CATALOG_MERGE.test(ln.text.trim()),
  );
  if (idx === -1) return { song, trimmed: false };
  return {
    song: { ...song, lines: song.lines.slice(0, idx) },
    trimmed: true,
    marker: song.lines[idx].text.trim().slice(0, 60),
  };
}

function fixLineText(text: string): string {
  let t = text.replace(/perchè/g, "perché").replace(/Perchè/g, "Perché");
  if (t === "per amore del suo nom") return "per amore del suo nome";
  return t;
}

function fixBrokenTitleContinuation(song: Song): Song {
  if (song.id !== "gloria-nell-alto-dei-cieli-gen") return song;
  const first = song.lines[0];
  if (first?.type === "lyrics" && first.text === "Verde)") {
    return {
      ...song,
      title: "GLORIA NELL'ALTO DEI CIELI (Gen Verde)",
      lines: song.lines.slice(1),
    };
  }
  return song;
}

function fixSongLines(song: Song): Song {
  let song2 = fixBrokenTitleContinuation(song);
  const lines = song2.lines.map((ln) => ({
    ...ln,
    text: fixLineText(ln.text),
  }));
  song2 = { ...song2, lines };
  if (song2.id === "padre-mio") {
    const deduped: SongLine[] = [];
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i];
      const prev = deduped[deduped.length - 1];
      if (
        prev &&
        prev.type === cur.type &&
        prev.text === cur.text &&
        cur.text === "perché sei il Padre mio"
      ) {
        continue;
      }
      deduped.push(cur);
    }
    return { ...song2, lines: deduped };
  }
  return song2;
}

const report = {
  removedDuplicates: [] as string[],
  trimmedTails: [] as { id: string; marker: string }[],
  refusiLinesFixed: 0,
};

let imported = SONGS.filter((s) => !ORIGINAL_IDS.has(s.id));

imported = imported.filter((s) => {
  if (REMOVE_IDS.has(s.id)) {
    report.removedDuplicates.push(`${s.id} (${s.title})`);
    return false;
  }
  return true;
});

imported = imported.map((s) => {
  const { song, trimmed, marker } = trimMergedTail(s);
  if (trimmed && marker) report.trimmedTails.push({ id: song.id, marker });
  return fixSongLines(song);
});

const header = `import { Song, SongLine } from "../types";

const c = (text: string): SongLine => ({ type: "chords", text });
const l = (text: string): SongLine => ({ type: "lyrics", text });
const n = (text: string): SongLine => ({ type: "note", text });

export const IMPORTED_SONGS: Song[] = [
`;

const body = imported.map(serializeSong).join("\n");
const out = header + body + "\n];\n";
const outPath = join(__dirname, "../src/songs/imported.ts");
writeFileSync(outPath, out, "utf8");

console.log(JSON.stringify({ ...report, importedCount: imported.length }, null, 2));
console.log(`Written ${outPath}`);
