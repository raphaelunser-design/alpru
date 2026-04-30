alter table public.resorts
  add column if not exists skipass_price_from numeric,
  add column if not exists skipass_price_currency text,
  add column if not exists skipass_price_last_checked date,
  add column if not exists skipass_price_note text;
