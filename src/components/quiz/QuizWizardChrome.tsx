"use client";

import GlassCard from "@/components/GlassCard";
import MetricChip from "@/components/premium/MetricChip";
import { skiCourseNeedOptions, type SkiCourseNeed } from "@/lib/skiCourses";
import { wizardSteps } from "@/lib/quizOptions";

type WizardStep = (typeof wizardSteps)[number];

type SummaryPrefs = {
  budgetMin: number;
  budgetMax: number;
  peopleCount: number;
  skiCourseNeed: SkiCourseNeed;
};

type ActionProps = {
  isFinalStep: boolean;
  submitting: boolean;
  onPrimaryAction: () => void | Promise<void>;
};

function primaryActionLabel(isFinalStep: boolean, submitting: boolean) {
  if (!isFinalStep) return "Weiter";
  return submitting ? "Match wird berechnet..." : "Ergebnisse anzeigen";
}

export function QuizMetricSummary({
  activeProfileLabel,
  budgetMin,
  budgetMax,
  rangeDays,
  rangeSummary,
  priorityCount,
}: {
  activeProfileLabel: string;
  budgetMin: number;
  budgetMax: number;
  rangeDays: number | null;
  rangeSummary: string;
  priorityCount: number;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <MetricChip icon="vibe" value={activeProfileLabel} label="Profil" variant="glass" />
      <MetricChip icon="cost" value={`€ ${budgetMin} - € ${budgetMax}`} label="Budget p. P." variant="glass" />
      <MetricChip icon="time" value={rangeSummary} label={rangeDays ? `${rangeDays} Tage` : "Zeitraum"} variant="glass" />
      <MetricChip icon="data" value={`${priorityCount}`} label="Top-Prioritäten gewählt" variant="glass" />
    </section>
  );
}

export function QuizWizardProgress({ activeStep, onStepChange }: { activeStep: number; onStepChange: (step: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[1.35rem] border border-white/18 bg-white p-2 text-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.12)] sm:grid-cols-4">
      {wizardSteps.map((step, index) => {
        const active = index === activeStep;
        const completed = index < activeStep;
        return (
          <button
            key={step.label}
            type="button"
            className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
              active
                ? "bg-sky-50 text-sky-800"
                : completed
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
            onClick={() => onStepChange(index)}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                active ? "bg-sky-600 text-white" : completed ? "bg-emerald-500 text-white" : "bg-white text-slate-500"
              }`}
            >
              {index + 1}
            </span>
            <span className="truncate text-sm font-extrabold">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function QuizFooterActions({
  activeStep,
  currentWizardStep,
  isFinalStep,
  submitting,
  submitError,
  onPrevious,
  onPrimaryAction,
}: ActionProps & {
  activeStep: number;
  currentWizardStep: WizardStep;
  submitError: string;
  onPrevious: () => void;
}) {
  return (
    <GlassCard className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-sm font-semibold text-white">{currentWizardStep.title}</div>
        <div className="mt-1 text-xs text-slate-400">{currentWizardStep.text}</div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {activeStep > 0 ? (
          <button
            className="rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            type="button"
            onClick={onPrevious}
          >
            Zurück
          </button>
        ) : null}
        <button
          className="button-lift rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:cursor-wait disabled:opacity-70"
          disabled={isFinalStep && submitting}
          type="button"
          onClick={onPrimaryAction}
        >
          {primaryActionLabel(isFinalStep, submitting)}
        </button>
      </div>
      {submitError ? <div className="text-sm leading-6 text-amber-100 md:max-w-sm">{submitError}</div> : null}
    </GlassCard>
  );
}

export function QuizSidebarSummary({
  activeProfileLabel,
  isFinalStep,
  prefs,
  rangeSummary,
  submitting,
  submitError,
  topPriorities,
  onPrimaryAction,
}: ActionProps & {
  activeProfileLabel: string;
  prefs: SummaryPrefs;
  rangeSummary: string;
  submitError: string;
  topPriorities: string[];
}) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-28 space-y-4">
        <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.13)]">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-700">Eure Auswahl (Live)</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-950">{activeProfileLabel}</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Zeitraum</span>
              <span className="text-right font-extrabold text-slate-950">{rangeSummary}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Abfahrt</span>
              <span className="font-extrabold text-slate-950">München</span>
            </div>
            <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Budget</span>
              <span className="font-extrabold text-slate-950">€ {prefs.budgetMin} - € {prefs.budgetMax}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Gruppe</span>
              <span className="font-extrabold text-slate-950">{prefs.peopleCount} Personen</span>
            </div>
            <div className="flex justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Skikurs</span>
              <span className="text-right font-extrabold text-slate-950">
                {skiCourseNeedOptions.find((option) => option.value === prefs.skiCourseNeed)?.label ?? "Nein"}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-500">Prioritäten Top 3</span>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs font-bold text-slate-900">
                {topPriorities.map((priority) => (
                  <li key={priority}>{priority}</li>
                ))}
              </ol>
            </div>
          </div>
          <button
            className="button-lift mt-4 w-full rounded-xl bg-sky-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70"
            disabled={isFinalStep && submitting}
            onClick={onPrimaryAction}
            type="button"
          >
            {primaryActionLabel(isFinalStep, submitting)}
          </button>
          {submitError ? <div className="mt-3 text-sm leading-6 text-amber-100">{submitError}</div> : null}
        </div>
      </div>
    </aside>
  );
}

export function MobileQuizSummaryBar({
  activeProfileLabel,
  isFinalStep,
  mobileSummaryOpen,
  prefs,
  rangeSummary,
  submitting,
  submitError,
  topPriorities,
  onPrimaryAction,
  onToggle,
}: ActionProps & {
  activeProfileLabel: string;
  mobileSummaryOpen: boolean;
  prefs: Pick<SummaryPrefs, "budgetMin" | "budgetMax" | "peopleCount">;
  rangeSummary: string;
  submitError: string;
  topPriorities: string[];
  onToggle: () => void;
}) {
  return (
    <div className="sticky bottom-24 z-30 rounded-2xl border border-sky-200/25 bg-slate-950/90 p-3 shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{activeProfileLabel}</div>
          <div className="mt-0.5 truncate text-xs text-slate-400">
            {prefs.peopleCount} Personen · {prefs.budgetMin}-{prefs.budgetMax} EUR · {rangeSummary}
          </div>
        </div>
        <button
          className="min-h-11 shrink-0 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white hover:bg-white/10"
          type="button"
          onClick={onToggle}
          aria-expanded={mobileSummaryOpen}
        >
          {mobileSummaryOpen ? "Weniger" : "Details"}
        </button>
        <button
          className="min-h-11 shrink-0 rounded-xl bg-sky-200 px-4 text-sm font-semibold text-slate-950 disabled:opacity-70"
          disabled={isFinalStep && submitting}
          onClick={onPrimaryAction}
          type="button"
        >
          {isFinalStep ? (submitting ? "..." : "Match") : "Weiter"}
        </button>
      </div>
      {mobileSummaryOpen ? (
        <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-xs text-slate-300">
          <div className="flex justify-between gap-3">
            <span>Profil</span>
            <span className="text-right font-semibold text-white">{activeProfileLabel}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Budget</span>
            <span className="text-right font-semibold text-white">€ {prefs.budgetMin} - € {prefs.budgetMax}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Prioritäten</span>
            <span className="text-right font-semibold text-white">{topPriorities.join(", ")}</span>
          </div>
        </div>
      ) : null}
      {submitError ? <div className="mt-2 text-xs leading-5 text-amber-100">{submitError}</div> : null}
    </div>
  );
}
