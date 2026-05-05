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
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Gruppenplanung für Ski-Trips direkt in Alpivo</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78 md:text-base">
              Verfügbarkeiten abstimmen, Resorts aus Alpivo favorisieren, Preisfenster vergleichen und Gruppenkosten ohne Tool-Wechsel im Blick behalten.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/trips/new"
                className="button-lift rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
              >
                Ski-Trip anlegen
              </Link>
              <Link
                href="/quiz"
                className="button-lift rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{userId && !demoReason ? "Deine Trips" : "Beispiel-Tripboards"}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ski-Reisen gemeinsam entscheiden</h2>
          </div>
          <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="/trips/new">
            Neuer Trip
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
