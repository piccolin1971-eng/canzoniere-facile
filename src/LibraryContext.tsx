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
import { defaultLibraryData, LibraryData, normalizeLibraryData, Setlist } from "./libraryTypes";

const STORAGE_KEY = "canzoniere_library";

type LibraryState = {
  favorites: string[];
  setlists: Setlist[];
  activeSetlistId: string | null;
  savedTranspose: Record<string, number>;
  isFavorite: (songId: string) => boolean;
  toggleFavorite: (songId: string) => Promise<void>;
  isInSetlist: (setlistId: string, songId: string) => boolean;
  isInAnySetlist: (songId: string) => boolean;
  getSetlistsContaining: (songId: string) => Setlist[];
  addToSetlist: (setlistId: string, songId: string) => Promise<void>;
  removeFromSetlist: (setlistId: string, songId: string) => Promise<void>;
  moveInSetlist: (setlistId: string, songId: string, direction: "up" | "down") => Promise<void>;
  reorderSetlist: (setlistId: string, songIds: string[]) => Promise<void>;
  renameSetlist: (setlistId: string, name: string) => Promise<void>;
  setActiveSetlistId: (setlistId: string | null) => Promise<void>;
  getActiveSetlist: () => Setlist | undefined;
  getSavedTranspose: (songId: string) => number;
  saveTranspose: (songId: string, semitones: number) => Promise<void>;
  resetTranspose: (songId: string) => Promise<void>;
  purgeSong: (songId: string) => Promise<void>;
};

const LibraryContext = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LibraryData>(defaultLibraryData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setData(normalizeLibraryData(JSON.parse(raw)));
      } catch (e) {
        console.warn("Impossibile caricare preferiti/scalette:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback((updater: (prev: LibraryData) => LibraryData) => {
    setData((prev) => {
      const next = updater(prev);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((songId: string) => data.favorites.includes(songId), [data.favorites]);

  const toggleFavorite = useCallback(
    async (songId: string) => {
      persist((prev) => ({
        ...prev,
        favorites: prev.favorites.includes(songId)
          ? prev.favorites.filter((id) => id !== songId)
          : [...prev.favorites, songId],
      }));
    },
    [persist],
  );

  const isInSetlist = useCallback(
    (setlistId: string, songId: string) => {
      const sl = data.setlists.find((s) => s.id === setlistId);
      return sl?.songIds.includes(songId) ?? false;
    },
    [data.setlists],
  );

  const isInAnySetlist = useCallback(
    (songId: string) => data.setlists.some((sl) => sl.songIds.includes(songId)),
    [data.setlists],
  );

  const getSetlistsContaining = useCallback(
    (songId: string) => data.setlists.filter((sl) => sl.songIds.includes(songId)),
    [data.setlists],
  );

  const addToSetlist = useCallback(
    async (setlistId: string, songId: string) => {
      persist((prev) => ({
        ...prev,
        activeSetlistId: setlistId,
        setlists: prev.setlists.map((sl) => {
          if (sl.id !== setlistId) return sl;
          if (sl.songIds.includes(songId)) return sl;
          return { ...sl, songIds: [...sl.songIds, songId] };
        }),
      }));
    },
    [persist],
  );

  const removeFromSetlist = useCallback(
    async (setlistId: string, songId: string) => {
      persist((prev) => ({
        ...prev,
        setlists: prev.setlists.map((sl) =>
          sl.id === setlistId ? { ...sl, songIds: sl.songIds.filter((id) => id !== songId) } : sl,
        ),
      }));
    },
    [persist],
  );

  const moveInSetlist = useCallback(
    async (setlistId: string, songId: string, direction: "up" | "down") => {
      persist((prev) => ({
        ...prev,
        setlists: prev.setlists.map((sl) => {
          if (sl.id !== setlistId) return sl;
          const idx = sl.songIds.indexOf(songId);
          if (idx < 0) return sl;
          const nextIdx = direction === "up" ? idx - 1 : idx + 1;
          if (nextIdx < 0 || nextIdx >= sl.songIds.length) return sl;
          const songIds = [...sl.songIds];
          [songIds[idx], songIds[nextIdx]] = [songIds[nextIdx], songIds[idx]];
          return { ...sl, songIds };
        }),
      }));
    },
    [persist],
  );

  const reorderSetlist = useCallback(
    async (setlistId: string, songIds: string[]) => {
      persist((prev) => ({
        ...prev,
        setlists: prev.setlists.map((sl) =>
          sl.id === setlistId ? { ...sl, songIds } : sl,
        ),
      }));
    },
    [persist],
  );

  const renameSetlist = useCallback(
    async (setlistId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      persist((prev) => ({
        ...prev,
        setlists: prev.setlists.map((sl) =>
          sl.id === setlistId ? { ...sl, name: trimmed } : sl,
        ),
      }));
    },
    [persist],
  );

  const setActiveSetlistId = useCallback(
    async (setlistId: string | null) => {
      persist((prev) => ({ ...prev, activeSetlistId: setlistId }));
    },
    [persist],
  );

  const getActiveSetlist = useCallback(
    () => data.setlists.find((s) => s.id === data.activeSetlistId),
    [data.setlists, data.activeSetlistId],
  );

  const getSavedTranspose = useCallback(
    (songId: string) => data.savedTranspose[songId] ?? 0,
    [data.savedTranspose],
  );

  const saveTranspose = useCallback(
    async (songId: string, semitones: number) => {
      const clamped = Math.max(-11, Math.min(11, Math.round(semitones)));
      persist((prev) => {
        const savedTranspose = { ...prev.savedTranspose };
        if (clamped === 0) delete savedTranspose[songId];
        else savedTranspose[songId] = clamped;
        return { ...prev, savedTranspose };
      });
    },
    [persist],
  );

  const resetTranspose = useCallback(
    async (songId: string) => {
      persist((prev) => {
        const savedTranspose = { ...prev.savedTranspose };
        delete savedTranspose[songId];
        return { ...prev, savedTranspose };
      });
    },
    [persist],
  );

  const purgeSong = useCallback(
    async (songId: string) => {
      persist((prev) => {
        const savedTranspose = { ...prev.savedTranspose };
        delete savedTranspose[songId];
        return {
          ...prev,
          favorites: prev.favorites.filter((id) => id !== songId),
          setlists: prev.setlists.map((sl) => ({
            ...sl,
            songIds: sl.songIds.filter((id) => id !== songId),
          })),
          savedTranspose,
        };
      });
    },
    [persist],
  );

  const value = useMemo(
    (): LibraryState => ({
      favorites: data.favorites,
      setlists: data.setlists,
      activeSetlistId: data.activeSetlistId,
      savedTranspose: data.savedTranspose,
      isFavorite,
      toggleFavorite,
      isInSetlist,
      isInAnySetlist,
      getSetlistsContaining,
      addToSetlist,
      removeFromSetlist,
      moveInSetlist,
      reorderSetlist,
      renameSetlist,
      setActiveSetlistId,
      getActiveSetlist,
      getSavedTranspose,
      saveTranspose,
      resetTranspose,
      purgeSong,
    }),
    [
      data,
      isFavorite,
      toggleFavorite,
      isInSetlist,
      isInAnySetlist,
      getSetlistsContaining,
      addToSetlist,
      removeFromSetlist,
      moveInSetlist,
      reorderSetlist,
      renameSetlist,
      setActiveSetlistId,
      getActiveSetlist,
      getSavedTranspose,
      saveTranspose,
      resetTranspose,
      purgeSong,
    ],
  );

  if (!loaded) return null;

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
