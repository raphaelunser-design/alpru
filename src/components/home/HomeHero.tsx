"use client";

import Image from "next/image";
import Link from "next/link";
import BrandLogo from "@/components/premium/BrandLogo";
import ResortMatchCard from "@/components/premium/ResortMatchCard";
import TrustPoint from "@/components/premium/TrustPoint";
import { heroMatch } from "@/lib/premiumDemoMatches";

function ArrowIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomeHero() {
  return (
    <section className="hero-shell relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen w-screen overflow-hidden bg-[#020817] text-white">
      <Image
        src="/bg/banner-bild-4k.png"
        alt="Verschneites alpines Tal bei Abendlicht"
        fill
        priority
        sizes="100vw"
        className="hero-media object-cover"
        style={{ objectPosition: "center 45%" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_20%,rgba(14,165,233,0.22),transparent_28%),linear-gradient(180deg,rgba(2,8,23,0.24)_0%,rgba(2,8,23,0.58)_55%,#020817_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,8,23,0.96)_0%,rgba(2,8,23,0.68)_43%,rgba(2,8,23,0.18)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#020817] to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-5 py-6 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo className="text-white" />
          <nav className="hidden items-center gap-3 text-sm font-bold lg:flex" aria-label="Landingpage Navigation">
            <a href="#so-funktionierts" className="rounded-full px-4 py-2 text-white/84 transition hover:bg-white/10 hover:text-white">
              So funktioniert&apos;s
            </a>
            <a href="#beispiel-match" className="rounded-full px-4 py-2 text-white/84 transition hover:bg-white/10 hover:text-white">
              Beispiel-Match
            </a>
            <Link href="/resorts" className="rounded-full px-4 py-2 text-white/84 transition hover:bg-white/10 hover:text-white">
              Resorts
            </Link>
          </nav>
          <Link href="/quiz" className="button-lift hidden min-h-12 items-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.3)] hover:bg-sky-400 sm:inline-flex">
            <span className="hidden sm:inline">Match starten</span>
            <span className="sm:hidden">Match</span>
            <ArrowIcon />
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.92fr_0.9fr] lg:py-16">
          <div className="hero-content max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/18 bg-sky-200/[0.08] px-4 py-2 text-sm font-bold text-sky-100 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.65)]" />
              Dein Ski-Trip. Intelligenter gemacht.
            </div>
            <h1 className="mt-8 max-w-[12ch] text-5xl font-black leading-[0.98] tracking-[-0.025em] text-white drop-shadow-[0_22px_70px_rgba(2,6,23,0.55)] sm:text-6xl lg:text-7xl">
              Findet den Ski-Trip, der wirklich zu euch passt.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-slate-200 md:text-2xl md:leading-10">
              Budget, Anreise, Schnee, Vibe und Unterkunft in einem klaren Match-Score.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/quiz" className="button-lift inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-sky-500 px-8 text-base font-black text-white shadow-[0_28px_70px_rgba(14,165,233,0.34)] hover:bg-sky-400">
                Match in 3 Minuten starten
                <ArrowIcon />
              </Link>
              <a href="#beispiel-match" className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-white/22 bg-white/[0.075] px-7 text-base font-extrabold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12]">
                <PlayIcon />
                Beispiel ansehen
              </a>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <TrustPoint compact icon="shield" title="Unabhängig & transparent" text="Keine Werbung. Keine Provision." />
              <TrustPoint compact icon="data" title="Match mit Gründen" text="Score, Haken und Alternativen." />
              <TrustPoint compact icon="lock" title="Sicher & privat" text="Deine Daten bleiben bei dir." />
            </div>
          </div>

          <div id="beispiel-match" className="animate-rise mx-auto w-full max-w-[690px] lg:mx-0">
            <ResortMatchCard match={heroMatch} variant="hero" priority />
          </div>
        </div>
      </div>
    </section>
  );
}
