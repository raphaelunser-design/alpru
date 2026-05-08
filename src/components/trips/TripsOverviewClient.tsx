"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import Section from "@/components/Section";
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

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[360px]" imagePosition="center 46%">
        <div className="mx-auto flex min-h-[320px] w-full max-w-6xl items-end px-4 pb-10 pt-14 md:px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Trips</p>
            <h1 className="mt-4 max-w-[21rem] break-words text-3xl font-semibold leading-tight text-white sm:max-w-3xl md:text-5xl">
              Plant euren Ski-Trip gemeinsam - ohne WhatsApp-Chaos.
            </h1>
            <p className="mt-3 max-w-[20rem] text-sm leading-6 text-white/78 sm:max-w-2xl md:text-base">
              Verfügbarkeiten, Favoriten, Kosten und To-dos liegen in einem gemeinsamen Board.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/trips/new"
                className="button-lift inline-flex min-h-14 items-center rounded-2xl bg-sky-200 px-6 text-sm font-bold text-slate-950 shadow-[0_20px_50px_rgba(125,211,252,0.28)] hover:bg-white"
              >
                Ski-Trip anlegen
              </Link>
              <Link
                href="/quiz"
                className="button-lift inline-flex min-h-14 items-center rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
              >
                Match weiter nutzen
              </Link>
            </div>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        {demoReason ? <TripsStateCard title="Planner im Demo-Modus" text={demoReason} tone="default" /> : null}
        {error ? <TripsStateCard title="Trips konnten nicht geladen werden" text={error} tone="error" /> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tripFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-[0_18px_54px_rgba(2,6,23,0.22)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-200/20 bg-sky-200/10 text-sm font-bold text-sky-100">
                {index + 1}
              </div>
              <h2 className="mt-5 text-lg font-semibold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{feature.text}</p>
            </article>
          ))}
        </div>

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
      </Section>
    </div>
  );
}
