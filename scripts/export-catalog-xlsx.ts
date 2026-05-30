/**
 * Esporta tutti i canti in Excel per revisione / catalogazione manuale.
 *
 * - Foglio "Canti": elenco compatto + colonna cliccabile "Apri testo"
 * - Foglio "Testi": strofe impaginate (solo lyrics, come in app, senza accordi)
 * - Foglio "Sezioni": categorie liturgiche
 *
 * Uso: npm run export-catalog-xlsx
 */
import * as path from "path";
import ExcelJS from "exceljs";
import { SONGS } from "../src/songs/index.ts";
import { SECTIONS } from "../src/sections.ts";
import type { Song, SongLine } from "../src/types.ts";

const OUT = path.join(import.meta.dirname ?? __dirname, "catalogo-canti-revisione.xlsx");
const EXCEL_CELL_MAX = 32767;

/** Solo strofe (type lyrics), come testo cantato in app. */
function lyricsOnly(lines: SongLine[]): string {
  return lines
    .filter((line) => line.type === "lyrics")
    .map((line) => line.text.trim())
    .filter(Boolean)
    .join("\n");
}

function extractTonalita(subtitle?: string, title?: string): string {
  if (subtitle) {
    const m = subtitle.match(/(?:—|-)\s*tonalit[àa]\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  if (title) {
    const m = title.match(/\(in\s+([^)]+)\)/i);
    if (m) return m[1].trim();
  }
  return "";
}

function extractAutore(subtitle?: string): string {
  if (!subtitle) return "";
  return subtitle.replace(/(?:—|-)\s*tonalit[àa]\s*.+$/i, "").trim();
}

function sectionLabel(sectionId: string): string {
  const s = SECTIONS.find((x) => x.id === sectionId);
  return s ? `${sectionId} — ${s.name}` : sectionId;
}

const sectionOrder = new Map(SECTIONS.map((s, i) => [s.id, i]));

const sorted = [...SONGS].sort((a, b) => {
  const oa = sectionOrder.get(a.sectionId) ?? 99;
  const ob = sectionOrder.get(b.sectionId) ?? 99;
  if (oa !== ob) return oa - ob;
  return a.title.localeCompare(b.title, "it", { sensitivity: "base" });
});

const wb = new ExcelJS.Workbook();
wb.creator = "Canzoniere Facile";
wb.created = new Date();

// --- Foglio Testi (creato prima per calcolare i link) ---
const wsTesti = wb.addWorksheet("Testi", {
  views: [{ state: "frozen", ySplit: 1 }],
});
wsTesti.columns = [
  { header: "Canto", key: "canto", width: 22 },
  { header: "Testo (solo strofe)", key: "testo", width: 90 },
  { header: "Torna elenco", key: "back", width: 14 },
];

const headerTesti = wsTesti.getRow(1);
headerTesti.font = { bold: true };
headerTesti.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8EAF6" },
};

/** song.id → riga titolo nel foglio Testi (per hyperlink) */
const textAnchorBySongId = new Map<string, number>();

for (const song of sorted) {
  const text = lyricsOnly(song.lines);
  const titleRowNum = wsTesti.lastRow ? wsTesti.lastRow.number + 1 : 2;
  textAnchorBySongId.set(song.id, titleRowNum);

  const autore = extractAutore(song.subtitle);
  const ton = extractTonalita(song.subtitle, song.title);
  const meta = [autore, ton ? `tonalità ${ton}` : ""].filter(Boolean).join(" · ");

  const titleRow = wsTesti.addRow({
    canto: `${song.code} — ${song.title}`,
    testo: "",
    back: "",
  });
  titleRow.getCell("canto").font = { bold: true, size: 12, color: { argb: "FF1A237E" } };
  titleRow.getCell("testo").value = meta || " ";
  titleRow.getCell("testo").font = { italic: true, color: { argb: "FF616161" }, size: 10 };

  const bodyRow = wsTesti.addRow({
    canto: "",
    testo: text.length > EXCEL_CELL_MAX ? text.slice(0, EXCEL_CELL_MAX - 16) + "\n… [TRONCATO]" : text,
    back: "← Elenco",
  });
  const bodyCell = bodyRow.getCell("testo");
  bodyCell.alignment = { wrapText: true, vertical: "top" };
  bodyCell.font = { size: 11 };
  const lineCount = Math.max(2, text.split("\n").length);
  bodyRow.height = Math.min(420, Math.max(36, lineCount * 15));

  const backCell = bodyRow.getCell("back");
  backCell.value = { text: "← Elenco", hyperlink: "#Canti!A1", tooltip: "Torna all'elenco canti" };
  backCell.font = { color: { argb: "FF1565C0" }, underline: true, size: 10 };
  backCell.alignment = { vertical: "top" };

  wsTesti.addRow({});
}

