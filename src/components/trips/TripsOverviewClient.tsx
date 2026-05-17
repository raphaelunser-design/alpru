"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/premium/AppShell";
import MetricChip from "@/components/premium/MetricChip";
import PageHeader from "@/components/premium/PageHeader";
import TrustPoint from "@/components/premium/TrustPoint";
import TripCard from "@/components/trips/TripCard";
import TripsStateCard from "@/components/trips/TripsStateCard";
import { loadDemoTripBundles, loadTripBundlesForUser, shouldFallbackToDemo } from "@/lib/tripPlannerData";
import { buildDemoBundles, demoTripResortSlugs } from "@/lib/tripPlannerDemo";
import { getMvpTripResortLookup } from "@/lib/mvpResorts";
import { supabase } from "@/lib/supabase";
import type { SkiTripBundle } from "@/lib/tripPlanner";

const tripFeatures = [
  {
    title: "Verfügbarkeit abstimmen",
    text: "Findet das Wochenende, das für die Gruppe trägt.",
  },
  {
    title: "Resorts vergleichen",
    text: "Prüft Fit, Vibe, Pisten und Favoriten.",
  },
  {
    title: "Kosten pro Person sehen",
    text: "Seht das Budgetfenster pro Person sofort.",
  },
  {
    title: "Zahlungen & To-dos tracken",
    text: "Behaltet offene Beiträge und nächste Schritte im Blick.",
  },
];

