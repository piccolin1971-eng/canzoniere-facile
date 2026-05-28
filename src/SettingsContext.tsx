import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getAppColors,
  PARCHMENT_TONE_DEFAULT,
  PARCHMENT_TONE_MAX,
  PARCHMENT_TONE_MIN,
  type AppColors,
  type ThemeMode,
} from "./themeColors";

interface SettingsState {
  theme: ThemeMode;
  parchmentTone: number;
  customLyricColor: string | null;
  customChordColor: string | null;
  fontSize: number;
  setTheme: (t: ThemeMode) => void;
  setParchmentTone: (n: number) => void;
  setCustomLyricColor: (c: string | null) => void;
  setCustomChordColor: (c: string | null) => void;
  setFontSize: (n: number) => void;
  recentIds: string[];
  pushRecent: (id: string) => void;
  colors: AppColors;
}

const FONT_MIN = 16;
const FONT_MAX = 40;
const STORAGE_KEY = "canzoniere_settings";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const SettingsContext = createContext<SettingsState | null>(null);

type PersistedSettings = {
  theme: ThemeMode;
  parchmentTone: number;
  customLyricColor: string | null;
  customChordColor: string | null;
  fontSize: number;
  recentIds: string[];
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [parchmentTone, setParchmentToneState] = useState(PARCHMENT_TONE_DEFAULT);
  const [customLyricColor, setCustomLyricColorState] = useState<string | null>(null);
  const [customChordColor, setCustomChordColorState] = useState<string | null>(null);
  const [fontSize, setFontSizeState] = useState(22);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const stateRef = useRef<PersistedSettings>({
    theme,
    parchmentTone,
    customLyricColor,
    customChordColor,
    fontSize,
    recentIds,
  });
  stateRef.current = {
    theme,
    parchmentTone,
    customLyricColor,
    customChordColor,
    fontSize,
    recentIds,
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.theme === "light" || s.theme === "dark" || s.theme === "parchment") {
            setThemeState(s.theme);
          }
          if (typeof s.parchmentTone === "number") {
            setParchmentToneState(clamp(Math.round(s.parchmentTone), PARCHMENT_TONE_MIN, PARCHMENT_TONE_MAX));
          }
          if (s.customLyricColor === null || typeof s.customLyricColor === "string") {
            setCustomLyricColorState(s.customLyricColor ?? null);
          }
          if (s.customChordColor === null || typeof s.customChordColor === "string") {
            setCustomChordColorState(s.customChordColor ?? null);
          }
          if (typeof s.fontSize === "number") {
            setFontSizeState(clamp(s.fontSize, FONT_MIN, FONT_MAX));
          }
          if (Array.isArray(s.recentIds)) setRecentIds(s.recentIds.slice(0, 12));
        }
      } catch {
        /* ignore */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (patch: Partial<PersistedSettings>) => {
    const next = { ...stateRef.current, ...patch };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setTheme = useCallback(
    (t: ThemeMode) => {
      setThemeState(t);
      persist({ theme: t });
    },
    [persist],
  );

  const setParchmentTone = useCallback(
    (n: number) => {
      const v = clamp(Math.round(n), PARCHMENT_TONE_MIN, PARCHMENT_TONE_MAX);
      setParchmentToneState(v);
      persist({ parchmentTone: v });
    },
    [persist],
  );

  const setCustomLyricColor = useCallback(
    (c: string | null) => {
      setCustomLyricColorState(c);
      persist({ customLyricColor: c });
    },
    [persist],
  );

  const setCustomChordColor = useCallback(
    (c: string | null) => {
      setCustomChordColorState(c);
      persist({ customChordColor: c });
    },
    [persist],
  );

  const setFontSize = useCallback(
    (n: number) => {
      const v = clamp(n, FONT_MIN, FONT_MAX);
      setFontSizeState(v);
      persist({ fontSize: v });
    },
    [persist],
  );

  const pushRecent = useCallback(
    (id: string) => {
      setRecentIds((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, 12);
        persist({ recentIds: next });
        return next;
      });
    },
    [persist],
  );

  const colors = useMemo(
    () => getAppColors(theme, parchmentTone, customLyricColor, customChordColor),
    [theme, parchmentTone, customLyricColor, customChordColor],
  );

  if (!loaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        theme,
        parchmentTone,
        customLyricColor,
        customChordColor,
        fontSize,
        setTheme,
        setParchmentTone,
        setCustomLyricColor,
        setCustomChordColor,
        setFontSize,
        recentIds,
        pushRecent,
        colors,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export { FONT_MIN, FONT_MAX, PARCHMENT_TONE_MIN, PARCHMENT_TONE_MAX, PARCHMENT_TONE_DEFAULT };
