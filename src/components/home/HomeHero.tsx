"use client";

import Image from "next/image";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import { useClientLocale } from "@/lib/clientLocale";
import { homeCopy } from "./homeCopy";

function SearchMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m20 20-4.4-4.4m1.7-4.5a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 0 1 12.4 0Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function AlertIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8v5m0 4h.01M10.4 4.8 3.2 17.2A2 2 0 0 0 5 20h14a2 2 0 0 0 1.8-2.8L13.6 4.8a1.8 1.8 0 0 0-3.2 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomeHero() {
  const locale = useClientLocale();
  const copy = homeCopy[locale].hero;
  const example = homeCopy[locale].example;

  return (
    <section className="relative left-1/2 right-1/2 -mt-4 -ml-[50vw] -mr-[50vw] min-h-[calc(100vh-5.5rem)] w-screen overflow-hidden md:-mt-6 md:min-h-[720px]">
      <Image
        src="/bg/banner-bild-4k.png"
        alt="Verschneite Alpenlandschaft bei Sonnenuntergang"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "center 42%" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.34)_0%,rgba(2,6,23,0.48)_42%,rgba(2,6,23,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.86)_0%,rgba(15,23,42,0.54)_46%,rgba(15,23,42,0.18)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#07101e] to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 md:min-h-[720px] md:px-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="max-w-3xl py-6">
          <p className="text-sm font-semibold text-sky-100">{copy.kicker}</p>
          <h1 className="mt-4 max-w-[13ch] text-4xl font-semibold leading-[1.02] text-white drop-shadow-[0_12px_34px_rgba(2,6,23,0.55)] sm:max-w-[14ch] sm:text-5xl md:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-[21rem] break-words text-base leading-7 text-slate-100/88 sm:max-w-2xl md:text-xl md:leading-8">
            {copy.subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quiz"
              className="button-lift inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-sky-200 px-8 text-base font-bold text-slate-950 shadow-[0_22px_54px_rgba(125,211,252,0.34)] hover:bg-white sm:w-auto"
            >
              <SearchMark />
              {copy.primary}
            </Link>
            <a
              href="#so-funktionierts"
              className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16 sm:min-h-14 sm:px-6 sm:text-base"
            >
              {copy.secondary}
              <DownArrow />
            </a>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 text-sm text-slate-200/88 sm:grid-cols-3">
            {copy.stats.map(([label, text]) => (
              <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.08] p-4 shadow-[0_16px_52px_rgba(2,6,23,0.2)] backdrop-blur-xl">
                <div className="text-lg font-bold text-white">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <article className="relative overflow-hidden rounded-[1.75rem] border border-white/16 bg-white/[0.11] p-5 shadow-[0_32px_100px_rgba(2,6,23,0.42)] backdrop-blur-2xl md:p-6">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_18%_0%,rgba(125,211,252,0.30),transparent_42%)]" />
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">{example.label}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{example.resort}</h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-300">{example.subtitle}</p>
            </div>
            <ScoreRing value={87} size="sm" label="Score" />
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Kosten p. P.", "830 EUR", "Skipass, Unterkunft, Anreise"],
              ["Fahrzeit", "3 h 20", "ab München"],
              ["Schnee/Wetter", "stabil", "kalt, gute Höhenlage"],
              ["Vibe & Events", "hoch", "Hütten, Crew, Après"],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/34 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
            <h3 className="text-sm font-semibold text-white">{example.reasonsTitle}</h3>
            <ul className="mt-3 space-y-2.5">
              {example.reasons.slice(0, 3).map((reason) => (
                <li key={reason} className="flex items-start gap-2.5 text-sm leading-6 text-slate-200">
                  <span className="mt-1 text-sky-100">
                    <CheckIcon />
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-4 flex items-start gap-3 rounded-2xl border border-amber-200/20 bg-amber-200/12 p-4">
            <span className="mt-0.5 text-amber-100">
              <AlertIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-amber-100">{example.warningTitle}</div>
              <p className="mt-1 text-sm leading-6 text-slate-200">{example.warning}</p>
            </div>
          </div>

          <Link
            href="/quiz"
            className="relative mt-5 inline-flex min-h-11 items-center rounded-xl bg-sky-200 px-5 text-sm font-semibold text-slate-950 hover:bg-white"
          >
            {copy.primary}
          </Link>
        </article>
      </div>
    </section>
  );
}
