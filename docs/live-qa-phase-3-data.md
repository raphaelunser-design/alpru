# Alpivo Live-QA Phase 3 Data Sprint

Stand: 2026-05-17

## Zugriff und Route-Check

Die lokale Production-Instanz leitet ohne Beta-Cookie auf `/private-access` um. Fuer QA wurde lokal mit `ALPIVO_ACCESS_PASSWORD=qa-local` gestartet und mit Cookie `alpivo_beta_access=qa-local` geprueft.

Gepruefte Routen mit Access-Cookie: `/`, `/quiz`, `/results`, `/resorts`, `/map`, `/resort/obertauern`, `/resort/solden`, `/resort/zell-am-see`, `/resort/saalbach`, `/trips`, `/trips/new`, `/trips/demo-trip-crew`, `/trips/demo-trip-crew/compare`, `/trips/demo-trip-crew/expenses`, `/trips/demo-trip-family`, `/trips/demo-trip-family/compare`, `/trips/demo-trip-family/expenses`, `/checklist`, `/account`, `/feedback`, `/impressum`, `/datenschutz`, `/datenhinweis`.

Alle genannten Routen antworteten lokal mit HTTP 200, sobald der Beta-Zugang aktiv war. Ohne Cookie ist die Weiterleitung erwartet.

## Logo

Primaere Logo-Komponente: `src/components/premium/BrandLogo.tsx`.

Korrekte Assets:
- `public/brand/alpivo-logo-v2-transparent.png`
- `public/brand/alpivo-mark-v2-transparent.png`

Direkte alte Primaer-Referenzen auf `/brand/logo-v2-cropped.png` und `/brand/icon-v2-cropped.png` wurden in den sichtbaren App-Routen nicht mehr gefunden. Eine direkte Logo-Referenz in der separaten 3D-Map-Komponente wurde auf `BrandLogo` umgestellt.

## Zentrale Datenbasis

Zentrale Resort-/Match-Daten:
- `src/lib/alpivoResortData.ts`
- Re-Export fuer neue Consumer: `src/data/resorts.ts`

Konsistente Pflichtwerte:
- Obertauern: 92 Match, EUR 520 p. P., 3:45 h ab Muenchen
- Soelden: 89 Match, EUR 610 p. P., 3:30 h ab Muenchen
- Zell am See: 86 Match, EUR 470 p. P., 3:15 h ab Muenchen
- Saalbach: 84 Match, EUR 540 p. P., 3:50 h ab Muenchen

Neue Datenqualitaets-Typen:
- `src/types/alpivo.ts`
- `src/data/dataSources.ts`
- `src/lib/matchScore.ts`

## Hardcoding-Befunde

Vor dem Sprint gab es verstreute Top-Match-Hardcodings in `src/components/home/ExampleMatchCard.tsx`, alten Demo-Trip-Slugs in `src/lib/tripPlannerDemo.ts` und lokalen Empty-State-Fallbacks im Cockpit. Diese Bereiche wurden auf die zentrale Datenbasis beziehungsweise auf klar markierte Demo-Fallbacks umgestellt.

Legacy-Daten bleiben bewusst erhalten in:
- `src/lib/mvpResorts.ts` fuer die breite Resort-/Matching-Bibliothek
- `src/lib/tripPlannerDemo.ts` fuer zusaetzliche Demo-Resorts neben den zentralen Pilot-Resorts
- ungetrackten 3D-Map-Dateien fuer die separate Kartenarbeit

## Datenluecken und ehrlicher Status

Alpivo nutzt weiterhin Beta-/Demo-Orientierungswerte fuer Kosten, Wetter-/Schneesignal, Unterkunftsbeispiele und Reisezeit. Keine verbindliche Live-Verfuegbarkeit, keine Garantiepreise und keine Live-Lawinen-/Wetterdaten sind angebunden.

Feedback wird ueber `/api/feedback` in `beta_feedback` gespeichert, wenn Supabase-Service-Zugriff vorhanden ist. Browser-/Device-Info wird optional gesendet und im bestehenden `user_agent`-Feld zusammengefasst.

## Rechtliche Seiten

`/impressum`, `/datenschutz` und `/datenhinweis` sind visuell erreichbar. Rechtliche Pflichtangaben wurden nicht erfunden. Falls Betreiberangaben fehlen oder noch als Platzhalter markiert sind, bleibt das ein Launch-Blocker ausserhalb dieses Code-Sprints.

## Offene Punkte

- Supabase-Persistenz fuer Favoriten und Trip-Draft ist noch nicht umgesetzt; aktuell Local-State.
- Checklist-Readiness ist als zentrale Template-Logik vorbereitet, muss fuer Supabase-Login spaeter serverseitig synchronisiert werden.
- 3D-Map-Dateien sind separat in Arbeit und teils ungetrackt; sie wurden nicht als Teil dieses Sprints deployed.
