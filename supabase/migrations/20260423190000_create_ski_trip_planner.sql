create table if not exists public.ski_trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_region text,
  participant_target integer,
  budget_per_person numeric(10,2),
  ski_level text not null default 'mixed' check (ski_level in ('beginner', 'mixed', 'advanced')),
  focus text[] not null default '{}',
  preferred_resort_slugs text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ski_trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'joined' check (status in ('invited', 'open', 'joined')),
  joined_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists ski_trip_members_trip_user_idx
on public.ski_trip_members (trip_id, user_id)
where user_id is not null;

create table if not exists public.ski_trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  invite_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  note text,
  status text not null default 'invited' check (status in ('invited', 'open', 'joined')),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ski_trip_date_options (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ski_trip_date_range check (end_date >= start_date)
);

create table if not exists public.ski_trip_availability (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  date_option_id uuid not null references public.ski_trip_date_options(id) on delete cascade,
  member_id uuid not null references public.ski_trip_members(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  status text not null check (status in ('available', 'maybe', 'unavailable')),
  note text,
  updated_at timestamptz not null default now()
);

create unique index if not exists ski_trip_availability_unique_idx
on public.ski_trip_availability (date_option_id, member_id);

create table if not exists public.ski_trip_favorites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  resort_id uuid references public.resorts(id) on delete set null,
  resort_slug text not null,
  note text,
  proposed_by_member_id uuid references public.ski_trip_members(id) on delete set null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists ski_trip_favorites_unique_slug_idx
on public.ski_trip_favorites (trip_id, resort_slug);

create table if not exists public.ski_trip_favorite_votes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  favorite_id uuid not null references public.ski_trip_favorites(id) on delete cascade,
  member_id uuid not null references public.ski_trip_members(id) on delete cascade,
  vote_kind text not null check (vote_kind in ('like', 'favorite')),
  created_at timestamptz not null default now()
);

create unique index if not exists ski_trip_favorite_votes_unique_idx
on public.ski_trip_favorite_votes (favorite_id, member_id, vote_kind);

