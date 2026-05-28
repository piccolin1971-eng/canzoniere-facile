/**
 * Extract plain text from ODT (OpenDocument) files with line breaks preserved.
 */
import { readFileSync, writeFileSync } from "fs";
import AdmZip from "adm-zip";

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function xmlToText(xml) {
  const lines = [];
  let current = "";
  const pushLine = () => {
    const t = decodeXmlEntities(current.replace(/\u00a0/g, " ")).trimEnd();
    lines.push(t);
    current = "";
  };

  const re =
    /<text:(?:p|h[^>]*)[^>]*>|<\/text:(?:p|h[^>]*)>|<text:line-break\/>|<text:s(?:\s+text:c="(\d+)")?\/>|<text:tab\/>/g;
  let m;
  let last = 0;
  while ((m = re.exec(xml)) !== null) {
    const between = xml.slice(last, m.index);
    if (between) current += between.replace(/<[^>]+>/g, "");
    const tag = m[0];
    if (tag.startsWith("</text:")) pushLine();
    else if (tag === "<text:line-break/>") pushLine();
    else if (tag.startsWith("<text:s")) {
      const spaces = m[1] ? Number(m[1]) + 1 : 2;
      current += " ".repeat(spaces);
    } else if (tag === "<text:tab/>") current += "\t";
    last = re.lastIndex;
  }
  const tail = xml.slice(last).replace(/<[^>]+>/g, "");
  if (tail) current += tail;
  if (current.trim()) pushLine();

  return lines.join("\n");
}

export function odtToText(filePath) {
  const zip = new AdmZip(filePath);
  const entry = zip.getEntry("content.xml");
  if (!entry) throw new Error(`content.xml not found in ${filePath}`);
  return xmlToText(entry.getData().toString("utf8"));
}

if (process.argv[1]?.endsWith("parse-odt.js")) {
  const out = process.argv[3];
  const text = odtToText(process.argv[2]);
  if (out) {
    writeFileSync(out, text, "utf8");
    console.log("written", out, text.split("\n").length, "lines");
  } else {
    console.log(text.slice(0, 2000));
  }
}
