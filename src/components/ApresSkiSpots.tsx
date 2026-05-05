"use client";

export type ApresSpot = {
  id: string;
  resort_slug: string;
  name: string;
  venue_type: string;
  rank: number;
  village: string | null;
  address: string | null;
  vibe_label: string | null;
  best_for: string | null;
  opening_note: string | null;
  price_level: string | null;
  website_url: string | null;
  maps_url: string | null;
  booking_url: string | null;
  source_url: string | null;
  source_label: string | null;
  last_checked: string | null;
  note: string | null;
};

type ApresSkiSpotsProps = {
  resortName: string;
  apresScore: number | null;
  officialUrl: string | null;
  spots: ApresSpot[];
  hint: string;
};

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "offen";
  return `${Math.round(value * 100)}%`;
}

function mapsSearchUrl(resortName: string) {
  const query = encodeURIComponent(`Après Ski ${resortName}`);
  return `https://www.google.com/maps/search/api=1&query=${query}`;
}

function typeLabel(value: string | null | undefined) {
  if (value === "club") return "Club";
  if (value === "hut") return "Hütte";
  if (value === "restaurant") return "Restaurant";
  if (value === "umbrella_bar") return "Schirmbar";
  return "Bar";
}

function ExternalArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M7 5h8m0 0v8m0-8-9.5 9.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function ApresSkiSpots({ resortName, apresScore, officialUrl, spots, hint }: ApresSkiSpotsProps) {
  const mapSearch = mapsSearchUrl(resortName);

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/62 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Après-Ski</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Beste Adressen vor Ort</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Bars, Hütten und Treffpunkte werden als gepflegte Adressen mit Quelle geführt, damit Alpivo keine geratenen Empfehlungen ausspielt.
          </p>
        </div>
        <div className="w-fit rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-sm text-amber-50">
          Après-Ski Signal: {formatScore(apresScore)}
        </div>
      </div>

      {spots.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {spots.map((spot) => {
            const primaryUrl = spot.maps_url || spot.website_url || spot.booking_url || spot.source_url;
            return (
              <article key={spot.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      #{spot.rank} · {typeLabel(spot.venue_type)}
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-white">{spot.name}</h3>
                  </div>
                  {primaryUrl ? (
                    <a
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-950/40 text-slate-200 hover:text-sky-100"
                      href={primaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${spot.name} öffnen`}
                    >
                      <ExternalArrow />
                    </a>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {spot.address || spot.village ? (
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">Adresse</div>
                      <div className="mt-0.5 font-medium text-white">{spot.address ?? spot.village}</div>
                      {spot.address && spot.village ? <div className="text-xs text-slate-400">{spot.village}</div> : null}
                    </div>
                  ) : null}
                  {spot.vibe_label ? <div>{spot.vibe_label}</div> : null}
                  {spot.best_for ? <div className="text-xs text-slate-400">Gut für: {spot.best_for}</div> : null}
                  {spot.opening_note ? <div className="text-xs text-slate-400">{spot.opening_note}</div> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  {spot.price_level ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1">{spot.price_level}</span>
                  ) : null}
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1">
                    {spot.source_label ?? "Quelle gepflegt"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-amber-200/20 bg-amber-200/10 p-4 text-sm text-amber-50">
            Für dieses Resort sind noch keine verifizierten Après-Ski-Adressen hinterlegt.
            {hint ? <div className="mt-2 text-xs text-amber-100/80">{hint}</div> : null}
            <div className="mt-2 text-xs text-amber-100/80">
              Nächster Daten-Schritt: offizielle Resortseiten, lokale Tourismusquellen und geprüfte Kartenlinks je Spot importieren.
            </div>
          </div>
          <div className="grid gap-2 text-sm">
            <a
              className="inline-flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 text-slate-200 hover:bg-white/10"
              href={mapSearch}
              target="_blank"
              rel="noreferrer"
            >
              Karten-Suche öffnen
              <ExternalArrow />
            </a>
            {officialUrl ? (
              <a
                className="inline-flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-4 py-3 text-slate-200 hover:bg-white/10"
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
              >
                Offizielle Resortseite prüfen
                <ExternalArrow />
              </a>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