create table if not exists public.ski_trip_comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  favorite_id uuid not null references public.ski_trip_favorites(id) on delete cascade,
  member_id uuid not null references public.ski_trip_members(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ski_trip_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  favorite_id uuid not null references public.ski_trip_favorites(id) on delete cascade,
  date_option_id uuid not null references public.ski_trip_date_options(id) on delete cascade,
  currency text not null default 'EUR',
  skipass numeric(10,2) not null default 0,
  accommodation numeric(10,2) not null default 0,
  travel numeric(10,2) not null default 0,
  rental numeric(10,2) not null default 0,
  ski_school numeric(10,2) not null default 0,
  food numeric(10,2) not null default 0,
  buffer numeric(10,2) not null default 0,
  total_override numeric(10,2),
  note text,
  source_kind text not null default 'manual' check (source_kind in ('manual', 'seed', 'estimate')),
  updated_by_member_id uuid references public.ski_trip_members(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists ski_trip_price_snapshots_unique_idx
on public.ski_trip_price_snapshots (favorite_id, date_option_id);

create table if not exists public.ski_trip_budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  category text not null check (category in ('skipass', 'accommodation', 'travel', 'rental', 'ski_school', 'food', 'other')),
  description text not null,
  amount numeric(10,2) not null,
  due_date date,
  is_paid boolean not null default false,
  paid_by_member_id uuid references public.ski_trip_members(id) on delete set null,
  note text,
  created_by_member_id uuid references public.ski_trip_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ski_trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  category text not null check (category in ('skipass', 'accommodation', 'travel', 'rental', 'ski_school', 'food', 'other')),
  description text not null,
  amount numeric(10,2) not null,
  paid_by_member_id uuid references public.ski_trip_members(id) on delete set null,
  incurred_on date,
  note text,
  is_settled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ski_trip_expense_splits (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  expense_id uuid not null references public.ski_trip_expenses(id) on delete cascade,
  member_id uuid not null references public.ski_trip_members(id) on delete cascade,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create unique index if not exists ski_trip_expense_splits_unique_idx
on public.ski_trip_expense_splits (expense_id, member_id);

create table if not exists public.ski_trip_settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.ski_trips(id) on delete cascade,
  from_member_id uuid not null references public.ski_trip_members(id) on delete cascade,
  to_member_id uuid not null references public.ski_trip_members(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'open' check (status in ('open', 'paid')),
  note text,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ski_trip_members_trip_idx on public.ski_trip_members (trip_id);
create index if not exists ski_trip_invites_trip_idx on public.ski_trip_invites (trip_id);
create index if not exists ski_trip_date_options_trip_idx on public.ski_trip_date_options (trip_id);
create index if not exists ski_trip_availability_trip_idx on public.ski_trip_availability (trip_id);
create index if not exists ski_trip_favorites_trip_idx on public.ski_trip_favorites (trip_id);
create index if not exists ski_trip_votes_trip_idx on public.ski_trip_favorite_votes (trip_id);
create index if not exists ski_trip_comments_trip_idx on public.ski_trip_comments (trip_id);
create index if not exists ski_trip_price_snapshots_trip_idx on public.ski_trip_price_snapshots (trip_id);
create index if not exists ski_trip_budget_trip_idx on public.ski_trip_budget_items (trip_id);
create index if not exists ski_trip_expenses_trip_idx on public.ski_trip_expenses (trip_id);
create index if not exists ski_trip_expense_splits_trip_idx on public.ski_trip_expense_splits (trip_id);
create index if not exists ski_trip_settlements_trip_idx on public.ski_trip_settlements (trip_id);

create or replace function public.is_trip_member(target_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ski_trip_members member_row
    where member_row.trip_id = target_trip
      and member_row.user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_admin(target_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ski_trip_members member_row
    where member_row.trip_id = target_trip
      and member_row.user_id = auth.uid()
      and member_row.role = 'admin'
  );
$$;

create or replace function public.is_trip_creator(target_trip uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ski_trips trip_row
    where trip_row.id = target_trip
      and trip_row.created_by = auth.uid()
  );
$$;

create or replace function public.is_trip_member_self(target_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ski_trip_members member_row
    where member_row.id = target_member
      and member_row.user_id = auth.uid()
  );
$$;

grant execute on function public.is_trip_member(uuid) to anon, authenticated;
grant execute on function public.is_trip_admin(uuid) to anon, authenticated;
grant execute on function public.is_trip_creator(uuid) to anon, authenticated;
grant execute on function public.is_trip_member_self(uuid) to anon, authenticated;

alter table public.ski_trips enable row level security;
alter table public.ski_trip_members enable row level security;
alter table public.ski_trip_invites enable row level security;
alter table public.ski_trip_date_options enable row level security;
alter table public.ski_trip_availability enable row level security;
alter table public.ski_trip_favorites enable row level security;
alter table public.ski_trip_favorite_votes enable row level security;
alter table public.ski_trip_comments enable row level security;
alter table public.ski_trip_price_snapshots enable row level security;
alter table public.ski_trip_budget_items enable row level security;
alter table public.ski_trip_expenses enable row level security;
alter table public.ski_trip_expense_splits enable row level security;
alter table public.ski_trip_settlements enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trips' and policyname = 'Trip members can read trips') then
    create policy "Trip members can read trips" on public.ski_trips for select using (public.is_trip_member(id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trips' and policyname = 'Authenticated users can create trips') then
    create policy "Authenticated users can create trips" on public.ski_trips for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trips' and policyname = 'Trip admins can update trips') then
    create policy "Trip admins can update trips" on public.ski_trips for update using (public.is_trip_admin(id)) with check (public.is_trip_admin(id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trips' and policyname = 'Trip admins can delete trips') then
    create policy "Trip admins can delete trips" on public.ski_trips for delete using (public.is_trip_admin(id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_members' and policyname = 'Trip members can read members') then
    create policy "Trip members can read members" on public.ski_trip_members for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_members' and policyname = 'Creators or admins can insert members') then
    create policy "Creators or admins can insert members" on public.ski_trip_members for insert with check (public.is_trip_creator(trip_id) or public.is_trip_admin(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_members' and policyname = 'Admins or self can update members') then
    create policy "Admins or self can update members" on public.ski_trip_members for update using (public.is_trip_admin(trip_id) or user_id = auth.uid()) with check (public.is_trip_admin(trip_id) or user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_members' and policyname = 'Admins or self can delete members') then
    create policy "Admins or self can delete members" on public.ski_trip_members for delete using (public.is_trip_admin(trip_id) or user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_invites' and policyname = 'Trip members can read invites') then
    create policy "Trip members can read invites" on public.ski_trip_invites for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_invites' and policyname = 'Trip admins can manage invites') then
    create policy "Trip admins can manage invites" on public.ski_trip_invites for all using (public.is_trip_admin(trip_id)) with check (public.is_trip_admin(trip_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_date_options' and policyname = 'Trip members can read date options') then
    create policy "Trip members can read date options" on public.ski_trip_date_options for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_date_options' and policyname = 'Trip members can insert date options') then
    create policy "Trip members can insert date options" on public.ski_trip_date_options for insert with check (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_date_options' and policyname = 'Trip members can update date options') then
    create policy "Trip members can update date options" on public.ski_trip_date_options for update using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_date_options' and policyname = 'Trip admins can delete date options') then
    create policy "Trip admins can delete date options" on public.ski_trip_date_options for delete using (public.is_trip_admin(trip_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_availability' and policyname = 'Trip members can read availability') then
    create policy "Trip members can read availability" on public.ski_trip_availability for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_availability' and policyname = 'Members can write own availability') then
    create policy "Members can write own availability" on public.ski_trip_availability for insert with check (public.is_trip_member(trip_id) and user_id = auth.uid() and public.is_trip_member_self(member_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_availability' and policyname = 'Members can update own availability') then
    create policy "Members can update own availability" on public.ski_trip_availability for update using (public.is_trip_member(trip_id) and user_id = auth.uid() and public.is_trip_member_self(member_id)) with check (public.is_trip_member(trip_id) and user_id = auth.uid() and public.is_trip_member_self(member_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_availability' and policyname = 'Members can delete own availability') then
    create policy "Members can delete own availability" on public.ski_trip_availability for delete using (public.is_trip_member(trip_id) and user_id = auth.uid() and public.is_trip_member_self(member_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_favorites' and policyname = 'Trip members can read favorites') then
    create policy "Trip members can read favorites" on public.ski_trip_favorites for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_favorites' and policyname = 'Trip members can manage favorites') then
    create policy "Trip members can manage favorites" on public.ski_trip_favorites for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id) and (proposed_by_member_id is null or public.is_trip_member_self(proposed_by_member_id)));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_favorite_votes' and policyname = 'Trip members can read favorite votes') then
    create policy "Trip members can read favorite votes" on public.ski_trip_favorite_votes for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_favorite_votes' and policyname = 'Trip members can manage own favorite votes') then
    create policy "Trip members can manage own favorite votes" on public.ski_trip_favorite_votes for all using (public.is_trip_member(trip_id) and public.is_trip_member_self(member_id)) with check (public.is_trip_member(trip_id) and public.is_trip_member_self(member_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_comments' and policyname = 'Trip members can read comments') then
    create policy "Trip members can read comments" on public.ski_trip_comments for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_comments' and policyname = 'Trip members can manage own comments') then
    create policy "Trip members can manage own comments" on public.ski_trip_comments for all using (public.is_trip_member(trip_id) and public.is_trip_member_self(member_id)) with check (public.is_trip_member(trip_id) and public.is_trip_member_self(member_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_price_snapshots' and policyname = 'Trip members can read price snapshots') then
    create policy "Trip members can read price snapshots" on public.ski_trip_price_snapshots for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_price_snapshots' and policyname = 'Trip members can manage price snapshots') then
    create policy "Trip members can manage price snapshots" on public.ski_trip_price_snapshots for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id) and (updated_by_member_id is null or public.is_trip_member_self(updated_by_member_id)));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_budget_items' and policyname = 'Trip members can read budget items') then
    create policy "Trip members can read budget items" on public.ski_trip_budget_items for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_budget_items' and policyname = 'Trip members can manage budget items') then
    create policy "Trip members can manage budget items" on public.ski_trip_budget_items for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_expenses' and policyname = 'Trip members can read expenses') then
    create policy "Trip members can read expenses" on public.ski_trip_expenses for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_expenses' and policyname = 'Trip members can manage expenses') then
    create policy "Trip members can manage expenses" on public.ski_trip_expenses for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_expense_splits' and policyname = 'Trip members can read expense splits') then
    create policy "Trip members can read expense splits" on public.ski_trip_expense_splits for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_expense_splits' and policyname = 'Trip members can manage expense splits') then
    create policy "Trip members can manage expense splits" on public.ski_trip_expense_splits for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_settlements' and policyname = 'Trip members can read settlements') then
    create policy "Trip members can read settlements" on public.ski_trip_settlements for select using (public.is_trip_member(trip_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ski_trip_settlements' and policyname = 'Trip members can manage settlements') then
    create policy "Trip members can manage settlements" on public.ski_trip_settlements for all using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
  end if;
end $$;

