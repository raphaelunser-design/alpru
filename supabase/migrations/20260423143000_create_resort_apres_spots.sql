create table if not exists public.resort_apres_spots (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid references public.resorts(id) on delete cascade,
  resort_slug text not null,
  name text not null,
  venue_type text not null default 'bar',
  rank integer not null default 100,
  village text,
  address text,
  vibe_label text,
  best_for text,
  opening_note text,
  price_level text,
  website_url text,
  maps_url text,
  booking_url text,
  source_url text,
  source_label text not null default 'Offizielle Quelle',
  last_checked date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resort_apres_spots_resort_id_idx
  on public.resort_apres_spots(resort_id);

create index if not exists resort_apres_spots_resort_slug_idx
  on public.resort_apres_spots(resort_slug);

create index if not exists resort_apres_spots_rank_idx
  on public.resort_apres_spots(resort_slug, rank, name);

alter table public.resort_apres_spots enable row level security;

drop policy if exists "resort_apres_spots_public_read" on public.resort_apres_spots;
create policy "resort_apres_spots_public_read"
  on public.resort_apres_spots
  for select
  using (true);
