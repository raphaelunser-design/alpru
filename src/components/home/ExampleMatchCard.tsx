"use client";

import { useClientLocale } from "@/lib/clientLocale";
import { homeCopy } from "./homeCopy";

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExampleMatchCard() {
  const locale = useClientLocale();
  const copy = homeCopy[locale].example;
  const previews = [
    ["#1", "Saalbach-Hinterglemm", "87", "830 EUR", "3 h 20", "Après + Pisten"],
    ["#2", "Serfaus-Fiss-Ladis", "82", "760 EUR", "3 h 45", "Family + Komfort"],
    ["#3", "Obertauern", "79", "710 EUR", "3 h 10", "Schnee + Weekend"],
  ];

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">{copy.kicker}</p>
        <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          {copy.intro}
        </p>
      </div>

      <article className="overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/[0.075] shadow-[0_28px_90px_rgba(2,6,23,0.34)] backdrop-blur-2xl">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(125,211,252,0.20),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.88),rgba(2,6,23,0.70))] p-6 md:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{copy.label}</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{copy.resort}</h3>
              <p className="mt-1 text-sm text-slate-300">{copy.subtitle}</p>
            </div>
            <div className="w-fit rounded-2xl border border-sky-200/24 bg-sky-200/12 px-4 py-3 text-center">
              <div className="text-3xl font-semibold text-white">87</div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">{copy.scoreLabel}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 md:p-7">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.reasonsTitle}</h4>
            <div className="mt-4 grid gap-3">
              {copy.reasons.map((reason) => (
                <div key={reason} className="flex items-center gap-3 text-sm font-medium text-slate-100">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-200/14 text-sky-100">
                    <CheckIcon />
                  </span>
                  {reason}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200/18 bg-amber-200/10 p-4">
              <div className="text-sm font-semibold text-amber-100">{copy.warningTitle}</div>
              <p className="mt-1 text-sm leading-6 text-slate-200">{copy.warning}</p>
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/28 p-6 md:border-l md:border-t-0 md:p-7">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.costsTitle}</h4>
            <div className="mt-4 space-y-3">
              {copy.costs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.045] px-4 py-3">
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-sky-200 px-4 py-4 text-slate-950">
              <span className="text-sm font-semibold">{copy.total}</span>
              <span className="text-2xl font-semibold">830 €</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              {copy.note}
            </p>
          </div>
        </div>
      </article>

      <div className="grid gap-3 lg:col-span-2 md:grid-cols-3">
        {previews.map(([rank, resort, score, cost, drive, vibe]) => (
          <article key={rank} className="surface-lift rounded-2xl p-4 transition hover:-translate-y-1 hover:border-sky-200/28">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{rank} Top-Resort</div>
                <h3 className="mt-2 text-lg font-semibold text-white">{resort}</h3>
              </div>
              <div className="rounded-2xl border border-sky-200/25 bg-sky-200/10 px-3 py-2 text-center">
                <div className="text-2xl font-semibold text-white">{score}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-sky-100">Score</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3 text-slate-300">
                <span className="block text-slate-500">Kosten p. P.</span>
                <strong className="mt-1 block text-white">{cost}</strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3 text-slate-300">
                <span className="block text-slate-500">Fahrzeit</span>
                <strong className="mt-1 block text-white">{drive}</strong>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-emerald-200/20 bg-emerald-200/10 px-3 py-2 text-xs font-semibold text-emerald-50">
              {vibe}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
