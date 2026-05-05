"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";

type AnalyticsKpis = {
  totalPageViews: number;
  pageViewsToday: number;
  pageViews7d: number;
  pageViews30d: number;
  totalUsers: number;
  newUsers7d: number;
  totalFeedback: number;
  openFeedback: number;
  uniqueSessions30d: number;
  activeUsers30d: number;
};

type TopPage = {
  path: string;
  views: number;
};

type TimeSeriesPoint = {
  date: string;
  views: number;
};

type RecentEvent = {
  id: string;
  user_email: string | null;
  path: string;
  referrer: string | null;
  event_type: string;
  device_type: string | null;
  browser: string | null;
  created_at: string;
};

type RecentUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  created_at: string;
  last_seen_at: string | null;
};

type RecentFeedback = {
  id: string;
  user_email: string | null;
  display_name: string | null;
  category: string | null;
  feedback_type: string | null;
  message: string;
  page_path: string | null;
  page_url: string | null;
  status: string;
  created_at: string;
};

export type AdminAnalyticsPayload = {
  kpis: AnalyticsKpis;
  topPages: TopPage[];
  timeSeries: TimeSeriesPoint[];
  recentEvents: RecentEvent[];
  recentUsers: RecentUser[];
  recentFeedback: RecentFeedback[];
};

const number = new Intl.NumberFormat("de-DE");
const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" });
const dayFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateTime.format(date);
}

function formatDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value.slice(5);
  return dayFormatter.format(date);
}

function KpiCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <GlassCard className="p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{number.format(value)}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div>
    </GlassCard>
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function AdminAnalyticsClient({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");
    const headers = await authHeaders();
    const response = await fetch("/api/admin/analytics", { headers });
    const body = (await response.json().catch(() => null)) as AdminAnalyticsPayload & { error?: string } | null;

    if (!response.ok || !body) {
      setError(body?.error ?? "Analytics konnten nicht geladen werden.");
      setData(null);
      setLoading(false);
      return;
    }

    setData(body);
    setLoading(false);
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const maxViews = useMemo(() => {
    return Math.max(1, ...(data?.timeSeries.map((point) => point.views) ?? [1]));
  }, [data]);

  if (loading) {
    return <GlassCard className="p-6 text-sm text-slate-300">Traffic-Daten werden geladen...</GlassCard>;
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-sm text-red-100">{error}</div>
        <button
          type="button"
          onClick={loadAnalytics}
          className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Erneut laden
        </button>
      </GlassCard>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Besuche gesamt" value={data.kpis.totalPageViews} hint="Alle gespeicherten Page Views" />
        <KpiCard label="Heute" value={data.kpis.pageViewsToday} hint="Page Views seit Tagesbeginn" />
        <KpiCard label="7 Tage" value={data.kpis.pageViews7d} hint="Nutzung der letzten Woche" />
        <KpiCard label="Accounts" value={data.kpis.totalUsers} hint={`${number.format(data.kpis.newUsers7d)} neu in 7 Tagen`} />
      </div>

      {!compact ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="30 Tage" value={data.kpis.pageViews30d} hint="Page Views im Monatsfenster" />
          <KpiCard label="Sessions" value={data.kpis.uniqueSessions30d} hint="Anonyme Beta-Sessions in 30 Tagen" />
          <KpiCard label="Aktive Nutzer" value={data.kpis.activeUsers30d} hint="Eingeloggte Nutzer mit Events" />
          <KpiCard label="Feedback" value={data.kpis.totalFeedback} hint={`${number.format(data.kpis.openFeedback)} offen oder geplant`} />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Verlauf</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Page Views der letzten 30 Tage</h2>
            </div>
            <button
              type="button"
              onClick={loadAnalytics}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Aktualisieren
            </button>
          </div>
          <div className="mt-5 flex h-44 items-end gap-1 overflow-x-auto pb-2">
            {data.timeSeries.map((point) => (
              <div key={point.date} className="flex min-w-7 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-sky-200/70"
                  style={{ height: `${Math.max(8, (point.views / maxViews) * 135)}px` }}
                  title={`${formatDay(point.date)}: ${point.views} Views`}
                />
                <span className="text-[10px] text-slate-500">{formatDay(point.date)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Top Seiten</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Meist besuchte Bereiche</h2>
          <div className="mt-5 grid gap-2">
            {data.topPages.length ? (
              data.topPages.slice(0, compact ? 6 : 10).map((page) => (
                <div key={page.path} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-slate-200">{page.path}</span>
                  <span className="text-sm font-semibold text-white">{number.format(page.views)}</span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
                Noch keine Seitenaufrufe gespeichert.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {!compact ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Letzte Nutzer</p>
            <div className="mt-4 grid gap-2">
              {data.recentUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                  <div className="truncate text-sm font-semibold text-white">{user.display_name || user.email || "Unbenannter Nutzer"}</div>
                  <div className="mt-1 truncate text-xs text-slate-400">{user.email || "Keine E-Mail"}</div>
                  <div className="mt-2 text-xs text-slate-500">{formatDate(user.created_at)}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Letzte Aktivität</p>
            <div className="mt-4 grid gap-2">
              {data.recentEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                  <div className="truncate text-sm text-white">{event.path}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {event.user_email || "anonym"} · {event.device_type || "Gerät offen"} · {event.browser || "Browser offen"}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{formatDate(event.created_at)}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Letztes Feedback</p>
            <div className="mt-4 grid gap-2">
              {data.recentFeedback.slice(0, 10).map((feedback) => (
                <div key={feedback.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                  <div className="text-xs text-slate-400">{feedback.display_name || feedback.user_email || "anonym"}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-white">{feedback.message}</div>
                  <div className="mt-2 text-xs text-slate-500">{formatDate(feedback.created_at)}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
