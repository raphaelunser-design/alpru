"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

const trustPoints = ["Unabhängig & objektiv", "Aktuelle Daten & echte Bewertungen", "Sicher & transparent"];

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomeCTA() {
  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-950 px-4 py-12 text-white md:px-6 md:py-16">
      <Reveal>
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[1.65rem] border border-white/18 bg-slate-950 shadow-[0_34px_100px_rgba(2,6,23,0.36)] lg:grid-cols-[0.58fr_1fr_0.72fr]">
          <div className="relative min-h-56 overflow-hidden lg:min-h-full">
            <Image src="/bg/site-hero.jpg" alt="Alpiner Ski-Trip CTA Hintergrund" fill sizes="(min-width: 1024px) 380px, 92vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/6 to-slate-950/58" />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            <h2 className="text-3xl font-extrabold tracking-[-0.01em] text-white md:text-4xl">
              Bereit für euren perfekten Ski-Trip?
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-slate-300">
              Startet jetzt euren Match – in weniger als 3 Minuten.
            </p>
            <Link
              href="/quiz"
              className="button-lift mt-6 inline-flex min-h-14 w-fit items-center gap-3 rounded-xl bg-sky-500 px-7 text-base font-extrabold text-white shadow-[0_22px_54px_rgba(14,165,233,0.28)] hover:bg-sky-400"
            >
              Match starten
              <ArrowIcon />
            </Link>
          </div>
          <div className="flex flex-col justify-center gap-4 border-t border-white/10 p-6 md:p-8 lg:border-l lg:border-t-0">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm font-semibold text-slate-100">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/18 text-sky-200">
                  <CheckIcon />
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
