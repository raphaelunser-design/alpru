"use client";

import { useClientLocale } from "@/lib/clientLocale";
import { homeCopy } from "./homeCopy";

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

      <div className="mt-9 grid gap-4 lg:grid-cols-3">
        {copy.steps.map(([number, title, text]) => (
          <article key={number} className="relative rounded-2xl border border-white/12 bg-slate-950/46 p-6 shadow-[0_18px_54px_rgba(2,6,23,0.24)]">
            <div className="text-sm font-semibold text-sky-200">{number}</div>
            <h3 className="mt-10 text-xl font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
            <div className="pointer-events-none absolute right-5 top-5 h-14 w-14 rounded-full border border-white/10 bg-white/[0.04]" />
          </article>
        ))}
      </div>
    </section>
  );
}
