/** Nomi solfege → semitono (DO = 0). */
const SOLFEGE_BASE: Record<string, number> = {
  DO: 0,
  RE: 2,
  MI: 4,
  FA: 5,
  SOL: 7,
  LA: 9,
  SI: 11,
};

const SEMI_TO_SOLFEGE: { note: string; acc: string }[] = [
  { note: "DO", acc: "" },
  { note: "DO", acc: "#" },
  { note: "RE", acc: "" },
  { note: "RE", acc: "#" },
  { note: "MI", acc: "" },
  { note: "FA", acc: "" },
  { note: "FA", acc: "#" },
  { note: "SOL", acc: "" },
  { note: "SOL", acc: "#" },
  { note: "LA", acc: "" },
  { note: "LA", acc: "#" },
  { note: "SI", acc: "" },
];

/** Token accordo: DO, RE-, FA#, SOL, MI, ecc. + suffisso (m, 7, M, …). */
const CHORD_TOKEN =
  /^(DO|RE|MI|FA|SOL|LA|SI)(#|\+|b|-)?(\d*|m|M|maj|min|dim|aug|sus|add|°|º|\+)?(.*)?$/i;

function parseToken(token: string): { semi: number; suffix: string } | null {
  const t = token.trim();
  if (!t) return null;
  const m = t.match(CHORD_TOKEN);
  if (!m) return null;
  const baseName = m[1].toUpperCase();
  const base = SOLFEGE_BASE[baseName];
  if (base === undefined) return null;
  let acc = m[2] ?? "";
  if (acc === "b") acc = "-";
  let semi = base;
  if (acc === "#" || acc === "+") semi += 1;
  else if (acc === "-") semi -= 1;
  semi = ((semi % 12) + 12) % 12;
  const suffix = (m[3] ?? "") + (m[4] ?? "");
  return { semi, suffix };
}

function formatSemi(semi: number, preferFlat: boolean): string {
  const s = ((semi % 12) + 12) % 12;
  const entry = SEMI_TO_SOLFEGE[s];
  let acc = entry.acc;
  if (preferFlat && acc === "#") {
    const flatMap: Record<number, string> = {
      1: "RE-",
      3: "MI-",
      6: "SOL-",
      8: "LA-",
      10: "SI-",
      11: "DO-",
    };
    if (flatMap[s]) return flatMap[s];
  }
  return entry.note + acc;
}

function transposeToken(token: string, semitones: number): string {
  const parsed = parseToken(token);
  if (!parsed || semitones === 0) return token;
  const preferFlat = token.includes("-") || token.toLowerCase().includes("b");
  const newSemi = ((parsed.semi + semitones) % 12 + 12) % 12;
  return formatSemi(newSemi, preferFlat) + parsed.suffix;
}

/** Traspose una riga accordi (token separati da spazi). */
export function transposeChordLine(line: string, semitones: number): string {
  if (!semitones) return line;
  return line
    .split(/(\s+)/)
    .map((part) => (part.trim() ? transposeToken(part, semitones) : part))
    .join("");
}

export function formatTransposeLabel(semitones: number): string {
  if (semitones === 0) return "Originale";
  return semitones > 0 ? `+${semitones}` : `${semitones}`;
}
