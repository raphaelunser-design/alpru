create table if not exists public.app_admins (
  email text primary key,
  role text not null default 'admin' check (role in ('admin')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(email))
);

alter table public.app_admins enable row level security;

insert into public.app_admins (email, role, note)
values ('raphaelunser@gmail.com', 'admin', 'Initial Alpivo owner admin')
on conflict (email) do update
set role = excluded.role,
    note = excluded.note,
    updated_at = now();

create table if not exists public.ski_trip_checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.ski_trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 180),
  detail text not null default '',
  is_checked boolean not null default false,
  is_default boolean not null default false,
  default_key text,
  sort_order integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ski_trip_checklist_items_user_idx
on public.ski_trip_checklist_items (user_id, trip_id, sort_order);

create unique index if not exists ski_trip_checklist_default_global_unique
on public.ski_trip_checklist_items (user_id, default_key)
where trip_id is null and default_key is not null;

create unique index if not exists ski_trip_checklist_default_trip_unique
on public.ski_trip_checklist_items (user_id, trip_id, default_key)
where trip_id is not null and default_key is not null;

alter table public.ski_trip_checklist_items enable row level security;

drop policy if exists "checklist_items_select_own" on public.ski_trip_checklist_items;
create policy "checklist_items_select_own"
on public.ski_trip_checklist_items
for select
to authenticated
using (
  auth.uid() = user_id
  and (trip_id is null or public.is_trip_member(trip_id))
);

drop policy if exists "checklist_items_insert_own" on public.ski_trip_checklist_items;
create policy "checklist_items_insert_own"
on public.ski_trip_checklist_items
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (trip_id is null or public.is_trip_member(trip_id))
);

drop policy if exists "checklist_items_update_own" on public.ski_trip_checklist_items;
create policy "checklist_items_update_own"
on public.ski_trip_checklist_items
for update
to authenticated
using (
  auth.uid() = user_id
  and (trip_id is null or public.is_trip_member(trip_id))
)
with check (
  auth.uid() = user_id
  and (trip_id is null or public.is_trip_member(trip_id))
);

drop policy if exists "checklist_items_delete_own" on public.ski_trip_checklist_items;
create policy "checklist_items_delete_own"
on public.ski_trip_checklist_items
for delete
to authenticated
using (
  auth.uid() = user_id
  and (trip_id is null or public.is_trip_member(trip_id))
);
