/** Apostrofo ASCII e varianti tipografiche comuni nei testi importati. */
const APOSTROPHE = "['\u2019\u2018`\u00B4\u02BC]";

/** Corregge vocali accentate scritte con apostrofo (E' / E' → È, …). */
const APOSTROPHE_ACCENT: Record<string, string> = {
  A: "À",
  a: "à",
  E: "È",
  e: "è",
  I: "Ì",
  i: "ì",
  O: "Ò",
  o: "ò",
  U: "Ù",
  u: "ù",
};

export function fixItalianApostropheAccents(text: string): string {
  return text.replace(new RegExp(`([AaEeIiOoUu])${APOSTROPHE}`, "g"), (_m, vowel: string) =>
    APOSTROPHE_ACCENT[vowel] ?? vowel,
  );
}
