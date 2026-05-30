import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSong as getBuiltinSong,
  getThemes as getBuiltinThemes,
  SONGS,
} from "./songs";
import { Song } from "./types";

const STORAGE_KEY = "canzoniere_user_songs";
const HIDDEN_SONGS_KEY = "canzoniere_hidden_songs";
const CUSTOM_SECTION = "Z";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function nextCustomCode(existing: Song[]): string {
  let max = 0;
  for (const s of existing) {
    const m = /^M(\d+)$/.exec(s.code);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `M${max + 1}`;
}

type SongCatalogState = {
  loaded: boolean;
  userSongs: Song[];
  totalCount: number;
  /** Elenco A–Z in cache (stessa istanza finché il catalogo non cambia). */
  songsAlphabeticalList: Song[];
  getAlphabeticalNeighbors: (id: string) => {
    prev: Song | null;
    next: Song | null;
    index: number;
  };
  getBaseSong: (id: string) => Song | undefined;
  searchSongs: (query: string) => Song[];
  /** @deprecated Preferire songsAlphabeticalList */
  songsAlphabetical: () => Song[];
  songsBySection: (sectionId: string) => Song[];
  getSongsByTheme: (theme: string) => Song[];
  getThemes: () => string[];
  isCustomSong: (id: string) => boolean;
  isHiddenSong: (id: string) => boolean;
  addUserSong: (draft: { title: string; subtitle?: string; sectionId?: string; lines: Song["lines"] }) => Promise<Song>;
  updateUserSong: (id: string, patch: Partial<Pick<Song, "title" | "subtitle" | "sectionId" | "lines">>) => Promise<void>;
  deleteUserSong: (id: string) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
};

const SongCatalogContext = createContext<SongCatalogState | null>(null);

export function SongCatalogProvider({ children }: { children: ReactNode }) {
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [hiddenSongIds, setHiddenSongIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [userRaw, hiddenRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(HIDDEN_SONGS_KEY),
        ]);
        if (userRaw) {
          const parsed = JSON.parse(userRaw) as Song[];
          if (Array.isArray(parsed)) setUserSongs(parsed.filter((s) => s?.id && s?.title));
        }
        if (hiddenRaw) {
          const parsed = JSON.parse(hiddenRaw) as string[];
          if (Array.isArray(parsed)) {
            setHiddenSongIds(parsed.filter((id) => typeof id === "string"));
          }
        }
      } catch (e) {
        console.warn("Impossibile caricare i canti:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persistUserSongs = useCallback(async (next: Song[]) => {
    setUserSongs(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const persistHidden = useCallback(async (next: string[]) => {
    setHiddenSongIds(next);
    await AsyncStorage.setItem(HIDDEN_SONGS_KEY, JSON.stringify(next));
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenSongIds), [hiddenSongIds]);

  const visibleBuiltinSongs = useMemo(
    () => SONGS.filter((s) => !hiddenSet.has(s.id)),
    [hiddenSet],
  );

  const allSongs = useMemo(
    () => [...userSongs, ...visibleBuiltinSongs],
    [userSongs, visibleBuiltinSongs],
  );

  const getBaseSong = useCallback(
    (id: string) => {
      if (hiddenSet.has(id)) return undefined;
      return userSongs.find((s) => s.id === id) ?? getBuiltinSong(id);
    },
    [userSongs, hiddenSet],
  );

  const searchSongs = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return allSongs;
      return allSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.subtitle?.toLowerCase().includes(q) ?? false) ||
          (s.themes?.some((t) => t.toLowerCase().includes(q)) ?? false),
      );
    },
    [allSongs],
  );

  const songsAlphabeticalList = useMemo(
    () => [...allSongs].sort((a, b) => a.title.localeCompare(b.title, "it")),
    [allSongs],
  );

  const alphabeticalIndexById = useMemo(() => {
    const map = new Map<string, number>();
    songsAlphabeticalList.forEach((s, i) => map.set(s.id, i));
    return map;
  }, [songsAlphabeticalList]);

  const songsAlphabetical = useCallback(
    () => songsAlphabeticalList,
    [songsAlphabeticalList],
  );

  const getAlphabeticalNeighbors = useCallback(
    (id: string) => {
      const index = alphabeticalIndexById.get(id) ?? -1;
      if (index < 0) {
        return { prev: null, next: null, index: -1 };
      }
      return {
        prev: index > 0 ? songsAlphabeticalList[index - 1] : null,
        next: index < songsAlphabeticalList.length - 1 ? songsAlphabeticalList[index + 1] : null,
        index,
      };
    },
    [alphabeticalIndexById, songsAlphabeticalList],
  );

  const songsBySectionMap = useMemo(() => {
    const map = new Map<string, Song[]>();
    for (const s of allSongs) {
      const list = map.get(s.sectionId);
      if (list) list.push(s);
      else map.set(s.sectionId, [s]);
    }
    for (const [key, list] of map) {
      list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      map.set(key, list);
    }
    return map;
  }, [allSongs]);

  const songsBySection = useCallback(
    (sectionId: string) => songsBySectionMap.get(sectionId) ?? [],
    [songsBySectionMap],
  );

  const getSongsByTheme = useCallback(
    (theme: string) => {
      const t = theme.toLowerCase();
      return allSongs.filter((s) => {
        const title = s.title.toLowerCase();
        if (t === "kyrie") return title.includes("kyrie") || title.includes("pietà");
        if (t === "gloria") return title.includes("gloria");
        if (t === "alleluia") return title.includes("alleluia");
        if (t === "agnello di dio") return title.includes("agnello");
        if (t === "maria") return title.includes("maria");
        if (t === "santo") return title.includes("santo");
        if (t === "penitenza") return s.sectionId === "A";
        if (t === "natale") return s.sectionId === "N";
        if (t === "pasqua") return s.sectionId === "P";
        if (t === "liturgia") return true;
        return s.themes?.some((x) => x.toLowerCase() === t) ?? false;
      });
    },
    [allSongs],
  );

  const getThemes = useCallback(() => getBuiltinThemes(), []);

  const isCustomSong = useCallback(
    (id: string) => userSongs.some((s) => s.id === id),
    [userSongs],
  );

  const isHiddenSong = useCallback((id: string) => hiddenSet.has(id), [hiddenSet]);

  const addUserSong = useCallback(
    async (draft: {
      title: string;
      subtitle?: string;
      sectionId?: string;
      lines: Song["lines"];
    }) => {
      const slug = slugify(draft.title) || "canto";
      const song: Song = {
        id: `user-${slug}-${Date.now()}`,
        code: nextCustomCode(userSongs),
        title: draft.title.trim(),
        subtitle: draft.subtitle?.trim() || undefined,
        sectionId: draft.sectionId || CUSTOM_SECTION,
        lines: draft.lines,
        isCustom: true,
      };
      const next = [song, ...userSongs];
      await persistUserSongs(next);
      return song;
    },
    [userSongs, persistUserSongs],
  );

  const updateUserSong = useCallback(
    async (id: string, patch: Partial<Pick<Song, "title" | "subtitle" | "sectionId" | "lines">>) => {
      const next = userSongs.map((s) => (s.id === id ? { ...s, ...patch } : s));
      await persistUserSongs(next);
    },
    [userSongs, persistUserSongs],
  );

  const deleteUserSong = useCallback(
    async (id: string) => {
      await persistUserSongs(userSongs.filter((s) => s.id !== id));
    },
    [userSongs, persistUserSongs],
  );

  const deleteSong = useCallback(
    async (id: string) => {
      if (userSongs.some((s) => s.id === id)) {
        await deleteUserSong(id);
        return;
      }
      if (hiddenSet.has(id)) return;
      await persistHidden([...hiddenSongIds, id]);
    },
    [userSongs, hiddenSet, hiddenSongIds, deleteUserSong, persistHidden],
  );

  const value = useMemo(
    (): SongCatalogState => ({
      loaded,
      userSongs,
      totalCount: allSongs.length,
      songsAlphabeticalList,
      getAlphabeticalNeighbors,
      getBaseSong,
      searchSongs,
      songsAlphabetical,
      songsBySection,
      getSongsByTheme,
      getThemes,
      isCustomSong,
      isHiddenSong,
      addUserSong,
      updateUserSong,
      deleteUserSong,
      deleteSong,
    }),
    [
      loaded,
      userSongs,
      allSongs.length,
      songsAlphabeticalList,
      getAlphabeticalNeighbors,
      getBaseSong,
      searchSongs,
      songsAlphabetical,
      songsBySection,
      getSongsByTheme,
      isCustomSong,
      isHiddenSong,
      addUserSong,
      updateUserSong,
      deleteUserSong,
      deleteSong,
    ],
  );

  return <SongCatalogContext.Provider value={value}>{children}</SongCatalogContext.Provider>;
}

export function useSongCatalog() {
  const ctx = useContext(SongCatalogContext);
  if (!ctx) throw new Error("useSongCatalog must be used within SongCatalogProvider");
  return ctx;
}
