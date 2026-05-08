"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";
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

type RangeDays = 7 | 30 | 90;

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
  meta?: { rangeDays: number };
};

const number = new Intl.NumberFormat("de-DE");
const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" });
const dayFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });
const fullDayFormatter = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
const rangeOptions: RangeDays[] = [7, 30, 90];

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

function formatFullDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return fullDayFormatter.format(date);
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

function ChartSummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{hint}</div>
    </div>
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function AdminAnalyticsClient({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalytics(days: RangeDays = rangeDays) {
    setLoading((current) => current && !data);
    setRefreshing(true);
    setError("");
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error("Admin-Session fehlt. Bitte erneut anmelden.");
      const { response, body } = await fetchJsonWithTimeout<AdminAnalyticsPayload & { error?: string }>(
        `/api/admin/analytics?days=${days}`,
        { headers, cache: "no-store" },
        15000
      );

      if (!response.ok || !body) {
        throw new Error(body?.error ?? "Analytics konnten nicht geladen werden.");
      }

      setData(body);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Analytics konnten nicht geladen werden.");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalytics(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxViews = useMemo(() => {
    return Math.max(1, ...(data?.timeSeries.map((point) => point.views) ?? [1]));
  }, [data]);

  const chartSummary = useMemo(() => {
    const points = data?.timeSeries ?? [];
    const total = points.reduce((sum, point) => sum + point.views, 0);
    const average = points.length ? Math.round(total / points.length) : 0;
    const peak = points.reduce<TimeSeriesPoint | null>((best, point) => (!best || point.views > best.views ? point : best), null);
    const lastWithViews = [...points].reverse().find((point) => point.views > 0);
    return {
      average,
      peak,
      lastActivity: data?.recentEvents[0]?.created_at ?? lastWithViews?.date ?? null,
    };
  }, [data]);

  const labelStep = rangeDays === 7 ? 1 : rangeDays === 30 ? 5 : 15;

  if (loading) {
    return <GlassCard className="p-6 text-sm text-slate-300">Traffic-Daten werden geladen...</GlassCard>;
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-sm text-red-100">{error}</div>
        <button
          type="button"
          onClick={() => loadAnalytics(rangeDays)}
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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Verlauf</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Page Views der letzten {rangeDays} Tage</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
                {rangeOptions.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setRangeDays(days);
                      void loadAnalytics(days);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      rangeDays === days ? "bg-sky-200 text-slate-950" : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {days} Tage
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => loadAnalytics(rangeDays)}
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                {refreshing ? "Lädt..." : "Aktualisieren"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <ChartSummaryCard label="Durchschnitt / Tag" value={number.format(chartSummary.average)} hint="im gewählten Zeitraum" />
            <ChartSummaryCard
              label="Stärkster Tag"
              value={chartSummary.peak ? number.format(chartSummary.peak.views) : "-"}
              hint={chartSummary.peak ? formatFullDay(chartSummary.peak.date) : "keine Views"}
            />
            <ChartSummaryCard
              label="Letzte Aktivität"
              value={chartSummary.lastActivity ? (chartSummary.lastActivity.includes("T") ? formatDate(chartSummary.lastActivity) : formatFullDay(chartSummary.lastActivity)) : "-"}
              hint="letzter Page View"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/24 px-3 pb-3 pt-4">
            <div
              className="grid h-48 items-end gap-1 sm:gap-1.5"
              style={{ gridTemplateColumns: `repeat(${data.timeSeries.length}, minmax(0, 1fr))` }}
            >
              {data.timeSeries.map((point, index) => {
                const showLabel = index === 0 || index === data.timeSeries.length - 1 || index % labelStep === 0;
                return (
                  <div key={point.date} className="group relative flex min-w-0 flex-col items-center gap-2">
                    <div className="relative flex h-40 w-full items-end justify-center">
                      <div
                        className="w-full max-w-5 rounded-t-md bg-sky-200/65 transition group-hover:bg-sky-100"
                        style={{ height: `${Math.max(6, (point.views / maxViews) * 150)}px` }}
                      />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-white/12 bg-slate-950 px-3 py-2 text-xs shadow-[0_14px_42px_rgba(0,0,0,0.38)] group-hover:block">
                        <div className="font-semibold text-white">{number.format(point.views)} Views</div>
                        <div className="mt-0.5 text-slate-400">{formatFullDay(point.date)}</div>
                      </div>
                    </div>
                    <span className={`h-4 text-[10px] leading-4 ${showLabel ? "text-slate-500" : "text-transparent"}`}>
                      {showLabel ? formatDay(point.date) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
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
