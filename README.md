# Alpivo

Alpivo ist eine Ski- und Resort-Matching-Plattform auf Basis von Next.js App Router, TypeScript, Tailwind und Supabase.

## Kernbereiche

- Match-Quiz und Ergebnislogik
- Resort-Library und Detailseiten
- Wetter-, Route- und Travel-Panel
- Skipass- und Après-Ski-Datenmodelle
- Admin-Bereiche für Content, Resorts, Preise und Media
- neues Gruppenplanungs-Modul unter `/trips`

## Lokal starten

```bash
npm install
npm run dev
```

Produktionsnah testen:

```bash
npm run build
npm run start -- -p 3002
```

Im aktuellen Desktop-Setup läuft Alpivo typischerweise auf [http://localhost:3002](http://localhost:3002).

## Gruppenplanungs-Modul

Neue Routen:

- `/trips`
- `/trips/new`
- `/trips/[tripId]`
- `/trips/[tripId]/availability`
- `/trips/[tripId]/favorites`
- `/trips/[tripId]/compare`
- `/trips/[tripId]/budget`
- `/trips/[tripId]/expenses`
- `/trips/invite/[token]`

Das Modul bleibt innerhalb des bestehenden Alpivo-Kontexts:

- Resorts kommen direkt aus den bestehenden Alpivo-Resortdaten
- Verfügbarkeiten werden für Ski-Zeiträume gebuendelt
- Preisfenster werden pro Resort und Zeitraum verglichen
- Budgetposten und Gruppenausgaben werden im selben Workspace gepflegt

### Live vs. Demo

Solange die neue Trip-Migration remote noch nicht angewendet ist, fällt das Modul automatisch auf Demo-Daten zurück. Dadurch bleibt die UI sofort testbar.

Die Migration liegt lokal hier:

- `supabase/migrations/20260423190000_create_ski_trip_planner.sql`

## Supabase / Setup

Wichtige Variablen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_TOKEN`
- `ALPIVO_ACCESS_MODE`
- `ALPIVO_ACCESS_PASSWORD`

Optional:

- `SUPABASE_DB_PASSWORD` für `npx supabase db push`
- `TANKERKOENIG_API_KEY` für genauere Spritpreis-Schätzungen

## Public / Private Access

Der Website-Zugriff kann im Adminbereich unter `/admin` in der Karte `Website-Zugriff` zwischen `public` und `private` umgeschaltet werden.

Details: `docs/ACCESS_MODE.md`

## Cloud-Deployment

Empfohlener Produktivbetrieb:

- Hosting: Vercel
- Datenbank und Auth: Supabase
- Domain: `www.alpivo.de` als Hauptdomain, `alpivo.de` als Redirect

Wichtige Vercel Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `ADMIN_TOKEN`
- `ALPIVO_ACCESS_MODE`
- `ALPIVO_ACCESS_PASSWORD`
- optional `TANKERKOENIG_API_KEY`

Private Beta:

- Wenn `ALPIVO_ACCESS_MODE=private` oder Supabase `app_settings.alpivo_access_mode=private` gesetzt ist, ist Alpivo nicht öffentlich zugänglich.
- Freigabe-Link: `https://www.alpivo.de/?access=<ALPIVO_ACCESS_PASSWORD>`
- Nach dem Öffnen setzt Alpivo ein HttpOnly-Cookie für dieses Gerät.
- `ALPIVO_ACCESS_TOKEN` bleibt als Legacy-Fallback erhalten.

Wenn die neue Trip-Migration remote angewendet werden soll:

```bash
npx supabase db push
```

Voraussetzung: gültiger `SUPABASE_ACCESS_TOKEN` plus `SUPABASE_DB_PASSWORD`.

## Live-Daten

- Datenquelle: Open-Meteo Forecast API
- Tabelle: `public.resort_conditions`
- Update-Job: `update_resort_conditions` (Supabase Edge Function)

Lokal testen und Cron konfigurieren: siehe `docs/live_data.md`.

## Resort-Sync / Wetter-Cache

### Resort-Sync

- Endpoint: `POST /api/admin/sync-resorts`
- Auth: `ADMIN_TOKEN` via `Authorization: Bearer <TOKEN>` oder `x-admin-token`

Beispiel:

```bash
curl -X POST http://localhost:3000/api/admin/sync-resorts \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Wetter

- `GET /api/weather?lat=..&lon=..` holt Live-Daten von Open-Meteo
- `GET /api/resorts/[slug]/weather` nutzt Cache plus Open-Meteo

### Cache

- Cache-Tabelle: `public.resort_live_cache`
- TTL: 30 Minuten

## Nächste Ausbaustufen

- echte Preisquellen für Unterkünfte / Skipass / Travel-Snapshots anbinden
- Invite-Mails serverseitig versenden statt nur Join-Links zu erzeugen
- per-Day Heatmap für Verfügbarkeit statt nur date-option basierter Fenster
- Settlement-Workflow mit Rückmeldung "bezahlt" / "erledigt"
- Ops- oder Admin-Views für Trip-Support
