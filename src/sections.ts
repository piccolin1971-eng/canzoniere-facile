import type { Section } from "./types";

export const SECTIONS: Section[] = [
  { id: "A", name: "Atto penitenziale", emoji: "🙏", color: "#7C4DFF" },
  { id: "B", name: "Gloria", emoji: "✨", color: "#00BFA5" },
  { id: "C", name: "Salmi", emoji: "📖", color: "#42A5F5" },
  { id: "D", name: "Acclamazione al Vangelo", emoji: "📣", color: "#FF7043" },
  { id: "E", name: "Offertorio", emoji: "🎁", color: "#AB47BC" },
  { id: "F", name: "Dossologia", emoji: "🙌", color: "#26A69A" },
  { id: "G", name: "Santo", emoji: "☀️", color: "#FFA726" },
  { id: "H", name: "Scambio della pace", emoji: "🕊️", color: "#66BB6A" },
  { id: "L", name: "Agnello di Dio", emoji: "🐑", color: "#EF5350" },
  { id: "M", name: "Canti a Maria", emoji: "💙", color: "#5C6BC0" },
  { id: "N", name: "Avvento e Natale", emoji: "⭐", color: "#29B6F6" },
  { id: "P", name: "Quaresima e Pasqua", emoji: "✝️", color: "#8D6E63" },
  { id: "Z", name: "Miei canti", emoji: "✏️", color: "#9C27B0" },
];

export function getSection(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}
