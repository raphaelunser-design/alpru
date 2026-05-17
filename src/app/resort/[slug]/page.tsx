"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ScoreRing from "@/components/ScoreRing";
import AppShell from "@/components/premium/AppShell";
import MetricChip from "@/components/premium/MetricChip";
import PageHeader from "@/components/premium/PageHeader";
import ResortMatchCard from "@/components/premium/ResortMatchCard";
import TrustPoint from "@/components/premium/TrustPoint";
import { addTripDraftResort, isFavoriteSlug, setSelectedMapResort, toggleFavoriteSlug } from "@/lib/alpivoLocalState";
import { getAlpivoResortBySlug, getAlpivoTopMatches, toPremiumMatch } from "@/lib/alpivoResortData";

function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ResortDetailPage() {
  const params = useParams<{ slug?: string }>();
  const resort = useMemo(() => getAlpivoResortBySlug(params?.slug), [params?.slug]);
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!resort) return;
    setFavorite(isFavoriteSlug(resort.slug));
  }, [resort]);

  if (!resort) {
    return (
      <AppShell>
        <main className="alpivo-page-shell min-h-screen px-4 py-8 md:px-8">
          <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center">
            <div className="w-full rounded-[2rem] border border-white/12 bg-slate-950/72 p-6 text-white shadow-[0_34px_100px_rgba(2,6,23,0.42)] md:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-200/80">Resort nicht gefunden</p>
              <h1 className="mt-4 text-4xl font-black">Dieses Skigebiet ist in der Beta noch nicht verfügbar.</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Die Pilotdaten enthalten aktuell Obertauern, Sölden, Zell am See und Saalbach. Starte einen Match oder öffne die Resort-Übersicht.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white" href="/resorts">
                  Resorts ansehen
                </Link>
                <Link className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 px-5 text-sm font-extrabold text-white hover:bg-white/10" href="/quiz">
                  Match starten
                </Link>
              </div>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  const related = getAlpivoTopMatches()
    .filter((item) => item.slug !== resort.slug)
    .slice(0, 3)
    .map(toPremiumMatch);
  const handleFavorite = () => {
    const isNowFavorite = toggleFavoriteSlug(resort.slug);
    setFavorite(isNowFavorite);
    setMessage(isNowFavorite ? "Favorit gespeichert. Das Cockpit kann diesen Resort jetzt aufgreifen." : "Favorit entfernt.");
  };

  const handleTripDraft = () => {
    addTripDraftResort(resort.slug);
    setMessage(`${resort.name} wurde deinem lokalen Trip-Entwurf hinzugefügt.`);
  };

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen overflow-hidden px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1480px] space-y-8">
          <PageHeader
            eyebrow="Resort Detail"
            title={resort.name}
            subtitle={`${resort.regionLabel}. Ein erklärbares Top-Match mit Score, Kosten, Anreise, Schnee, Vibe, Gründen und Haken.`}
            actions={
              <Link
                href={`/map?resort=${encodeURIComponent(resort.slug)}`}
                onClick={() => setSelectedMapResort(resort.slug)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Auf Karte ansehen
                <ArrowIcon />
              </Link>
            }
          />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.24fr)_420px]">
            <article className="overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/74 text-white shadow-[0_34px_110px_rgba(2,6,23,0.46)]">
              <div className="relative min-h-[430px] overflow-hidden">
                <Image
                  src={resort.image}
                  alt={`${resort.name} Alpenpanorama`}
                  fill
                  priority
                  sizes="(min-width: 1280px) 920px, 96vw"
                  className="object-cover"
                  style={{ objectPosition: "center 48%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/12 via-slate-950/26 to-slate-950/92" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  {resort.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-sky-200/24 bg-slate-950/48 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-sky-50 backdrop-blur">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-sky-100/88">{resort.regionLabel}</p>
                      <h2 className="mt-2 text-5xl font-black leading-none md:text-7xl">{resort.name}</h2>
                      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{resort.description}</p>
                    </div>
                    <ScoreRing value={resort.score} size="lg" label="Match" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricChip icon="cost" value={resort.priceLabel} label="pro Person" variant="glass" />
                <MetricChip icon="time" value={resort.travelTimeFromMunich} label="ab München" variant="glass" />
                <MetricChip icon="snow" value={resort.snowLabel} label="Schneesicherheit" variant="glass" />
                <MetricChip icon="vibe" value={resort.vibeLabel} label="Vibe & Events" variant="glass" />
                <MetricChip icon="piste" value={resort.pisteKm} label="Pistenkilometer" variant="glass" />
                <MetricChip icon="height" value={resort.altitude} label="Höhenlage" variant="glass" className="sm:col-span-2 lg:col-span-2" />
              </div>

              <div className="grid gap-5 border-t border-white/10 p-5 md:grid-cols-[1fr_0.75fr] md:p-7">
                <div className="rounded-3xl border border-emerald-200/16 bg-emerald-300/[0.075] p-5">
                  <h3 className="text-lg font-black text-white">3 Gründe, warum es passt</h3>
                  <ul className="mt-4 space-y-3">
                    {resort.reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-3 text-sm leading-6 text-emerald-50">
                        <span className="mt-0.5 text-emerald-300">
                          <CheckIcon />
                        </span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-amber-200/22 bg-amber-300/[0.08] p-5">
                  <h3 className="text-lg font-black text-amber-100">Ein möglicher Nachteil</h3>
                  <p className="mt-4 text-sm leading-7 text-amber-50/90">{resort.drawback}</p>
                </div>
              </div>
            </article>

            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-white/12 bg-slate-950/78 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.42)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/80">Nächster Schritt</p>
                <h2 className="mt-3 text-2xl font-black text-white">Match in Planung überführen</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Diese Aktionen nutzen aktuell einen lokalen Demo-State. Backend-Persistenz kann später an Supabase angebunden werden.
                </p>
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={handleTripDraft}
                    className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                  >
                    Zum Trip hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                  >
                    {favorite ? "Favorit entfernen" : "Favorit speichern"}
                  </button>
                  <Link
                    href={`/map?resort=${encodeURIComponent(resort.slug)}`}
                    onClick={() => setSelectedMapResort(resort.slug)}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200/20 bg-sky-300/[0.08] px-5 text-sm font-extrabold text-sky-50 hover:bg-sky-300/[0.13]"
                  >
                    Auf Karte ansehen
                  </Link>
                </div>
                {message ? <p className="mt-4 rounded-2xl border border-emerald-200/18 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-50">{message}</p> : null}
              </div>

              <div className="grid gap-3">
                <TrustPoint icon="shield" title="Unabhängig erklärt" text="Alpivo zeigt Gründe und Haken statt leere Rankings." />
                <TrustPoint icon="data" title="Beta-Daten klar markiert" text="Kosten und Resortdaten sind Orientierung und werden laufend verbessert." />
                <TrustPoint icon="lock" title="Lokaler Demo-State" text="Favoriten und Trip-Entwurf bleiben auf diesem Gerät." />
              </div>
            </aside>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-200/80">Alternativen</p>
              <h2 className="mt-2 text-3xl font-black text-white">Weitere passende Resorts</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {related.map((item) => (
                <ResortMatchCard key={item.slug} match={item} variant="compact" />
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
