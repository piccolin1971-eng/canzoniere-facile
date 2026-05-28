import { Song, SongLine } from "./types";

/** Modifiche locali salvate sul dispositivo (non toccano i file sorgente). */
export type SongEdit = {
  title?: string;
  subtitle?: string;
  lines?: SongLine[];
};

export function applySongEdit(base: Song, edit?: SongEdit | null): Song {
  if (!edit) return base;
  return {
    ...base,
    title: edit.title ?? base.title,
    subtitle: edit.subtitle !== undefined ? edit.subtitle : base.subtitle,
    lines: edit.lines ?? base.lines,
  };
}

export function songEditFromSong(song: Song): SongEdit {
  return {
    title: song.title,
    subtitle: song.subtitle,
    lines: song.lines.map((line) => ({ ...line })),
  };
}

export function lineTypeLabel(type: SongLine["type"]): string {
  if (type === "chords") return "Accordi";
  if (type === "lyrics") return "Testo";
  return "Nota";
}

export function cycleLineType(type: SongLine["type"]): SongLine["type"] {
  if (type === "chords") return "lyrics";
  if (type === "lyrics") return "note";
  return "chords";
}
