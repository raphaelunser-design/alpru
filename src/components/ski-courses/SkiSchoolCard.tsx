import SkiCourseDataBadge from "@/components/ski-courses/SkiCourseDataBadge";
import {
  formatSkiCourseLastChecked,
  formatSkiCoursePrice,
  safeExternalUrl,
  skiCourseTargetLabels,
  skiCourseTypeLabels,
  summarizeSkiCourseBundle,
  type SkiCourseOffer,
  type SkiSchool,
} from "@/lib/skiCourses";

type SkiSchoolCardProps = {
  school: SkiSchool;
  offers: SkiCourseOffer[];
};

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

export default function SkiSchoolCard({ school, offers }: SkiSchoolCardProps) {
  const summary = summarizeSkiCourseBundle({ schools: [school], offers });
  const courseTypes = uniqueLabels(offers.map((offer) => skiCourseTypeLabels[offer.courseType]));
  const targetGroups = uniqueLabels(offers.map((offer) => skiCourseTargetLabels[offer.targetGroup]));
  const primaryUrl = [school.websiteUrl, school.bookingUrl].map(safeExternalUrl).find((url): url is string => Boolean(url)) ?? null;
  const officialUrl =
    [school.sourceUrl, school.bookingUrl, school.websiteUrl].map(safeExternalUrl).find((url): url is string => Boolean(url)) ?? null;

  return (
    <article className="grid h-full gap-4 rounded-2xl border border-white/10 bg-slate-950/26 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-white">{school.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{[school.region, school.country].filter(Boolean).join(", ") || "Region offen"}</p>
        </div>
        <SkiCourseDataBadge status={school.dataStatus} compact />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
          <div className="text-xs text-slate-400">Kursarten</div>
          <div className="mt-1 text-sm font-semibold text-white">{courseTypes.slice(0, 3).join(", ") || "Noch offen"}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
          <div className="text-xs text-slate-400">Zielgruppen</div>
          <div className="mt-1 text-sm font-semibold text-white">{targetGroups.slice(0, 3).join(", ") || "Noch offen"}</div>
        </div>
        <div className="rounded-xl border border-sky-200/20 bg-sky-200/10 p-3">
          <div className="text-xs text-slate-300">Preis ab</div>
          <div className="mt-1 text-sm font-semibold text-white">{formatSkiCoursePrice(summary.priceFrom, summary.currency ?? "EUR")}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-slate-200">
          Online buchbar: {summary.onlineBookingAvailable ? "ja" : "offiziell prüfen"}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 text-slate-200">
          Geprüft: {formatSkiCourseLastChecked(school.lastCheckedAt)}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {primaryUrl ? (
          <a className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100" href={primaryUrl} target="_blank" rel="noopener noreferrer">
            Zur Skischule
          </a>
        ) : null}
        {officialUrl ? (
          <a className="rounded-lg border border-white/12 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={officialUrl} target="_blank" rel="noopener noreferrer">
            Offiziell prüfen
          </a>
        ) : null}
        {!primaryUrl && !officialUrl ? <span className="text-sm text-slate-400">Kein offizieller Link hinterlegt.</span> : null}
      </div>
    </article>
  );
}
