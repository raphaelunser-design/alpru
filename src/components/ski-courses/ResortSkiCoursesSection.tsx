"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataFreshnessNote } from "@/components/DataStatusBadge";
import GlassCard from "@/components/GlassCard";
import SkiCourseComparison from "@/components/ski-courses/SkiCourseComparison";
import SkiCourseDataBadge from "@/components/ski-courses/SkiCourseDataBadge";
import SkiCourseFilters from "@/components/ski-courses/SkiCourseFilters";
import SkiCourseOfferCard from "@/components/ski-courses/SkiCourseOfferCard";
import SkiSchoolCard from "@/components/ski-courses/SkiSchoolCard";
import {
  SKI_COURSE_DATA_NOTE,
  calculateSkiCourseFitScore,
  filterSkiCourseOffers,
  formatSkiCoursePrice,
  safeExternalUrl,
  summarizeSkiCourseBundle,
  type SkiCourseBundle,
  type SkiCourseFilters as SkiCourseFiltersType,
} from "@/lib/skiCourses";

type ResortSkiCoursesSectionProps = {
  resortName: string;
  bundle: SkiCourseBundle | null;
  loading?: boolean;
  hint?: string;
  officialUrl?: string | null;
  beginnerScore?: number | null;
  familyScore?: number | null;
};

const emptyFilters: SkiCourseFiltersType = {
  targetGroup: "all",
  skillLevel: "all",
  courseType: "all",
  onlyOnlineBooking: false,
  maxPriceFrom: null,
};

export default function ResortSkiCoursesSection({
  resortName,
  bundle,
  loading = false,
  hint,
  officialUrl,
  beginnerScore,
  familyScore,
}: ResortSkiCoursesSectionProps) {
  const [filters, setFilters] = useState<SkiCourseFiltersType>(emptyFilters);
  const summary = useMemo(() => (bundle ? summarizeSkiCourseBundle(bundle) : null), [bundle]);
  const filteredOffers = useMemo(() => (bundle ? filterSkiCourseOffers(bundle.offers, filters) : []), [bundle, filters]);
  const officialResortUrl = useMemo(() => safeExternalUrl(officialUrl), [officialUrl]);
  const schoolOffers = useMemo(() => {
    if (!bundle) return new Map<string, typeof filteredOffers>();
    return new Map(bundle.schools.map((school) => [school.id, bundle.offers.filter((offer) => offer.skiSchoolId === school.id)]));
  }, [bundle]);
  const fit = useMemo(
    () =>
      bundle
        ? calculateSkiCourseFitScore(bundle, {
            need: "unsure",
            beginnerFriendlyScore: beginnerScore ?? null,
            familyFriendlyScore: familyScore ?? null,
          })
        : null,
    [beginnerScore, bundle, familyScore]
  );

  if (loading) {
    return (
      <GlassCard id="skikurse" className="scroll-mt-24 p-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.055]" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const hasData = Boolean(bundle && summary && summary.offerCount > 0);
  const activeSummary = summary!;

  return (
    <GlassCard id="skikurse" className="scroll-mt-24 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Skischulen & Kurse</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Skikurse in diesem Gebiet</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Vergleiche Kinderkurse, Erwachsenenkurse, Privatunterricht und Snowboardkurse. Preise und Verfügbarkeiten bitte vor Buchung offiziell prüfen.
          </p>
        </div>
        {summary ? <SkiCourseDataBadge status={summary.dataStatus} /> : null}
      </div>

      {!hasData ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-5">
          <h3 className="text-base font-semibold text-white">Für dieses Gebiet sind Skikursdaten noch nicht kuratiert.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Alpivo zeigt hier später Skischulen, Kursarten, Preisbereiche und offizielle Prüflinks für {resortName}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100" href="/feedback">
              Skikursdaten vorschlagen
            </Link>
            <Link className="rounded-lg border border-white/12 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href="/feedback">
              Feedback geben
            </Link>
            {officialResortUrl ? (
              <a className="rounded-lg border border-white/12 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href={officialResortUrl} target="_blank" rel="noopener noreferrer">
                Offizielle Resortseite
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="text-xs text-slate-400">Skischulen</div>
              <div className="mt-1 text-2xl font-semibold text-white">{activeSummary.schoolCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="text-xs text-slate-400">Kursangebote</div>
              <div className="mt-1 text-2xl font-semibold text-white">{activeSummary.offerCount}</div>
            </div>
            <div className="rounded-2xl border border-sky-200/20 bg-sky-200/10 p-4">
              <div className="text-xs text-slate-300">Preis ab</div>
              <div className="mt-1 text-lg font-semibold text-white">{formatSkiCoursePrice(activeSummary.priceFrom, activeSummary.currency ?? "EUR")}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="text-xs text-slate-400">Fit-Hinweis</div>
              <div className="mt-1 text-lg font-semibold text-white">{fit?.score ?? "-"}%</div>
              <div className="mt-1 text-xs text-slate-400">{fit?.label ?? "Noch offen"}</div>
            </div>
          </div>

          {bundle?.hint || hint ? <div className="mt-3 text-xs text-slate-400">{bundle?.hint ?? hint}</div> : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {bundle!.schools.map((school) => (
              <SkiSchoolCard key={school.id} school={school} offers={schoolOffers.get(school.id) ?? []} />
            ))}
          </div>

          <div className="mt-6">
            <SkiCourseFilters filters={filters} resultCount={filteredOffers.length} onChange={setFilters} />
          </div>

          <div className="mt-5">
            <SkiCourseComparison offers={filteredOffers} schools={bundle!.schools} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredOffers.slice(0, 4).map((offer) => (
              <SkiCourseOfferCard key={offer.id} offer={offer} school={bundle!.schools.find((school) => school.id === offer.skiSchoolId)} />
            ))}
          </div>
        </>
      )}

      <DataFreshnessNote className="mt-5">{SKI_COURSE_DATA_NOTE}</DataFreshnessNote>
    </GlassCard>
  );
}
