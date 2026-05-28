import type { SongLine } from "./types";

const SOLFEGE_ROOT = /^(DO|RE|MI|FA|SOL|LA|SI)(?:#|-)?(?:\d+|\+|\(.*)?$/i;
const NOTE_PREFIX = /^(intro|intr\.?|finale|fin\.?|rit\.?|\[|t:|f:|m:)/i;

function fixEncoding(s: string): string {
  return s
    .replace(/\uFFFD/g, "'")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .trim();
}

function tokenIsChord(tok: string): boolean {
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

function isChordLine(line: string): boolean {
  const t = line.trim();
  if (!t || NOTE_PREFIX.test(t)) return false;
  if (/^[a-zà-ù].*[,:;!?]$/.test(t)) return false;
  const tokens = t.split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.length > 24) return false;
  let chordish = 0;
  for (const tok of tokens) if (tokenIsChord(tok)) chordish++;
  if (chordish === 0) return false;
  return chordish / tokens.length >= 0.5;
}

function normalizeChordToken(tok: string): string {
  const m = tok.match(/^(\/)?([A-Za-z]{1,4})(#|b|-)?(\d+|\+|\(.*)?$/);
  if (!m) return tok.toUpperCase();
  const map: Record<string, string> = {
    Do: "DO",
    Re: "RE",
    Mi: "MI",
    Fa: "FA",
    Sol: "SOL",
    La: "LA",
    Si: "SI",
  };
  let note = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
  let out = map[note] || note.toUpperCase();
  const acc = m[3] || "";
  if (acc === "b" || acc === "-") {
    const flatMap: Record<string, string> = {
      DO: "DO-",
      RE: "RE-",
      MI: "MI-",
      FA: "FA-",
      SOL: "SOL-",
      LA: "LA-",
      SI: "SI-",
    };
    out = flatMap[out] || out + "-";
  } else if (acc === "#") out += "#";
  return (m[1] || "") + out + (m[4] || "");
}

function normalizeChordLine(line: string): string {
  return line
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeChordToken)
    .join("  ");
}

function looksLikeTitle(line: string): boolean {
  const t = line.trim();
  if (t.length < 2 || t.length > 80) return false;
  if (isChordLine(t)) return false;
  const letters = t.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 3) return false;
  const upper = (t.match(/[A-ZÀ-Ú]/g) || []).length;
  return upper / letters.length >= 0.5 || t === t.toUpperCase();
}

export type ParsedPaste = {
  title: string;
  lines: SongLine[];
};

export function parsePastedSong(raw: string, titleHint?: string): ParsedPaste {
  const rows = raw.split(/\r?\n/).map(fixEncoding);
  let title = titleHint?.trim() ?? "";
  let start = 0;

  if (!title) {
    while (start < rows.length && !rows[start].trim()) start++;
    if (start < rows.length && looksLikeTitle(rows[start])) {
      title = rows[start].trim();
      start++;
    }
  }

  const lines: SongLine[] = [];
  for (let i = start; i < rows.length; i++) {
    const line = rows[i].trim();
    if (!line) continue;
    if (NOTE_PREFIX.test(line) || (line.startsWith("[") && line.endsWith("]"))) {
      lines.push({ type: "note", text: line });
    } else if (isChordLine(line)) {
      lines.push({ type: "chords", text: normalizeChordLine(line) });
    } else {
      lines.push({ type: "lyrics", text: line });
    }
  }

  if (!title) title = "Canto senza titolo";
  return { title, lines };
}

export function parseSongJson(raw: string): ParsedPaste | null {
  try {
    const data = JSON.parse(raw) as {
      title?: string;
      lines?: { type?: string; text?: string }[];
    };
    if (!data.title?.trim() || !Array.isArray(data.lines)) return null;
    const lines: SongLine[] = [];
    for (const row of data.lines) {
      if (!row.text?.trim()) continue;
      const type =
        row.type === "chords" || row.type === "lyrics" || row.type === "note" ? row.type : "lyrics";
      lines.push({ type, text: row.text.trim() });
    }
    if (!lines.length) return null;
    return { title: data.title.trim(), lines };
  } catch {
    return null;
  }
}