export default function TripsOverviewClient() {
  const [bundles, setBundles] = useState<SkiTripBundle[]>(() => buildDemoBundles(getMvpTripResortLookup(demoTripResortSlugs)));
  const [demoBundles, setDemoBundles] = useState<SkiTripBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [demoReason, setDemoReason] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(false);
      setError("");

      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const nextUserId = data.user?.id ?? null;
      setUserId(nextUserId);

      try {
        if (nextUserId) {
          const liveBundles = await loadTripBundlesForUser(nextUserId);
          if (!mounted) return;
          setBundles(liveBundles);
          if (!liveBundles.length) {
            const samples = await loadDemoTripBundles();
            if (!mounted) return;
            setDemoBundles(samples);
          } else {
            setDemoBundles([]);
          }
          setDemoReason("");
        } else {
          const samples = await loadDemoTripBundles();
          if (!mounted) return;
          setBundles(samples);
          setDemoBundles([]);
          setDemoReason("Du siehst Demo-Trips. Mit Login werden hier deine echten Gruppenreisen geladen.");
        }
      } catch (loadError) {
        if (!mounted) return;
        if (shouldFallbackToDemo(loadError as { code: string; message: string })) {
          const samples = await loadDemoTripBundles();
          if (!mounted) return;
          setBundles(samples);
          setDemoReason("Die Trip-Tabellen sind lokal schon vorbereitet, remote aber noch nicht verfügbar. Deshalb läuft der Planner gerade im Demo-Modus.");
        } else {
          setError(loadError instanceof Error ? loadError.message : "Trips konnten nicht geladen werden.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session ? session.user?.id ?? null : null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const joinedMembers = bundles.reduce((sum, bundle) => sum + bundle.members.filter((member) => member.status === "joined").length, 0);
  const favoriteCount = bundles.reduce((sum, bundle) => sum + bundle.favorites.length, 0);
  const openDecisions = bundles.reduce((sum, bundle) => sum + bundle.dateOptions.length + bundle.budgetItems.filter((item) => !item.isPaid).length, 0);

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
        <div className="mx-auto grid w-full max-w-[1480px] gap-7">
          <PageHeader
            eyebrow="Trip Planung"
            title="Ein Board statt Chat-Chaos"
            subtitle="Alles Wichtige an einem Ort: Verfügbarkeiten, Resorts, Kosten und nächste Schritte für eure Gruppe."
            actions={
              <>
                <Link
                  href="/quiz"
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.065] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                >
                  Match nutzen
                </Link>
                <Link
                  href="/trips/new"
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                >
                  Trip anlegen
                </Link>
              </>
            }
          />

          <section className="grid gap-4 lg:grid-cols-4">
            <MetricChip icon="shield" value={`${bundles.length}`} label={userId && !demoReason ? "aktive Tripboards" : "Demo-Boards"} variant="glass" />
            <MetricChip icon="vibe" value={`${joinedMembers}`} label="Teilnehmer im Überblick" variant="glass" />
            <MetricChip icon="piste" value={`${favoriteCount}`} label="Resort-Favoriten" variant="glass" />
            <MetricChip icon="data" value={`${openDecisions}`} label="offene Entscheidungen" variant="glass" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="overflow-hidden rounded-[1.8rem] border border-white/12 bg-slate-950/72 shadow-[0_30px_90px_rgba(2,6,23,0.36)]">
              <div
                className="relative min-h-[280px] bg-cover bg-center p-5 md:p-7"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(2,8,23,0.94), rgba(2,8,23,0.55), rgba(2,8,23,0.18)), url("/bg/banner-bild-4k.png")',
                }}
              >
                <div className="max-w-2xl">
                  <span className="rounded-full border border-sky-200/24 bg-sky-300/12 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-sky-100">
                    Planungs-Cockpit
                  </span>
                  <h2 className="mt-5 text-3xl font-black leading-tight text-white md:text-5xl">Vom Match zur gemeinsamen Entscheidung.</h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 md:text-base">
                    Tripboards bündeln Favoriten, Zeiträume, Gruppenstimmen und Budgetpunkte in einer ruhigen App-Oberfläche.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {tripFeatures.slice(0, 3).map((feature) => (
                      <span key={feature.title} className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-2 text-xs font-bold text-white">
                        {feature.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="grid gap-4 rounded-[1.8rem] border border-white/12 bg-white/[0.065] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.24)]">
              <TrustPoint icon="shield" title="Unabhängig & transparent" text="Resorts, Budget und Vibe bleiben nachvollziehbar statt als Bauchgefühl im Chat zu verschwinden." />
              <TrustPoint icon="data" title="Gemeinsam entscheidbar" text="Zeiträume, Favoriten und Kosten liegen nebeneinander und werden nicht über mehrere Tabs verteilt." />
              <TrustPoint icon="lock" title="Beta mit klaren Zuständen" text="Demo-Boards sind sichtbar markiert, echte Trips laden nach Login aus Supabase." />
            </aside>
          </section>

        {demoReason ? <TripsStateCard title="Planner im Demo-Modus" text={demoReason} tone="default" /> : null}
        {error ? <TripsStateCard title="Trips konnten nicht geladen werden" text={error} tone="error" /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{userId && !demoReason ? "Deine Trips" : "Demo-Tripboard"}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ein Board statt Chat-Chaos</h2>
          </div>
          <Link className="rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" href="/trips/new">
            Ski-Trip anlegen
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`trip-skeleton-${index}`} className="h-[360px] animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
            ))}
          </div>
        ) : bundles.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {bundles.map((bundle) => (
              <TripCard key={bundle.trip.id} bundle={bundle} />
            ))}
          </div>
        ) : (
          <TripsStateCard
            title="Noch kein eigener Ski-Trip"
            text="Lege den ersten Gruppen-Trip an. Danach sammeln sich hier Verfügbarkeiten, Resort-Favoriten, Preisfenster und Gruppenkosten."
            tone="muted"
            action={
              <Link
                href="/trips/new"
                className="button-lift inline-flex rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
              >
                Trip starten
              </Link>
            }
          />
        )}

        {userId && demoBundles.length > 0 ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Demo-Daten</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Beispiel-Boards für den Ausbau</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {demoBundles.map((bundle) => (
                <TripCard key={`sample-${bundle.trip.id}`} bundle={bundle} />
              ))}
            </div>
          </div>
        ) : null}
        </div>
      </main>
    </AppShell>
  );
}
