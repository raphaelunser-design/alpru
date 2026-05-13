import SkiCourseDataBadge from "@/components/ski-courses/SkiCourseDataBadge";
import {
  formatSkiCoursePrice,
  skiCourseSkillLabels,
  skiCourseTargetLabels,
  skiCourseTypeLabels,
  type SkiCourseOffer,
  type SkiSchool,
} from "@/lib/skiCourses";

type SkiCourseComparisonProps = {
  offers: SkiCourseOffer[];
  schools: SkiSchool[];
};

function schoolNameFor(offer: SkiCourseOffer, schools: SkiSchool[]) {
  return schools.find((school) => school.id === offer.skiSchoolId)?.name ?? "Skischule";
}

function yesNo(value: boolean | null | undefined) {
  if (value === true) return "Ja";
  if (value === false) return "Nein";
  return "Offen";
}

export default function SkiCourseComparison({ offers, schools }: SkiCourseComparisonProps) {
  const visible = offers.slice(0, 6);

  if (!visible.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-slate-300">
        Keine Kursangebote passen zu den aktuellen Filtern.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="hidden grid-cols-[1.15fr_0.9fr_0.8fr_0.8fr_0.9fr] gap-3 border-b border-white/10 bg-white/[0.06] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:grid">
        <span>Kurs</span>
        <span>Zielgruppe</span>
        <span>Preis</span>
        <span>Leistungen</span>
        <span>Daten</span>
      </div>
      <div className="divide-y divide-white/10">
        {visible.map((offer) => (
          <div key={offer.id} className="grid gap-3 px-4 py-4 text-sm text-slate-300 md:grid-cols-[1.15fr_0.9fr_0.8fr_0.8fr_0.9fr] md:items-center">
            <div>
              <div className="font-semibold text-white">{skiCourseTypeLabels[offer.courseType]}</div>
              <div className="mt-1 text-xs text-slate-400">{schoolNameFor(offer, schools)}</div>
            </div>
            <div>
              <span className="font-medium text-white">{skiCourseTargetLabels[offer.targetGroup]}</span>
              <div className="mt-1 text-xs text-slate-400">{skiCourseSkillLabels[offer.skillLevel]}</div>
            </div>
            <div className="font-semibold text-white">{formatSkiCoursePrice(offer.priceFrom, offer.currency, offer.priceUnit)}</div>
            <div className="text-xs leading-5 text-slate-300">
              <div>Halbtag: {yesNo(offer.halfDayAvailable)}</div>
              <div>Ganztag: {yesNo(offer.fullDayAvailable)}</div>
              <div>Online: {yesNo(offer.onlineBookingAvailable)}</div>
            </div>
            <div>
              <SkiCourseDataBadge status={offer.dataStatus} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
