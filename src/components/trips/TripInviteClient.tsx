"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import Section from "@/components/Section";
import TripsStateCard from "@/components/trips/TripsStateCard";
import { supabase } from "@/lib/supabase";

type InvitePayload = {
  tripTitle: string;
  email: string | null;
  role: "admin" | "member";
  note: string | null;
  status: "invited" | "open" | "joined";
};

export default function TripInviteClient({ token }: { token: string }) {
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successUrl, setSuccessUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserEmail(userData.user?.email ?? null);

      const response = await fetch(`/api/trips/invite/${encodeURIComponent(token)}`);
      const payload = (await response.json()) as InvitePayload & { error: string };
      if (!mounted) return;
      if (!response.ok) {
        setError(payload.error ?? "Invite konnte nicht geladen werden.");
      } else {
        setInvite(payload);
      }
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[320px]" imagePosition="center 46%">
        <div className="mx-auto flex min-h-[280px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Trip Invite</p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">In einen Ski-Trip einsteigen</h1>
          </div>
        </div>
      </BackgroundHero>

      <Section>
        {loading ? (
          <div className="h-[220px] animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
        ) : error ? (
          <TripsStateCard title="Invite nicht verfügbar" text={error} tone="error" />
        ) : successUrl ? (
          <TripsStateCard
            title="Du bist jetzt im Trip"
            text="Mitgliedschaft angelegt. Von hier aus kommst du direkt in das Gruppen-Board."
            action={
              <Link
                href={successUrl}
                className="button-lift inline-flex rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
              >
                Zum Trip
              </Link>
            }
          />
        ) : invite ? (
          <TripsStateCard
            title={invite.tripTitle}
            text={
              invite.email
                `Dieser Invite ist für ${invite.email} gedacht. Eingeloggt bist du aktuell als ${userEmail ?? "niemand"}.`
                : "Offener Gruppen-Invite für Alpivo."
            }
            action={
              userEmail (
                <button
                  className="button-lift rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    const { data: sessionData } = await supabase.auth.getSession();
                    const accessToken = sessionData.session.access_token;
                    const response = await fetch(`/api/trips/invite/${encodeURIComponent(token)}`, {
                      method: "POST",
                      headers: accessToken { Authorization: `Bearer ${accessToken}` } : {},
                    });
                    const payload = (await response.json()) as { error: string; tripId: string };
                    setBusy(false);
                    if (!response.ok || !payload.tripId) {
                      setError(payload.error "Invite konnte nicht angenommen werden.");
                      return;
                    }
                    setSuccessUrl(`/trips/${encodeURIComponent(payload.tripId)}`);
                  }}
                >
                  {busy "Bitte warten..." : "Trip beitreten"}
                </button>
              ) : (
                <Link
                  href="/account"
                  className="button-lift inline-flex rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                >
                  Erst einloggen
                </Link>
              )
            }
          />
        ) : null}
      </Section>
    </div>
  );
}
