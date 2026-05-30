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
import { useSongCatalog } from "./SongCatalogContext";
import { applySongEdit, SongEdit } from "./songEdits";
import { Song } from "./types";

const STORAGE_KEY = "canzoniere_edits";

type SongEditsState = {
  loaded: boolean;
  getResolvedSong: (id: string) => Song | undefined;
  isEdited: (id: string) => boolean;
  saveEdit: (id: string, edit: SongEdit) => Promise<void>;
  resetEdit: (id: string) => Promise<void>;
};

const SongEditsContext = createContext<SongEditsState | null>(null);

function SongEditsProviderInner({ children }: { children: ReactNode }) {
  const { getBaseSong } = useSongCatalog();
  const [edits, setEdits] = useState<Record<string, SongEdit>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, SongEdit>;
          if (parsed && typeof parsed === "object") setEdits(parsed);
        }
      } catch (e) {
        console.warn("Impossibile caricare modifiche canti:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Record<string, SongEdit>) => {
    setEdits(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getResolvedSong = useCallback(
    (id: string): Song | undefined => {
      const base = getBaseSong(id);
      if (!base) return undefined;
      return applySongEdit(base, edits[id]);
    },
    [edits, getBaseSong],
  );

  const isEdited = useCallback((id: string) => Boolean(edits[id]), [edits]);

  const saveEdit = useCallback(
    async (id: string, edit: SongEdit) => {
      const next = { ...edits, [id]: edit };
      await persist(next);
    },
    [edits, persist],
  );

  const resetEdit = useCallback(
    async (id: string) => {
      const next = { ...edits };
      delete next[id];
      await persist(next);
    },
    [edits, persist],
  );

  const value = useMemo(
    () => ({ loaded, getResolvedSong, isEdited, saveEdit, resetEdit }),
    [loaded, getResolvedSong, isEdited, saveEdit, resetEdit],
  );

  return <SongEditsContext.Provider value={value}>{children}</SongEditsContext.Provider>;
}

export function SongEditsProvider({ children }: { children: ReactNode }) {
  return <SongEditsProviderInner>{children}</SongEditsProviderInner>;
}

export function useSongEdits() {
  const ctx = useContext(SongEditsContext);
  if (!ctx) throw new Error("useSongEdits must be used within SongEditsProvider");
  return ctx;
}
