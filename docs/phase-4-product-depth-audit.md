# Phase 4 Product Depth Audit

Datum: 2026-05-19

## Lokale Route-Pruefung

Erster Check gegen `http://localhost:3016` war blockiert, weil dort kein Server mehr lief. Danach wurde gegen den lokal laufenden Next-Server auf `http://localhost:3007` mit Beta-Cookie `alpivo_beta_access=qa-local` geprueft. Nach den Phase-4-Aenderungen wurde ein frischer Production-Build gegen `http://localhost:3023` geprueft.

| Route | Status | Befund |
| --- | ---: | --- |
| `/` | 200 | Nutzbar. Vor Sprint noch falsches Logo-Asset im HTML. |
| `/quiz` | 200 | Nutzbar. Wizard vorhanden. Vor Sprint noch falsches Logo-Asset. |
| `/results` | 200 | Nutzbar. Top Matches vorhanden, aber vor Sprint noch zu prominent als Demo-Fallback formuliert. |
| `/resorts` | 200 | Nutzbar. Premium-Cards vorhanden, Such-/Filterliste weiterhin gemischt mit alter Resort-Library. |
| `/map` | 200 | Nutzbar. Premium-Map vorhanden; Action Links fehlten noch im Sidepanel. |
| `/resort/obertauern` | 200 | Nutzbar. Viele Detailinfos vorhanden; offizielle Action Links fehlten noch als eigener Produktbereich. |
| `/resort/solden` | 200 | Nutzbar. Detailseite vorhanden; offizielle Action Links fehlten noch als eigener Produktbereich. |
| `/resort/zell-am-see` | 200 | Nutzbar. Detailseite vorhanden; offizielle Action Links fehlten noch als eigener Produktbereich. |
| `/resort/saalbach` | 200 | Nutzbar. Detailseite vorhanden; offizielle Action Links fehlten noch als eigener Produktbereich. |
| `/trips` | 200 | Nutzbar. Gast-/Beispiel-Tripboards vorhanden, aber Copy wirkte noch zu stark nach Demo-Modus. |
| `/trips/new` | 200 | Shell war vorhanden, fuer Gastnutzer aber zu hart als Login-Blocker formuliert. |
| `/trips/demo-trip-crew` | 200 | Nutzbar. Tripboard mit Inhalt vorhanden. |
| `/trips/demo-trip-crew/compare` | 200 | Nutzbar. Preisvergleich ist nicht leer. |
| `/trips/demo-trip-crew/expenses` | 200 | Nutzbar. Gruppenkosten sind nicht leer. |
| `/trips/demo-trip-family` | 200 | Nutzbar. Tripboard mit Inhalt vorhanden. |
| `/trips/demo-trip-family/compare` | 200 | Nutzbar. Preisvergleich ist nicht leer. |
| `/trips/demo-trip-family/expenses` | 200 | Nutzbar. Gruppenkosten sind nicht leer. |
| `/trips/demo-trip-spring` | 200 | Nutzbar. Tripboard mit Inhalt vorhanden. |
| `/trips/demo-trip-spring/compare` | 200 | Nutzbar. Preisvergleich ist nicht leer. |
| `/trips/demo-trip-spring/expenses` | 200 | Nutzbar. Gruppenkosten sind nicht leer. |
| `/checklist` | 200 | Nutzbar. Lokaler Gastzustand und Readiness vorhanden. |
| `/account` | 200 | Nutzbar. Cockpit vorhanden, aber Top-Match-Fallback war noch als Demo formuliert. |
| `/feedback` | 200 | Nutzbar. Form und States vorhanden. |
| `/impressum` | 200 | Launch-Blocker: Anbieterangaben fehlen weiterhin. Keine Fantasiedaten eintragen. |
| `/datenschutz` | 200 | Launch-Blocker: finale Datenschutzerklaerung/Verantwortlicher/Speicherfristen fehlen weiterhin. |
| `/datenhinweis` | 200 | Nutzbar. Datenhinweise vorhanden; Begriffe wurden Richtung Beta-/Pilotdaten entschaerft. |

## Finaler Smoke-Test nach Phase 4

Frischer Check gegen `http://localhost:3023` nach `npm run build`:

