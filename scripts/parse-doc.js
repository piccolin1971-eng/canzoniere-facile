/**
 * Extract plain text from legacy Word .doc files.
 */
import WordExtractor from "word-extractor";

export async function docToText(filePath) {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(filePath);
  return doc.getBody();
}
