"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataFreshnessNote } from "@/components/DataStatusBadge";
import AppShell from "@/components/premium/AppShell";
import PageHeader from "@/components/premium/PageHeader";
import ResortActionHub from "@/components/premium/ResortActionHub";
import ResortMatchCard from "@/components/premium/ResortMatchCard";
import SkipassAssistant from "@/components/premium/SkipassAssistant";
import TrustPoint from "@/components/premium/TrustPoint";
import { getResortActionLinks } from "@/data/resortActionLinks";
import { alpivoCanonicalResorts, getAlpivoResortBySlug, toPremiumMatch } from "@/data/resorts";
import { useAlpivoGuestState } from "@/hooks/useAlpivoGuestState";
import { calculateMatchResults, type MatchResult } from "@/lib/matchScore";

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
  const { state: guestState, selectResort, toggleFavorite, addTripDraftResort, markActionCompleted } = useAlpivoGuestState();
  const scoredResults = useMemo(() => {
    const base = calculateMatchResults(guestState.preferences, alpivoCanonicalResorts).filter((result) => !result.hardExclusion?.excluded);
    if (sort === "price") return [...base].sort((a, b) => a.resort.price.estimatedPerPerson - b.resort.price.estimatedPerPerson).map((result, index) => ({ ...result, rank: index + 1 }));
    if (sort === "drive") {
      return [...base]
        .sort((a, b) => (a.resort.travelFromMunich.durationMinutes ?? 9999) - (b.resort.travelFromMunich.durationMinutes ?? 9999))
        .map((result, index) => ({ ...result, rank: index + 1 }));
    }
    return base;
  }, [guestState.preferences, sort]);

  const matches = scoredResults
    .map((result) => {
      const resort = getAlpivoResortBySlug(result.resort.slug);
      if (!resort) return null;
      return {
        ...toPremiumMatch(resort),
        rank: result.rank,
        score: result.totalScore,
        reasons: result.reasons.slice(0, 3),
        drawback: result.drawbacks[0] ?? resort.drawback,
      };
    })
    .filter((match): match is NonNullable<typeof match> => Boolean(match));
  const topMatch = matches[0];
  const topResult = scoredResults[0];
  const topAlpivoResort = getAlpivoResortBySlug(topResult?.resort.slug);
  const alternatives = matches.slice(1, 3);

  const addMatchToTrip = (result: MatchResult | undefined) => {
    if (!result) return;
    addTripDraftResort(result.resort.slug);
    setMessage(`${result.resort.name} wurde deinem Trip-Entwurf hinzugefügt. Als Gast bleibt er auf diesem Gerät gespeichert.`);
  };

  const toggleMatchFavorite = (result: MatchResult | undefined) => {
    if (!result) return;
    const isFavorite = toggleFavorite(result.resort.slug);
    setMessage(isFavorite ? `${result.resort.name} ist als Favorit gespeichert.` : `${result.resort.name} wurde aus den Favoriten entfernt.`);
  };

  const openMapForMatch = (slug: string) => {
    selectResort(slug);
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
                href={`/map?resort=${encodeURIComponent(topResult?.resort.slug ?? "obertauern")}`}
                onClick={() => openMapForMatch(topResult?.resort.slug ?? "obertauern")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Auf Karte ansehen
                <ArrowIcon />
              </Link>
              <button type="button" onClick={() => addMatchToTrip(topResult)} className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400">
                Zum Trip hinzufügen
              </button>
              <button type="button" onClick={() => toggleMatchFavorite(topResult)} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10">
                {topResult && guestState.favoriteResortSlugs.includes(topResult.resort.slug) ? "Favorit entfernen" : "Favorit speichern"}
              </button>
            </div>
          </section>

          <section className="grid gap-3 rounded-[2rem] border border-white/12 bg-slate-950/58 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.32)]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/80">Schnellaktionen</p>
              <h2 className="mt-2 text-2xl font-black text-white">Direkt weiterplanen</h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {scoredResults.slice(0, 3).map((result) => {
                const links = getResortActionLinks(result.resort.slug);
                return (
                  <div key={result.resort.slug} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-white">{result.resort.name}</div>
                        <div className="mt-1 text-xs text-slate-400">{result.totalScore} Match · {result.resort.region}, {result.resort.country}</div>
                      </div>
                      <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-black text-emerald-50">#{result.rank}</span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <Link href={`/resort/${encodeURIComponent(result.resort.slug)}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-sky-500 px-3 text-xs font-extrabold text-white hover:bg-sky-400">
                        Details ansehen
                      </Link>
                      <Link
                        href={`/map?resort=${encodeURIComponent(result.resort.slug)}`}
                        onClick={() => openMapForMatch(result.resort.slug)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] px-3 text-xs font-extrabold text-white hover:bg-white/10"
                      >
                        Auf Karte ansehen
                      </Link>
                      {links.skipassShop ? (
                        <a
                          href={links.skipassShop.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markActionCompleted("skipassChecked", result.resort.slug)}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-200/18 bg-emerald-300/[0.08] px-3 text-xs font-extrabold text-emerald-50 hover:bg-emerald-300/[0.13]"
                        >
                          Skipass offiziell prüfen
                        </a>
                      ) : null}
                      <button type="button" onClick={() => toggleMatchFavorite(result)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] px-3 text-xs font-extrabold text-white hover:bg-white/10">
                        {guestState.favoriteResortSlugs.includes(result.resort.slug) ? "Favorit entfernen" : "Favorit speichern"}
                      </button>
                      <button type="button" onClick={() => addMatchToTrip(result)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] px-3 text-xs font-extrabold text-white hover:bg-white/10">
                        Zum Trip hinzufügen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
            <ResortActionHub
              resortSlug={topResult?.resort.slug ?? "obertauern"}
              limit={6}
              title="Offizielle Links zum Top Match"
              subtitle="Prüfe Tickets, Live-Status, Unterkunft und Anreise direkt bei den offiziellen Quellen."
              onActionClick={(link) => {
                const slug = topResult?.resort.slug ?? "obertauern";
                if (link.kind === "skipass_shop" || link.kind === "ticket_info") markActionCompleted("skipassChecked", slug);
                if (link.kind === "live_status" || link.kind === "webcam") markActionCompleted("liveStatusChecked", slug);
                if (link.kind === "accommodation") markActionCompleted("accommodationChecked", slug);
                if (link.kind === "travel") markActionCompleted("routeChecked", slug);
              }}
            />
            {topAlpivoResort ? (
              <SkipassAssistant
                resort={topAlpivoResort}
                preferences={guestState.preferences}
                variant="compact"
                completed={guestState.completedActions.skipassChecked}
                onComplete={() => markActionCompleted("skipassChecked", topAlpivoResort.slug)}
              />
            ) : null}
            <DataFreshnessNote className="xl:col-span-2">
              Kosten, Fahrzeiten und Schneesignale sind Beta-Orientierung. Externe Ticket-, Unterkunfts- und Live-Links öffnen offizielle Quellen; Alpivo wickelt keine Buchung ab.
            </DataFreshnessNote>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <TrustPoint icon="shield" title="Unabhängig & transparent" text="Wir erklären Resorts neutral mit Gründen, Haken und klar markierten Datenständen." />
            <TrustPoint icon="data" title="Beta-Daten klar markiert" text="Kosten und Resortdaten sind Orientierung und werden laufend verbessert." />
            <TrustPoint icon="lock" title="Sicher & transparent" text="Deine Daten bleiben geschützt und werden nur für deinen Match genutzt." />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
