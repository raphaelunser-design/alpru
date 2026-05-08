"use client";

import { useClientLocale } from "@/lib/clientLocale";
import { homeCopy } from "./homeCopy";

function SlidersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h10m4 0h2M4 17h3m4 0h9M14 5v4M7 15v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 18 5.2-8 3.4 5.1L16 10l4 8H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 21h14M6 6h12M9 3l-3 3 3 3M15 3l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 6H5.5A2.5 2.5 0 0 0 8 11M16 6h2.5A2.5 2.5 0 0 1 16 11M12 13v4M9 20h6M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const stepIcons = [SlidersIcon, CompareIcon, TrophyIcon];

export default function HowItWorks() {
  const locale = useClientLocale();
  const copy = homeCopy[locale].how;

  return (
    <section id="so-funktionierts" className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">{copy.kicker}</p>
        <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          {copy.intro}
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {copy.steps.map(([number, title, text], index) => {
          const StepIcon = stepIcons[index] ?? TrophyIcon;
          return (
            <article key={number} className="relative rounded-2xl border border-white/12 bg-slate-950/42 p-6 shadow-[0_18px_54px_rgba(2,6,23,0.22)] transition hover:-translate-y-1 hover:border-sky-200/25">
              <div className="flex items-start justify-between gap-4">
                <div className="text-3xl font-semibold leading-none text-sky-100/85">{number}</div>
                <div className="pointer-events-none text-sky-100/70">
                  <StepIcon />
                </div>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/12 bg-white/[0.055] p-4 shadow-[0_18px_54px_rgba(2,6,23,0.22)] md:p-5">
        <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">Score-Logik</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">Aus Signalen wird ein erklärbarer Match.</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {["Budget", "Anreise", "Wetter", "Vibe"].map((signal, index) => (
              <div key={signal} className="rounded-2xl border border-white/10 bg-slate-950/38 p-3">
                <div className="text-xs text-slate-400">{signal}</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-sky-200" style={{ width: `${[78, 66, 84, 72][index]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