// --- Foglio Canti ---
const wsCanti = wb.addWorksheet("Canti", {
  views: [{ state: "frozen", ySplit: 1 }],
});
wsCanti.columns = [
  { header: "ID", key: "id", width: 14 },
  { header: "Codice", key: "code", width: 10 },
  { header: "Titolo", key: "title", width: 34 },
  { header: "Autore", key: "autore", width: 26 },
  { header: "Tonalità", key: "ton", width: 12 },
  { header: "Sezione attuale", key: "section", width: 28 },
  { header: "Temi", key: "themes", width: 22 },
  { header: "Apri testo", key: "link", width: 14 },
  { header: "Nuova sezione", key: "newSection", width: 16 },
  { header: "Note", key: "notes", width: 28 },
];

const headerCanti = wsCanti.getRow(1);
headerCanti.font = { bold: true };
headerCanti.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE3F2FD" },
};

for (const song of sorted) {
  const anchor = textAnchorBySongId.get(song.id) ?? 2;
  let note = "";
  if (song.isCustom) note = "Canto utente (Miei canti)";
  const lyrics = lyricsOnly(song.lines);
  if (lyrics.length > EXCEL_CELL_MAX) {
    note = [note, "Testo troncato nel foglio Testi"].filter(Boolean).join(" | ");
  }
  if (!lyrics.trim()) {
    note = [note, "Nessuna strofa (solo accordi/note)"].filter(Boolean).join(" | ");
  }

  const row = wsCanti.addRow({
    id: song.id,
    code: song.code,
    title: song.title,
    autore: extractAutore(song.subtitle),
    ton: extractTonalita(song.subtitle, song.title),
    section: sectionLabel(song.sectionId),
    themes: (song.themes ?? []).join(", "),
    link: "",
    newSection: "",
    notes: note,
  });

  const linkCell = row.getCell("link");
  linkCell.value = {
    text: "▶ Testo",
    hyperlink: `#Testi!A${anchor}`,
    tooltip: `${song.title} — apri testo impaginato`,
  };
  linkCell.font = { color: { argb: "FF1565C0" }, underline: true, bold: true };
  linkCell.alignment = { horizontal: "center" };
}

// --- Foglio Sezioni ---
const wsSez = wb.addWorksheet("Sezioni");
wsSez.columns = [
  { header: "ID", key: "id", width: 8 },
  { header: "Nome", key: "name", width: 32 },
  { header: "Emoji", key: "emoji", width: 8 },
  { header: "Nuova categoria (sì/no)", key: "flag", width: 22 },
  { header: "Note", key: "notes", width: 40 },
];
wsSez.getRow(1).font = { bold: true };
for (const s of SECTIONS) {
  wsSez.addRow({ id: s.id, name: s.name, emoji: s.emoji, flag: "", notes: "" });
}
wsSez.addRow({});
wsSez.addRow({ id: "(aggiungi)", name: "", emoji: "", flag: "", notes: "" });

// --- Istruzioni brevi ---
const wsHelp = wb.addWorksheet("Come usare");
wsHelp.getColumn(1).width = 100;
const helpLines = [
  "CANZONIERE FACILE — Catalogo canti per revisione",
  "",
  "1. Foglio «Canti»: compila «Nuova sezione» e «Note».",
  "2. Colonna «Apri testo» (blu): clic → salta al foglio «Testi» con le sole strofe (senza accordi).",
  "3. Nel foglio «Testi» usa «← Elenco» per tornare all'inizio dell'elenco.",
  "4. Foglio «Sezioni»: categorie attuali; aggiungi nuove righe in fondo se serve.",
  "",
  `Generato: ${new Date().toLocaleString("it-IT")} — ${sorted.length} canti`,
];
helpLines.forEach((line, i) => {
  const row = wsHelp.getRow(i + 1);
  row.getCell(1).value = line;
  if (i === 0) row.getCell(1).font = { bold: true, size: 13 };
});

async function main() {
  await wb.xlsx.writeFile(OUT);
  console.log(`Scritti ${sorted.length} canti → ${OUT}`);
  console.log("Fogli: Canti (elenco + link), Testi (strofe), Sezioni, Come usare");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
