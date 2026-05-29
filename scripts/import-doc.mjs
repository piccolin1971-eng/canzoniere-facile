/**
 * Import songs from legacy Word .doc songbooks.
 * Run: node scripts/import-doc.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { docToText } from "./parse-doc.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DOC_FILES = [
  {
    path: "c:/Users/picco/Desktop/Canzonieri/canzoniere coro Longarone.doc",
    source: "longarone",
    codePrefix: "LG",
    parser: "longarone",
    relaxedQuality: true,
  },
  {
    path: "c:/Users/picco/Desktop/Canzonieri/Libretto canti con accordi fatto in seminario.doc",
    source: "seminario",
    codePrefix: "SM",
    parser: "seminario",
  },
  {
    path: "c:/Users/picco/Desktop/Canzonieri/L'Atteso (accordi).doc",
    source: "atteso",
    codePrefix: "AT",
    parser: "single",
    defaultTitle: "L'Atteso",
  },
  {
    path: "c:/Users/picco/Desktop/Canzonieri/canti-con-accordi-con-indice-2007.doc",
    source: "frate-jacopa-2007",
    codePrefix: "FJ",
    parser: "index2007",
  },
];

const NOTE_PREFIX = /^(intro|intr\.?|finale|fin\.?|rit\.|rit:|parlato|\[|t:|f:|m:|strum|solista|tutti)/i;
const PAGE_MARK = /^(- \d+ -|\d+ of \d+--?|-- \d+ of \d+ --)$/;
const METADATA_RE =
  /Autore sconosciuto|20\d{2}-\d{2}-\d{2}T|Sistemare posizioni|Indice personalizzato|Creative Commons|altervista|Ultimo aggiornamento|Questo documento|scaricat|cfj@alcantarine|via Capitolo|CASA FRATE|^Canti$/i;
const LYRIC_TITLE_REJECT =
  /^[\*\s]|\.{2,}|\b2x\b$|,\s*(Signore|Cristo|alleluia|pietà|noi|tu|ti|di)\b|^(abbi|accogli|ti |noi |la |il |che |per |con |una |e |a )/i;

const SOLFEGE_ROOT = /^(Do|Re|Mi|Fa|Sol|La|Si)(?:#|b|-)?(?:\d+|\+|\(.*)?$/i;
const LATIN_CHORD =
  /^(Do|Re|Mi|Fa|Sol|La|Si|Sib|Lab|Dom|L[ae])(?:#|b|-)?(?:\d+|maj|min|7|\+|\(.*)?$|^\/(Do|Re|Mi|Fa|Sol|La|Si)$/i;

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

function prepLine(raw) {
  return fixEncoding(raw)
    .replace(/\t+/g, "  ")
    .replace(/\b(Do|Re|Mi|Fa|Sol|La|Si|Sib|Lab|L[ae])\s+-/gi, "$1-")
    .replace(/\s+/g, " ")
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

function tokenIsChord(tok) {
  if (tok === "-" || tok === "–") return false;
  const cleaned = tok.replace(/^\//, "").replace(/^\(/, "").replace(/\)$/, "");
  if (SOLFEGE_ROOT.test(cleaned)) return true;
  if (LATIN_CHORD.test(cleaned)) return true;
  if (tok.includes("/")) {
    return tok.split("/").every((p) => {
      const x = p.replace(/^\(/, "").replace(/\)$/, "");
      return SOLFEGE_ROOT.test(x) || LATIN_CHORD.test(x);
    });
  }
  return false;
}

function isChordLine(line) {
  const t = prepLine(line);
  if (!t || NOTE_PREFIX.test(t)) return false;
  if (/^[a-zà-ù].*[,:;!?]$/.test(t) && !/^(do|re|mi|fa|sol|la|si)\b/i.test(t)) return false;
  const tokens = t.split(/\s+/).filter((x) => x !== "-" && x !== "–");
  if (!tokens.length || tokens.length > 28) return false;
  let chordish = 0;
  for (const tok of tokens) if (tokenIsChord(tok)) chordish++;
  if (chordish === 0) return false;
  return chordish / tokens.length >= 0.45;
}

function toActChordToken(tok) {
  const slashParts = tok.split("/");
  return slashParts
    .map((part) => {
      let p = part.replace(/^\(/, "").replace(/\)$/, "");
      const m = p.match(/^(\/)?([A-Za-z]{1,4})(#|b|-)?(\d+|\+|\(.*)?$/);
      if (!m) {
        const sol = p.match(/^(Do|Re|Mi|Fa|Sol|La|Si|Sib|Lab)(#|b|-)?(\d+)?$/i);
        if (sol) {
          const map = { do: "DO", re: "RE", mi: "MI", fa: "FA", sol: "SOL", la: "LA", si: "SI", sib: "SIB", lab: "LAB" };
          let out = map[sol[1].toLowerCase()] || sol[1].toUpperCase();
          if (sol[2] === "b") out += "b";
          else if (sol[2] === "-") out += "-";
          else if (sol[2] === "#") out += "#";
          if (sol[3]) out += sol[3];
          return out;
        }
        return p.toUpperCase();
      }
      const prefix = m[1] || "";
      let note = m[2];
      let acc = m[3] || "";
      const tail = m[4] || "";
      note = note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
      const map = { Do: "DO", Re: "RE", Mi: "MI", Fa: "FA", Sol: "SOL", La: "LA", Si: "SI" };
      let out = map[note] || note.toUpperCase();
      if (acc === "b") {
        const flatMap = { DO: "DO-", RE: "RE-", MI: "MI-", FA: "FA-", SOL: "SOL-", LA: "LA-", SI: "SI-" };
        out = flatMap[out] || `${out}b`;
      } else if (acc === "-") out += "-";
      else if (acc === "#") out += "#";
      return prefix + out + tail;
    })
    .join("/");
}

function formatChords(line) {
  const tokens = prepLine(line).split(/\s+/).filter((x) => x !== "-" && x !== "–");
  return tokens.map(toActChordToken).join("  ");
}

function classifyLine(line) {
  const t = prepLine(line);
  if (!t) return null;
  if (PAGE_MARK.test(t)) return null;
  if (METADATA_RE.test(t)) return null;
  if (/^\d+\s*$/.test(t)) return null;
  if (ROLE_TITLE_RE.test(t)) {
    return { type: "note", text: `[${t.replace(/:$/, "").toUpperCase()}]` };
  }
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
  const paren = t.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (paren) return { title: paren[1].trim(), subtitle: paren[2].trim() };
  return { title: t, subtitle: undefined };
}

const ROLE_TITLE_RE = /^(SOLISTA|CORO|DONNE|UOMINI|ENTRAMBI|TUTTI)\b/i;

function isAllCapsTitle(line) {
  const t = prepLine(line);
  if (!t || t.length < 4 || t.length > 90) return false;
  if (ROLE_TITLE_RE.test(t)) return false;
  if (METADATA_RE.test(t) || isChordLine(t) || LYRIC_TITLE_REJECT.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  if (/,\s*[a-zà-ù]/.test(t)) return false;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length < 4) return false;
  const upper = (t.match(/[A-ZÀ-Ú]/g) || []).length;
  return upper / letters.length >= 0.82;
}

function isSeminarioTitle(line) {
  const t = prepLine(line);
  if (!t || t.length > 120 || t.length < 3) return false;
  if (ROLE_TITLE_RE.test(t)) return false;
  if (METADATA_RE.test(t) || isChordLine(t) || LYRIC_TITLE_REJECT.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  if (/,\s*[a-zà-ù]/.test(t)) return false;
  if (/^[A-ZÀ-Ú0-9 '"()-]+\([^)]+\)\s*$/.test(t)) return true;
  if (isAllCapsTitle(t)) return true;
  return false;
}

function parseIndex2007(text) {
  const titles = [];
  for (const line of text.split("\n")) {
    const m = line.trim().match(/^([A-ZÀ-Ú0-9' ]{4,})\t+\d+\s*$/);
    if (!m) continue;
    const title = fixEncoding(m[1].trim());
    if (/^Indice$/i.test(title)) continue;
    titles.push(title);
  }
  return titles;
}

function parseByIndexTitles(text, source, indexTitles) {
  const titleByNorm = new Map(indexTitles.map((t) => [normTitle(t), t]));
  const songs = [];
  let current = null;

  for (const raw of text.split("\n")) {
    const trimmed = prepLine(raw);
    if (!trimmed || METADATA_RE.test(trimmed)) continue;
    if (/^[A-Za-zÀ-ÿ .,'-]+\t+\d+\s*$/.test(raw.trim()) && !titleByNorm.has(normTitle(trimmed))) continue;

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

function parseLongarone(text, source) {
  const songs = [];
  let current = null;
  for (const raw of text.split("\n")) {
    const trimmed = prepLine(raw);
    if (!trimmed || METADATA_RE.test(trimmed)) continue;
    if (isAllCapsTitle(trimmed)) {
      if (current?.lines.length) songs.push(current);
      const { title, subtitle } = splitTitle(trimmed);
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

function parseSeminario(text, source) {
  const songs = [];
  let current = null;
  for (const raw of text.split("\n")) {
    const trimmed = prepLine(raw);
    if (!trimmed || METADATA_RE.test(trimmed)) continue;
    if (isSeminarioTitle(trimmed)) {
      if (current?.lines.length) songs.push(current);
      const { title, subtitle } = splitTitle(trimmed);
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

function parseSingleSong(text, source, defaultTitle) {
  const lines = text.split("\n");
  let title = defaultTitle;
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = prepLine(lines[i]);
    if (!t) continue;
    if (!isChordLine(t) && t.length < 80) {
      title = splitTitle(t).title;
      start = i + 1;
    }
    break;
  }
  const song = { title, subtitle: undefined, lines: [], source };
  for (let i = start; i < lines.length; i++) {
    const cl = classifyLine(lines[i]);
    if (cl) song.lines.push(cl);
  }
  return song.lines.length ? [song] : [];
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
  if (/salmo|cantico|acclamate al signore|laudate|innalzate|i cieli narrano|magnificat/.test(full)) return "C";
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

function songQualityOk(song, relaxed = false) {
  if (/^\([^)]+\)\s*$/.test(song.title.trim())) return "paren-only title";
  if (song.lines.length < 3) return "too few lines";
  const lyrics = song.lines.filter((l) => l.type === "lyrics");
  const chords = song.lines.filter((l) => l.type === "chords");
  if (lyrics.length < 2) return "too few lyrics";
  if (!relaxed && chords.length < 1) return "missing chords";
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

function parseDoc(text, spec) {
  switch (spec.parser) {
    case "longarone":
      return parseLongarone(text, spec.source);
    case "seminario":
      return parseSeminario(text, spec.source);
    case "single":
      return parseSingleSong(text, spec.source, spec.defaultTitle);
    case "index2007":
      return parseByIndexTitles(text, spec.source, parseIndex2007(text));
    default:
      return [];
  }
}

const existing = loadExistingCatalog();
const usedIds = new Set(existing.map((s) => s.id));
const usedNormKeys = new Set(existing.map((s) => `${normTitle(s.title)}|${normTitle(s.subtitle || "")}`));

const report = { sources: {}, added: [], skipped: [] };

for (const spec of DOC_FILES) {
  const text = await docToText(spec.path);
  writeFileSync(join(__dirname, `${spec.source}.txt`), text, "utf8");

  const parsed = parseDoc(text, spec);
  report.sources[spec.source] = { parsed: parsed.length, added: 0, skippedDuplicate: 0, skippedQuality: 0 };

  let seq = 1;
  for (const song of parsed) {
    const q = songQualityOk(song, spec.relaxedQuality);
    if (q) {
      report.skipped.push({ title: song.title, subtitle: song.subtitle, reason: q, source: spec.source });
      report.sources[spec.source].skippedQuality++;
      continue;
    }

    const key = `${normTitle(song.title)}|${normTitle(song.subtitle || "")}`;
    if (usedNormKeys.has(key) || isDuplicate(song.title, song.subtitle, existing)) {
      report.skipped.push({ title: song.title, subtitle: song.subtitle, reason: "duplicate", source: spec.source });
      report.sources[spec.source].skippedDuplicate++;
      continue;
    }

    const sectionId = guessSection(song.title, song.subtitle);
    let baseId = `${spec.source}-${slugify(song.title, song.subtitle)}`;
    let id = baseId;
    let n = 2;
    while (usedIds.has(id)) id = `${baseId}-${n++}`;
    usedIds.add(id);
    usedNormKeys.add(key);
    existing.push({ id, title: song.title, subtitle: song.subtitle });

    const code = `${spec.codePrefix}${String(seq++).padStart(3, "0")}`;
    report.added.push({ id, title: song.title, subtitle: song.subtitle, source: spec.source, block: genSong(song, id, sectionId, code) });
    report.sources[spec.source].added++;
  }
}

if (report.added.length) appendToImported(report.added.map((s) => s.block));

writeFileSync(join(__dirname, "import-doc-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("=== Import DOC ===");
for (const [src, stats] of Object.entries(report.sources)) {
  console.log(`${src}: parsed=${stats.parsed} added=${stats.added} dup=${stats.skippedDuplicate} quality=${stats.skippedQuality}`);
}
console.log(`Total added: ${report.added.length}`);
if (report.added.length) {
  console.log("Sample:", report.added.slice(0, 8).map((s) => s.title).join(" | "));
}
