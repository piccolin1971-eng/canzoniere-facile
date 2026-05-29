/**
 * Remove doc-import song blocks so import-doc.mjs can re-run cleanly.
 * Run: node scripts/undo-doc-import.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const importedPath = join(__dirname, "../src/songs/imported.ts");
const PREFIXES = ["longarone-", "seminario-", "atteso-", "frate-jacopa-"];

let content = readFileSync(importedPath, "utf8");
const blocks = content.split(/\n  \{/);
const header = blocks[0];
const kept = [header.endsWith("{") ? header : header];

let removed = 0;
for (const block of blocks.slice(1)) {
  const idM = block.match(/^\s*id:\s*"([^"]+)"/m);
  const id = idM?.[1] ?? "";
  if (PREFIXES.some((p) => id.startsWith(p))) {
    removed++;
    continue;
  }
  kept.push("  {" + block);
}

let out = kept.join("");
out = out.trimEnd();
if (!out.endsWith("];")) {
  out = out.replace(/,\s*$/, "") + "\n];\n";
}
writeFileSync(importedPath, out, "utf8");
console.log(`Removed ${removed} doc-import songs.`);
