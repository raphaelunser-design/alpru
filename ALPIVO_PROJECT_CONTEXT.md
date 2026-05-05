# Alpivo Project Context

Status date: 2026-04-30

This file documents the current technical state of the local Alpivo workspace.
It intentionally lists environment variable names only. No secret values are
stored here.

## Tech Stack

- App framework: Next.js 16.1.6 with App Router
- UI runtime: React 19.2.3 and React DOM 19.2.3
- Language: TypeScript
- Styling: Tailwind CSS 4 via `@tailwindcss/postcss`
- Data/backend: Supabase via `@supabase/supabase-js` 2.93.2
- Maps: Leaflet 1.9.4
- Motion/UI helpers: Framer Motion 12.29.2, React Day Picker 9.13.0
- Tooling: ESLint 9, `eslint-config-next` 16.1.6, TypeScript 5
- Local package manager state: `node_modules` and `package-lock.json` are present
- Node runtime detected locally: Node 22.22.0

## Current Features

- Public Alpivo homepage and ski/resort matching flow
- Quiz page and results page for resort matching
- Resort library, resort detail pages, and map view
- Weather, route, travel, geocode, and search API routes
- Resort decision cards, global search, travel connection panel, piste map
  section, apres-ski spots, and feedback UI components
- Admin area for:
  - site content
  - feedback
  - media
  - prices
  - resorts
  - access mode / private beta access
  - resort sync cron endpoint
- Account and Supabase auth callback pages
- Checklist page
- Legal/content pages: impressum, datenschutz, datenhinweis
- Group trip planning module under `/trips`:
  - trip overview
  - create trip
  - invite flow
  - workspace
  - availability
  - favorites
  - compare
  - budget
  - expenses
- Supabase Edge Function: `update_resort_conditions`

## Important Environment Variables

### Present in `.env.local`

- `ADMIN_TOKEN`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Present in `.env.example`

- `ADMIN_EMAILS`
- `ADMIN_TOKEN`
- `ALPIVO_ACCESS_MODE`
- `ALPIVO_ACCESS_PASSWORD`
- `ALPIVO_ACCESS_TOKEN`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TANKERKOENIG_API_KEY`

### Referenced by application or Supabase function code

- `ADMIN_EMAILS`
- `ADMIN_TOKEN`
- `ALPIVO_ACCESS_MODE`
- `ALPIVO_ACCESS_PASSWORD`
- `ALPIVO_ACCESS_TOKEN`
- `DEFAULT_FUEL_PRICE_DIESEL_EUR`
- `DEFAULT_FUEL_PRICE_E10_EUR`
- `DEFAULT_FUEL_PRICE_E5_EUR`
- `NEXT_PUBLIC_DB_TRAVEL_URL`
- `NEXT_PUBLIC_OMIO_TRAVEL_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_TRAINLINE_TRAVEL_URL`
- `NODE_ENV`
- `OPEN_METEO_BASE_URL`
- `OSRM_BASE_URL`
- `SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `SYNC_MAX_TOTAL`
- `SYNC_PER_COUNTRY_LIMIT`
- `TANKERKOENIG_API_KEY`

### Referenced in code but missing from `.env.example`

