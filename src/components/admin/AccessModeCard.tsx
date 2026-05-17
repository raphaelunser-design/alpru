"use client";

import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { getAdminAuthContext, getAdminRequestHeaders } from "@/lib/adminClientAuth";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";
import type { AlpivoAccessMode } from "@/lib/accessModeShared";

type AccessModeResponse = {
  mode: AlpivoAccessMode;
  source: "supabase" | "environment" | "default";
  error?: string;
};

function statusLabel(mode: AlpivoAccessMode | null) {
  if (mode === "public") return "Öffentlich";
  if (mode === "private") return "Privat";
  return "Unbekannt";
}

function sourceLabel(source: AccessModeResponse["source"] | undefined) {
  if (source === "supabase") return "Supabase Einstellung";
  if (source === "environment") return "Environment Fallback";
  if (source === "default") return "System-Fallback";
  return "wird geladen";
}

export default function AccessModeCard() {
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<AlpivoAccessMode | null>(null);
  const [source, setSource] = useState<AccessModeResponse["source"]>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function readToken() {
    const context = await getAdminAuthContext();
    setHeaders(context.headers);
    return context.headers;
  }

  async function loadMode(nextHeaders = headers) {
    setLoading(true);
    setError("");
    try {
      const authHeaders = Object.keys(nextHeaders).length ? nextHeaders : await getAdminRequestHeaders();
      if (!Object.keys(authHeaders).length) throw new Error("Admin-Session fehlt. Bitte erneut anmelden oder Admin-Token nutzen.");

      const { response, body } = await fetchJsonWithTimeout<AccessModeResponse>(
        "/api/admin/access-mode",
        { headers: authHeaders, cache: "no-store" },
        12000
      );
      if (!response.ok) throw new Error(body?.error || "Access Mode konnte nicht geladen werden.");
      setMode(body?.mode ?? null);
      setSource(body?.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access Mode konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function updateMode(nextMode: AlpivoAccessMode) {
    const authHeaders = Object.keys(headers).length ? headers : await readToken();
    if (!Object.keys(authHeaders).length) {
      setError("Admin-Session fehlt. Bitte erneut anmelden oder Admin-Token nutzen.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { response, body } = await fetchJsonWithTimeout<AccessModeResponse>(
        "/api/admin/access-mode",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ mode: nextMode }),
        },
        12000
      );
      if (!response.ok) throw new Error(body?.error || "Access Mode konnte nicht gespeichert werden.");
      setMode(nextMode);
      setSource("supabase");
      setMessage(
        nextMode === "public"
          ? "Alpivo ist jetzt öffentlich zugänglich."
          : "Alpivo ist jetzt wieder privat geschützt."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access Mode konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    readToken().then((authHeaders) => loadMode(authHeaders));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPublic = mode === "public";

  return (
    <GlassCard className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Website-Zugriff</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Public / Private Beta</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Steuert zentral, ob Alpivo ohne Zugangscode erreichbar ist oder wieder über die Beta-Freigabe geschützt wird.
          </p>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            isPublic
              ? "border-emerald-200/25 bg-emerald-200/12 text-emerald-100"
              : "border-amber-200/25 bg-amber-200/12 text-amber-100"
          }`}
        >
          {loading ? "Lade..." : statusLabel(mode)}
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-4 text-sm md:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Aktueller Modus</div>
          <div className="mt-1 font-semibold text-white">{loading ? "wird geladen" : statusLabel(mode)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Quelle</div>
          <div className="mt-1 font-semibold text-white">{sourceLabel(source)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Privater Code</div>
          <div className="mt-1 font-semibold text-white">über Environment Variable</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={saving || loading || mode === "public"}
          onClick={() => updateMode("public")}
          className="button-lift rounded-xl bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Website öffentlich schalten
        </button>
        <button
          type="button"
          disabled={saving || loading || mode === "private"}
          onClick={() => updateMode("private")}
          className="button-lift rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Website privat schalten
        </button>
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => loadMode()}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Status neu laden
        </button>
      </div>

      {message ? <div className="mt-4 rounded-lg border border-emerald-200/20 bg-emerald-200/10 p-3 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="mt-4 rounded-lg border border-red-200/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
    </GlassCard>
  );
}
