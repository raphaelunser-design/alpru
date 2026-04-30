"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import SelectControl from "@/components/SelectControl";
import { supabase } from "@/lib/supabase";

type FeedbackRow = {
  id: string;
  user_email: string | null;
  category: "bug" | "feature" | "feedback";
  message: string;
  page_path: string | null;
  status: "new" | "reviewed" | "done" | "archived";
  created_at: string;
};

const categoryOptions = [
  { value: "all", label: "Alle Kategorien" },
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Bugs" },
  { value: "feature", label: "Ideen" },
];

const statusOptions = [
  { value: "all", label: "Alle Status" },
  { value: "new", label: "Neu" },
  { value: "reviewed", label: "Geprüft" },
  { value: "done", label: "Erledigt" },
  { value: "archived", label: "Archiv" },
];

const statusEditOptions = statusOptions.filter((option) => option.value !== "all");

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function categoryLabel(category: FeedbackRow["category"]) {
  if (category === "bug") return "Bug";
  if (category === "feature") return "Idee";
  return "Feedback";
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    return {
      total: rows.length,
      bugs: rows.filter((row) => row.category === "bug").length,
      features: rows.filter((row) => row.category === "feature").length,
      open: rows.filter((row) => row.status === "new").length,
    };
  }, [rows]);

  async function authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function loadFeedback() {
    setLoading(true);
    setError("");
    const headers = await authHeaders();
    const response = await fetch(`/api/admin/feedbackcategory=${category}&status=${status}`, { headers });
    const body = (await response.json().catch(() => null)) as { data: FeedbackRow[]; error: string } | null;

    if (!response.ok) {
      setError(body.error ?? "Feedback konnte nicht geladen werden.");
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(body.data ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, nextStatus: string) {
    const headers = await authHeaders();
    const response = await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error: string } | null;
      setError(body.error ?? "Status konnte nicht gespeichert werden");
      return;
    }

    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, status: nextStatus as FeedbackRow["status"] } : row))
    );
  }

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  return (
    <Section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Beta Feedback</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Nutzerfeedback auswerten</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Bugs, Ideen und allgemeines Feedback aus dem sticky Feedback-Button.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <GlassCard className="p-4">
          <div className="text-xs text-slate-400">Gesamt</div>
          <div className="mt-1 text-2xl font-semibold text-white">{stats.total}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-slate-400">Neu</div>
          <div className="mt-1 text-2xl font-semibold text-white">{stats.open}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-slate-400">Bugs</div>
          <div className="mt-1 text-2xl font-semibold text-white">{stats.bugs}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-slate-400">Ideen</div>
          <div className="mt-1 text-2xl font-semibold text-white">{stats.features}</div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <SelectControl value={category} ariaLabel="Kategorie filtern" options={categoryOptions} onChange={setCategory} />
          <SelectControl value={status} ariaLabel="Status filtern" options={statusOptions} onChange={setStatus} />
          <button
            type="button"
            onClick={loadFeedback}
            className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Aktualisieren
          </button>
        </div>
        {error ? <div className="mt-3 rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
      </GlassCard>

      <div className="grid gap-3">
        {loading ? <GlassCard className="p-5 text-sm text-slate-300">Feedback wird geladen...</GlassCard> : null}
        {!loading && rows.length === 0 (
          <GlassCard className="p-5 text-sm text-slate-300">Noch kein Feedback für diese Filter.</GlassCard>
        ) : null}
        {rows.map((row) => (
          <GlassCard key={row.id} className="p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-sky-200/20 bg-sky-200/10 px-2.5 py-1 text-sky-100">
                    {categoryLabel(row.category)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-slate-300">
                    {row.status}
                  </span>
                  <span className="text-slate-500">{formatDate(row.created_at)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{row.message}</p>
                <div className="mt-3 text-xs text-slate-500">
                  {row.user_email "anonym"}
                  {row.page_path ` · ${row.page_path}` : ""}
                </div>
              </div>
              <div className="w-full md:w-44">
                <SelectControl
                  value={row.status}
                  compact
                  ariaLabel="Feedback Status ändern"
                  options={statusEditOptions}
                  onChange={(value) => updateStatus(row.id, value)}
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
