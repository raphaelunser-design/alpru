"use client";

import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | string;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
  feedback_count: number;
  page_event_count: number;
};

const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" });
const number = new Intl.NumberFormat("de-DE");

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateTime.format(date);
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error("Admin-Session fehlt. Bitte erneut anmelden.");
      const { response, body } = await fetchJsonWithTimeout<{ data?: AdminUser[]; error?: string }>(
        "/api/admin/users",
        { headers, cache: "no-store" },
        12000
      );

      if (!response.ok) throw new Error(body?.error ?? "Nutzer konnten nicht geladen werden.");
      setUsers(body?.data ?? []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nutzer konnten nicht geladen werden.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      return [user.email, user.display_name, user.role].some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [query, users]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      withFeedback: users.filter((user) => user.feedback_count > 0).length,
      active: users.filter((user) => user.page_event_count > 0).length,
    };
  }, [users]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Accounts</div>
          <div className="mt-2 text-3xl font-semibold text-white">{number.format(stats.total)}</div>
          <div className="mt-1 text-xs text-slate-400">Registrierte Profile</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Admins</div>
          <div className="mt-2 text-3xl font-semibold text-white">{number.format(stats.admins)}</div>
          <div className="mt-1 text-xs text-slate-400">Rolle admin</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Feedback</div>
          <div className="mt-2 text-3xl font-semibold text-white">{number.format(stats.withFeedback)}</div>
          <div className="mt-1 text-xs text-slate-400">Nutzer mit Feedback</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aktiv</div>
          <div className="mt-2 text-3xl font-semibold text-white">{number.format(stats.active)}</div>
          <div className="mt-1 text-xs text-slate-400">Mit Page Events</div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Nutzerverwaltung</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Registrierte Beta-Accounts</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name oder E-Mail suchen"
              className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
            />
            <button
              type="button"
              onClick={loadUsers}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Laden
            </button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <div className="hidden grid-cols-[1.2fr_1fr_0.55fr_0.65fr_0.65fr_0.9fr] gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500 lg:grid">
            <div>Nutzer</div>
            <div>E-Mail</div>
            <div>Rolle</div>
            <div>Feedback</div>
            <div>Events</div>
            <div>Aktivität</div>
          </div>

          {loading ? <div className="p-5 text-sm text-slate-300">Nutzer werden geladen...</div> : null}
          {!loading && filtered.length === 0 ? (
            <div className="p-5 text-sm text-slate-300">Keine Nutzer für diese Suche gefunden.</div>
          ) : null}

          {filtered.map((user) => (
            <div
              key={user.id}
              className="grid gap-2 border-b border-white/10 px-4 py-4 text-sm last:border-b-0 lg:grid-cols-[1.2fr_1fr_0.55fr_0.65fr_0.65fr_0.9fr] lg:items-center"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-white">{user.display_name || "Ohne Anzeigename"}</div>
                <div className="mt-1 text-xs text-slate-500">Erstellt: {formatDate(user.created_at)}</div>
              </div>
              <div className="break-all text-slate-300">{user.email || "-"}</div>
              <div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    user.role === "admin"
                      ? "border-sky-200/25 bg-sky-200/12 text-sky-100"
                      : "border-white/10 bg-white/[0.06] text-slate-300"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "User"}
                </span>
              </div>
              <div className="text-slate-200">{number.format(user.feedback_count)}</div>
              <div className="text-slate-200">{number.format(user.page_event_count)}</div>
              <div className="text-slate-400">{formatDate(user.last_seen_at)}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
