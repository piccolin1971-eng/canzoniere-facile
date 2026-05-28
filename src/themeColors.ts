export type ThemeMode = "light" | "dark" | "parchment";

export const PARCHMENT_TONE_MIN = 35;
export const PARCHMENT_TONE_MAX = 65;
export const PARCHMENT_TONE_DEFAULT = 50;

export type AppColors = {
  bg: string;
  bgCard: string;
  bgElevated: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  chord: string;
  chordAlt: string;
  primary: string;
  success: string;
  headerTint: string;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function hexToHsl(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h /= 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  if (ss === 0) {
    const v = Math.round(ll * 255);
    const hex = v.toString(16).padStart(2, "0");
    return `#${hex}${hex}${hex}`;
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hue = hh / 360;
  const toRgb = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const r = Math.round(toRgb(hue + 1 / 3) * 255);
  const g = Math.round(toRgb(hue) * 255);
  const b = Math.round(toRgb(hue - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function shiftParchmentHex(hex: string, tone: number, minL: number, maxL: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, clamp(l + tone * 1.25, minL, maxL));
}

function parchmentToneToDelta(tone: number): number {
  const t = clamp(Math.round(tone), PARCHMENT_TONE_MIN, PARCHMENT_TONE_MAX);
  return ((t - PARCHMENT_TONE_DEFAULT) / 15) * 8;
}

function getDarkColors(): AppColors {
  return {
    bg: "#0C0C12",
    bgCard: "#16161F",
    bgElevated: "#1E1E2A",
    border: "#2A2A3A",
    text: "#F4F4F8",
    textMuted: "#9A9AB0",
    accent: "#FF6B4A",
    accentSoft: "#FF8A7022",
    chord: "#FFB74D",
    chordAlt: "#4DD0E1",
    primary: "#7C4DFF",
    success: "#00E676",
    headerTint: "#F4F4F8",
  };
}

function getLightColors(): AppColors {
  return {
    bg: "#FDFBF7",
    bgCard: "#FFFFFF",
    bgElevated: "#F2F0E9",
    border: "#D7D3C8",
    text: "#111111",
    textMuted: "#5C5C6A",
    accent: "#E64A19",
    accentSoft: "#E64A1922",
    chord: "#BF360C",
    chordAlt: "#00695C",
    primary: "#5E35B1",
    success: "#2E7D32",
    headerTint: "#111111",
  };
}

function getParchmentColors(tone: number): AppColors {
  const delta = parchmentToneToDelta(tone);
  const bg = shiftParchmentHex("#E8DCC4", delta, 78, 92);
  const bgCard = shiftParchmentHex("#F2E6D0", delta, 80, 94);
  const bgElevated = shiftParchmentHex("#D8C8A8", delta, 68, 82);
  const border = shiftParchmentHex("#C8B89C", delta, 62, 76);
  return {
    bg,
    bgCard,
    bgElevated,
    border,
    text: "#000000",
    textMuted: "#2C2C2C",
    accent: "#8B4513",
    accentSoft: "#8B451322",
    chord: "#B45309",
    chordAlt: "#1B5E20",
    primary: "#8B4513",
    success: "#1B5E20",
    headerTint: "#000000",
  };
}

export function getAppColors(
  theme: ThemeMode,
  parchmentTone = PARCHMENT_TONE_DEFAULT,
  customLyricColor?: string | null,
  customChordColor?: string | null,
): AppColors {
  let base: AppColors;
  if (theme === "dark") {
    base = getDarkColors();
  } else if (theme === "parchment") {
    base = getParchmentColors(parchmentTone);
  } else {
    base = getLightColors();
  }

  return {
    ...base,
    text: customLyricColor ?? base.text,
    chord: customChordColor ?? base.chord,
  };
}
