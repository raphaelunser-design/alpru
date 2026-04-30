alter table public.resorts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'resorts' and policyname = 'public read resorts'
  ) then
    create policy "public read resorts"
      on public.resorts
      for select
      using (true);
  end if;
end $$;
