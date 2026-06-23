# Alpivo Project Operating Model

Stand: 2026-06-23

## Projektwurzel

Die aktive App liegt in `ski-match/`. Der uebergeordnete Ordner `Alpivo/` ist ein Workspace fuer Referenzen, Bildmaterial und alte Kopien. Vercel, Supabase CLI und npm-Kommandos sollen aus `ski-match/` laufen.

## Hosting-Entscheidung

Vercel bleibt die passende Hosting-Plattform fuer diese App:

- Next.js App Router wird direkt unterstuetzt.
- Das Projekt ist bereits mit Vercel verknuepft.
- Production- und Preview-Deployments existieren bereits.
- `vercel.json` enthaelt den geplanten Cron fuer `/api/admin/sync-resorts`.

Ein Plattformwechsel wuerde aktuell mehr Risiko als Nutzen erzeugen. Der bessere Schnitt ist, die Projektwurzel, Env-Dokumentation und App-Grenzen sauber zu halten.

## Cloud-Arbeitsmodell

Der Quellcode gehoert in GitHub. Vercel deployt daraus Preview- und Production-Versionen, Supabase bleibt die Cloud fuer Datenbank, Auth und Storage. Damit ist der Laptop nur noch ein Arbeitsgeraet, nicht der Projektort.

Empfohlener Ablauf auf einem neuen Geraet:

1. Repository klonen.
2. In `ski-match/` arbeiten.
3. Abhaengigkeiten mit `npm install` installieren.
4. Environment-Variablen aus Vercel/Supabase holen, idealerweise mit `vercel env pull`.
5. Lokal mit `npm run dev` starten.

OneDrive bleibt nur fuer Rohmaterial, Referenzen und private Assets sinnvoll. Der aktive App-Code sollte nicht von OneDrive-Sync abhaengen, weil GitHub/Vercel reproduzierbarer und besser fuer Zusammenarbeit sind.

## Datenmodi

Alpivo nutzt drei Datenmodi:

- Live: Supabase, Open-Meteo, OSRM und optionale Provider-Links/API-Konfiguration.
- Fallback: kuratierte MVP-Resortdaten, wenn Supabase leer ist oder nicht erreichbar ist.
- Demo: Beispiel-Trips und lokale Guest-State-Daten fuer testbare Produktflows.

Produktiv sollte jede UI, die Fallback oder Demo nutzt, das sichtbar machen. Neue Features sollen nicht stillschweigend Demo-Daten als echte Daten darstellen.

## UI-Grenzen

Aktuell gibt es zwei bewusste UI-Bereiche:

- Marketing/Top-Level-Experience: helle `components/ui/*`-Bausteine, zum Beispiel Startseite, Resorts, Results und neue Resort-Detailseiten.
- App-Workspace: dunkle `components/premium/AppShell`-Navigation fuer Quiz, Trips, Account, Admin und produktive Arbeitsbereiche.

Globale Header/Footer/Mobile-Nav werden ueber `src/config/appChrome.ts` zentral ein- oder ausgeblendet. Neue Routen sollen dort eingetragen werden, wenn sie eigene Navigation oder eine immersive Vollbild-Experience haben.

## Naechste Aufraeumreihenfolge

1. Alte Deploy-Kopien und UI-Referenzen ausserhalb von `ski-match/` in einen klaren Referenz-/Archivbereich verschieben.
2. Results, Resorts und Resort-Detailseiten als helle Top-Level-Experience konsolidieren.
3. Demo-/Fallback-Hinweise vereinheitlichen.
4. Sehr grosse Client-Dateien wie `TripWorkspaceClient.tsx`, `quiz/page.tsx` und `account/page.tsx` schrittweise in kleinere Einheiten teilen.
