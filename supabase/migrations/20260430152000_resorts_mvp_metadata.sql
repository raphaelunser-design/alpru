alter table public.resorts
  add column if not exists estimated_day_pass_eur numeric,
  add column if not exists estimated_food_eur_per_day numeric,
  add column if not exists estimated_accommodation_eur_per_night numeric,
  add column if not exists snow_reliability_score numeric,
  add column if not exists value_score numeric,
  add column if not exists budget_level text,
  add column if not exists resort_style text[] default '{}',
  add column if not exists data_quality text default 'estimated',
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resorts_budget_level_check'
  ) then
    alter table public.resorts
      add constraint resorts_budget_level_check
      check (budget_level is null or budget_level in ('budget', 'mid', 'premium'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resorts_data_quality_check'
  ) then
    alter table public.resorts
      add constraint resorts_data_quality_check
      check (data_quality in ('demo', 'estimated', 'verified'));
  end if;
end $$;

update public.resorts
set
  estimated_day_pass_eur = coalesce(
    estimated_day_pass_eur,
    skipass_price_from,
    case
      when country ilike '%Schweiz%' then 82
      when country ilike '%Frankreich%' then 68
      when country ilike '%Italien%' then 62
      when country ilike '%Deutschland%' then 48
      else 68
    end
  ),
  estimated_food_eur_per_day = coalesce(
    estimated_food_eur_per_day,
    case
      when country ilike '%Schweiz%' then 70
      when country ilike '%Frankreich%' then 58
      when country ilike '%Italien%' then 52
      when country ilike '%Deutschland%' then 45
      else 55
    end
  ),
  estimated_accommodation_eur_per_night = coalesce(
    estimated_accommodation_eur_per_night,
    case
      when country ilike '%Schweiz%' then 130
      when country ilike '%Frankreich%' then 105
      when country ilike '%Italien%' then 95
      when country ilike '%Deutschland%' then 85
      else 100
    end
  ),
  snow_reliability_score = coalesce(
    snow_reliability_score,
    least(100, greatest(0, round((((coalesce(elevation_max_m, 1400) - 900) / 1800.0) * 70 + (coalesce(piste_km_total, piste_km, 25) / 250.0) * 30)::numeric, 0)))
  ),
  value_score = coalesce(
    value_score,
    least(100, greatest(0, round((100 - (coalesce(skipass_price_from, 65) - 45) * 1.2 + least(coalesce(piste_km_total, piste_km, 20), 160) / 3)::numeric, 0)))
  ),
  budget_level = coalesce(
    budget_level,
    case
      when coalesce(skipass_price_from, 65) <= 58 then 'budget'
      when coalesce(skipass_price_from, 65) >= 78 then 'premium'
      else 'mid'
    end
  ),
  data_quality = coalesce(data_quality, 'estimated'),
  updated_at = coalesce(updated_at, now())
where true;
