# Alpivo Product Audit

Datum: 2026-05-20

## Umfang

Geprueft wurde der lokal gebaute Production-Stand auf `http://localhost:3024` mit Beta-Cookie `alpivo_beta_access=qa-local`.

Vor der Routenpruefung wurden ausgefuehrt:

- `npm run lint`
- `npm run build`

## Routenstatus

| Route | Status | Befund |
| --- | ---: | --- |
| `/` | 200 | Funktioniert. Hero/Startseite nutzt zentrale Brand-Komponente, keine Fake-Presseleiste, Resort-Action-Links vorhanden. |
| `/quiz` | 200 | Funktioniert. Wizard ist vorhanden, keine alten Logo-Assets im HTML. |
| `/results` | 200 | Funktioniert. Top Matches werden angezeigt, keine leere Vorbereitung, Obertauern/Solden/Zell am See konsistent. |
| `/resorts` | 200 | Funktioniert. Resort-Cards und offizielle Links vorhanden. |
| `/map` | 200 | Funktioniert. Premium-Map rendert, keine Platzhaltertexte wie `Karten-Preview wird vorbereitet`. |
| `/resort/obertauern` | 200 | Funktioniert. Detailseite laedt mit Score, Metriken, Gruenden, Haken und offiziellen Links. |
| `/resort/solden` | 200 | Funktioniert. Detailseite laedt mit konsistenten Daten und offiziellen Links. |
| `/resort/zell-am-see` | 200 | Funktioniert. Detailseite laedt mit konsistenten Daten und offiziellen Links. |
| `/resort/saalbach` | 200 | Funktioniert. Detailseite laedt mit konsistenten Daten und offiziellen Links. |
| `/trips` | 200 | Funktioniert. Gast-Tripboards vorhanden, keine leere Shell. |
| `/trips/new` | 200 | Funktioniert. Gastmodus wird produktnah erklaert: lokale Planung als Gast, dauerhafte Speicherung mit Login. |
| `/trips/demo-trip-crew` | 200 | Funktioniert. Tripboard hat Inhalt; URL enthaelt noch historischen Demo-Slug, sichtbare harte Demo-Copy wurde reduziert. |
| `/trips/demo-trip-crew/compare` | 200 | Funktioniert. Vergleichsseite ist nicht leer. |
| `/trips/demo-trip-crew/expenses` | 200 | Funktioniert. Gruppenkosten-Seite ist nicht leer. |
| `/trips/demo-trip-family` | 200 | Funktioniert. Tripboard hat Inhalt. |
| `/trips/demo-trip-family/compare` | 200 | Funktioniert. Vergleichsseite ist nicht leer. |
| `/trips/demo-trip-family/expenses` | 200 | Funktioniert. Gruppenkosten-Seite ist nicht leer. |
| `/trips/demo-trip-spring` | 200 | Funktioniert. Tripboard hat Inhalt. |
| `/trips/demo-trip-spring/compare` | 200 | Funktioniert. Vergleichsseite ist nicht leer. |
| `/trips/demo-trip-spring/expenses` | 200 | Funktioniert. Gruppenkosten-Seite ist nicht leer. |
| `/checklist` | 200 | Funktioniert. Lokale Checkliste/Readiness vorhanden. |
| `/account` | 200 | Funktioniert. Gast-Cockpit ist produktnah formuliert, keine harte `Cockpit wird aktiv`-Copy mehr. |
| `/feedback` | 200 | Funktioniert. Feedbackseite laedt, keine leere Shell. |
| `/impressum` | 200 | Launch-Blocker: Seite ist bewusst ein Platzhalter fuer finale Anbieterangaben. Keine Fantasiedaten eingetragen. |
| `/datenschutz` | 200 | Launch-Blocker: finale Datenschutzerklaerung/Verantwortlicher/Speicherfristen fehlen. Keine Fantasiedaten eingetragen. |
| `/datenhinweis` | 200 | Funktioniert. Datenstatus ist als Beta-/Pilotdaten erklaert. |

## Logo

Zentrale Komponente:

- `src/components/premium/BrandLogo.tsx`

Genutzte Assets:

- `public/brand/logo-v2.png`
- `public/brand/icon-v2.png`

Status:

- Header, Footer, AppShell, Mobile Navigation, Map, Wizard, Account, Resort Detail, Tripseiten und rechtliche Seiten laufen ueber `BrandLogo` oder den Adapter `src/components/Logo.tsx`.
- In den geprueften HTML-Antworten wurden keine primaeren Referenzen auf `alpivo-logo-v2-transparent`, `alpivo-mark-v2-transparent`, `logo-v2-cropped` oder `icon-v2-cropped` gefunden.
- Die alten/falschen Assets liegen noch im `public/brand`-Ordner, werden aber nicht mehr als primaere Brand ausgespielt.

