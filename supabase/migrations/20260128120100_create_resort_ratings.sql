create table if not exists public.resort_ratings (
  id uuid primary key default gen_random_uuid(),
  resort_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating >= 0 and rating <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists resort_ratings_unique on public.resort_ratings (resort_slug, user_id);

alter table public.resort_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resort_ratings' and policyname = 'Public read resort ratings'
  ) then
    create policy "Public read resort ratings"
    on public.resort_ratings
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resort_ratings' and policyname = 'Users insert own ratings'
  ) then
    create policy "Users insert own ratings"
    on public.resort_ratings
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resort_ratings' and policyname = 'Users update own ratings'
  ) then
    create policy "Users update own ratings"
    on public.resort_ratings
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resort_ratings' and policyname = 'Users delete own ratings'
  ) then
    create policy "Users delete own ratings"
    on public.resort_ratings
    for delete
    using (auth.uid() = user_id);
  end if;
end $$;
