# Alpivo Access Mode

Alpivo kann zentral zwischen `public` und `private` geschaltet werden.

## Modi

- `public`: Alle Seiten sind ohne Zugangscode erreichbar.
- `private`: Die Private-Beta-Logik ist aktiv. Besucher werden auf `/private-access` geleitet und können mit dem gesetzten Zugangscode oder einem `access=...`-Link freigeschaltet werden.

## Priorität

1. Supabase `app_settings` mit `key = alpivo_access_mode`
2. Environment Variable `ALPIVO_ACCESS_MODE`
3. Fallback: lokal `public`, in Production `private`

## Admin-Umschaltung

1. Mit dem Admin-Konto anmelden.
2. `/admin` öffnen.
3. In der Karte `Website-Zugriff` auf `Website öffentlich schalten` oder `Website privat schalten` klicken.

Die Änderung wird in Supabase gespeichert und bleibt nach einem Reload erhalten.

## Environment-Fallback

```env
ALPIVO_ACCESS_MODE=public
ALPIVO_ACCESS_PASSWORD=<aktueller-zugangscode>
```

Für den privaten Modus:

```env
ALPIVO_ACCESS_MODE=private
ALPIVO_ACCESS_PASSWORD=<aktueller-zugangscode>
```

`ALPIVO_ACCESS_TOKEN` bleibt als Legacy-Fallback erhalten, sollte aber für neue Setups durch `ALPIVO_ACCESS_PASSWORD` ersetzt werden.

## Sicherheit

- Der Admin-Toggle ist zusätzlich serverseitig über `/api/admin/access-mode` geschützt.
- Nur Admins aus `ADMIN_EMAILS` oder `app_admins` dürfen den Modus lesen und ändern.
- Normale Nutzer können den Access Mode nicht per Browser-Manipulation ändern.
