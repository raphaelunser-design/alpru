create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  category text not null default 'feedback' check (category in ('bug', 'feature', 'feedback')),
  message text not null check (char_length(message) between 3 and 2000),
  page_path text,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'done', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

create policy "Anyone can submit beta feedback"
  on public.beta_feedback
  for insert
  to anon, authenticated
  with check (
    category in ('bug', 'feature', 'feedback')
    and char_length(message) between 3 and 2000
  );

create policy "Users can read their own beta feedback"
  on public.beta_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists beta_feedback_created_at_idx on public.beta_feedback (created_at desc);
create index if not exists beta_feedback_category_idx on public.beta_feedback (category);
create index if not exists beta_feedback_status_idx on public.beta_feedback (status);
