"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ScoreRing from "@/components/ScoreRing";
import { getAlpivoTopMatches } from "@/data/resorts";

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExampleMatchCard() {
  const [topMatch, ...alternatives] = getAlpivoTopMatches();
  const previewMatches = alternatives.slice(0, 2);

  return (
    <section id="beispiel-match" className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#081426] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(14,165,233,0.14),transparent_32%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-[1.05fr_0.82fr] lg:items-center">
        <Reveal>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200">Ergebnis-Preview</p>
            <h2 className="mt-3 max-w-[12ch] text-3xl font-extrabold tracking-[-0.01em] text-white md:text-5xl">
              Eure Top Matches
            </h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
              Top-Empfehlungen mit Gründen, Haken und Alternativen. Alpivo sortiert nicht nur, sondern erklärt, warum ein Resort zu eurer Gruppe passt.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="grid gap-4">
            <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
              <div className="relative h-72 overflow-hidden">
                <Image src={topMatch.image} alt={`${topMatch.name} Top-Match Vorschau`} fill sizes="(min-width: 1024px) 580px, 92vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/4 via-slate-950/12 to-slate-950/72" />
                <div className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-300 text-xl font-extrabold text-emerald-950">{topMatch.rank}</div>
                <div className="absolute right-4 top-4 rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-950">
                  Top Match
                </div>
                <div className="absolute bottom-5 left-5 right-28">
                  <h3 className="text-3xl font-extrabold text-white">{topMatch.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/86">{topMatch.regionLabel}</p>
                </div>
                <div className="absolute bottom-4 right-4">
                  <ScoreRing value={topMatch.score} size="sm" label="Match" />
                </div>
              </div>
              <div className="grid divide-y divide-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                {[
                  [topMatch.priceLabel, "pro Person"],
                  [topMatch.travelTimeFromMunich, "ab München"],
                  ["Schneesicher", topMatch.snowLabel],
                  ["Vibe & Events", topMatch.vibeLabel],
                ].map(([value, label]) => (
                  <div key={value} className="px-4 py-4">
                    <div className="text-sm font-extrabold text-slate-950">{value}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <p className="text-sm leading-6 text-slate-600">
                  {topMatch.reasons.slice(0, 3).join(", ")}.
                </p>
                <Link href={`/resort/${topMatch.slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-sky-700 transition hover:border-sky-200 hover:bg-sky-50">
                  Details ansehen
                  <ArrowIcon />
                </Link>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {previewMatches.map((match) => (
                <article key={match.name} className="grid overflow-hidden rounded-[1.15rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:grid-cols-[0.48fr_1fr] lg:grid-cols-[0.42fr_1fr]">
                  <div className="relative min-h-36 overflow-hidden">
                    <Image src={match.image} alt={`${match.name} Resort-Vorschau`} fill sizes="220px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/0 to-slate-950/58" />
                    <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-sky-600 text-sm font-extrabold text-white">
                      {match.rank}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-950">{match.name}</h3>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{match.regionLabel}</p>
                      </div>
                      <div className="rounded-full border border-slate-200 px-3 py-2 text-center">
                        <div className="text-xl font-extrabold text-slate-950">{match.score}</div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Match</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <strong className="block text-slate-950">{match.priceLabel}</strong>
                        <span className="text-slate-500">pro Person</span>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <strong className="block text-slate-950">{match.travelTimeFromMunich}</strong>
                        <span className="text-slate-500">ab München</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
