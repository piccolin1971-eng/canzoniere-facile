export type LineType = "chords" | "lyrics" | "note";

export interface SongLine {
  type: LineType;
  text: string;
}

export interface Song {
  id: string;
  code: string;
  title: string;
  sectionId: string;
  themes?: string[];
  subtitle?: string;
  lines: SongLine[];
}

export interface Section {
  id: string;
  name: string;
  emoji: string;
  color: string;
}