## Navigation

- Desktop-AppShell nutzt einheitlich: Startseite, Match starten, Ergebnisse, Resorts, Karte, Trips, Checkliste, Konto, Feedback.
- Mobile AppShell nutzt einheitlich: Start, Match, Ergebnis, Trips, Konto.
- Die globale MobileBottomNav wurde von `Trips Bald` auf `Trips Beta` vereinheitlicht.
- Keine widerspruechlichen `Bald`-Labels mehr in `src`.
- Rechtliche/sekundaere Seiten nutzen den globalen Header/Footer mit zentraler Logo-Komponente.

## Demo-Sprache

Entfernt bzw. entschaerft:

- `Demo Top Matches` / `Demo Top-Matches`
- `Demo-Fallback`
- `Demo-Boards`
- `lokaler Demo-State`
- `Cockpit wird aktiv, sobald du deinen ersten Match startest`
- `Zum Anlegen eines echten Gruppen-Trips braucht Alpivo ein Konto`
- `Bekannt aus`

Aktueller Ansatz:

- Gastmodus wird als lokal auf diesem Geraet gespeichert beschrieben.
- Login wird als dauerhafte Speicherung beschrieben.
- `Demo` wird nicht mehr prominent als Produktzustand ausgespielt; historische Trip-URLs enthalten weiterhin `demo-trip-*`.

## Links und Aktionen

- Zentrale offizielle Resort-Links liegen in `src/data/resortActionLinks.ts`.
- `ExternalActionLinks` wird in Results, Resorts, Map und Resort Detail genutzt.
- Alpivo behauptet keine eigene Buchung. Externe Links werden als offizielle naechste Schritte fuer Resort-Infos, Skipass/Preise, Live-Status, Webcams, Pistenplan, Unterkunft oder Anreise dargestellt.
- Travel-Copy wurde entschaerft: keine `Partnerlink`-Formulierung mehr, stattdessen externe Suche bzw. freigegebene Travel-Provider-API.

## Leere Seiten und Shell-only-Zustaende

- Im HTTP-Smoke-Test war keine der geforderten Routen leer oder Shell-only.
- Trip Detail, Compare und Expenses fuer Crew, Family und Spring liefern alle 200 und rendern Inhalte.
- Keine Route zeigte dauerhaft `Lade Resort`, `Empfehlungen werden vorbereitet` oder `wird vorbereitet`.

## Daten und Werte

- Obertauern bleibt Top Match mit Score 92.
- Solden bleibt mit Score 89 konsistent.
- Zell am See bleibt mit Score 86 konsistent.
- Saalbach bleibt mit Score 84 konsistent.
- Resortdaten, Action Links und Datenstatus sind weiter teilweise Beta-/Pilotdaten und dienen als Orientierung.

## Buttons, die klickbar wirken

Per HTTP-Smoke-Test wurden keine leeren Zielrouten gefunden. Interaktive Client-Aktionen wie Favorit speichern, Zum Trip hinzufuegen, Feedback senden oder lokale Checkliste wurden in diesem Audit nicht voll browser-interaktiv durchgeklickt. Aus Code-Sicht nutzen diese Bereiche lokale State-/localStorage-Fallbacks oder vorhandene API-Routen.

## Launch-Blocker

P0 vor oeffentlichem Launch:

- `Impressum`: finale Anbieterangaben fehlen.
- `Datenschutz`: finale Angaben zu Verantwortlichem, Rechtsgrundlagen, Empfaengern, Speicherdauer, Cookies/Tracking und Betroffenenrechten fehlen.

Nicht blockierend, aber offen:

- Historische Trip-URLs enthalten weiterhin `demo-trip-*`; sichtbare Produkt-Copy ist entschaerft.
- Lint hat 6 bestehende Warnings in Travel-/Route-Komponenten.
- Externe Resort-Links sollten vor Production-Launch manuell im Browser gegengeprueft werden, da offizielle Tourismusseiten ihre URL-Struktur aendern koennen.

## Verifikation

- `npm run lint`: erfolgreich, 0 Errors, 6 Warnings.
- `npm run build`: erfolgreich, Next.js Production-Build mit 59 generierten Seiten.
- `npm run typecheck`: kein Script in `package.json`.
- `npm run test`: kein Script in `package.json`.
