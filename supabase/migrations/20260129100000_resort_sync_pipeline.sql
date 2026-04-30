alter table public.resorts
  add column if not exists slug text,
  add column if not exists name text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists lat double precision,
  add column if not exists lon double precision,
  add column if not exists image_url text,
  add column if not exists official_url text,
  add column if not exists piste_map_url text,
  add column if not exists lift_status_url text,
  add column if not exists skipass_url text,
  add column if not exists provider text,
  add column if not exists provider_id text;

create unique index if not exists resorts_slug_key on public.resorts (slug) where slug is not null;

create table if not exists public.resort_live_cache (
  resort_id uuid primary key references public.resorts(id) on delete cascade,
  weather_json jsonb,
  weather_updated_at timestamptz,
  lift_json jsonb,
  lift_updated_at timestamptz,
  source text,
  updated_at timestamptz default now()
);

alter table public.resort_live_cache enable row level security;
