import { readFileSync, writeFileSync } from "fs";

const EXISTING = [
  { id: "a1", title: "Ti chiedo perdono" },
  { id: "a2", title: "Signore che sei venuto" },
  { id: "a3", title: "Kyrie Eleison", subtitle: "Emberti / Gialloreti" },
  { id: "a4", title: "Kyrie Eleison" },
  { id: "a5", title: "Kyrie Togolese" },
  { id: "a6", title: "Signore pietà" },
  { id: "a7", title: "Scusa Signore" },
  { id: "a8", title: "Signore pietà", subtitle: "Messa Gen" },
  { id: "a9", title: "Kyrie", subtitle: "Pardonne-moi Seigneur" },
  { id: "a10", title: "Perdonaci Signore" },
  { id: "a11", title: "Signore pietà" },
  { id: "b1", title: "Gloria a Dio, pace all'uomo" },
  { id: "b2", title: "Gloria a Cristo" },
  { id: "b3", title: "Gloria in excelsis Deo" },
  { id: "b4", title: "Il Signore è la luce" },
  { id: "b5", title: "Gloria a Dio", subtitle: "Lodate Dio — tonalità SOL" },
  { id: "b5mi", title: "Gloria a Dio", subtitle: "Lodate Dio — tonalità MI" },
  { id: "b6", title: "Gloria a Dio", subtitle: "RnS" },
  { id: "b7", title: "Gloria", subtitle: "D. Ricci" },
  { id: "b8", title: "Gloria, Gloria!", subtitle: "Giombini" },
  { id: "b9", title: "Gloria", subtitle: "Buttazzo / Beltrami" },
];

const NOTE_PREFIX = /^(intro|finale|rit\.|rit:|parlato|\[)/i;
const PAGE_MARK = /^(- \d+ -|\d+ of \d+--?|-- \d+ of \d+ --)$/;
const TITLE_RE = /^(\d+)\.\s+(.+)$/;

const SOLFEGE_ROOT = /^(Do|Re|Mi|Fa|Sol|La|Si)(?:#|b|-)?(?:\d+|\+|\(.*)?$/i;

function isCatalogTitle(numStr, rest) {
  const letters = rest.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 3) return false;
  const upper = (rest.match(/[A-ZÀ-Ú]/g) || []).length;
  return upper / letters.length >= 0.72;
}

const CHORD_TOKEN =
  /^(\/)?[A-Za-z]{1,4}(?:#|b|-)?(?:\d+|\/\d|\(|\)|\+|-)?(?:\/[A-Za-z]{1,4}(?:#|b|-)?(?:\d+)?)*$/;

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

function isDuplicate(title, subtitle) {
  const n = normTitle(title);
  const ns = subtitle ? normTitle(subtitle) : "";
  return EXISTING.some((e) => {
    const en = normTitle(e.title);
    const es = e.subtitle ? normTitle(e.subtitle) : "";
    if (n !== en) return false;
    if (es && ns) return es === ns || ns.includes(es) || es.includes(ns);
    if (es || ns) return false;
    return true;
  });
}

function splitTitle(raw) {
  const t = fixEncoding(raw);
  const paren = t.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (paren) return { title: paren[1].trim(), subtitle: paren[2].trim() };
  return { title: t, subtitle: undefined };
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
  if (/^\d+\.\s/.test(t)) return false;
  if (/^[a-zà-ù].*[,:;!?]$/.test(t)) return false;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.length > 24) return false;
  let chordish = 0;
  for (const tok of tokens) {
    if (tokenIsChord(tok)) chordish++;
  }
  if (chordish === 0) return false;
  return chordish / tokens.length >= 0.5;
}

function toActChordToken(tok) {
  let t = tok;
  const slashParts = t.split("/");
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
  if (/^\d+\s+[A-Z].+-\s+\d+\s+-$/.test(t)) return null;
  if (NOTE_PREFIX.test(t) || /^\[.+\]$/.test(t)) return { type: "note", text: t.startsWith("[") ? t : `[${t.toUpperCase()}]` };
  if (/^(intro|finale):?\s/i.test(t)) return { type: "note", text: `[${t.toUpperCase()}]` };
  if (isChordLine(t)) return { type: "chords", text: formatChords(t) };
  return { type: "lyrics", text: t };
}

function parseLibrettoIndex(text) {
  const map = new Map();
  for (const raw of text.split("\n")) {
    const line = fixEncoding(raw.trim());
    if (!line || /^[A-Z]$/.test(line) || line.startsWith("Indice") || line.startsWith("Legenda")) continue;
    const m = line.match(/^(.+?)\s+(?:([ANMPTOQ])\s+)?(?:[iocf]\s+)*(\d{3})?\s*$/i);
    if (!m) continue;
    let title = m[1].trim();
    if (title.length < 3) continue;
    const lit = m[2] || "";
    const tags = [];
    if (/\bi\b/.test(line)) tags.push("ingress");
    if (/\bo\b/.test(line)) tags.push("offertorio");
    if (/\bc\b/.test(line)) tags.push("communion");
    if (/\bf\b/.test(line)) tags.push("finale");
    map.set(normTitle(title), { lit, tags });
  }
  return map;
}

function guessSection(title, subtitle, indexMap) {
  const key = normTitle(title);
  const meta = indexMap.get(key);
  const full = `${title} ${subtitle || ""}`.toLowerCase();

  if (meta?.lit === "N" || /avvento|natale|adeste|stelle|bethlem|noel|pastor|presepe/.test(full)) return "N";
  if (meta?.lit === "P" || /pasqua|risort|quaresima|croce|passion|venerdì santo/.test(full)) return "P";
  if (meta?.lit === "M" || /ave maria|maria|marian|madre/.test(full)) return "M";
  if (meta?.lit === "A" || /avvento|sion/.test(full)) return "N";

  if (/kyrie|pietà|pietà|peniten|perdon|scusa signore|confession/.test(full)) return "A";
  if (/^gloria|gloria,|gloria a|gloria in excelsis|il signore è la luce/.test(full)) return "B";
  if (/agnello di dio|agnus dei/.test(full)) return "L";
  if (/^santo[^a-z]|sanctus|santo il signore/.test(full)) return "G";
  if (/alleluia|halleluia/.test(full)) return "D";
  if (meta?.tags.includes("offertorio") || /offertorio|offriamo|mistero della fede|pane del ciel|su questo altare/.test(full))
    return "E";
  if (/pace|shalom|scambio/.test(full)) return "H";
  if (/salmo|cantico|acclamate al signore|laudate|innalzate|i cieli narrano/.test(full)) return "C";
  if (/lode|dossologia|amen/.test(full)) return "F";

  if (meta?.tags.includes("communion")) return "C";
  if (meta?.tags.includes("ingress")) return "C";
  return "C";
}

function parseAccordi(text) {
  const songs = [];
  let current = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const tm = line.match(TITLE_RE);
    if (tm && isCatalogTitle(tm[1], tm[2])) {
      if (current && current.lines.length) songs.push(current);
      const { title, subtitle } = splitTitle(tm[2]);
      current = { num: parseInt(tm[1], 10), title, subtitle, lines: [], source: "libroaccordi" };
      continue;
    }
    if (!current) continue;
    const cl = classifyLine(line);
    if (cl) current.lines.push(cl);
  }
  if (current && current.lines.length) songs.push(current);
  return songs;
}