- `DEFAULT_FUEL_PRICE_DIESEL_EUR`
- `DEFAULT_FUEL_PRICE_E10_EUR`
- `DEFAULT_FUEL_PRICE_E5_EUR`
- `NEXT_PUBLIC_DB_TRAVEL_URL`
- `NEXT_PUBLIC_OMIO_TRAVEL_URL`
- `NEXT_PUBLIC_TRAINLINE_TRAVEL_URL`
- `OPEN_METEO_BASE_URL`
- `OSRM_BASE_URL`
- `SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `SYNC_MAX_TOTAL`
- `SYNC_PER_COUNTRY_LIMIT`

## Deployment Setup

- Vercel project metadata exists at `.vercel/project.json`.
- Local Vercel project name: `ski-match`.
- `vercel.json` defines one cron:
  - path: `/api/admin/sync-resorts`
  - schedule: `0 3 * * *`
- `.vercelignore` excludes local env files, `.vercel`, `.next`,
  `node_modules`, token text files, temp files, backups, debug logs, and
  generated TypeScript build info.
- Vercel CLI is not available as a global PATH command.
- Vercel CLI works through `npx --yes vercel --version`.
- Vercel CLI version tested through `npx`: 52.2.1.
- Read-only Vercel env listing with the local token file succeeded.
- Vercel production env names currently detected:
  - `ADMIN_TOKEN`
  - `ALPIVO_ACCESS_MODE`
  - `ALPIVO_ACCESS_PASSWORD`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- No deployment was started.
- No production deploy was performed.

## Supabase Setup

- Supabase folder exists at `supabase/`.
- `supabase/config.toml` is not present.
- Supabase CLI is not available as a global PATH command.
- Supabase CLI works through local `npx supabase`.
- Supabase CLI version tested through `npx`: 2.72.9.
- Supabase CLI reports that a newer CLI version is available.
- Local Supabase link metadata exists in `supabase/.temp/`.
- The linked Supabase project was found through a read-only project list check.
- `SUPABASETOKEN.txt` exists locally, but token values are not documented here.
- `SUPABASE_DB_PASSWORD` is not present in `.env.local`.
- A `supabase db push --dry-run --yes` check was attempted and did not apply
  migrations. It failed before listing migrations because the remote DB access
  requires `SUPABASE_DB_PASSWORD` or sufficient role permissions.
- No real Supabase migration push was performed.

### Local migration files

- `20260128120000_resorts_add_columns.sql`
- `20260128120100_create_resort_ratings.sql`
- `20260128120200_create_resort_conditions.sql`
- `20260128120300_resorts_public_read.sql`
- `20260129100000_resort_sync_pipeline.sql`
- `20260129123000_fix_mojibake_resorts.sql`
- `20260129193000_add_skipass_prices.sql`
- `20260129210000_create_site_content.sql`
- `20260129210100_create_media_bucket.sql`
- `20260423130000_create_resort_skipass_prices.sql`
- `20260423143000_create_resort_apres_spots.sql`
- `20260423190000_create_ski_trip_planner.sql`
- `20260424190000_profile_preferences_and_demo_members.sql`
- `20260424233000_add_trip_expense_due_date.sql`
- `20260426120000_create_checklist_and_admin_roles.sql`
- `20260426143000_add_resort_hero_images.sql`
- `20260429112000_create_beta_feedback.sql`
- `20260430113000_create_app_settings_access_mode.sql`
- `20260430152000_resorts_mvp_metadata.sql`

## Current Build State

`npm run build` currently fails during Turbopack parsing.

The failures are syntax errors, not missing environment variables. The visible
pattern is missing operators such as `?`, `??`, `||`, or optional chaining in
multiple already modified files.

Files reported by the build include:

- `src/app/account/page.tsx`
- `src/app/admin/prices/page.tsx`
- `src/app/admin/resorts/page.tsx`
- `src/app/api/admin/resorts/route.ts`
- `src/app/checklist/page.tsx`
- `src/app/map/page.tsx`
- `src/app/quiz/page.tsx`
- `src/app/resort/[slug]/page.tsx`
- `src/app/resorts/page.tsx`
- `src/app/results/page.tsx`
- `src/components/SelectControl.tsx`
- `src/components/trips/TripCard.tsx`
- `src/components/trips/TripCreateClient.tsx`
- `src/components/trips/TripInviteClient.tsx`
- `src/components/trips/TripWorkspaceClient.tsx`
- `src/lib/mvpResorts.ts`
- `src/lib/openMeteo.ts`
- `src/lib/resortSignals.ts`
- `src/lib/tripPlannerData.ts`

## Git State

- The workspace is a Git repository.
- `git` is not currently available through the default shell PATH.
- A usable Git executable was found at `C:\Program Files\Git\cmd\git.exe`.
- Current branch: `setup/full-access-check`.
- The working tree is dirty with many modified source files.
- `supabase/.temp/linked-project.json` is untracked.
- Treat the modified files as existing user/work-in-progress changes unless
  explicitly told otherwise.

## Known Risks

- Production build is currently broken by syntax errors across several app,
  component, and library files.
- The dirty Git working tree makes it unsafe to assume which changes belong to
  whom without reviewing diffs first.
- Default shell PATH is missing `git`, `supabase`, and `vercel`; Git, Supabase,
  and Vercel are only usable through explicit paths or `npx`.
- `.env.local` is enough for basic Supabase app access, but it does not contain
  all env names referenced by code or all names documented in `.env.example`.
- `.env.example` does not document all env names currently referenced by code.
- Supabase remote migration dry-run cannot currently reach a clean migration
  preview without `SUPABASE_DB_PASSWORD` or corrected remote role permissions.
- `supabase/config.toml` is missing, so local Supabase service configuration is
  incomplete or not committed in this workspace.
- Token text files exist in the project root. `.vercelignore` excludes them from
  Vercel uploads, but they still need careful local handling.
- README text currently shows mojibake in several German words, indicating an
  encoding/content-cleanup risk.

## Open Next Steps

1. Fix the syntax errors reported by `npm run build`, without deleting existing
   features.
2. Re-run `npm run build` after syntax fixes.
3. Decide whether `git` should be added to the shell PATH or always called via
   `C:\Program Files\Git\cmd\git.exe`.
4. Review the current dirty Git diff before any functional changes are made.
5. Update `.env.example` so it documents all env names referenced by the code.
6. Decide whether `.env.local` should include the optional access-mode, travel,
   sync, fuel, and Supabase alias env names for local parity.
7. Provide or configure `SUPABASE_DB_PASSWORD` only if a Supabase migration
   dry-run should be repeated.
8. Keep using `npx --yes vercel` for Vercel checks, or install Vercel CLI if a
   global command is preferred.
9. Avoid production deploys and real Supabase pushes until the build is green
   and the dirty Git state has been reviewed.
