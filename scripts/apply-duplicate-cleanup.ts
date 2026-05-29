/**
 * Rimuove dal catalogo i canti elencati in plan-duplicate-cleanup.json.
 * Run: npm run apply-cleanup
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Song, SongLine } from "../src/types";
import { SONGS } from "../src/songs/index";

const ORIGINAL_IDS = new Set([
  "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11",
  "b1", "b2", "b3", "b4", "b5", "b5mi", "b6", "b7", "b8", "b9",
]);

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

const planPath = join(__dirname, "plan-duplicate-cleanup.json");
const plan = JSON.parse(readFileSync(planPath, "utf8")) as {
  hideIds: string[];
  groups: { keep: { id: string; title: string }; remove: { id: string; title: string }[] }[];
};

const hideIds = new Set<string>(plan.hideIds ?? []);
if (!hideIds.size) {
  console.log("Nessun canto da rimuovere nel piano.");
  process.exit(0);
}

const skippedOriginals = [...hideIds].filter((id) => ORIGINAL_IDS.has(id));
for (const id of skippedOriginals) hideIds.delete(id);

const beforeTotal = SONGS.length;
const beforeImported = SONGS.filter((s) => !ORIGINAL_IDS.has(s.id)).length;

const removed: { id: string; title: string; code: string }[] = [];
const imported = SONGS.filter((s) => !ORIGINAL_IDS.has(s.id)).filter((s) => {
  if (hideIds.has(s.id)) {
    removed.push({ id: s.id, title: s.title, code: s.code });
    return false;
  }
  return true;
});

const header = `import { Song, SongLine } from "../types";

const c = (text: string): SongLine => ({ type: "chords", text });
const l = (text: string): SongLine => ({ type: "lyrics", text });
const n = (text: string): SongLine => ({ type: "note", text });

export const IMPORTED_SONGS: Song[] = [
`;

const outPath = join(__dirname, "../src/songs/imported.ts");
writeFileSync(outPath, header + imported.map(serializeSong).join("\n") + "\n];\n", "utf8");

console.log("=== Apply pulizia doppioni ===\n");
console.log(`Canti totali: ${beforeTotal} → ${beforeTotal - removed.length}`);
console.log(`Importati: ${beforeImported} → ${imported.length}`);
console.log(`Rimossi da imported.ts: ${removed.length} (piano: ${plan.hideIds.length})`);
if (skippedOriginals.length) {
  console.log(`Saltati (catalogo index.ts): ${skippedOriginals.join(", ")}`);
}
console.log(`\nScritto: ${outPath}`);
console.log("\n--- Campione rimossi (max 15) ---");
for (const r of removed.slice(0, 15)) {
  const g = plan.groups.find((gr) => gr.remove.some((x) => x.id === r.id));
  const keep = g?.keep;
  console.log(`  ${r.code} "${r.title}" (${r.id})  →  keep: "${keep?.title}" (${keep?.id})`);
}
if (removed.length > 15) console.log(`  ... +${removed.length - 15}`);
