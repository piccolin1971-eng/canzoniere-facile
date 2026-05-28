export const SETLIST_COUNT = 5;

export type Setlist = {
  id: string;
  name: string;
  songIds: string[];
};

export const DEFAULT_SETLISTS: Setlist[] = [
  { id: "sl-1", name: "Domenica", songIds: [] },
  { id: "sl-2", name: "Messa tipo", songIds: [] },
  { id: "sl-3", name: "Feriale", songIds: [] },
  { id: "sl-4", name: "Scaletta 4", songIds: [] },
  { id: "sl-5", name: "Scaletta 5", songIds: [] },
];

export type LibraryData = {
  favorites: string[];
  setlists: Setlist[];
  activeSetlistId: string | null;
  /** Trasposizione salvata per canto (semitoni). */
  savedTranspose: Record<string, number>;
};

export function defaultLibraryData(): LibraryData {
  return {
    favorites: [],
    setlists: DEFAULT_SETLISTS.map((s) => ({ ...s, songIds: [...s.songIds] })),
    activeSetlistId: "sl-1",
    savedTranspose: {},
  };
}

export function normalizeLibraryData(raw: Partial<LibraryData> | null): LibraryData {
  const base = defaultLibraryData();
  if (!raw) return base;

  const setlists = DEFAULT_SETLISTS.map((def, i) => {
    const found = raw.setlists?.find((s) => s.id === def.id) ?? raw.setlists?.[i];
    return {
      id: def.id,
      name: typeof found?.name === "string" && found.name.trim() ? found.name.trim() : def.name,
      songIds: Array.isArray(found?.songIds)
        ? [...new Set(found.songIds.filter((id) => typeof id === "string"))]
        : [],
    };
  });

  const activeSetlistId =
    typeof raw.activeSetlistId === "string" && setlists.some((s) => s.id === raw.activeSetlistId)
      ? raw.activeSetlistId
      : base.activeSetlistId;

  const savedTranspose: Record<string, number> = {};
  if (raw.savedTranspose && typeof raw.savedTranspose === "object") {
    for (const [k, v] of Object.entries(raw.savedTranspose)) {
      if (typeof v === "number" && v >= -11 && v <= 11) savedTranspose[k] = v;
    }
  }

  return {
    favorites: Array.isArray(raw.favorites)
      ? [...new Set(raw.favorites.filter((id) => typeof id === "string"))]
      : [],
    setlists,
    activeSetlistId,
    savedTranspose,
  };
}
