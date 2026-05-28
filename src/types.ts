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
  /** Canto aggiunto dall'utente sul tablet. */
  isCustom?: boolean;
}

export interface Section {
  id: string;
  name: string;
  emoji: string;
  color: string;
}
