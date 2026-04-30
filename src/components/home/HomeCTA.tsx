"use client";

import Link from "next/link";
import { useClientLocale } from "@/lib/clientLocale";
import { homeCopy } from "./homeCopy";

export default function HomeCTA() {
  const locale = useClientLocale();
  const copy = homeCopy[locale].cta;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 md:px-6 md:pb-20">
      <div className="rounded-[1.75rem] border border-white/14 bg-[linear-gradient(135deg,rgba(186,230,253,0.16),rgba(15,23,42,0.72))] p-6 shadow-[0_28px_90px_rgba(2,6,23,0.32)] md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">{copy.kicker}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{copy.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {copy.text}
            </p>
          </div>
          <Link
            href="/quiz"
            className="button-lift inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-sky-200 px-7 text-base font-semibold text-slate-950 hover:bg-white"
          >
            {copy.button}
          </Link>
        </div>
      </div>
    </section>
  );
}
