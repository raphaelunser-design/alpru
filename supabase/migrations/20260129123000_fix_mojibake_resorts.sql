create or replace function public.fix_mojibake(input text)
returns text
language plpgsql
as $$
declare
  result text;
begin
  if input is null then
    return null;
  end if;

  result := input;
  -- German umlauts / ß
  result := replace(result, 'ÃƒÂ¤', 'Ã¤');
  result := replace(result, 'ÃƒÂ¶', 'Ã¶');
  result := replace(result, 'ÃƒÂ¼', 'Ã¼');
  result := replace(result, 'ÃƒÅ¸', 'ÃŸ');
  result := replace(result, 'Ãƒâ€ž', 'Ã„');
  result := replace(result, 'Ãƒâ€“', 'Ã–');
  result := replace(result, 'ÃƒÅ“', 'Ãœ');
  -- Common punctuation mojibake
  result := replace(result, 'Ã¢â‚¬â€œ', 'â€“');
  result := replace(result, 'Ã¢â‚¬â€', 'â€”');
  result := replace(result, 'Ã¢â‚¬Å¾', 'â€ž');
  result := replace(result, 'Ã¢â‚¬Å“', 'â€œ');
  result := replace(result, 'Ã¢â‚¬Â', 'â€');
  result := replace(result, 'Ã¢â‚¬Ëœ', 'â€˜');
  result := replace(result, 'Ã¢â‚¬â„¢', 'â€™');

  return result;
end;
$$;

update public.resorts
set
  name = public.fix_mojibake(name),
  country = public.fix_mojibake(country),
  region = public.fix_mojibake(region)
where
  name like '%Ãƒ%' or name like '%Ã¢%' or
  country like '%Ãƒ%' or country like '%Ã¢%' or
  region like '%Ãƒ%' or region like '%Ã¢%';
