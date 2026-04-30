# Live Data (Wetter & Schneehöhe)

## Überblick
- Quelle: Open-Meteo Forecast API
- Speicherung: `public.resort_conditions`
- Update: Edge Function `update_resort_conditions`

## Lokal testen
1) Supabase lokal starten:
   ```bash
   supabase start
   ```
2) Function lokal ausführen:
   ```bash
   supabase functions serve update_resort_conditions --no-verify-jwt
   ```
3) Manuell triggern:
   ```bash
   curl -X POST http://127.0.0.1:54321/functions/v1/update_resort_conditions \
     -H "Content-Type: application/json" \
     -d '{"force": true}'
   ```

## Secrets setzen (Cloud)
Die Edge Function benötigt den Service Role Key für Inserts/Upserts:
```bash
supabase secrets set SERVICE_ROLE_KEY=<service-role-key>
```

## Manuell in der Cloud triggern
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update_resort_conditions \
  -H "Authorization: Bearer <anon-or-service-key>" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

## Cron Job aktivieren (alle 30 Minuten)
Voraussetzung: `pg_cron` und `pg_net` aktiv.

1) Secrets im Vault speichern:
```sql
select vault.create_secret('project_url', 'https://<project-ref>.supabase.co');
select vault.create_secret('publishable_key', '<anon-key>');
```

2) Cron Job anlegen:
```sql
select
  cron.schedule(
    'update_resort_conditions_30m',
    '*/30 * * * *',
    $$
      select
        net.http_post(
          url := (select vault.get_secret('project_url') || '/functions/v1/update_resort_conditions'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select vault.get_secret('publishable_key'))
          ),
          body := jsonb_build_object('force', false)
        );
    $$
  );
```

## Betroffene Tabellen
- `public.resort_conditions` (aktuelle Bedingungen pro Resort)
- `public.resorts` (lat/lon für API Requests)
