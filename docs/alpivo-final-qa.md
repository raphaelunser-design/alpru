# Alpivo Final QA

Stand: 2026-06-03

## Render-QA-Hinweis

Der lokale Production-Server wurde auf `http://localhost:3032` geprüft. Alle Smoke-Routen liefern HTTP 200, werden im Browser aber ohne gültigen Beta-Zugang erwartbar durch `/private-access` abgefangen. Ein zusätzlicher Start mit `ALPIVO_ACCESS_MODE=public` auf `http://localhost:3034` wurde ebenfalls vom aktuellen Access-Mode-Gate übersteuert. Die Browserprüfung der eigentlichen App-Seiten ist dadurch ohne gültigen lokalen Access-Cookie blockiert; Code-, TypeScript-, Lint- und Build-Prüfung sind erfolgreich.

## Geprüfte Routen

- `/` - Landing nutzt Premium-Hero, zentrale Top-Match-Daten und keine Fake-Presseclaims.
- `/quiz` - Wizard nutzt AppShell, Default-Preferences und schreibt in den lokalen Guest State.
- `/results` - Top Matches werden aus zentralen Resortdaten und MatchScore berechnet. Obertauern bleibt Top Match mit 92.
- `/resorts` - Resortübersicht zeigt kuratierte Pilotdaten, Filter und Detail-Links; Fallback-Copy ist nicht mehr als rohe Demo formuliert.
- `/map` - Premium-Kartenansicht ist Teil der AppShell. Query-State wie `/map?resort=solden` selektiert Resorts.
- `/resort/obertauern`, `/resort/solden`, `/resort/zell-am-see`, `/resort/saalbach` - Detailseiten laden zentrale Resortdaten, ActionHub, SkipassAssistant, Datenstatus und externe Links.
- `/trips`, `/trips/new` - Tripboards und neuer Trip-Start haben Inhalte und Gastmodus-Hinweise.
- `/trips/demo-trip-crew`, `/trips/demo-trip-family`, `/trips/demo-trip-spring` - Trip-Detailseiten enthalten Header, Top Match, Favoriten, Actions, Readiness und Aktivität.
- `/trips/demo-trip-crew/compare`, `/trips/demo-trip-family/compare`, `/trips/demo-trip-spring/compare` - Vergleich zeigt Resort-Favoriten, Entscheidungshilfe und offizielle Aktionen.
- `/trips/demo-trip-crew/expenses`, `/trips/demo-trip-family/expenses`, `/trips/demo-trip-spring/expenses` - Kostenplanung, SkipassAssistant, Gruppensplit und Schätzungshinweise sind sichtbar.
- `/checklist` - Checklist ist mit Guest State, ResortActionHub, SkipassAssistant und Readiness verbunden.
- `/account` - Cockpit liest Guest State, Top Matches, Favoriten, Trip Draft, Readiness und Aktivität.
- `/feedback` - Feedback nutzt echte Submit-, Success- und Error-States; kein falsches Admin-Versprechen.
- `/impressum` - sichtbar, aber Launch-Blocker wegen fehlender Pflichtangaben.
- `/datenschutz` - sichtbar, aber Launch-Blocker wegen fehlender finaler Datenschutzerklärung.
- `/datenhinweis` - erklärt Beta-Daten, Schätzwerte, keine Buchung über Alpivo, offizielle Prüfung und Guest-Mode-Speicherung.

## Behobene Probleme in diesem Pass

- Zentrale BrandLogo-Komponente nutzt die konfigurierten Alpivo-Assets aus `src/config/brand.ts`.
- Keine direkten primären Referenzen auf `logo-v2-cropped`, `icon-v2-cropped` oder `alpivo-logo-v2-transparent` in Header/Footer/AppShell gefunden.
- Results, Resorts, Map, Checklist und Trip Expenses haben kompakte Datenhinweise zu Schätzungen, offiziellen Quellen und lokaler Speicherung.
- Map-Sidepanel priorisiert `Zum Trip hinzufügen` als Primary CTA.
- ResortActionHub kennzeichnet externe offizielle Links mit eindeutigen ARIA-Labels und meldet fehlende Links über die Kategorie `link-fehlt`.
- Sichtbare Demo-Sprache in Resortdaten wurde auf Beispielreise/Pilot-Set entschärft.
- Legal-Seiten sind sauber als Launch-Blocker markiert statt als interne, unfertige Platzhalter.

## Datenstatus

- Obertauern, Sölden, Zell am See und Saalbach kommen aus der zentralen Resortdatenbasis.
- Kosten, Fahrzeiten, Unterkunftsbeispiele, Vibe- und Schneesignale sind teilweise geschätzt oder Beta-Orientierung.
- Offizielle Action Links sind vorhanden für zentrale Resortaktionen wie Skipass, Preise, Live-Status, Webcams und Unterkunftssuche.
- Fehlende Links oder unklare Daten können über `/feedback?category=link-fehlt` oder `/feedback?category=daten-fehlen` gemeldet werden.

## Guest-State-Status

- Wizard, Results, Map, Resort Detail, Trips, Checklist und Account nutzen den lokalen Guest State.
- Favoriten, Trip Draft, Completed Actions und Checklist Readiness bleiben im Gastmodus lokal auf diesem Gerät gespeichert.
- Supabase-Persistenz ist weiterhin getrennt vom lokalen Guest Mode und wird nicht als garantiert behauptet.

## Mobile-Status

- Hauptseiten nutzen AppShell und Mobile Bottom Nav.
- Wizard Summary, Cards, Results, Resort Detail, Checklist und Account sind auf mobile Card-Layouts ausgelegt.
- Map nutzt auf kleineren Viewports ein kompaktes Panel unter der Kartenfläche; ein echtes natives Bottom-Sheet ist noch ein Phase-2/3D-Map-Integrationspunkt.

## Accessibility-Status

- Globale `focus-visible` Styles sind vorhanden.
- Neue externe Action Links haben verständlichere Labels.
- Interaktive Planungsaktionen sind Buttons oder Links, nicht rohe Click-Divs.
- Datenzustände werden zusätzlich textlich erklärt und nicht nur über Farbe vermittelt.

## Launch-Blocker

- Impressum: finale Pflichtangaben fehlen und dürfen nicht erfunden werden.
- Datenschutz: finale Datenschutzerklärung mit Verantwortlichem, Rechtsgrundlagen, Empfängern, Speicherfristen und Tracking-/Cookie-Hinweisen fehlt.
- Rechtliche Prüfung vor öffentlichem Launch erforderlich.

## Offene Punkte

- Separates 3D-Map-Projekt ist bewusst nicht berührt und muss später integriert werden.
- Map-Mobile kann nach Integration der 3D-Karte als echtes Bottom Sheet weiter verfeinert werden.
- Einige Daten bleiben Beta-/Schätzwerte, bis offizielle oder importierte Quellen angebunden sind.
- Admin-/Supabase-Persistenz für lokale Guest-State-Aktionen ist vorbereitet, aber nicht vollständig vereinheitlicht.
