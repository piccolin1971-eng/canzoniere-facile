/**
 * Inserisce nel report risultati verificati manualmente (ricerca web agente).
 * Run: npx tsx scripts/seed-verified-authors.ts
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const REPORT_PATH = join(__dirname, "author-enrichment-report.json");

type Confidence = "high" | "medium" | "low" | "not_found" | "traditional";

interface EnrichmentResult {
  id: string;
  title: string;
  author?: string;
  confidence: Confidence;
  sources: string[];
  queries: string[];
  lyricsMatch: boolean;
  notes?: string;
  processedAt: string;
}

/** Risultati verificati con match testo + fonti concordi. */
const VERIFIED: Omit<EnrichmentResult, "processedAt">[] = [
  {
    id: "a1",
    title: "Ti chiedo perdono",
    author: "Sequeri",
    confidence: "high",
    sources: ["puericantoresveduggio.it", "baronacom.it"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Pierangelo Sequeri — testo e musica",
  },
  {
    id: "a2",
    title: "Signore che sei venuto",
    author: "f. buttazzo",
    confidence: "high",
    sources: ["animazioneliturgica.it"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Francesco Buttazzo, Vita nuova con te 1995",
  },
  {
    id: "abba-padre",
    title: "ABBA' PADRE",
    author: "S. Martinez",
    confidence: "high",
    sources: ["arquen.it/canti/326"],
    queries: ["manual"],
    lyricsMatch: true,
  },
  {
    id: "accogli-i-nostri-doni",
    title: "ACCOGLI I NOSTRI DONI",
    author: "f. buttazzo",
    confidence: "high",
    sources: ["arquen.it/canti/641", "paolinestore.it"],
    queries: ["manual"],
    lyricsMatch: true,
  },
  {
    id: "adeste-fideles",
    title: "ADESTE FIDELES",
    author: "Trad.",
    confidence: "traditional",
    sources: ["wikisource", "liturgia cattolica"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Inno natalizio tradizionale",
  },
  {
    id: "acqua-siamo-noi",
    title: "ACQUA SIAMO NOI",
    author: "Giosy Cento",
    confidence: "high",
    sources: ["animatamente.net", "canzoniereonline.it"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "G. Cento in animatamente",
  },
  {
    id: "ascolto-la-tua-voce",
    title: "ASCOLTO LA TUA VOCE",
    author: "M. C. Pecoraro",
    confidence: "high",
    sources: ["arquen.it/canti/2094"],
    queries: ["manual"],
    lyricsMatch: true,
  },
  {
    id: "apri-le-tue-braccia",
    title: "APRI LE TUE BRACCIA",
    author: "D. Machetta",
    confidence: "high",
    sources: ["arquen.it/canti/666", "cantoeprego.it"],
    queries: ["manual"],
    lyricsMatch: true,
  },
  {
    id: "benedici-il-signore",
    title: "BENEDICI IL SIGNORE",
    author: "m. frisina",
    confidence: "high",
    sources: ["animatamente.net", "paolinestore.it"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Salmo 102 — Marco Frisina",
  },
  {
    id: "canzone-di-san-damiano",
    title: "CANZONE DI SAN DAMIANO",
    author: "R. Ortolani",
    confidence: "high",
    sources: ["arquen.it/canti/766", "librettocanti.it"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "C. Baglioni & R. Ortolani — film Fratello sole sorella luna",
  },
  {
    id: "camminero",
    title: "CAMMINERO'",
    author: "Alberto Marani",
    confidence: "high",
    sources: ["animatamente.net", "le3.it"],
    queries: ["manual"],
    lyricsMatch: true,
  },
  {
    id: "andro-a-vederla-un-di",
    title: "ANDRO' A VEDERLA UN DI'",
    author: "Pietro Janin",
    confidence: "high",
    sources: ["ecclesiadei.it", "accordiespartiti.it"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Canto mariano popolare, autore storico",
  },
  {
    id: "gloria-nell-alto-dei-cieli-gen",
    title: "GLORIA NELL'ALTO DEI CIELI (Gen Verde)",
    author: "Gen Verde",
    confidence: "high",
    sources: ["paolinestore.it", "animatamente.net"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Autore nel titolo — Verbum Panis",
  },
  {
    id: "servire-e-regnare-gen-verde",
    title: "Servire è regnare (Gen Verde) ♫",
    author: "Gen Verde",
    confidence: "high",
    sources: ["animatamente.net"],
    queries: ["manual"],
    lyricsMatch: true,
  },
  {
    id: "alleluia-gen-verde-15",
    title: "Alleluia (gen verde)	15",
    author: "Gen Verde",
    confidence: "high",
    sources: ["libretto indice", "animatamente.net"],
    queries: ["manual"],
    lyricsMatch: true,
    notes: "Variante Alleluia Verbum Panis",
  },
  {
    id: "canoni-di-taize",
    title: "Canoni di Taizè",
    author: "Taizé",
    confidence: "traditional",
    sources: ["taize.fr", "liturgia"],
    queries: ["manual"],
    lyricsMatch: true,
  },
];

interface Report {
  updatedAt: string;
  results: Record<string, EnrichmentResult>;
}

const report: Report = existsSync(REPORT_PATH)
  ? (JSON.parse(readFileSync(REPORT_PATH, "utf8")) as Report)
  : { updatedAt: new Date().toISOString(), results: {} };

let merged = 0;
for (const v of VERIFIED) {
  const existing = report.results[v.id];
  if (existing?.confidence === "high" && existing.author) continue;
  report.results[v.id] = { ...v, processedAt: new Date().toISOString() };
  merged++;
}

report.updatedAt = new Date().toISOString();
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
console.log(`Seed verificati: ${merged} inseriti/aggiornati → ${REPORT_PATH}`);
