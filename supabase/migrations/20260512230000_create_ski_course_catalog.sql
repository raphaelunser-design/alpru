create table if not exists public.ski_schools (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid references public.resorts(id) on delete cascade,
  resort_slug text not null,
  name text not null,
  website_url text,
  booking_url text,
  phone text,
  email text,
  address text,
  country text,
  region text,
  source_url text,
  data_status text not null default 'unknown' check (
    data_status in ('official', 'curated', 'estimated', 'demo', 'unknown')
  ),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ski_course_offers (
  id uuid primary key default gen_random_uuid(),
  ski_school_id uuid not null references public.ski_schools(id) on delete cascade,
  resort_id uuid references public.resorts(id) on delete cascade,
  resort_slug text not null,
  course_type text not null check (
    course_type in ('children_group', 'adult_group', 'private', 'snowboard', 'beginner', 'advanced', 'family')
  ),
  target_group text not null default 'mixed' check (
    target_group in ('children', 'adults', 'families', 'mixed')
  ),
  skill_level text not null default 'all' check (
    skill_level in ('first_timer', 'beginner', 'intermediate', 'advanced', 'all')
  ),
  duration text,
  half_day_available boolean,
  full_day_available boolean,
  private_available boolean,
  group_available boolean,
  snowboard_available boolean,
  children_available boolean,
  adults_available boolean,
  min_age integer check (min_age is null or min_age >= 0),
  max_age integer check (max_age is null or max_age >= 0),
  price_from numeric(10, 2) check (price_from is null or price_from >= 0),
  currency text not null default 'EUR',
  price_unit text check (
    price_unit is null or price_unit in ('half_day', 'day', 'multi_day', 'hour', 'course')
  ),
  equipment_included boolean,
  liftpass_included boolean,
  lunch_included boolean,
  online_booking_available boolean,
  cancellation_hint text,
  meeting_point text,
  language_options text[] not null default '{}',
  source_url text,
  data_status text not null default 'unknown' check (
    data_status in ('official', 'curated', 'estimated', 'demo', 'unknown')
  ),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_age is null or min_age is null or max_age >= min_age)
);

create index if not exists ski_schools_resort_id_idx
  on public.ski_schools(resort_id);

create index if not exists ski_schools_resort_slug_idx
  on public.ski_schools(resort_slug);

create unique index if not exists ski_schools_unique_name_idx
  on public.ski_schools(resort_slug, lower(name));

create index if not exists ski_schools_data_status_idx
  on public.ski_schools(data_status);

create index if not exists ski_course_offers_school_id_idx
  on public.ski_course_offers(ski_school_id);

create index if not exists ski_course_offers_resort_id_idx
  on public.ski_course_offers(resort_id);

create index if not exists ski_course_offers_resort_slug_idx
  on public.ski_course_offers(resort_slug);

create index if not exists ski_course_offers_lookup_idx
  on public.ski_course_offers(resort_slug, target_group, skill_level, course_type);

create index if not exists ski_course_offers_flags_idx
  on public.ski_course_offers(resort_slug, children_available, private_available, snowboard_available, online_booking_available);

create unique index if not exists ski_course_offers_unique_seed_idx
  on public.ski_course_offers(
    ski_school_id,
    course_type,
    target_group,
    skill_level,
    coalesce(duration, ''),
    coalesce(source_url, '')
  );

alter table public.ski_schools enable row level security;
alter table public.ski_course_offers enable row level security;

drop policy if exists "ski_schools_public_read" on public.ski_schools;
create policy "ski_schools_public_read"
  on public.ski_schools
  for select
  using (true);

drop policy if exists "ski_course_offers_public_read" on public.ski_course_offers;
create policy "ski_course_offers_public_read"
  on public.ski_course_offers
  for select
  using (true);

drop trigger if exists ski_schools_set_updated_at on public.ski_schools;
create trigger ski_schools_set_updated_at
  before update on public.ski_schools
  for each row
  execute function public.set_updated_at();

drop trigger if exists ski_course_offers_set_updated_at on public.ski_course_offers;
create trigger ski_course_offers_set_updated_at
  before update on public.ski_course_offers
  for each row
  execute function public.set_updated_at();
