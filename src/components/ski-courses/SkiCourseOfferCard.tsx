import SkiCourseDataBadge from "@/components/ski-courses/SkiCourseDataBadge";
import type { ReactNode } from "react";
import {
  formatSkiCourseLastChecked,
  formatSkiCoursePrice,
  safeExternalUrl,
  skiCourseSkillLabels,
  skiCourseTargetLabels,
  skiCourseTypeLabels,
  type SkiCourseOffer,
  type SkiSchool,
} from "@/lib/skiCourses";

type SkiCourseOfferCardProps = {
  offer: SkiCourseOffer;
  school?: SkiSchool | null;
};

function availabilityLabel(value: boolean | null | undefined, positive: string, negative = "nicht gepflegt") {
  if (value === true) return positive;
  if (value === false) return "nicht inklusive";
  return negative;
}

function Flag({ active, children }: { active: boolean | null | undefined; children: ReactNode }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        active ? "border-emerald-200/25 bg-emerald-200/10 text-emerald-50" : "border-white/10 bg-white/[0.055] text-slate-300"
      }`}
    >
      {children}
    </span>
  );
}

export default function SkiCourseOfferCard({ offer, school }: SkiCourseOfferCardProps) {
  const sourceUrl =
    [offer.sourceUrl, school?.bookingUrl, school?.websiteUrl].map(safeExternalUrl).find((url): url is string => Boolean(url)) ?? null;

  return (
    <article className="grid h-full gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {school?.name ?? "Skischule"}
          </div>
          <h3 className="mt-1 break-words text-base font-semibold text-white">{skiCourseTypeLabels[offer.courseType]}</h3>
          <div className="mt-1 text-sm text-slate-300">
            {skiCourseTargetLabels[offer.targetGroup]} · {skiCourseSkillLabels[offer.skillLevel]}
          </div>
        </div>
        <SkiCourseDataBadge status={offer.dataStatus} compact />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-sky-200/20 bg-sky-200/10 p-3">
          <div className="text-xs text-slate-300">Preis ab</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {formatSkiCoursePrice(offer.priceFrom, offer.currency, offer.priceUnit)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/18 p-3">
          <div className="text-xs text-slate-400">Dauer</div>
          <div className="mt-1 text-sm font-semibold text-white">{offer.duration ?? "Dauer offiziell prüfen"}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Flag active={offer.childrenAvailable}>Kinder</Flag>
        <Flag active={offer.adultsAvailable}>Erwachsene</Flag>
        <Flag active={offer.privateAvailable}>Privat</Flag>
        <Flag active={offer.groupAvailable}>Gruppe</Flag>
        <Flag active={offer.snowboardAvailable}>Snowboard</Flag>
        <Flag active={offer.halfDayAvailable}>Halbtags</Flag>
        <Flag active={offer.fullDayAvailable}>Ganztags</Flag>
      </div>

      <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
          Ausrüstung: <span className="font-semibold text-white">{availabilityLabel(offer.equipmentIncluded, "inklusive")}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
          Liftpass: <span className="font-semibold text-white">{availabilityLabel(offer.liftpassIncluded, "inklusive")}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2">
          Mittag: <span className="font-semibold text-white">{availabilityLabel(offer.lunchIncluded, "inklusive")}</span>
        </div>
      </div>

      {offer.meetingPoint ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm text-slate-300">
          <span className="font-semibold text-white">Treffpunkt:</span> {offer.meetingPoint}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-400">
        <span>Geprüft: {formatSkiCourseLastChecked(offer.lastCheckedAt)}</span>
        {sourceUrl ? (
          <a className="rounded-lg border border-white/12 px-3 py-2 font-semibold text-white hover:bg-white/10" href={sourceUrl} target="_blank" rel="noopener noreferrer">
            Offiziell prüfen
          </a>
        ) : (
          <span>Kein offizieller Link hinterlegt</span>
        )}
      </div>
    </article>
  );
}
