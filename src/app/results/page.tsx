"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/premium/AppShell";
import ExternalActionLinks from "@/components/premium/ExternalActionLinks";
import PageHeader from "@/components/premium/PageHeader";
import ResortMatchCard from "@/components/premium/ResortMatchCard";
import TrustPoint from "@/components/premium/TrustPoint";
import { getResortActionLinks } from "@/data/resortActionLinks";
import { addTripDraftResort, setSelectedMapResort } from "@/lib/alpivoLocalState";
import { getAlpivoTopMatches, toPremiumMatch } from "@/data/resorts";

type SortKey = "match" | "price" | "drive";

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ResultsPage() {
  const [sort, setSort] = useState<SortKey>("match");
  const [message, setMessage] = useState("");
  const resorts = useMemo(() => {
    const base = getAlpivoTopMatches();
    if (sort === "price") return [...base].sort((a, b) => a.pricePerPerson - b.pricePerPerson);
    if (sort === "drive") return [...base].sort((a, b) => Number.parseInt(a.distanceFromMunich, 10) - Number.parseInt(b.distanceFromMunich, 10));
    return base;
  }, [sort]);

  const matches = resorts.map(toPremiumMatch);
  const topMatch = matches[0];
  const topResort = resorts[0];
  const topActionLinks = getResortActionLinks(topResort?.slug);
  const alternatives = matches.slice(1, 3);

  const addTopMatchToTrip = () => {
    if (!topResort) return;
    addTripDraftResort(topResort.slug);
    setMessage(`${topResort.name} wurde deinem lokalen Trip-Entwurf hinzugefügt. Als Gast bleibt er auf diesem Gerät gespeichert.`);
  };

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1480px] space-y-7">
          <PageHeader
            eyebrow="Eure Top Matches"
            title="Eure Top Matches"
            subtitle="Basierend auf euren Präferenzen. Alpivo zeigt Score, Kosten, Anreise, Schnee, Vibe, Gründe und Haken auf einen Blick."
            actions={
              <>
                <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/14 bg-white/[0.06] px-4 text-sm font-extrabold text-white">
                  <span className="text-slate-300">Sortierung</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortKey)}
                    className="bg-transparent text-white outline-none"
                    aria-label="Top Matches sortieren"
                  >
                    <option className="bg-slate-950" value="match">Match Score</option>
                    <option className="bg-slate-950" value="price">Preis</option>
                    <option className="bg-slate-950" value="drive">Anreise</option>
                  </select>
                </label>
                <Link className="inline-flex min-h-12 items-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400" href="/quiz">
                  Match anpassen
                </Link>
              </>
            }
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
            {topMatch ? <ResortMatchCard match={topMatch} variant="featured" priority /> : null}
            <div className="grid gap-5">
              {alternatives.map((match) => (
                <ResortMatchCard key={match.slug} match={match} variant="compact" />
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-[2rem] border border-white/12 bg-slate-950/58 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.32)] md:grid-cols-[1fr_auto] md:items-center md:p-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/80">Nächster Schritt</p>
              <h2 className="mt-2 text-2xl font-black text-white">Top Match prüfen oder direkt in die Planung übernehmen.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Wenn noch kein persönlicher Wizard-State vorhanden ist, nutzt Alpivo konsistente Pilot-Matches als Startpunkt. Deine Auswahl kann anschließend lokal weitergeplant werden.
              </p>
              {message ? <p className="mt-3 rounded-2xl border border-emerald-200/18 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-50">{message}</p> : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/map?resort=${encodeURIComponent(topResort?.slug ?? "obertauern")}`}
                onClick={() => setSelectedMapResort(topResort?.slug ?? "obertauern")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Auf Karte ansehen
                <ArrowIcon />
              </Link>
              <button type="button" onClick={addTopMatchToTrip} className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400">
                Zum Trip hinzufügen
              </button>
            </div>
          </section>

          <ExternalActionLinks
            links={topActionLinks}
            limit={5}
            title="Offizielle Links zum Top Match"
            subtitle="Prüfe Tickets, Live-Status, Unterkunft und Anreise direkt bei den offiziellen Quellen."
          />

          <section className="grid gap-4 md:grid-cols-3">
            <TrustPoint icon="shield" title="Unabhängig & transparent" text="Wir erklären Resorts neutral und ohne unbelegte Partner-Claims." />
            <TrustPoint icon="data" title="Beta-Daten klar markiert" text="Kosten und Resortdaten sind Orientierung und werden laufend verbessert." />
            <TrustPoint icon="lock" title="Sicher & transparent" text="Deine Daten bleiben geschützt und werden nur für deinen Match genutzt." />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
