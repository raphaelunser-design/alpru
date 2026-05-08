"use client";

import { useEffect, useMemo, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { dataQualityLabel, eventTypeLabel, formatEventPeriod, type ResortEvent } from "@/lib/resortEvents";

type ResortSummary = {
  name: string;
  slug: string | null;
  country: string | null;
  region: string | null;
};

type EventRow = ResortEvent & {
  resorts: ResortSummary | ResortSummary[] | null;
};

const qualityOptions = [
  { value: "all", label: "Alle Qualitäten" },
  { value: "official", label: "Offiziell" },
  { value: "estimated", label: "Geschätzt" },
  { value: "outdated", label: "Datum prüfen" },
  { value: "missing", label: "Fehlt" },
];

function resortFor(row: EventRow) {
  if (Array.isArray(row.resorts)) return row.resorts[0] ?? null;
  return row.resorts ?? null;
}

export default function AdminEventsPage() {
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [quality, setQuality] = useState("all");
  const [rows, setRows] = useState<EventRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? "");
    };
    run();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (query.trim()) params.set("q", query.trim());
      if (quality !== "all") params.set("quality", quality);
      const res = await fetch(`/api/admin/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Events konnten nicht geladen werden.");
      setRows(json.data ?? []);
      setCount(json.count ?? 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Events konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const official = rows.filter((row) => row.data_quality === "official").length;
    const estimated = rows.filter((row) => row.data_quality === "estimated").length;
    const outdated = rows.filter((row) => row.data_quality === "outdated").length;
    return { official, estimated, outdated };
  }, [rows]);

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[220px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[220px] w-full max-w-6xl items-end px-4 pb-8 pt-10 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Vibe & Events</h1>
            <p className="mt-2 text-sm text-white/70">Eventdaten nach Resort, Datum, Genre und Datenqualität prüfen.</p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="space-y-4 p-6">
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_auto]">
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder="Event, Ort oder Typ suchen"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              value={quality}
              onChange={(event) => setQuality(event.target.value)}
            >
              {qualityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60"
              onClick={loadEvents}
              disabled={loading}
            >
              {loading ? "Lade..." : "Events laden"}
            </button>
          </div>
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Geladen</div>
              <div className="mt-1 font-semibold text-white">{rows.length} / {count || rows.length}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Offiziell</div>
              <div className="mt-1 font-semibold text-white">{summary.official}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Geschätzt</div>
              <div className="mt-1 font-semibold text-white">{summary.estimated}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Datum prüfen</div>
              <div className="mt-1 font-semibold text-white">{summary.outdated}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr_0.8fr] gap-3 border-b border-white/10 bg-white/[0.06] px-4 py-3 text-[11px] uppercase tracking-wide text-slate-400">
            <span>Event</span>
            <span>Resort</span>
            <span>Zeitraum</span>
            <span>Genre</span>
            <span>Datenqualität</span>
          </div>
          <div className="divide-y divide-white/10">
            {rows.map((row) => {
              const resort = resortFor(row);
              return (
                <div key={row.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm text-slate-200 md:grid-cols-[1.2fr_1fr_0.8fr_1fr_0.8fr]">
                  <div>
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{eventTypeLabel(row.event_type)}</div>
                  </div>
                  <div>
                    <div>{resort?.name ?? "Resort fehlt"}</div>
                    <div className="mt-1 text-xs text-slate-500">{[resort?.region, resort?.country].filter(Boolean).join(", ")}</div>
                  </div>
                  <div>{formatEventPeriod(row)}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(row.music_genres ?? []).slice(0, 4).map((genre) => (
                      <span key={genre} className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-200">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-slate-200">
                      {dataQualityLabel(row.data_quality)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {!rows.length ? (
            <div className="px-4 py-8 text-sm text-slate-400">
              Noch keine Events geladen oder keine Treffer für die aktuellen Filter.
            </div>
          ) : null}
        </GlassCard>
      </Section>
    </div>
  );
}
