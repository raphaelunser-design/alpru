"use client";

import Image from "next/image";
import Link from "next/link";
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

export default function HomeHero() {
  const locale = useClientLocale();
  const copy = homeCopy[locale].hero;

  return (
    <section className="relative left-1/2 right-1/2 -mt-4 -ml-[50vw] -mr-[50vw] min-h-[calc(100vh-5.5rem)] w-screen overflow-hidden md:-mt-6 md:min-h-[700px]">
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

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl items-center px-4 py-12 md:min-h-[700px] md:px-6">
        <div className="max-w-3xl py-6">
          <div className="inline-flex rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/82 shadow-[0_12px_40px_rgba(2,6,23,0.24)] backdrop-blur-xl">
            {copy.badge}
          </div>

          <p className="mt-8 text-sm font-semibold text-sky-100">{copy.kicker}</p>
          <h1 className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.95] text-white drop-shadow-[0_12px_34px_rgba(2,6,23,0.55)] sm:max-w-[12ch] sm:text-6xl md:text-7xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100/88 md:text-lg">
            {copy.subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quiz"
              className="button-lift inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sky-200 px-7 text-base font-semibold text-slate-950 shadow-[0_18px_44px_rgba(125,211,252,0.28)] hover:bg-white sm:w-auto"
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
              <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.075] p-4 shadow-[0_16px_52px_rgba(2,6,23,0.2)] backdrop-blur-xl">
                <div className="text-lg font-semibold text-white">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
