# Product Scope

Alpivo focuses on Alpine ski resorts only.

## In scope (MVP)
- Alpine Convention countries: AT, CH, DE, FR, IT, LI, MC, SI
- Resorts filtered to the Alps (Wikidata P4552/P706; fallback to Alps bbox when Wikidata is missing)
- Resort discovery: list, map, and quiz results
- Basic match scoring and filtering
- Local checklist persistence

## Out of scope (for now)
- Global resorts outside the Alps
- Full booking flows
- Paid routing or weather providers without a clear ROI

## Data sources
- OpenSkiStats + OpenSkiMap for base resort data
- Wikidata entity check for Alps-only filter

## Quality bar
- Each resort needs name, country, lat, lon
- Prefer official_url, image_url, piste km and lift/run counts
