import React, { createContext, useContext, useState, ReactNode } from "react";

type FontCtx = {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
};

const FontContext = createContext<FontCtx | null>(null);

const MIN = 16;
const MAX = 36;
const STEP = 2;

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState(22);

  const increase = () => setFontSize((n) => Math.min(MAX, n + STEP));
  const decrease = () => setFontSize((n) => Math.max(MIN, n - STEP));

  return (
    <FontContext.Provider value={{ fontSize, increase, decrease }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error("useFont must be used within FontProvider");
  return ctx;
}
