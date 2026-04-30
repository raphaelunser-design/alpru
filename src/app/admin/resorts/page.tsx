"use client";

import { useEffect, useMemo, useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";

const DEFAULT_NEW = {
  name: "",
  slug: "",
  country: "",
  region: "",
  lat: "",
  lon: "",
};

type ResortRow = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
  image_url: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  image_source: string | null;
  image_credit: string | null;
  image_license: string | null;
  official_url: string | null;
  piste_map_url: string | null;
  skipass_url: string | null;
  openskimap_url: string | null;
  piste_km: number | null;
  piste_km_total: number | null;
  runs_count_total: number | null;
  lifts_count_total: number | null;
  elevation_min_m: number | null;
  elevation_max_m: number | null;
  vertical_m: number | null;
  apres_score: number | null;
  crowd_score: number | null;
  infra_score: number | null;
  hut_score: number | null;
  park_score: number | null;
  beginner_score: number | null;
  advanced_score: number | null;
  skipass_price_from: number | null;
  skipass_price_currency: string | null;
  skipass_price_last_checked: string | null;
  skipass_price_note: string | null;
};

export default function AdminResortsPage() {
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ResortRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState<Record<string, Partial<ResortRow>>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newResort, setNewResort] = useState(DEFAULT_NEW);

  useEffect(() => {
    const run = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? "");
    };
    run();
  }, []);

  const loadResorts = async (offset = 0) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("limit", "50");
      params.set("offset", String(offset));

      const res = await fetch(`/api/admin/resorts${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const res = await fetch(`/api/admin/resorts`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const createResort = async () => {
    if (!newResort.name.trim()) {
      setError("Name fehlt");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: newResort.name.trim(),
        slug: newResort.slug.trim() || undefined,
        country: newResort.country.trim() || null,
        region: newResort.region.trim() || null,
        lat: newResort.lat ? Number(newResort.lat) : null,
        lon: newResort.lon Number(newResort.lon) : null,
      };
      const res = await fetch(`/api/admin/resorts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erstellen fehlgeschlagen");
      await loadResorts();
      setNewResort(DEFAULT_NEW);
    } catch (err) {
      setError(err instanceof Error err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  const displayRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[220px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[220px] w-full max-w-6xl items-end px-4 pb-8 pt-10 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Resorts verwalten</h1>
            <p className="mt-2 text-sm text-white/70">Stammdaten, Links, Preise und Scores pflegen.</p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_auto]">
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder="Suche nach Resort, Land oder Slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              onClick={() => loadResorts()}
              disabled={loading}
            >
              {loading "Lade..." : "Resorts laden"}
            </button>
          </div>
          {error <div className="text-sm text-red-300">{error}</div> : null}
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Neues Resort</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Name"
              value={newResort.name}
              onChange={(event) => setNewResort((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Slug (optional)"
              value={newResort.slug}
              onChange={(event) => setNewResort((prev) => ({ ...prev, slug: event.target.value }))}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Land"
              value={newResort.country}
              onChange={(event) => setNewResort((prev) => ({ ...prev, country: event.target.value }))}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Region"
              value={newResort.region}
              onChange={(event) => setNewResort((prev) => ({ ...prev, region: event.target.value }))}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Lat"
              value={newResort.lat}
              onChange={(event) => setNewResort((prev) => ({ ...prev, lat: event.target.value }))}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Lon"
              value={newResort.lon}
              onChange={(event) => setNewResort((prev) => ({ ...prev, lon: event.target.value }))}
            />
          </div>
          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            onClick={createResort}
            disabled={loading}
          >
            Resort hinzufügen
          </button>
        </GlassCard>

        <div className="space-y-4">
          {displayRows.map((row) => {
            const isDirty = Boolean(dirty[row.id]);
            const expanded = expandedId === row.id;
            return (
              <GlassCard key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">{row.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{row.slug}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      onClick={() => setExpandedId(expanded null : row.id)}
                    >
                      {expanded "Weniger" : "Erweitert"}
                    </button>
                    <button
                      className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                        isDirty "bg-white text-slate-900" : "bg-white/10 text-white"
                      }`}
                      onClick={() => saveRow(row)}
                      disabled={!isDirty || loading}
                    >
                      {isDirty "Speichern" : "Gespeichert"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Name"
                    value={row.name ""}
                    onChange={(event) => updateRow(row.id, { name: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Land"
                    value={row.country ""}
                    onChange={(event) => updateRow(row.id, { country: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Region"
                    value={row.region ""}
                    onChange={(event) => updateRow(row.id, { region: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Lat"
                    value={row.lat ""}
                    onChange={(event) => updateRow(row.id, { lat: event.target.value Number(event.target.value) : null })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Lon"
                    value={row.lon ""}
                    onChange={(event) => updateRow(row.id, { lon: event.target.value Number(event.target.value) : null })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Bild URL"
                    value={row.image_url ""}
                    onChange={(event) => updateRow(row.id, { image_url: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-sky-200/20 bg-sky-200/10 px-3 py-2 text-sm text-white placeholder:text-slate-400"
                    placeholder="Hero-Bild URL (rechtlich geprüft)"
                    value={row.hero_image_url ""}
                    onChange={(event) => updateRow(row.id, { hero_image_url: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Hero Alt-Text"
                    value={row.hero_image_alt ""}
                    onChange={(event) => updateRow(row.id, { hero_image_alt: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Bildquelle URL"
                    value={row.image_source ""}
                    onChange={(event) => updateRow(row.id, { image_source: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Credit"
                    value={row.image_credit ""}
                    onChange={(event) => updateRow(row.id, { image_credit: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Lizenz"
                    value={row.image_license ""}
                    onChange={(event) => updateRow(row.id, { image_license: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Offizielle URL"
                    value={row.official_url ""}
                    onChange={(event) => updateRow(row.id, { official_url: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Pistenplan URL"
                    value={row.piste_map_url ""}
                    onChange={(event) => updateRow(row.id, { piste_map_url: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Skipass URL"
                    value={row.skipass_url ""}
                    onChange={(event) => updateRow(row.id, { skipass_url: event.target.value })}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Skipass Preis ab"
                    value={row.skipass_price_from ""}
                    onChange={(event) =>
                      updateRow(row.id, {
                        skipass_price_from: event.target.value Number(event.target.value) : null,
                      })
                    }
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Währung"
                    value={row.skipass_price_currency ""}
                    onChange={(event) => updateRow(row.id, { skipass_price_currency: event.target.value })}
                  />
                  <input
                    type="date"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={row.skipass_price_last_checked ""}
                    onChange={(event) => updateRow(row.id, { skipass_price_last_checked: event.target.value })}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    placeholder="Preis Notiz"
                    value={row.skipass_price_note ""}
                    onChange={(event) => updateRow(row.id, { skipass_price_note: event.target.value })}
                  />
                </div>

                {expanded (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="OpenSkiMap URL"
                        value={row.openskimap_url ""}
                        onChange={(event) => updateRow(row.id, { openskimap_url: event.target.value })}
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Pisten gesamt (km)"
                        value={row.piste_km_total row.piste_km ""}
                        onChange={(event) =>
                          updateRow(row.id, { piste_km_total: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Runs total"
                        value={row.runs_count_total ""}
                        onChange={(event) =>
                          updateRow(row.id, { runs_count_total: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Lifte total"
                        value={row.lifts_count_total ""}
                        onChange={(event) =>
                          updateRow(row.id, { lifts_count_total: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Min Höhe (m)"
                        value={row.elevation_min_m ""}
                        onChange={(event) =>
                          updateRow(row.id, { elevation_min_m: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Max Höhe (m)"
                        value={row.elevation_max_m ""}
                        onChange={(event) =>
                          updateRow(row.id, { elevation_max_m: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Vertical (m)"
                        value={row.vertical_m ""}
                        onChange={(event) =>
                          updateRow(row.id, { vertical_m: event.target.value Number(event.target.value) : null })
                        }
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Après Score"
                        value={row.apres_score ""}
                        onChange={(event) =>
                          updateRow(row.id, { apres_score: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Andrang Score"
                        value={row.crowd_score ""}
                        onChange={(event) =>
                          updateRow(row.id, { crowd_score: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Infra Score"
                        value={row.infra_score ""}
                        onChange={(event) =>
                          updateRow(row.id, { infra_score: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Hütten Score"
                        value={row.hut_score ""}
                        onChange={(event) => updateRow(row.id, { hut_score: event.target.value Number(event.target.value) : null })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Park Score"
                        value={row.park_score ""}
                        onChange={(event) => updateRow(row.id, { park_score: event.target.value Number(event.target.value) : null })}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Beginner Score"
                        value={row.beginner_score ""}
                        onChange={(event) =>
                          updateRow(row.id, { beginner_score: event.target.value Number(event.target.value) : null })
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                        placeholder="Advanced Score"
                        value={row.advanced_score ""}
                        onChange={(event) =>
                          updateRow(row.id, { advanced_score: event.target.value Number(event.target.value) : null })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
