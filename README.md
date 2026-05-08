Alpivo
Alpivo ist eine Ski- und Resort-Matching-Plattform auf Basis von Next.js App Router, TypeScript, Tailwind CSS und Supabase. Die Anwendung bündelt Resort-Daten, Live-Wetter, Routen- und Travel-Informationen, Skipass-/Après-Ski-Modelle sowie ein Gruppenplanungs-Modul für Ski-Trips.
Kernbereiche
Match-Quiz mit Ergebnis- und Rankinglogik
Resort-Library mit Detailseiten
Wetter-, Route- und Travel-Panel
Skipass- und Après-Ski-Datenmodelle
Admin-Bereiche für Content, Resorts, Preise und Media
Gruppenplanungs-Modul unter `/trips`
Lokal starten
```bash
npm install
npm run dev
```
Produktionsnah lokal testen:
```bash
npm run build
npm run start -- -p 3002
```
Im aktuellen Desktop-Setup läuft Alpivo typischerweise auf:
```text
http://localhost:3002
```
Gruppenplanungs-Modul
Das Gruppenplanungs-Modul liegt unter `/trips` und bleibt vollständig im bestehenden Alpivo-Kontext: Resorts, Reisezeiträume, Preisfenster, Budgetposten und Gruppenausgaben werden in einem gemeinsamen Workspace gepflegt.
Routen
`/trips`
`/trips/new`
`/trips/[tripId]`
`/trips/[tripId]/availability`
`/trips/[tripId]/favorites`
`/trips/[tripId]/compare`
`/trips/[tripId]/budget`
`/trips/[tripId]/expenses`
`/trips/invite/[token]`
Funktionen
Resorts werden direkt aus den bestehenden Alpivo-Resortdaten übernommen.
Verfügbarkeiten werden für Ski-Zeiträume gebündelt.
Preisfenster werden pro Resort und Zeitraum verglichen.
Budgetposten und Gruppenausgaben werden im selben Workspace gepflegt.
Invite-Links ermöglichen den Einstieg in bestehende Trips.
Live vs. Demo
Falls die neue Trip-Migration remote noch nicht angewendet ist, fällt das Modul automatisch auf Demo-Daten zurück. Dadurch bleibt die UI sofort testbar.
Die Migration liegt lokal hier:
```text
supabase/migrations/20260423190000_create_ski_trip_planner.sql
```
Migration remote anwenden:
```bash
npx supabase db push
```
Voraussetzung dafür sind ein gültiger `SUPABASE_ACCESS_TOKEN` und `SUPABASE_DB_PASSWORD`.
Supabase / Setup
Wichtige Variablen
Variable	Zweck
`NEXT_PUBLIC_SUPABASE_URL`	Öffentliche Supabase-Projekt-URL
`NEXT_PUBLIC_SUPABASE_ANON_KEY`	Supabase Client Key für lokale/ältere Setups
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`	Supabase Publishable Key für aktuelle Vercel-/Supabase-Setups
`SUPABASE_SERVICE_ROLE_KEY`	Serverseitiger Supabase Service Role Key für lokale/ältere Setups
`SUPABASE_SECRET_KEY`	Serverseitiger Supabase Secret Key für aktuelle Vercel-/Supabase-Setups
`ADMIN_TOKEN`	Admin-API-Authentifizierung
`ALPIVO_ACCESS_MODE`	Website-Zugriff: `public` oder `private`
`ALPIVO_ACCESS_PASSWORD`	Passwort für Private-Beta-Zugriff
Optionale Variablen
Variable	Zweck
`SUPABASE_DB_PASSWORD`	Wird für `npx supabase db push` benötigt
`TANKERKOENIG_API_KEY`	Genauere Spritpreis-Schätzungen
> Serverseitige Supabase Keys wie `SUPABASE_SERVICE_ROLE_KEY` oder `SUPABASE_SECRET_KEY` dürfen nicht im Client exponiert werden.
Public / Private Access
Der Website-Zugriff kann im Adminbereich unter `/admin` in der Karte Website-Zugriff zwischen `public` und `private` umgeschaltet werden.
Details stehen in:
```text
docs/ACCESS_MODE.md
```
Private Beta
Wenn `ALPIVO_ACCESS_MODE=private` oder Supabase `app_settings.alpivo_access_mode=private` gesetzt ist, ist Alpivo nicht öffentlich zugänglich.
Freigabe-Link:
```text
https://www.alpivo.de/?access=<ALPIVO_ACCESS_PASSWORD>
```
Nach dem Öffnen setzt Alpivo ein HttpOnly-Cookie für dieses Gerät. `ALPIVO_ACCESS_TOKEN` bleibt als Legacy-Fallback erhalten.
Cloud-Deployment
Empfohlener Produktivbetrieb:
Hosting: Vercel
Datenbank und Auth: Supabase
Hauptdomain: `www.alpivo.de`
Redirect: `alpivo.de` → `www.alpivo.de`
Wichtige Vercel Environment Variables:
```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
ADMIN_TOKEN
ALPIVO_ACCESS_MODE
ALPIVO_ACCESS_PASSWORD
TANKERKOENIG_API_KEY optional
```
Live-Daten
Datenquelle: Open-Meteo Forecast API
Tabelle: `public.resort_conditions`
Update-Job: `update_resort_conditions` als Supabase Edge Function
Lokal testen und Cron konfigurieren:
```text
docs/live_data.md
```
Resort-Sync / Wetter-Cache
Resort-Sync
Endpoint:
```text
POST /api/admin/sync-resorts
```
Auth:
`Authorization: Bearer <ADMIN_TOKEN>`
alternativ `x-admin-token`
Beispiel:
```bash
curl -X POST http://localhost:3002/api/admin/sync-resorts \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
> Port bei Bedarf an das lokale Setup anpassen.
Wetter
`GET /api/weather?lat=..&lon=..` holt Live-Daten von Open-Meteo.
`GET /api/resorts/[slug]/weather` nutzt Cache plus Open-Meteo.
Cache
Cache-Tabelle: `public.resort_live_cache`
TTL: 30 Minuten
Nächste Ausbaustufen
echte Preisquellen für Unterkünfte, Skipässe und Travel-Snapshots anbinden
Invite-Mails serverseitig versenden statt nur Join-Links zu erzeugen
per-Day Heatmap für Verfügbarkeit statt nur date-option-basierter Fenster
Settlement-Workflow mit Rückmeldung `bezahlt` / `erledigt`
Ops- oder Admin-Views für Trip-Support
