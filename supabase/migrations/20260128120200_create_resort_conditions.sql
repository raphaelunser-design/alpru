create extension if not exists "pgcrypto";

create table if not exists public.resort_conditions (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  fetched_at timestamptz not null default now(),
  source text not null default 'open_meteo',
  model text null,
  temperature_c numeric null,
  wind_kph numeric null,
  weather_code int null,
  snowfall_1h_cm numeric null,
  snow_depth_cm numeric null,
  snowfall_next_24h_cm numeric null,
  raw jsonb null
);

create unique index if not exists resort_conditions_resort_id_key on public.resort_conditions (resort_id);
create index if not exists resort_conditions_resort_id_idx on public.resort_conditions (resort_id);
create index if not exists resort_conditions_fetched_at_idx on public.resort_conditions (fetched_at);

alter table public.resort_conditions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resort_conditions' and policyname = 'public read conditions'
  ) then
    create policy "public read conditions"
      on public.resort_conditions
      for select
      using (true);
  end if;
end $$;
