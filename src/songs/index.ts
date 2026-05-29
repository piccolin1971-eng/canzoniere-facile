import { Song, SongLine } from "../types";
import { IMPORTED_SONGS } from "./imported";

const c = (text: string): SongLine => ({ type: "chords", text });
const l = (text: string): SongLine => ({ type: "lyrics", text });
const n = (text: string): SongLine => ({ type: "note", text });

export const SONGS: Song[] = [
  {
    id: "a1",
    code: "A1",
    title: "Ti chiedo perdono",
    subtitle: "Sequeri",
    sectionId: "A",
    lines: [
      n("[INTRO: LA- RE- LA-]"),
      c("LA-  RE-  LA-  DO  FA  MI  LA-  FA  MI7"),
      l("Ti chiedo perdono Padre buono, per ogni mancanza d'Amore:"),
      c("LA-  RE-  LA-  DO  FA  MI  LA-  FA  SOL"),
      l("per la mia debole speranza, e per la mia fragile fede."),
      c("DO  FA  DO  SOL  FA  SOL  DO  MI-"),
      l("Domando a Te Signore, che illumini i miei passi,"),
      c("FA  FA-  DO  FA  FA-"),
      l("la forza di vivere con tutti i miei fratelli,"),
      c("DO  SOL7  DO"),
      l("nuovamente fedele al Tuo Vangelo."),
      n("[FINE: FA DO]"),
    ],
  },
  {
    id: "a2",
    code: "A2",
    title: "Signore che sei venuto",
    subtitle: "f. buttazzo",
    sectionId: "A",
    lines: [
      c("MI  LA  MI  LA"),
      l("Signore che sei venuto a perdonare,"),
      c("DO#-  SOL#-  LA  MI"),
      l("abbi pietà di noi, abbi pietà di noi."),
      c("LA  MI  LA  MI"),
      l("Signore pietà. Signore pietà."),
      c("MI  LA  MI  LA"),
      l("Cristo che fai festa per chi ritorna a Te,"),
      c("DO#-  SOL#-  LA  MI"),
      l("abbi pietà di noi, abbi pietà di noi."),
      c("LA  MI  LA  MI"),
      l("Cristo pietà. Cristo pietà."),
      c("MI  LA  MI  LA"),
      l("Signore che perdoni molto a chi molto ama,"),
      c("DO#-  SOL#-  LA  MI"),
      l("abbi pietà di noi, abbi pietà di noi."),
      c("LA  MI  LA  MI"),
      l("Signore pietà. Signore pietà."),
    ],
  },
  {
    id: "a3",
    code: "A3",
    title: "Kyrie Eleison",
    sectionId: "A",
    subtitle: "Emberti / Gialloreti",
    lines: [
      c("RE  SI-  MI-  LA  RE  SI-  MI-  LA  RE"),
      l("Kyrie eleison, Christe eleison, Kyrie eleison, Christe eleison."),
      c("RE  SI-  MI-  LA  RE  SI-  MI-  LA"),
      l("Signore pietà, Cristo pietà, Signore pietà, Cristo pietà."),
      c("RE  SI-  MI-  LA  RE  SI-  MI-  LA  RE"),
      l("Kyrie eleison, Christe eleison, Kyrie eleison, Christe eleison."),
    ],
  },
  {
    id: "a4",
    code: "A4",
    title: "Kyrie Eleison",
    subtitle: "Emberti / Gialloreti",
    sectionId: "A",
    lines: [
      n("[INTRO: LA- MI]"),
      c("LA-  SOL  DO  RE-  MI  LA-"),
      l("Kyrie, Kyrie, eleison."),
      c("LA-  SOL  DO  RE-  MI  LA-"),
      l("Kyrie, Kyrie, eleison."),
      c("LA-  SOL  DO  RE-  MI  LA-"),
      l("Christe, Christe, eleison."),
      c("LA-  SOL  DO  RE-  MI  LA-"),
      l("Christe, Christe, eleison."),
      c("LA-  SOL  DO  RE-  MI  LA-"),
      l("Kyrie, Kyrie, eleison."),
      c("LA-  SOL  DO  RE-  MI  LA-"),
      l("Kyrie, Kyrie, eleison."),
    ],
  },
  {
    id: "a5",
    code: "A5",
    title: "Kyrie Togolese",
    sectionId: "A",
    lines: [
      c("RE  SI-  FA#-  LA  RE  SI-  FA#-  LA"),
      l("Kyrie eleison, Kyrie eleison,"),
      c("RE  SI-  FA#-  LA  SI-  SOL  LA  RE"),
      l("Kyrie eleison, ele … ele - i - son."),
      c("RE  SI-  FA#-  LA  RE  SI-  FA#-  LA"),
      l("Christe eleison, Christe eleison,"),
      c("RE  SI-  FA#-  LA  SI-  SOL  LA  RE"),
      l("Christe eleison, ele … ele - i - son."),
      c("RE  SI-  FA#-  LA  RE  SI-  FA#-  LA"),
      l("Kyrie eleison, Kyrie eleison,"),
      c("RE  SI-  FA#-  LA  SI-  SOL  LA  RE"),
      l("Kyrie eleison, ele … ele - i - son."),
    ],
  },
  {
    id: "a6",
    code: "A6",
    title: "Signore pietà",
    sectionId: "A",
    lines: [
      c("RE  SOL  RE"),
      l("Signore, Signore pietà."),
      c("FA#-  LA  SI-  SOL"),
      l("Cristo, Cristo pietà di noi."),
      c("LA  FA#-  MI-  RE"),
      l("Signore pietà, pietà di noi."),
      c("RE  SOL  RE"),
      l("Signore, Signore pietà."),
      c("FA#-  LA  SI-  SOL"),
      l("Cristo, Cristo pietà di noi."),
      c("LA  FA#-  MI-  RE"),
      l("Signore pietà, pietà di noi."),
      c("SOL  LA7  FA#-  MI-  RE"),
      l("Signore, Signore pietà, pietà di noi."),
    ],
  },
  {
    id: "a7",
    code: "A7",
    title: "Scusa Signore",
    subtitle: "biagioli (in Re)",
    sectionId: "A",
    lines: [
      c("MI  SI  MI  LA  MI  SI  SI7"),
      l("1  Scusa Signore se bussiamo alla porta del Tuo cuore, siamo noi."),
      c("MI  SI  MI  LA  MI  SI  MI  SI"),
      l("Scusa Signore se chiediamo mendicanti dell'Amore un ristoro da Te."),
      c("MI  LA  FA#-  MI"),
      l("Rit.: Così la foglia quando è stanca cade giù,"),
      c("DO#-  SOL#-  LA  SI"),
      l("ma poi la terra ha una vita sempre in più."),
      c("MI  LA  FA#-  MI"),
      l("Così la gente quando è stanca vuole Te,"),
      c("DO#-  SOL#-  LA  SI  MI  SI"),
      l("e tu Signore hai una vita sempre in più, sempre in più."),
      n("[FINE: MI]"),
    ],
  },
  {
    id: "a8",
    code: "A8",
    title: "Signore pietà",
    sectionId: "A",
    subtitle: "Messa Gen",
    lines: [
      c("LA-  RE-  DO"),
      l("Signore, pietà! Signore, pietà di noi!"),
      c("LA-  FA  SOL  MI"),
      l("Cristo, pietà! Cristo, pietà di noi!"),
      c("LA-  FA  RE-  SOL  LA-"),
      l("Signore, pietà! Signore, pietà di noi, pietà!"),
      n("[PARLATO] Signore, ho cercato fuori di Te la mia gloria…"),
      c("LA-  FA  RE-  SOL  LA-"),
      l("Signore, pietà! Signore, pietà di noi, pietà!"),
    ],
  },
  {
    id: "a9",
    code: "A9",
    title: "Kyrie",
    sectionId: "A",
    subtitle: "Pardonne-moi Seigneur",
    lines: [
      c("DO  SOL  RE-  LA-  DO  SOL  LA-"),
      l("Ky-rie eleison, Kyrie eleison."),
      c("DO  SOL  RE-  LA-  DO  SOL  LA-"),
      l("Christe eleison, Christe eleison."),
      c("DO  SOL  RE-  LA-  DO  SOL  LA-"),
      l("Ky-rie eleison, Kyrie eleison."),
    ],
  },
  {
    id: "a10",
    code: "A10",
    title: "Perdonaci Signore",
    sectionId: "A",
    lines: [
      c("MI-  LA-"),
      l("1. Perdonaci, Signore, nostro amico,"),
      c("RE  SI  MI-"),
      l("se abbiamo pensato solo a noi,"),
      c("DO  LA-  RE  MI-"),
      l("e non ci siamo accorti delle Tue parole."),
      c("DO  RE  SOL  RE"),
      l("Signore, Signore, Signore pietà."),
      c("DO  RE  SOL  RE  MI-"),
      l("Signore, Signore, Signore pietà, pietà."),
    ],
  },
  {
    id: "a11",
    code: "A11",
    title: "Signore pietà",
    sectionId: "A",
    lines: [
      c("LA  FA#-  RE  SI-  MI  LA"),
      l("Signore, che hai parola di vita eterna, abbi pietà di noi."),
      c("RE  SI-  MI  LA"),
      l("Signore, Signore, Signore pietà."),
      c("LA  FA#-  RE  SI-  MI  LA"),
      l("Cristo, mite e umile di cuore, abbi pietà di noi."),
      c("RE  DO#-  SI-  LA"),
      l("Cristo, Cristo, Cristo pietà."),
      c("LA  SI-  FA#-  RE"),
      l("Signore, che per noi ti sei fatto obbediente fino alla morte,"),
      c("SI-  MI  LA"),
      l("abbi pietà di noi."),
      c("RE  SI-  MI  LA"),
      l("Signore, Signore, Signore pietà."),
    ],
  },
  {
    id: "b1",
    code: "B1",
    title: "Gloria a Dio, pace all'uomo",
    sectionId: "B",
    lines: [
      c("LA-  FA  SOL  DO  SOL  LA-  MI-"),
      l("Rit.: Gloria a Dio! Pace all'uomo! Gioia dal cielo alla terra!"),
      c("DO  FA  SOL  DO  FA  LA-  SOL4  DO"),
      l("1 Per il Tuo Amore, Padre buono, a Te il nostro grazie."),
      c("FA  SOL  DO  FA  SOL7  MI-  SOL"),
      l("Noi Ti lodiamo, Ti benediciamo per il Tuo Regno che viene."),
      c("DO  SOL  LA-  MI-  LA-  SOL  RE-  LA-"),
      l("A Te i canti di festa per il Figlio Gesù nello Spirito Santo."),
      n("Rit."),
    ],
  },
  {
    id: "b2",
    code: "B2",
    title: "Gloria a Cristo",
    sectionId: "B",
    lines: [
      c("RE  RE  MI-  RE  DO  RE"),
      l("1 Gloria a Cristo, splendore eterno del Dio vivente!"),
      c("RE  MI-  RE  LA-  RE"),
      l("Rit.: Gloria a Te, Signor!"),
      c("RE  RE  MI-  RE  DO  RE"),
      l("2 Gloria a Cristo, sapienza eterna del Dio vivente!  Rit."),
      c("RE  RE  MI-  RE  DO  RE"),
      l("3 Gloria a Cristo, Parola eterna del Dio vivente!  Rit."),
      c("RE  RE  MI-  RE  DO  RE"),
      l("4 Gloria a Cristo, che muore e risorge per tutti i fratelli!  Rit."),
      c("RE  RE  MI-  RE  DO  RE"),
      l("5 Gloria a Cristo, che ascende nei cieli alla destra del Padre!  Rit."),
    ],
  },
  {
    id: "b3",
    code: "B3",
    title: "Gloria in excelsis Deo",
    sectionId: "B",
    lines: [
      c("RE  SOL  RE  SOL  RE  LA"),
      l("Rit.: Gloria, gloria, in excelsis Deo."),
      c("RE  SI-  LA  FA#  SI-  SOL  RE  LA  RE"),
      l("Gloria, Gloria, in excelsis Deo."),
      c("RE  SI-  RE  LA  SOL  SI-"),
      l("1 E pace in terra agli uomini di buona volontà. Noi Ti lodiamo,"),
      c("MI-  LA  SOL  MI-"),
      l("Ti benediciamo, Ti adoriamo, noi Ti glorifichiamo,"),
      c("LA  RE"),
      l("Ti rendiamo grazie per la tua Gloria immensa,"),
      c("SI-  LA7  MI-  LA7"),
      l("Signore Dio Re del cielo, Dio Padre onnipotente.  Rit."),
    ],
  },
  {
    id: "b4",
    code: "B4",
    title: "Il Signore è la luce",
    sectionId: "B",
    lines: [
      c("SOL  RE  DO  SOL"),
      l("1 Il Signore è la luce che vince la notte."),
      c("SI-  DO  LA-  DO  RE7  SOL"),
      l("Rit.: Gloria! Gloria! Cantiamo al Signore!"),
      c("SI-  DO  LA-  DO  RE7  SOL"),
      l("Gloria! Gloria! Cantiamo al Signore!"),
      c("SOL  RE  DO  SOL"),
      l("2 Il Signore è la vita che vince la morte.  Rit."),
      c("SOL  RE  DO  SOL"),
      l("3 Il Signore è la grazia che vince il peccato.  Rit."),
      c("SOL  RE  DO  SOL"),
      l("4 Il Signore è la gioia che vince l'angoscia.  Rit."),
      c("SOL  RE  DO  SOL"),
      l("5 Il Signore è la pace che vince la guerra.  Rit."),
    ],
  },
  {
    id: "b5",
    code: "B5",
    title: "Gloria a Dio",
    sectionId: "B",
    subtitle: "Lodate Dio — tonalità SOL",
    lines: [
      c("SOL  RE  DO  SOL"),
      l("1  Gloria a Dio Signore nell'alto dei cieli."),
      c("SI-  DO  LA-  DO  RE7  SOL"),
      l("Gloria, gloria, nell'alto dei cieli!"),
      c("SOL  RE  DO  SOL"),
      l("2  Pace agli uomini in Terra a Dio diletti."),
      c("SI-  DO  LA-  DO  RE7  SOL"),
      l("Pace, pace, agli uomini in Terra!"),
      c("SOL  RE  DO  SOL"),
      l("3  Con l'intero creato lodiamo Te Padre."),
      c("SI-  DO  LA-  DO  RE7  SOL"),
      l("A Te lode, azione di grazie!"),
    ],
  },
  {
    id: "b5mi",
    code: "B5",
    title: "Gloria a Dio",
    sectionId: "B",
    subtitle: "Lodate Dio — tonalità MI",
    lines: [
      c("MI  SI  LA  MI"),
      l("1  Gloria a Dio Signore nell'alto dei cieli."),
      c("SOL#-  LA  FA#-  LA  SI7  MI"),
      l("Gloria, gloria, nell'alto dei cieli!"),
      c("MI  SI  LA  MI"),
      l("2  Pace agli uomini in Terra a Dio diletti."),
      c("SOL#-  LA  FA#-  LA  SI7  MI"),
      l("Pace, pace, agli uomini in Terra!"),
    ],
  },
  {
    id: "b6",
    code: "B6",
    title: "Gloria a Dio",
    sectionId: "B",
    subtitle: "RnS",
    lines: [
      n("[INTRO: RE LA RE]"),
      c("RE  LA"),
      l("Rit.: Gloria a Dio nell'alto dei cieli"),
      c("SOL  LA"),
      l("e pace in terra agli uomini amati dal Signore."),
      c("RE  LA  SOL"),
      l("Ti lodiamo, Ti benediciamo, Ti adoriamo, Ti rendiamo grazie"),
      c("LA"),
      l("per la tua gloria immensa."),
      c("SOL  FA#-"),
      l("1 Signore Dio, Re del cielo, Dio Padre onnipotente;"),
      c("MI-  LA"),
      l("Signore, Figlio unigenito, Gesù Cristo.  Rit."),
      c("SOL  LA"),
      l("Amen, Amen."),
    ],
  },
  {
    id: "b7",
    code: "B7",
    title: "Gloria",
    sectionId: "B",
    subtitle: "D. Ricci",
    lines: [
      n("[INTRO: DO FA DO SOL LA- DO MI- SOL]"),
      c("DO  FA  DO  SOL"),
      l("Rit.: Gloria a Dio nell'alto dei cieli"),
      c("LA-  DO  MI-  SOL4  SOL"),
      l("e pace in terra agli uomini di buona volontà."),
      c("SIb  DO"),
      l("1 Noi Ti lodiamo, Ti benediciamo, Ti adoriamo, Ti glorifichiamo,"),
      c("MI-  FA  LA-  DO  SOL4  SOL"),
      l("Ti rendiamo grazie per la Tua gloria immensa, Signore Dio,"),
      c("FA  LA-  DO  SOL"),
      l("Re del cielo, Dio Padre onnipotente.  Rit."),
      c("RE-7  FA  DO"),
      l("Amen. Amen."),
    ],
  },
  {
    id: "b8",
    code: "B8",
    title: "Gloria, Gloria!",
    sectionId: "B",
    subtitle: "Giombini",
    lines: [
      c("DO  SOL  DO  FA  SOL  DO  SOL  DO  FA  SOL  DO  MI-  LA-  FA"),
      l("Gloria (Gloria) Gloria (Gloria) a Dio nell'alto dei Cieli,"),
      c("DO  SOL  DO  FA  SOL"),
      l("Gloria."),
      c("DO  SOL  DO  FA  SOL  DO  SOL  DO  FA  SOL  DO  MI-  LA-  FA  DO  SOL  DO  DO7"),
      l("E pace (e pace) e pace (e pace) in Terra agli uomini di buona volontà."),
      n("[FINE: FA SOL DO]"),
    ],
  },
  {
    id: "b9",
    code: "B9",
    title: "Gloria",
    sectionId: "B",
    subtitle: "Buttazzo / Beltrami",
    lines: [
      c("SOL  RE  DO  SOL  RE  DO  SOL"),
      l("Gloria a Dio nell'alto dei cieli e pace in terra agli uomini"),
      c("FA  RE"),
      l("di buona volontà."),
      c("MI-  SI-  DO  SOL  LA-  SI  SI7"),
      l("1. Noi ti lodiamo, Ti benediciamo, Ti adoriamo, Ti glorifichiamo"),
      c("MI-  SI-  DO  LA-  RE"),
      l("Ti rendiamo grazie per la Tua Gloria immensa."),
      c("DO-  SOL  MI-  LA-  RE"),
      l("Signore Dio, Re del Cielo, Dio Padre Onnipotente. Rit."),
      n("[FINE: DO LA- SOL]"),
    ],
  },
  ...IMPORTED_SONGS,
];

