import Image from "next/image";
import Link from "next/link";
import MetricChip, { MetricIcon, type MetricIconName } from "@/components/premium/MetricChip";
import ScoreRing from "@/components/ScoreRing";
import type { PremiumMatch } from "@/data/resorts";

type ResortMatchCardProps = {
  match: PremiumMatch;
  variant?: "hero" | "featured" | "compact" | "grid";
  priority?: boolean;
  className?: string;
};

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompactMetric({ icon, value, label }: { icon: MetricIconName; value: string; label: string }) {
  return (
    <div className="flex min-h-14 min-w-0 items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.075] px-3 py-2 text-white">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-400/14 text-sky-200">
        <MetricIcon name={icon} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold leading-tight">{value}</span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/62">{label}</span>
      </span>
    </div>
  );
}

export default function ResortMatchCard({ match, variant = "grid", priority = false, className = "" }: ResortMatchCardProps) {
  const isHero = variant === "hero";
  const isFeatured = variant === "featured" || isHero;
  const isCondensed = variant === "compact" || variant === "grid";
  const imageHeight = isHero ? "h-[290px] md:h-[320px]" : isFeatured ? "h-[320px]" : "h-48";

  return (
    <article
      className={`group overflow-hidden rounded-[1.7rem] border ${
        isHero ? "border-white/24 bg-slate-950/82 text-white" : "border-white/12 bg-slate-950/74 text-white"
      } shadow-[0_34px_100px_rgba(2,6,23,0.42)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-sky-200/40 ${className}`}
    >
      <div className={`relative overflow-hidden ${imageHeight}`}>
        <Image
          src={match.image}
          alt={`${match.name} Resort-Panorama`}
          fill
          priority={priority}
          sizes={isFeatured ? "(min-width: 1024px) 680px, 94vw" : "(min-width: 1024px) 420px, 94vw"}
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
          style={{ objectPosition: "center 48%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/6 via-slate-950/22 to-slate-950/82" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-black ${match.rank === 1 ? "bg-emerald-300 text-emerald-950" : match.rank === 3 ? "bg-amber-300 text-amber-950" : "bg-sky-500 text-white"}`}>
            #{match.rank}
          </span>
          {match.rank === 1 ? (
            <span className="rounded-full border border-emerald-200/30 bg-emerald-300/24 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-50 backdrop-blur">
              Top Match
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-5 left-5 right-28">
          <h3 className={isFeatured ? "text-4xl font-black leading-none text-white" : "text-2xl font-black leading-none text-white"}>{match.name}</h3>
          <p className="mt-2 text-sm font-semibold text-white/86">{match.region}, {match.country}</p>
        </div>
        <div className="absolute bottom-4 right-4">
          <ScoreRing value={match.score} size={isHero ? "md" : "sm"} label="Match" />
        </div>
      </div>

      <div className={`grid gap-2 border-b border-white/10 p-4 ${isCondensed ? "grid-cols-2" : "sm:grid-cols-4"}`}>
        {isCondensed ? (
          <>
            <CompactMetric icon="cost" value={match.cost} label="p. P." />
            <CompactMetric icon="time" value={match.drive} label="ab München" />
            <CompactMetric icon="snow" value={match.snow} label="Schnee" />
            <CompactMetric icon="vibe" value={match.vibe} label="Vibe" />
          </>
        ) : (
          <>
            <MetricChip icon="cost" value={match.cost} label="pro Person" variant="glass" />
            <MetricChip icon="time" value={match.drive} label="ab München" variant="glass" />
            <MetricChip icon="snow" value="Schnee" label={match.snow} variant="glass" />
            <MetricChip icon="vibe" value="Vibe" label={match.vibe} variant="glass" />
          </>
        )}
      </div>

      <div className={`grid gap-5 p-5 ${isFeatured ? "md:grid-cols-[1fr_0.8fr]" : ""}`}>
        <div>
          <h4 className="text-sm font-extrabold text-white">3 Gründe, warum es passt</h4>
          <ul className="mt-3 space-y-2">
            {match.reasons.slice(0, isFeatured ? 3 : 2).map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm leading-6 text-slate-200">
                <span className="mt-1 text-emerald-300"><CheckIcon /></span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200/22 bg-amber-300/[0.08] p-4">
          <h4 className="text-sm font-extrabold text-amber-100">Ein möglicher Nachteil</h4>
          <p className="mt-2 text-sm leading-6 text-amber-50/86">{match.drawback}</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <Link
          href={`/resort/${encodeURIComponent(match.slug)}`}
          className="button-lift inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
        >
          Details ansehen
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}
