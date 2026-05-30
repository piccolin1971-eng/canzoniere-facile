import type { Song } from "./types";

export type ThemeDef = {
  id: string;
  label: string;
  color: string;
  matches: (ctx: ThemeContext) => boolean;
};

export type ThemeContext = {
  song: Song;
  title: string;
  meta: string;
  lyrics: string;
  full: string;
};

export function buildThemeContext(song: Song): ThemeContext {
  const title = song.title.toLowerCase();
  const meta = [song.title, song.subtitle ?? "", ...(song.themes ?? [])].join(" ").toLowerCase();
  const lyrics = song.lines
    .filter((l) => l.type === "lyrics")
    .map((l) => l.text)
    .join("\n")
    .toLowerCase();
  const full = [
    meta,
    ...song.lines.filter((l) => l.type !== "chords").map((l) => l.text),
  ]
    .join("\n")
    .toLowerCase();
  return { song, title, meta, lyrics, full };
}

function hasWord(text: string, re: RegExp): boolean {
  return re.test(text);
}

function genVerde(meta: string): boolean {
  return /\bgen\s*verde\b|\bgen\s*v\.|\blit\.-gen\s*verde|\(gen\s*verde\b/.test(meta);
}

function genRosso(meta: string): boolean {
  return /\bgen\s*rosso\b|\bgen\s*r\.|\(gen\s*rosso\b|\bgen\s*r\b(?![a-z])/.test(meta);
}

/** Tematiche in ordine di visualizzazione. */
export const THEME_DEFINITIONS: ThemeDef[] = [
  {
    id: "kyrie",
    label: "Kyrie",
    color: "#7C4DFF",
    matches: ({ title, meta, lyrics }) =>
      hasWord(title, /\bkyrie\b|piet[aà]|eleison/) ||
      hasWord(meta, /\bkyrie\b|signore piet[aà]/) ||
      hasWord(lyrics, /\bkyrie\b|signore piet[aà]|piet[aà] di noi|eleison/),
  },
  {
    id: "gloria",
    label: "Gloria",
    color: "#00BFA5",
    matches: ({ song, title, meta }) =>
      song.sectionId === "B" ||
      hasWord(title, /\bgloria\b/) ||
      (hasWord(meta, /\bgloria\b/) && !genVerde(meta) && !genRosso(meta)),
  },
  {
    id: "alleluia",
    label: "Alleluia",
    color: "#FF7043",
    matches: ({ song, title, lyrics }) =>
      song.sectionId === "D" ||
      hasWord(title, /\balleluia\b/) ||
      hasWord(lyrics, /\balleluia\b/),
  },
  {
    id: "agnello-di-dio",
    label: "Agnello di Dio",
    color: "#EF5350",
    matches: ({ song, title, meta }) =>
      song.sectionId === "L" ||
      hasWord(title, /\bagnello\b/) ||
      hasWord(meta, /\bagnello di dio\b/),
  },
  {
    id: "mariani",
    label: "Mariani",
    color: "#5C6BC0",
    matches: ({ song, title, meta, lyrics }) =>
      song.sectionId === "M" ||
      hasWord(title, /\bmaria\b|ave maria|\bmagnificat\b|\bregina\b|\brosario\b/) ||
      hasWord(meta, /\bmadre di dio\b|\bvergine\b/) ||
      hasWord(lyrics, /\bave maria\b|\bsalve regina\b|\bmagnificat\b/),
  },
  {
    id: "santo",
    label: "Santo",
    color: "#FFA726",
    matches: ({ song, title, meta }) =>
      song.sectionId === "G" ||
      (hasWord(title, /\bsanto\b/) && !title.includes("santuario")) ||
      hasWord(meta, /\bsanto, santo, santo\b/),
  },
  {
    id: "penitenza",
    label: "Penitenza",
    color: "#FF6B4A",
    matches: ({ song, title, lyrics }) =>
      song.sectionId === "A" ||
      hasWord(title, /penitenz|confesso|mi accuso/) ||
      hasWord(lyrics, /atto penitenz|confesso a dio|mi accuso/),
  },
  {
    id: "natale-avvento",
    label: "Natale e Avvento",
    color: "#29B6F6",
    matches: ({ song, title, meta, lyrics }) =>
      song.sectionId === "N" ||
      hasWord(title, /\bavvento\b|\bnatale\b|\bbambino\b|\bbetlem/) ||
      hasWord(meta, /\bavvento\b|\bnatale\b/) ||
      hasWord(lyrics, /\bvieni emmanuele\b|\bin terra pace\b|\bbuon pastore\b/),
  },
  {
    id: "pasqua",
    label: "Pasqua",
    color: "#8D6E63",
    matches: ({ song, title, meta, lyrics }) =>
      song.sectionId === "P" ||
      hasWord(title, /\bpasqua\b|\brisort|\bpasquale\b/) ||
      hasWord(meta, /\bpasqua\b|\bmistero pasquale\b/) ||
      hasWord(lyrics, /\bcristo risort|\bvittoria sulla morte\b|\bsepolcro\b/),
  },
  {
    id: "offertorio",
    label: "Offertorio",
    color: "#AB47BC",
    matches: ({ song, title, meta, lyrics, full }) =>
      song.sectionId === "E" ||
      hasWord(title, /\boffertorio\b|\bofferta\b/) ||
      hasWord(meta, /\boffertorio\b/) ||
      hasWord(lyrics, /\boffertorio\b|\bti offriamo\b|\bportiamo all.altare\b|\bpane e vino\b|\bpane del cielo\b|\bcalici\b|\bcalice\b|\bostia\b/) ||
      (hasWord(full, /\bpane\b/) && hasWord(full, /\bvino\b/) && hasWord(full, /offri|present|altare|eucarist/)),
  },
  {
    id: "comunione",
    label: "Comunione",
    color: "#26A69A",
    matches: ({ title, lyrics, full }) =>
      hasWord(title, /\bcomunione\b/) ||
      hasWord(lyrics, /\bcomunione\b|\bcorpo di cristo\b|\bsangue di cristo\b|\briceviamo\b|\bpane di vita\b|\bostia\b|\bcorp[oa] del signore\b/) ||
      hasWord(full, /\bcomunione\b|\bcomunichiamo\b/),
  },
  {
    id: "adorazione",
    label: "Adorazione",
    color: "#7E57C2",
    matches: ({ title, lyrics }) =>
      hasWord(title, /\badorazione\b|\beucarist/) ||
      hasWord(lyrics, /\bti adoriamo\b|\badoriamo\b|\beucaristia\b|\bsacramento\b|\bmonstr/),
  },
  {
    id: "spirito-santo",
    label: "Spirito Santo",
    color: "#42A5F5",
    matches: ({ song, title, meta, lyrics }) => {
      if (song.id === "l-atteso") return true;
      if (hasWord(title, /\batteso\b|\bspirito santo\b|\bvieni spirito\b/)) return true;
      if (hasWord(meta, /\bspirito santo\b|\bvieni spirito\b/)) return true;
      if (hasWord(lyrics, /\bil mio spirito esulta\b|\bnello spirito di\b/)) return false;
      return hasWord(
        lyrics,
        /\bspirito santo\b|\bspirito di dio\b|\bspirito del signore\b|\bvieni spirito\b|\bparaclito\b|\bconsolatore\b|\blo spirito che animi\b|\blo spirito del\b|\bspirito di sapienza\b|\bspirito di fortezza\b|\bspirito di vita\b/,
      );
    },
  },
  {
    id: "gen-verde",
    label: "Gen Verde",
    color: "#66BB6A",
    matches: ({ meta }) => genVerde(meta),
  },
  {
    id: "gen-rosso",
    label: "Gen Rosso",
    color: "#E53935",
    matches: ({ meta }) => genRosso(meta),
  },
  {
    id: "taize",
    label: "Taizé",
    color: "#8D6E63",
    matches: ({ meta, lyrics }) =>
      hasWord(meta, /\btaiz[eé]\b|\bcom\.?\s*taiz/) || hasWord(lyrics, /\btaiz[eé]\b|\bconfitemini domino\b/),
  },
  {
    id: "missione",
    label: "Missione",
    color: "#5C6BC0",
    matches: ({ title, lyrics }) =>
      hasWord(title, /\bmissione\b|\bevangel/) ||
      hasWord(lyrics, /\bmissione\b|\bandate\b|\btestimoni\b|\bannunciate\b|\bevangelizz|\binviati\b|\bportate il vangelo\b/),
  },
  {
    id: "battesimo",
    label: "Battesimo",
    color: "#29B6F6",
    matches: ({ title, lyrics }) =>
      hasWord(title, /\bbattesim/) ||
      hasWord(lyrics, /\bbattesim|\bacqua che scende\b|\brinnovati nell.acqua\b|\bbattizzat/),
  },
];

const themeById = new Map(THEME_DEFINITIONS.map((t) => [t.id, t]));
const themeByLabel = new Map(THEME_DEFINITIONS.map((t) => [t.label.toLowerCase(), t]));

export function resolveTheme(query: string): ThemeDef | undefined {
  const q = query.trim().toLowerCase();
  return themeById.get(q) ?? themeByLabel.get(q);
}

export function classifySongThemes(song: Song): ThemeDef[] {
  const ctx = buildThemeContext(song);
  return THEME_DEFINITIONS.filter((def) => def.matches(ctx));
}

export function songMatchesTheme(song: Song, query: string): boolean {
  const def = resolveTheme(query);
  if (!def) return false;
  return def.matches(buildThemeContext(song));
}

export function getThemeLabels(): string[] {
  return THEME_DEFINITIONS.map((t) => t.label);
}

export function getThemeColor(labelOrId: string): string {
  const def = resolveTheme(labelOrId);
  return def?.color ?? "#42A5F5";
}
