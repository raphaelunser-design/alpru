create table if not exists public.resort_events (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  name text not null,
  event_type text not null check (
    event_type in ('festival', 'concert', 'apres_ski', 'opening', 'closing', 'local_event')
  ),
  music_genres text[] not null default '{}',
  vibe_tags text[] not null default '{}',
  start_date date,
  end_date date,
  recurring_month smallint check (recurring_month between 1 and 12),
  location_name text,
  altitude_m integer check (altitude_m is null or altitude_m between 0 and 9000),
  ticket_required boolean,
  ticket_price_from numeric(10, 2) check (ticket_price_from is null or ticket_price_from >= 0),
  official_url text,
  short_description text,
  best_for text,
  not_ideal_for text,
  data_quality text not null default 'estimated' check (
    data_quality in ('official', 'estimated', 'outdated', 'missing')
  ),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists resort_events_resort_id_idx
  on public.resort_events(resort_id);

create index if not exists resort_events_dates_idx
  on public.resort_events(start_date, end_date);

create index if not exists resort_events_recurring_month_idx
  on public.resort_events(recurring_month);

create index if not exists resort_events_event_type_idx
  on public.resort_events(event_type);

create index if not exists resort_events_data_quality_idx
  on public.resort_events(data_quality);

create index if not exists resort_events_music_genres_idx
  on public.resort_events using gin(music_genres);

create index if not exists resort_events_vibe_tags_idx
  on public.resort_events using gin(vibe_tags);

create unique index if not exists resort_events_unique_seed_idx
  on public.resort_events(resort_id, lower(name), coalesce(start_date, '1900-01-01'::date));

alter table public.resort_events enable row level security;

drop policy if exists "resort_events_public_read" on public.resort_events;
create policy "resort_events_public_read"
  on public.resort_events
  for select
  using (true);

drop trigger if exists resort_events_set_updated_at on public.resort_events;
create trigger resort_events_set_updated_at
  before update on public.resort_events
  for each row
  execute function public.set_updated_at();
