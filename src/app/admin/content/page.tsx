"use client";

import { useState } from "react";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { getAdminRequestHeaders } from "@/lib/adminClientAuth";

type ContentRow = {
  key: string;
  value: Record<string, string>;
};

const defaultContent: Record<string, Record<string, string>> = {
  landing: {
    badge: "Alpivo MVP · Alpen, Budget, Stil",
    title: "Finde dein Alpen-Resort in unter 90 Sekunden",
    subtitle: "Sag uns, was dir wichtig ist. Wir zeigen dir passende Skigebiete mit Kosten-Range, Highlights und klaren Gründen.",
    primaryLabel: "Match starten",
    primaryHref: "/quiz",
    secondaryLabel: "Resorts entdecken",
    secondaryHref: "/resorts",
    heroImage: "/bg/banner-bild-4k.png",
  },
  resorts: {
    title: "Alle Alpen-Resorts",
    subtitle: "Aktuelle Daten und Links zu offiziellen Quellen.",
    heroImage: "/bg/banner-bild-4k.png",
  },
  results: {
    title: "Deine Matches",
    subtitle: "Sortiert nach Passung, Budget, Value und alpinem Stil.",
    heroImage: "/bg/banner-bild-4k.png",
  },
  quiz: {
    title: "Dein Match",
    subtitle: "Stell deinen Trip zusammen und finde das passende Resort.",
    heroImage: "/bg/banner-bild-4k.png",
  },
};

export default function AdminContentPage() {
  const [content, setContent] = useState<Record<string, Record<string, string>>>(defaultContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const loadContent = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAdminRequestHeaders();
      if (!Object.keys(headers).length) throw new Error("Admin-Session fehlt. Bitte erneut anmelden oder Admin-Token nutzen.");
      const res = await fetch(`/api/admin/content`, {
        headers,
      });
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const json = await res.json();
      const rows: ContentRow[] = json.data ?? [];
      const next = { ...defaultContent } as Record<string, Record<string, string>>;
      rows.forEach((row) => {
        next[row.key] = { ...next[row.key], ...(row.value || {}) };
      });
      setContent(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const saveKey = async (key: string) => {
    setLoading(true);
    setError("");
    setSaved("");
    try {
      const headers = await getAdminRequestHeaders();
      if (!Object.keys(headers).length) throw new Error("Admin-Session fehlt. Bitte erneut anmelden oder Admin-Token nutzen.");
      const res = await fetch(`/api/admin/content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ key, value: content[key] }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      setSaved(`Gespeichert: ${key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[220px]" imagePosition="center 48%">
        <div className="mx-auto flex min-h-[220px] w-full max-w-6xl items-end px-4 pb-8 pt-10 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Content verwalten</h1>
            <p className="mt-2 text-sm text-white/70">Hero-Texte, Buttons und Backgrounds.</p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              onClick={loadContent}
              disabled={loading}
            >
              {loading ? "Lade..." : "Content laden"}
            </button>
            {saved ? <span className="text-xs text-emerald-300">{saved}</span> : null}
            {error ? <span className="text-xs text-red-300">{error}</span> : null}
          </div>
        </GlassCard>

        {Object.entries(content).map(([key, values]) => (
          <GlassCard key={key} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{key}</h2>
              <button
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                onClick={() => saveKey(key)}
                disabled={loading}
              >
                Speichern
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(values).map(([field, value]) => (
                <div key={`${key}-${field}`} className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">{field}</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={value}
                    onChange={(event) => updateField(key, field, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </Section>
    </div>
  );
}
