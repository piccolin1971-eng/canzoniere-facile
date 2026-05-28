import { readFileSync, writeFileSync } from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function extractPdf(path) {
  const data = new Uint8Array(readFileSync(path));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines = [];
    let currentY = null;
    let currentLine = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round(item.transform[5]);
      if (currentY !== null && Math.abs(y - currentY) > 2) {
        if (currentLine.length) lines.push(currentLine.join(" ").trim());
        currentLine = [];
      }
      currentY = y;
      if (item.str.trim()) currentLine.push(item.str);
    }
    if (currentLine.length) lines.push(currentLine.join(" ").trim());
    pages.push({ page: i, lines: lines.filter(Boolean) });
  }
  return pages;
}

const files = [
  ["libroaccordi", "c:/Users/picco/Desktop/libroaccordi.pdf"],
  ["libretto", "c:/Users/picco/Desktop/Libretto.pdf"],
];

for (const [name, path] of files) {
  const pages = await extractPdf(path);
  const text = pages.map((p) => p.lines.join("\n")).join("\n\n");
  writeFileSync(`c:/Users/picco/canzoniere-act/scripts/${name}.txt`, text, "utf8");
  writeFileSync(
    `c:/Users/picco/canzoniere-act/scripts/${name}.json`,
    JSON.stringify(pages, null, 0),
    "utf8",
  );
  console.log(name, "pages:", pages.length, "chars:", text.length);
}
