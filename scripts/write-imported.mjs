import { readFileSync, writeFileSync } from "fs";

const body = readFileSync("c:/Users/picco/canzoniere-act/scripts/new-songs.ts.txt", "utf8");
const header = `import { Song, SongLine } from "../types";

const c = (text: string): SongLine => ({ type: "chords", text });
const l = (text: string): SongLine => ({ type: "lyrics", text });
const n = (text: string): SongLine => ({ type: "note", text });

export const IMPORTED_SONGS: Song[] = [
`;
const footer = `\n];\n`;
writeFileSync("c:/Users/picco/canzoniere-act/src/songs/imported.ts", header + body + footer, "utf8");
console.log("written imported.ts", (header + body + footer).length);