export function getSong(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}

export function searchSongs(query: string): Song[] {
  const q = query.trim().toLowerCase();
  if (!q) return SONGS;
  return SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.subtitle?.toLowerCase().includes(q) ?? false) ||
      (s.themes?.some((t) => t.toLowerCase().includes(q)) ?? false),
  );
}

export function getThemes(): string[] {
  const set = new Set<string>();
  for (const s of SONGS) {
    const t = s.title.toLowerCase();
    if (t.includes("kyrie") || t.includes("pietà")) set.add("Kyrie");
    if (t.includes("gloria")) set.add("Gloria");
    if (t.includes("alleluia")) set.add("Alleluia");
    if (t.includes("agnello")) set.add("Agnello di Dio");
    if (t.includes("maria") || t.includes("ave maria")) set.add("Maria");
    if (t.includes("santo") && !t.includes("santuario")) set.add("Santo");
    if (s.sectionId === "A") set.add("Penitenza");
    if (s.sectionId === "N") set.add("Natale");
    if (s.sectionId === "P") set.add("Pasqua");
  }
  set.add("Liturgia");
  return [...set].sort((a, b) => a.localeCompare(b, "it"));
}

export function getSongsByTheme(theme: string): Song[] {
  const t = theme.toLowerCase();
  return SONGS.filter((s) => {
    const title = s.title.toLowerCase();
    if (t === "kyrie") return title.includes("kyrie") || title.includes("pietà");
    if (t === "gloria") return title.includes("gloria");
    if (t === "alleluia") return title.includes("alleluia");
    if (t === "agnello di dio") return title.includes("agnello");
    if (t === "maria") return title.includes("maria");
    if (t === "santo") return title.includes("santo");
    if (t === "penitenza") return s.sectionId === "A";
    if (t === "natale") return s.sectionId === "N";
    if (t === "pasqua") return s.sectionId === "P";
    if (t === "liturgia") return true;
    return s.themes?.some((x) => x.toLowerCase() === t) ?? false;
  });
}

export function songsBySection(sectionId: string): Song[] {
  return SONGS.filter((s) => s.sectionId === sectionId);
}

export function songsAlphabetical(): Song[] {
  return [...SONGS].sort((a, b) => a.title.localeCompare(b.title, "it"));
}