- Alle oben gelisteten Routen antworten mit HTTP 200.
- In den geprueften HTML-Antworten wurden keine primaeren Referenzen mehr auf `alpivo-logo-v2-transparent`, `alpivo-mark-v2-transparent`, `logo-v2-cropped` oder `icon-v2-cropped` gefunden.
- Die harten Demo-Problemstrings `Demo Top-Matches`, `Demo-Fallback`, `Demo-Boards`, `lokaler Demo-State`, `Cockpit wird aktiv`, `echten Gruppen-Trips` und `Bekannt aus` wurden in den geprueften HTML-Antworten nicht mehr gefunden.
- Resort-nahe Routen zeigen offizielle Action Links fuer Skipass/Preise, Live-Status, Webcams, Pistenplan, Unterkunft oder Anreise.
- `Impressum` und `Datenschutz` bleiben Launch-Blocker, weil echte Pflichtangaben nicht im Repo vorliegen.

## Blocker und Produktluecken

- Logo: Vor Sprint wurde in allen HTML-Routen `alpivo-logo-v2-transparent` ausgeliefert. Dieses Asset wurde vom Nutzer als falsch markiert. Primaere Brand laeuft jetzt ueber die zentrale `BrandLogo`-Komponente mit `public/brand/logo-v2.png` und `public/brand/icon-v2.png`.
- Rechtliches: `Impressum` und `Datenschutz` enthalten weiterhin bewusste Platzhalter. Das ist ein Launch-Blocker, bis echte Pflichtangaben vorliegen.
- Demo-Gefuehl: Results, Account, Trips und Trip Detail nutzten vor Sprint noch Begriffe wie `Demo Top-Matches`, `Demo-Fallback`, `Demo-Boards`, `Demo-Trip` oder `lokaler Demo-State`.
- Offizielle Links: Resort Detail, Results, Map und Resorts hatten noch keinen einheitlichen Produktbereich fuer Skipass, Live-Status, Webcams, Pistenplan, Unterkunft, Anreise und Events.
- Trip-Erstellung: `/trips/new` war fuer Gaeste zu stark als Login-Blocker formuliert, obwohl lokale Planung moeglich ist.
- Datenqualitaet: Pilotwerte sind weiterhin Orientierung. Offizielle Preise, Live-Status, Wetter, Schneelage, Pistenstatus und Verfuegbarkeiten muessen vor Buchung bei den verlinkten offiziellen Quellen geprueft werden.

## Action Links

Phase 4 fuehrt zentrale Resort-Action-Links ein. Confidence ist `official`, wenn der Link auf eine offizielle Resort-/Tourismusquelle zeigt. Alpivo behauptet dadurch keine eigene Buchung und leitet Nutzer nur zu offiziellen Quellen weiter.

Die zentralen Links liegen in `src/data/resortActionLinks.ts` und werden ueber `ExternalActionLinks` in Results, Resorts, Map und Resort Detail genutzt. Ein frischer HEAD-Check der hinterlegten URLs ergab HTTP 200 fuer alle aktuell eingebauten Ziele.

## Verifikation

- `npm run lint`: erfolgreich, 0 Errors, 6 bestehende Warnings in `src/app/api/travel/fuel-estimate/route.ts`, `src/components/RoutePreview.tsx` und `src/components/TravelConnectionPanel.tsx`.
- `npm run build`: erfolgreich. Ein vorheriger Versuch wurde von einer laufenden lokalen `next start`-Instanz blockiert (`EPERM unlink .next/static/...`); nach Stoppen des Workspace-Servers und Entfernen des betroffenen generierten Build-Artefakts lief der Build sauber durch.
- `npm run typecheck`: kein Script in `package.json`.
- `npm run test`: kein Script in `package.json`.

## Offene Launch-Blocker

- Finale Anbieterangaben fuer das Impressum fehlen.
- Finale Datenschutzerklaerung mit Verantwortlichem, Rechtsgrundlagen, Empfaengern, Speicherfristen, Cookies/Tracking und Betroffenenrechten fehlt.
- Offizielle Link-Ziele sollten vor Production-Launch nochmals manuell im Browser geprueft werden, da externe Seiten ihre URL-Struktur aendern koennen.
