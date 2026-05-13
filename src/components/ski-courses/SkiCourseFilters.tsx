"use client";

import type { SkiCourseFilters } from "@/lib/skiCourses";

type SkiCourseFiltersProps = {
  filters: SkiCourseFilters;
  resultCount: number;
  onChange: (filters: SkiCourseFilters) => void;
};

const targetOptions = [
  { value: "all", label: "Alle" },
  { value: "children", label: "Kinder" },
  { value: "adults", label: "Erwachsene" },
  { value: "families", label: "Familien" },
  { value: "mixed", label: "Gemischt" },
] as const;

const levelOptions = [
  { value: "all", label: "Alle Level" },
  { value: "first_timer", label: "Erster Skitag" },
  { value: "beginner", label: "Anfänger" },
  { value: "intermediate", label: "Fortgeschritten" },
  { value: "advanced", label: "Sportlich" },
] as const;

const courseOptions = [
  { value: "all", label: "Alle Kurse" },
  { value: "group", label: "Gruppe" },
  { value: "private", label: "Privat" },
  { value: "snowboard", label: "Snowboard" },
] as const;

export default function SkiCourseFilters({ filters, resultCount, onChange }: SkiCourseFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/28 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Skikursfilter</div>
          <div className="mt-1 text-sm text-slate-300">{resultCount} passende Angebote</div>
        </div>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-slate-200">
          <input
            type="checkbox"
            className="h-4 w-4 accent-sky-200"
            checked={Boolean(filters.onlyOnlineBooking)}
            onChange={(event) => onChange({ ...filters, onlyOnlineBooking: event.target.checked })}
          />
          Online buchbar
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-2 text-xs font-medium text-slate-400">
          Zielgruppe
          <select
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-sky-200/45 focus:ring-4 focus:ring-sky-200/10"
            value={filters.targetGroup ?? "all"}
            onChange={(event) => onChange({ ...filters, targetGroup: event.target.value as SkiCourseFilters["targetGroup"] })}
          >
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-xs font-medium text-slate-400">
          Level
          <select
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-sky-200/45 focus:ring-4 focus:ring-sky-200/10"
            value={filters.skillLevel ?? "all"}
            onChange={(event) => onChange({ ...filters, skillLevel: event.target.value as SkiCourseFilters["skillLevel"] })}
          >
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-xs font-medium text-slate-400">
          Kurstyp
          <select
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-sky-200/45 focus:ring-4 focus:ring-sky-200/10"
            value={filters.courseType ?? "all"}
            onChange={(event) => onChange({ ...filters, courseType: event.target.value as SkiCourseFilters["courseType"] })}
          >
            {courseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-xs font-medium text-slate-400">
          Max. Preis ab
          <input
            className="min-h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/45 focus:ring-4 focus:ring-sky-200/10"
            type="number"
            min={0}
            placeholder="z. B. 120"
            value={filters.maxPriceFrom ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                maxPriceFrom: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
