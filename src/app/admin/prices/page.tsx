"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { getAdminRequestHeaders } from "@/lib/adminClientAuth";

type ResortRow = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  region: string | null;
  skipass_url: string | null;
  skipass_price_from: number | null;
  skipass_price_currency: string | null;
  skipass_price_last_checked: string | null;
  skipass_price_note: string | null;
};

function formatLabel(row: ResortRow) {
  return [row.name, row.country, row.region].filter(Boolean).join(" · ");
}

export default function AdminPricesPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ResortRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState<Record<string, Partial<ResortRow>>>({});

  const displayRows = useMemo(() => rows, [rows]);

  const loadResorts = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAdminRequestHeaders();
      if (!Object.keys(headers).length) throw new Error("Admin-Session fehlt. Bitte erneut anmelden oder Admin-Token nutzen.");
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("limit", "1000");
      const res = await fetch(`/api/admin/prices${params.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const json = await res.json();
      setRows(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: string, patch: Partial<ResortRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setDirty((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveRow = async (row: ResortRow) => {
    const patch = dirty[row.id];
    if (!patch) return;

    setLoading(true);
    setError("");
    try {
      const headers = await getAdminRequestHeaders();
      if (!Object.keys(headers).length) throw new Error("Admin-Session fehlt. Bitte erneut anmelden oder Admin-Token nutzen.");
      const res = await fetch(`/api/admin/prices`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ id: row.id, ...patch }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const json = await res.json();
      const updated = json.data as ResortRow | null;
      if (updated) {
        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
      }
      setDirty((prev) => {
        const copy = { ...prev };
        delete copy[row.id];
        return copy;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[240px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[240px] w-full max-w-6xl items-end px-4 pb-8 pt-10 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Skipass Preise pflegen</h1>
            <p className="mt-2 text-sm text-white/70">
              Trage die aktuellen Tagespreise ein und speichere sie direkt in Supabase.
            </p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_auto]">
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder="Suche nach Resort oder Slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              onClick={loadResorts}
              disabled={loading}
            >
              {loading ? "Lade..." : "Resorts laden"}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span>Admin-Zugriff wird beim Laden und Speichern geprüft.</span>
            <Link className="underline" href="/resorts">
              Zurück zu Resorts
            </Link>
          </div>
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
        </GlassCard>

        <div className="space-y-4">
          {displayRows.map((row) => {
            const isDirty = Boolean(dirty[row.id]);
            return (
              <GlassCard key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{formatLabel(row)}</div>
                    <div className="mt-1 text-xs text-slate-400">{row.slug}</div>
                    {row.skipass_url ? (
                      <a
                        className="mt-2 inline-block text-xs text-slate-300 underline"
                        href={row.skipass_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Skipass Link öffnen
                      </a>
                    ) : null}
                  </div>
                  <button
                    className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                      isDirty ? "bg-white text-slate-900" : "bg-white/10 text-white"
                    }`}
                    onClick={() => saveRow(row)}
                    disabled={!isDirty || loading}
                  >
                    {isDirty ? "Speichern" : "Gespeichert"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Preis ab"
                    value={row.skipass_price_from ?? ""}
                    onChange={(event) =>
                      updateRow(row.id, {
                        skipass_price_from: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Währung (EUR)"
                    value={row.skipass_price_currency ?? ""}
                    onChange={(event) => updateRow(row.id, { skipass_price_currency: event.target.value })}
                  />
                  <input
                    type="date"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={row.skipass_price_last_checked ?? ""}
                    onChange={(event) => updateRow(row.id, { skipass_price_last_checked: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Notiz (z.B. Erwachsene 1-Tag HS)"
                    value={row.skipass_price_note ?? ""}
                    onChange={(event) => updateRow(row.id, { skipass_price_note: event.target.value })}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
