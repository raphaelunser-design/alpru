create table if not exists public.resort_skipass_prices (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid references public.resorts(id) on delete cascade,
  resort_slug text not null,
  ticket_name text not null default '1-Tageskarte',
  ticket_category text not null default 'day',
  age_group text not null default 'adult',
  age_label text not null,
  min_age integer,
  max_age integer,
  season_label text,
  valid_from date,
  valid_to date,
  currency text not null default 'EUR',
  price numeric not null,
  price_type text not null default 'fixed' check (price_type in ('fixed', 'from')),
  source_url text,
  source_label text not null default 'Offizielle Preisliste',
  affiliate_url text,
  last_checked date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resort_skipass_prices_resort_id_idx
  on public.resort_skipass_prices(resort_id);

create index if not exists resort_skipass_prices_resort_slug_idx
  on public.resort_skipass_prices(resort_slug);

create index if not exists resort_skipass_prices_lookup_idx
  on public.resort_skipass_prices(resort_slug, ticket_category, age_group, valid_from, valid_to);

alter table public.resort_skipass_prices enable row level security;

drop policy if exists "resort_skipass_prices_public_read" on public.resort_skipass_prices;
create policy "resort_skipass_prices_public_read"
  on public.resort_skipass_prices
  for select
  using (true);
