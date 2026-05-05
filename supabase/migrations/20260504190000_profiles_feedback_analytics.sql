create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists last_seen_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.app_admins (
  email text primary key,
  role text not null default 'admin' check (role in ('admin')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email = lower(email))
);

insert into public.app_admins (email, role, note)
values ('raphaelunser@gmail.com', 'admin', 'Initial Alpivo owner admin')
on conflict (email) do update
set role = excluded.role,
    note = excluded.note,
    updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'raphaelunser@gmail.com'
    or exists (
      select 1
      from public.app_admins a
      where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        and a.role = 'admin'
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  initial_name text;
  initial_role text;
begin
  normalized_email := lower(coalesce(new.email, ''));
  initial_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(normalized_email, '@', 1))), '');
  initial_role := case when normalized_email = 'raphaelunser@gmail.com' then 'admin' else 'user' end;

  insert into public.profiles (id, email, display_name, role, created_at, updated_at, last_seen_at)
  values (new.id, normalized_email, initial_name, initial_role, now(), now(), now())
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      role = case
        when excluded.email = 'raphaelunser@gmail.com' then 'admin'
        else public.profiles.role
      end,
      updated_at = now(),
      last_seen_at = coalesce(public.profiles.last_seen_at, now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name, role, created_at, updated_at, last_seen_at)
select
  u.id,
  lower(u.email),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'full_name', split_part(lower(u.email), '@', 1))), ''),
  case when lower(u.email) = 'raphaelunser@gmail.com' then 'admin' else 'user' end,
  coalesce(u.created_at, now()),
  now(),
  coalesce(u.last_sign_in_at, now())
from auth.users u
on conflict (id) do update
set email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    role = case
      when excluded.email = 'raphaelunser@gmail.com' then 'admin'
      else public.profiles.role
    end,
    updated_at = now(),
    last_seen_at = coalesce(public.profiles.last_seen_at, excluded.last_seen_at);

update public.profiles
set role = 'admin',
    updated_at = now()
where lower(email) = 'raphaelunser@gmail.com';

create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_non_admin_role_change on public.profiles;
create trigger profiles_prevent_non_admin_role_change
before update on public.profiles
for each row execute function public.prevent_non_admin_role_change();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and (
    role = 'user'
    or lower(coalesce(email, auth.jwt() ->> 'email', '')) = 'raphaelunser@gmail.com'
    or public.is_admin()
  )
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_last_seen_idx on public.profiles (last_seen_at desc);

alter table public.beta_feedback add column if not exists display_name text;
alter table public.beta_feedback add column if not exists page_url text;
alter table public.beta_feedback add column if not exists feedback_type text;
alter table public.beta_feedback add column if not exists rating integer;
alter table public.beta_feedback add column if not exists updated_at timestamptz not null default now();
alter table public.beta_feedback add column if not exists updated_by uuid references auth.users(id) on delete set null;

update public.beta_feedback
set feedback_type = coalesce(feedback_type, category, 'feedback'),
    page_url = coalesce(page_url, page_path)
where feedback_type is null or page_url is null;

alter table public.beta_feedback drop constraint if exists beta_feedback_category_check;
alter table public.beta_feedback
  add constraint beta_feedback_category_check
  check (category in ('bug', 'feature', 'feedback', 'idea', 'design', 'general'));

alter table public.beta_feedback drop constraint if exists beta_feedback_feedback_type_check;
alter table public.beta_feedback
  add constraint beta_feedback_feedback_type_check
  check (feedback_type is null or feedback_type in ('bug', 'feature', 'feedback', 'idea', 'design', 'general'));

alter table public.beta_feedback drop constraint if exists beta_feedback_status_check;
alter table public.beta_feedback
  add constraint beta_feedback_status_check
  check (status in ('new', 'reviewed', 'planned', 'done', 'archived'));

alter table public.beta_feedback drop constraint if exists beta_feedback_rating_check;
alter table public.beta_feedback
  add constraint beta_feedback_rating_check
  check (rating is null or rating between 1 and 5);

drop trigger if exists beta_feedback_set_updated_at on public.beta_feedback;
create trigger beta_feedback_set_updated_at
before update on public.beta_feedback
for each row execute function public.set_updated_at();

drop policy if exists "Anyone can submit beta feedback" on public.beta_feedback;
create policy beta_feedback_insert_own_or_anonymous
on public.beta_feedback
for insert
to anon, authenticated
with check (
  category in ('bug', 'feature', 'feedback', 'idea', 'design', 'general')
  and char_length(message) between 3 and 2000
  and (
    user_id is null
    or auth.uid() = user_id
  )
);

drop policy if exists "Users can read their own beta feedback" on public.beta_feedback;
create policy "Users can read their own beta feedback"
on public.beta_feedback
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists beta_feedback_admin_update on public.beta_feedback;
create policy beta_feedback_admin_update
on public.beta_feedback
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists beta_feedback_admin_delete on public.beta_feedback;
create policy beta_feedback_admin_delete
on public.beta_feedback
for delete
to authenticated
using (public.is_admin());

create index if not exists beta_feedback_user_created_idx on public.beta_feedback (user_id, created_at desc);
create index if not exists beta_feedback_type_status_idx on public.beta_feedback (feedback_type, status);

create table if not exists public.page_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  path text not null check (char_length(trim(path)) between 1 and 500),
  referrer text,
  user_agent text,
  event_type text not null default 'page_view' check (event_type in ('page_view')),
  session_id text,
  device_type text,
  browser text,
  created_at timestamptz not null default now()
);

alter table public.page_events enable row level security;

drop policy if exists page_events_insert_anonymous_or_own on public.page_events;
create policy page_events_insert_anonymous_or_own
on public.page_events
for insert
to anon, authenticated
with check (
  event_type = 'page_view'
  and (
    user_id is null
    or auth.uid() = user_id
  )
);

drop policy if exists page_events_admin_select on public.page_events;
create policy page_events_admin_select
on public.page_events
for select
to authenticated
using (public.is_admin());

create index if not exists page_events_created_at_idx on public.page_events (created_at desc);
create index if not exists page_events_path_created_at_idx on public.page_events (path, created_at desc);
create index if not exists page_events_user_created_at_idx on public.page_events (user_id, created_at desc);
create index if not exists page_events_session_created_at_idx on public.page_events (session_id, created_at desc);
