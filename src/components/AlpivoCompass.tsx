import Link from "next/link";
import type { ResortDecision } from "@/lib/resortSignals";

type CompassResort = ResortDecision & {
  distanceKm: number | null;
  driveHours: number | null;
};

type AlpivoCompassProps = {
  results: CompassResort[];
  totalResults: number;
};

const number = new Intl.NumberFormat("de-DE");

function pct(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function compactCost(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${number.format(value)} EUR`;
}

function strongestSignal(resort: CompassResort | undefined) {
  if (!resort) return null;
  const entries = [
    { label: "Pistenprofil", value: resort.fitProfile.slope 0 },
    { label: "Vibe", value: resort.fitProfile.vibe 0 },
    { label: "Schnee", value: resort.fitProfile.snow resort.snowReliability 0 },
    { label: "Sommer-Gletscher", value: resort.fitProfile.summer resort.summerGlacierScore 0 },
    { label: "Off-Piste", value: resort.fitProfile.offPiste 0 },
    { label: "Value", value: resort.fitProfile.value resort.valueScore 0 },
    { label: "Komfort", value: resort.fitProfile.comfort 0 },
  ].sort((a, b) => b.value - a.value);
  return entries[0];
}

function coachText(results: CompassResort[]) {
  if (results.length === 0) return "Starte den Match neu, damit Alpivo dein Entscheidungsprofil berechnen kann.";
  const first = results[0];
  const second = results[1];
  if (!second) return `${first.name} ist aktuell dein klarster Kandidat.`;
  const spread = first.matchPct - second.matchPct;
  if (spread >= 9) return `${first.name} liegt deutlich vorne. Prüfe nur noch Kosten, Route und Pistenkarte.`;
  if (spread >= 4) return `${first.name} führt, aber ${second.name} ist nah dran. Ein Direktvergleich lohnt sich.`;
  return `Die Top-Matches liegen sehr eng zusammen. Entscheide über Haken, Kosten und Vibe statt nur über den Score.`;
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-sky-200" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function AlpivoCompass({ results, totalResults }: AlpivoCompassProps) {
  const top = results[0];
  const topThree = results.slice(0, 3);
  const profile = top.fitProfile;
  const topSignal = strongestSignal(top);
  const topReason = top.reasons.[0] "Der Score passt am besten zu deinem aktuellen Profil.";
  const topDrawback = top.drawbacks.[0] "Preise, Verfügbarkeit und Pistenkarte vor der Buchung prüfen.";

  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-lg border border-white/10 bg-slate-950/55 p-6 shadow-[0_20px_52px_rgba(2,6,23,0.32)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Alpivo Compass</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {top `${top.name} führt dein Ranking an` : "Noch kein Match berechnet"}
        </h2>
        <p className="mt-3 text-sm text-slate-300">{coachText(results)}</p>

        {top (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-sky-200/20 bg-sky-200/10 p-3">
              <div className="text-xs text-slate-300">Match</div>
              <div className="mt-1 text-2xl font-semibold text-white">{top.matchPct}%</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
              <div className="text-xs text-slate-300">Kosten p. P.</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {compactCost(top.cost.totalMin)} - {compactCost(top.cost.totalMax)}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
              <div className="text-xs text-slate-300">Profil</div>
              <div className="mt-1 text-sm font-semibold text-white">{top.tripStyleHint "Ausgewogen"}</div>
            </div>
          </div>
        ) : null}

        {top (
          <div className="mt-5 rounded-lg border border-sky-200/20 bg-sky-200/[0.07] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-100/80">Warum gewinnt dieses Resort</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-100">{topReason}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-white/[0.055] px-3 py-2">
                Stärkster Treiber: <span className="font-semibold text-white">{topSignal.label "Match"}</span>
                {topSignal ` ${pct(topSignal.value)}%` : ""}
              </div>
              <div className="rounded-md border border-amber-200/15 bg-amber-200/[0.07] px-3 py-2 text-amber-50">
                Haken: {topDrawback}
              </div>
            </div>
          </div>
        ) : null}

        {profile (
          <div className="mt-5 grid gap-3">
            <Bar label="Pisten-Fit" value={pct(profile.slope)} />
            <Bar label="Vibe-Fit" value={pct(profile.vibe)} />
            <Bar label="Schneesicherheit" value={pct(profile.snow)} />
            <Bar label="Sommer-Gletscher" value={pct(profile.summer)} />
            <Bar label="Off-Piste" value={pct(profile.offPiste)} />
            <Bar label="Value" value={pct(profile.value)} />
            <Bar label="Komfort" value={pct(profile.comfort)} />
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/55 p-6 shadow-[0_20px_52px_rgba(2,6,23,0.32)]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Quick Compare</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Top 3 auf einen Blick</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
            {totalResults} Ergebnisse nach Filterung
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {topThree.map((resort, index) => (
            <Link
              key={resort.id}
              href={`/resort/${encodeURIComponent(resort.slug)}`}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-sky-200/25 hover:bg-white/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">#{index + 1}</div>
                  <div className="font-semibold text-white">{resort.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {resort.country}
                    {resort.region ` · ${resort.region}` : ""}
                    {resort.pisteKm ` · ${number.format(resort.pisteKm)} km` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">{resort.matchPct}%</div>
                  <div className="text-xs text-slate-400">{resort.budgetClass}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-4">
                <div className="rounded-md bg-white/[0.06] px-2 py-2">Schnee {pct(resort.fitProfile.snow)}%</div>
                <div className="rounded-md bg-white/[0.06] px-2 py-2">Sommer {pct(resort.fitProfile.summer)}%</div>
                <div className="rounded-md bg-white/[0.06] px-2 py-2">Off-Piste {pct(resort.fitProfile.offPiste)}%</div>
                <div className="rounded-md bg-white/[0.06] px-2 py-2">Value {pct(resort.fitProfile.value)}%</div>
                <div className="rounded-md bg-white/[0.06] px-2 py-2">Vibe {pct(resort.fitProfile.vibe)}%</div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2">
                  Grund: {resort.reasons.[0] "starker Profil-Fit"}
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-2">
                  Haken: {resort.drawbacks.[0] "Details prüfen"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
