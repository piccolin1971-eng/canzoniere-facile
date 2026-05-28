# Canzoniere Facile

App per tablet Android (e preview web) con i canti dell’**Azione Cattolica Ticinese** — testo e accordi in **Do Re Mi**, righe accordi sopra il testo.

Versione iniziale: **21 canti** importati dal PDF `Canzoniere-ACT` (A1–A11 Atto penitenziale, B1–B9 Gloria, più B5 in tonalità MI).

## Anteprima senza ricompilare l’APK

Per sviluppare e provare **non serve un APK ogni volta**. Usa **Expo Go**:

1. Sul tablet Android installa **[Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)** (una volta sola).
2. Sul PC, nella cartella del progetto:

```bash
cd c:\Users\picco\canzoniere-act
npm install
npx expo start
```

3. Scansiona il **QR code** con Expo Go (stessa rete Wi‑Fi del PC).
4. Ogni modifica al codice si ricarica sul tablet in pochi secondi (**Fast Refresh**).

### Alternative rapide

- **Tunnel** (se Wi‑Fi difficile): `npx expo start --tunnel`
- **Solo PC (browser)**: `npx expo start --web` — utile per layout, meno fedele al tablet.
- **APK “vera”**: solo quando serve testare fuori da Expo Go → `eas build` o build di sviluppo.

## Funzioni attuali

- Home con accesso a **Cerca**, **Sezioni**, **A–Z**, **Tematiche**
- Schermata canto: accordi arancioni, testo chiaro, **A- / A+**
- Navigazione canto precedente / successivo
- Canti recenti in home

## Struttura dati

I canti sono in `src/songs/index.ts` (righe `chords` / `lyrics` / `note`). Per aggiungerne altri dal PDF si può estendere lo stesso formato o uno script di import.

## Requisiti

- Node.js 20+
- npm o yarn

## Licenza / testi

I testi appartengono al canzoniere ACT. Questa app è un supporto personale di studio; verificare eventuali diritti prima di una distribuzione pubblica.
