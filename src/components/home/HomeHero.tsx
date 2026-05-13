"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";

const calmEase = [0.22, 1, 0.36, 1] as const;

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17c3-8 11-2 14-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 17h.01M19 7h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
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

const matchCriteria = [
  { label: "Fahrlevel", value: "Mittel bis sportlich" },
  { label: "Gruppe", value: "Crew-Trip" },
  { label: "Budget", value: "ca. 520 € p. P." },
  { label: "Vibe", value: "lebendig, aber planbar" },
];

const metrics = [
  { label: "Schnee", value: "sehr gut", hint: "Dez. bis April" },
  { label: "Anreise", value: "3:45 h", hint: "ab München" },
  { label: "Pisten", value: "100 km", hint: "ausgewogen" },
  { label: "Events", value: "Après", hint: "Hütten & Bars" },
];

const reasons = [
  "Schneesicheres Höhenprofil für kurze Winterfenster",
  "Gute Pistenmischung für unterschiedliche Levels",
  "Genug Après-Ski, ohne die Planung zu überladen",
];

export default function HomeHero() {
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };
  const item = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.62, ease: calmEase },
    },
  };

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-[840px] w-screen overflow-hidden bg-slate-950 md:min-h-[880px]">
      <motion.div
        className="absolute inset-0"
        initial={reduceMotion ? false : { scale: 1.06 }}
        animate={reduceMotion ? undefined : { scale: 1.01 }}
        transition={{ duration: 1.1, ease: calmEase }}
      >
        <Image
          src="/bg/banner-bild-4k.png"
          alt="Verschneite Alpenlandschaft mit Skifahrer in den Alpen"
          fill
          priority
          sizes="100vw"
          className="hero-media object-cover"
          style={{ objectPosition: "center 42%" }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.10)_0%,rgba(2,6,23,0.42)_48%,rgba(2,6,23,0.90)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(2,10,24,0.92)_0%,rgba(2,10,24,0.60)_44%,rgba(2,10,24,0.22)_100%)]" />
      <div className="hero-fog" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-[#07101e] via-[#07101e]/88 to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[840px] w-full max-w-6xl items-center gap-9 px-4 pb-16 pt-28 md:min-h-[880px] md:px-6 md:pt-32 lg:grid-cols-[0.92fr_0.86fr]">
        <motion.div
          className="w-full max-w-[calc(100vw-2rem)] md:max-w-3xl"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={item}
            className="max-w-[13ch] text-4xl font-extrabold leading-[1.02] text-white drop-shadow-[0_18px_46px_rgba(2,6,23,0.45)] sm:text-5xl md:text-6xl"
          >
            Findet den Ski-Trip, der wirklich zu euch passt.
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-5 max-w-[calc(100vw-2rem)] text-base font-medium leading-7 text-white/86 sm:max-w-2xl md:text-xl md:leading-8"
          >
            Alpivo gewichtet Schnee, Terrain, Anreise, Budget, Gruppe und Vibe zu einem klar erklärbaren Match.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/quiz"
              className="button-lift inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-sky-400 px-7 text-base font-extrabold text-slate-950 shadow-[0_24px_60px_rgba(14,165,233,0.34)] hover:bg-white focus:outline-none focus:ring-4 focus:ring-sky-200/45 sm:w-auto"
            >
              Match starten
              <ArrowIcon />
            </Link>
            <Link
              href="/resorts"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-white/24 bg-white/10 px-6 text-base font-bold text-white shadow-[0_18px_44px_rgba(2,6,23,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/16 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Resorts entdecken
              <ArrowIcon />
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Terrain", "Schnee", "Gruppen-Fit"].map((label) => (
              <div key={label} className="rounded-2xl border border-white/14 bg-white/[0.07] px-4 py-3 text-sm text-white/82 backdrop-blur-md">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100/70">{label}</span>
                <span className="mt-1 block font-semibold">transparent erklärt</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.article
          className="w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.7rem] border border-white/28 bg-slate-950/60 text-white shadow-[0_32px_100px_rgba(2,8,23,0.54)] backdrop-blur-2xl lg:max-w-full"
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.72, delay: reduceMotion ? 0 : 0.28, ease: calmEase }}
        >
          <div className="border-b border-white/12 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-100/70">Live Match Preview</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white">Obertauern</h2>
                <p className="mt-1 text-sm font-semibold text-white/70">Salzburg, Österreich</p>
              </div>
              <ScoreRing value={92} size="sm" label="Match" />
            </div>
          </div>

          <div className="relative h-56 overflow-hidden sm:h-64">
            <Image
              src="/bg/site-hero.jpg"
              alt="Obertauern Resort-Panorama bei Abendlicht"
              fill
              sizes="(min-width: 1024px) 520px, 92vw"
              className="object-cover transition duration-500"
              style={{ objectPosition: "center 48%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/34 to-slate-950/0" />
            <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2">
              {matchCriteria.map((criterion) => (
                <div key={criterion.label} className="rounded-2xl border border-white/14 bg-slate-950/48 px-3 py-2 text-sm backdrop-blur-xl">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-100/68">{criterion.label}</div>
                  <div className="mt-1 font-semibold text-white">{criterion.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid divide-y divide-white/10 border-b border-white/10 bg-white/[0.05] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-h-20 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{metric.label}</div>
                <strong className="mt-1 block text-sm font-extrabold text-white">{metric.value}</strong>
                <span className="block text-xs text-slate-400">{metric.hint}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-[1fr_0.78fr] md:p-6">
            <div>
              <h3 className="text-sm font-extrabold text-white">Warum es passt</h3>
              <ul className="mt-3 space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-sm leading-6 text-slate-200">
                    <span className="mt-1 text-emerald-300">
                      <CheckIcon />
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200/18 bg-amber-200/[0.07] p-4">
              <h3 className="text-sm font-extrabold text-amber-50">Vor Buchung prüfen</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                In der Hochsaison können Wochenenden voller sein. Alpivo markiert solche Haken direkt im Ergebnis.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100/76 sm:text-xs">
              <span className="inline-flex items-center gap-2">
                <RouteIcon />
                München
              </span>
              <span className="h-px min-w-8 flex-1 bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-300" />
              <span>Obertauern</span>
              <span className="shrink-0 rounded-full border border-white/14 bg-white/10 px-2 py-1 normal-case tracking-normal">3:45 h</span>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
