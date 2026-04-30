create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  check (char_length(trim(key)) between 1 and 120),
  check (char_length(trim(value)) between 1 and 1000)
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read_access_mode" on public.app_settings;
create policy "app_settings_public_read_access_mode"
on public.app_settings
for select
to anon, authenticated
using (key = 'alpivo_access_mode');

insert into public.app_settings (key, value, updated_by)
values ('alpivo_access_mode', 'public', 'migration')
on conflict (key) do nothing;
