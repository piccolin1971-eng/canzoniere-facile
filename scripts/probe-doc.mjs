import WordExtractor from "word-extractor";
import { writeFileSync } from "fs";
import { basename } from "path";

const FILES = [
  "c:/Users/picco/Desktop/Canzonieri/canzoniere coro Longarone.doc",
  "c:/Users/picco/Desktop/Canzonieri/Libretto canti con accordi fatto in seminario.doc",
  "c:/Users/picco/Desktop/Canzonieri/L'Atteso (accordi).doc",
  "c:/Users/picco/Desktop/Canzonieri/canti-con-accordi-con-indice-2007.doc",
];

const extractor = new WordExtractor();

for (const path of FILES) {
  const doc = await extractor.extract(path);
  const body = doc.getBody();
  const name = basename(path).replace(/\.doc$/i, ".txt");
  writeFileSync(new URL(`./${name}`, import.meta.url), body, "utf8");
  console.log(name, "lines:", body.split("\n").length, "chars:", body.length);
  console.log(body.slice(0, 1200));
  console.log("---");
}
