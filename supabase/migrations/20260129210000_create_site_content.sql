create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_content'
      and policyname = 'Public read content'
  ) then
    create policy "Public read content"
      on public.site_content
      for select
      using (true);
  end if;
end $$;
