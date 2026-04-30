alter table public.resorts
  add column if not exists hero_image_url text,
  add column if not exists hero_image_alt text,
  add column if not exists image_source text,
  add column if not exists image_credit text,
  add column if not exists image_license text;

comment on column public.resorts.hero_image_url is 'Curated resort-specific hero image URL. Keep existing image_url/fallback when empty.';
comment on column public.resorts.hero_image_alt is 'Accessible alt text for the curated resort hero image.';
comment on column public.resorts.image_source is 'Source page for the curated resort hero image.';
comment on column public.resorts.image_credit is 'Attribution for the curated resort hero image.';
comment on column public.resorts.image_license is 'License label for the curated resort hero image.';

with curated_images(slug, hero_image_url, hero_image_alt, image_source, image_credit, image_license) as (
  values
    (
      'les-trois-vallees',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Val-thorens-panorama.jpg/3840px-Val-thorens-panorama.jpg',
      'Winterpanorama im Skigebiet Les Trois Vallees bei Val Thorens',
      'https://commons.wikimedia.org/wiki/File:Val-thorens-panorama.jpg',
      'Henrik / Wikimedia Commons',
      'CC BY-SA 3.0'
    ),
    (
      'val-thorens-orelle',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Val-thorens-panorama.jpg/3840px-Val-thorens-panorama.jpg',
      'Panorama der Pisten und Berge in Val Thorens Orelle',
      'https://commons.wikimedia.org/wiki/File:Val-thorens-panorama.jpg',
      'Henrik / Wikimedia Commons',
      'CC BY-SA 3.0'
    ),
    (
      'skicircus-saalbach-hinterglemm-leogang-fieberbrunn',
      'https://upload.wikimedia.org/wikipedia/commons/b/b5/Saalbach_hinterglemm.jpg',
      'Berglandschaft in Saalbach-Hinterglemm im Skicircus',
      'https://commons.wikimedia.org/wiki/File:Saalbach_hinterglemm.jpg',
      'Arne Mueseler / Wikimedia Commons',
      'CC BY-SA 3.0 DE'
    ),
    (
      'skiwelt-wilder-kaiser-brixental',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Wilder_Kaiser_massif_panorama_from_SkiWelt_2026.JPG/3840px-Wilder_Kaiser_massif_panorama_from_SkiWelt_2026.JPG',
      'Winterpanorama des Wilden Kaisers vom Skigebiet SkiWelt',
      'https://commons.wikimedia.org/wiki/File:Wilder_Kaiser_massif_panorama_from_SkiWelt_2026.JPG',
      'Mike is Michi / Wikimedia Commons',
      'CC BY-SA 4.0'
    ),
    (
      'tignes-val-d-isere',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Tignes_resort_%285790107636%29.jpg/3840px-Tignes_resort_%285790107636%29.jpg',
      'Winterblick auf das Skigebiet Tignes Val d''Isere',
      'https://commons.wikimedia.org/wiki/File:Tignes_resort_(5790107636).jpg',
      'Jerome Bon / Wikimedia Commons',
      'CC BY 2.0'
    ),
    (
      'zermatt-breuil-cervinia-breuil-cervinia-ski-paradise',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Zermatt_in_Winter_%281%29.jpg/3840px-Zermatt_in_Winter_%281%29.jpg',
      'Winterpanorama in Zermatt mit alpiner Berglandschaft',
      'https://commons.wikimedia.org/wiki/File:Zermatt_in_Winter_(1).jpg',
      'Armineaghayan / Wikimedia Commons',
      'CC BY-SA 4.0'
    ),
    (
      'la-plagne',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/La_Plagne_Winter_Panorama.jpg/3840px-La_Plagne_Winter_Panorama.jpg',
      'Winterpanorama im Skigebiet La Plagne',
      'https://commons.wikimedia.org/wiki/File:La_Plagne_Winter_Panorama.jpg',
      'Bart Roemgens / Wikimedia Commons',
      'CC BY-SA 4.0'
    ),
    (
      'les-arcs',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Mont_Pourri_Seen_From_Aiguille_Rouge.jpg/3840px-Mont_Pourri_Seen_From_Aiguille_Rouge.jpg',
      'Bergpanorama vom Skigebiet Les Arcs Richtung Mont Pourri',
      'https://commons.wikimedia.org/wiki/File:Mont_Pourri_Seen_From_Aiguille_Rouge.jpg',
      'Benh LIEU SONG / Wikimedia Commons',
      'CC BY-SA 4.0'
    ),
    (
      'kitzski',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kitzbuehel_Panorama.jpg/3840px-Kitzbuehel_Panorama.jpg',
      'Panorama von Kitzbuehel und dem Skigebiet am Hahnenkamm',
      'https://commons.wikimedia.org/wiki/File:Kitzbuehel_Panorama.jpg',
      'www.gpix.at / Wikimedia Commons',
      'CC BY-SA 3.0'
    ),
    (
      'serfaus-fiss-ladis',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Serfaus%2C_Skigebiet_Masner.jpg/3840px-Serfaus%2C_Skigebiet_Masner.jpg',
      'Blick auf das Skigebiet Serfaus-Fiss-Ladis im Masnergebiet',
      'https://commons.wikimedia.org/wiki/File:Serfaus,_Skigebiet_Masner.jpg',
      'Constantin0907 / Wikimedia Commons',
      'CC BY-SA 4.0'
    ),
    (
      'silvretta-arena-ischgl-samnaun',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Panorama_Ischgl_Idalp.jpg/3840px-Panorama_Ischgl_Idalp.jpg',
      'Panorama im Skigebiet Ischgl Idalp',
      'https://commons.wikimedia.org/wiki/File:Panorama_Ischgl_Idalp.jpg',
      'Guerkan Senguen / Wikimedia Commons',
      'Public domain'
    ),
    (
      'lech-zurs',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Lech-Zuers-Trittkopfbahn-Flexenarena-02ASD.jpg/3840px-Lech-Zuers-Trittkopfbahn-Flexenarena-02ASD.jpg',
      'Skipiste und Trittkopfbahn in Lech Zuers am Arlberg',
      'https://commons.wikimedia.org/wiki/File:Lech-Zuers-Trittkopfbahn-Flexenarena-02ASD.jpg',
      'Asurnipal / Wikimedia Commons',
      'CC BY-SA 4.0'
    ),
    (
      'solden',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Ski_resort%2C_Soelden_%28LRM_20241216_140945%29.jpg/3840px-Ski_resort%2C_Soelden_%28LRM_20241216_140945%29.jpg',
      'Winterlandschaft und Pisten im Skigebiet Soelden',
      'https://commons.wikimedia.org/wiki/File:Ski_resort,_Soelden_(LRM_20241216_140945).jpg',
      'Matti Blume / Wikimedia Commons',
      'CC BY-SA'
    ),
    (
      'st-anton-st-christoph-stuben',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Skiing_in_Sankt_Anton_am_Arlberg_-_panoramio.jpg/3840px-Skiing_in_Sankt_Anton_am_Arlberg_-_panoramio.jpg',
      'Skifahren im Skigebiet St. Anton am Arlberg',
      'https://commons.wikimedia.org/wiki/File:Skiing_in_Sankt_Anton_am_Arlberg_-_panoramio.jpg',
      'qwesy qwesy / Wikimedia Commons',
      'CC BY 3.0'
    ),
    (
      'obertauern',
      'https://upload.wikimedia.org/wikipedia/commons/a/a5/Obertauern_Panorama_Piste.jpg',
      'Pistenpanorama im Skigebiet Obertauern',
      'https://commons.wikimedia.org/wiki/File:Obertauern_Panorama_Piste.jpg',
      'L3nnox / Wikimedia Commons',
      'CC BY-SA 3.0'
    )
)
update public.resorts as resorts
set
  hero_image_url = curated_images.hero_image_url,
  hero_image_alt = curated_images.hero_image_alt,
  image_source = curated_images.image_source,
  image_credit = curated_images.image_credit,
  image_license = curated_images.image_license
from curated_images
where resorts.slug = curated_images.slug
  and nullif(trim(coalesce(resorts.hero_image_url, '')), '') is null;