function parseLibrettoSongs(text) {
  const songs = [];
  let current = null;
  const LIB_TITLE = /^(\d{3})\.\s+(.+)$/;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const tm = line.match(LIB_TITLE);
    if (tm) {
      if (current && current.lines.length) songs.push(current);
      const { title, subtitle } = splitTitle(tm[2]);
      current = { num: parseInt(tm[1], 10), title, subtitle, lines: [], source: "libretto" };
      continue;
    }
    if (!current) continue;
    if (/^\d+$/.test(line) || line.startsWith("Indice") || line.startsWith("Legenda")) continue;
    const cl = classifyLine(line);
    if (cl) current.lines.push(cl);
  }
  if (current && current.lines.length) songs.push(current);
  return songs;
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function genSong(song, id, sectionId) {
  const code = song.source === "libretto" ? String(song.num).padStart(3, "0") : `LA${song.num}`;
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

const accordiText = readFileSync("c:/Users/picco/canzoniere-act/scripts/libroaccordi.txt", "utf8");
const librettoText = readFileSync("c:/Users/picco/canzoniere-act/scripts/libretto.txt", "utf8");
const indexMap = parseLibrettoIndex(librettoText);
const parsedAccordi = parseAccordi(accordiText);
const parsedLibretto = parseLibrettoSongs(librettoText);

const usedIds = new Set(EXISTING.map((s) => s.id));
const usedTitles = new Set(EXISTING.map((s) => normTitle(s.title)));
const skipped = [];
const added = [];

function tryAdd(song) {
  if (song.lines.length < 2) {
    skipped.push({ title: song.title, reason: "too few lines", source: song.source });
    return;
  }
  const hasChords = song.lines.some((l) => l.type === "chords");
  const hasLyrics = song.lines.some((l) => l.type === "lyrics");
  if (!hasChords || !hasLyrics) {
    skipped.push({ title: song.title, reason: "missing chords or lyrics", source: song.source });
    return;
  }
  const nt = normTitle(song.title);
  if (usedTitles.has(nt) || isDuplicate(song.title, song.subtitle)) {
    skipped.push({ title: song.title, reason: "duplicate", source: song.source });
    return;
  }

  const sectionId = guessSection(song.title, song.subtitle, indexMap);
  let baseId = slugify(song.title, song.subtitle);
  let id = baseId;
  let n = 2;
  while (usedIds.has(id)) id = `${baseId}-${n++}`;
  usedIds.add(id);
  usedTitles.add(nt);
  added.push({ ...song, id, sectionId, ts: genSong(song, id, sectionId) });
}

for (const song of parsedAccordi) tryAdd(song);
for (const song of parsedLibretto) tryAdd(song);

const tsBlock = added.map((s) => s.ts).join("\n");
writeFileSync("c:/Users/picco/canzoniere-act/scripts/new-songs.ts.txt", tsBlock, "utf8");
writeFileSync(
  "c:/Users/picco/canzoniere-act/scripts/import-report.json",
  JSON.stringify(
    {
      fromLibroaccordi: added.filter((s) => s.source === "libroaccordi").length,
      fromLibretto: added.filter((s) => s.source === "libretto").length,
      skipped: skipped.length,
      firstNewId: added[0]?.id,
      titles: added.map((s) => s.title),
      skippedSample: skipped.slice(0, 30),
    },
    null,
    2,
  ),
  "utf8",
);

console.log("accordi", parsedAccordi.length, "libretto", parsedLibretto.length);
console.log("added", added.length);
console.log("skipped", skipped.length);
console.log("first", added[0]?.id, added[0]?.title);
