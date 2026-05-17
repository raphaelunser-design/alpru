"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { clearStoredAdminToken, getAdminAuthContext, saveStoredAdminToken } from "@/lib/adminClientAuth";
import { isOwnerAdminEmail } from "@/lib/adminShared";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";

type AdminGateState = {
  loading: boolean;
  isAdmin: boolean;
  email: string | null;
  reason: "loading" | "logged-out" | "forbidden" | "allowed";
  authSource: "supabase" | "token" | "none";
};

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminGateState>({
    loading: true,
    isAdmin: false,
    email: null,
    reason: "loading",
    authSource: "none",
  });
  const [manualToken, setManualToken] = useState("");
  const [tokenMessage, setTokenMessage] = useState("");

  const checkAdmin = useCallback(async () => {
    let mounted = true;

    const context = await getAdminAuthContext();
    const ownerFallback = isOwnerAdminEmail(context.email);

    if (!Object.keys(context.headers).length && !ownerFallback) {
      if (mounted) setState({ loading: false, isAdmin: false, email: context.email, reason: "logged-out", authSource: context.source });
      return () => {
        mounted = false;
      };
    }

    try {
      const { response, body } = await fetchJsonWithTimeout<{ isAdmin: boolean; email: string | null }>(
        "/api/admin/me",
        {
          headers: context.headers,
          cache: "no-store",
        },
        10000
      );

      if (!mounted) return;
      const isAdmin = Boolean(response.ok && body?.isAdmin) || ownerFallback;
      setState({
        loading: false,
        isAdmin,
        email: body?.email ?? context.email,
        reason: isAdmin ? "allowed" : "forbidden",
        authSource: context.source,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[alpivo-admin] admin status request failed", { error, email: context.email });
      }
      if (mounted) {
        setState({
          loading: false,
          isAdmin: ownerFallback,
          email: context.email,
          reason: ownerFallback ? "allowed" : "forbidden",
          authSource: context.source,
        });
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const cleanupPromise = checkAdmin();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => undefined);
    };
  }, [checkAdmin]);

  if (state.loading) {
    return (
      <Section>
        <GlassCard className="p-6 text-sm text-slate-300">Adminrechte werden geprüft...</GlassCard>
      </Section>
    );
  }

  if (!state.isAdmin) {
    return (
      <Section>
        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Adminzugriff</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            {state.reason === "logged-out" ? "Login erforderlich" : "Keine Adminrechte"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            {state.reason === "logged-out"
              ? "Melde dich mit dem Alpivo-Konto an, das Adminrechte besitzt, oder nutze den Admin-Token-Fallback."
              : `Dieses Konto${state.email ? ` (${state.email})` : state.authSource === "token" ? " mit gespeichertem Admin-Token" : ""} ist nicht als Alpivo-Admin freigegeben.`}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account"
              className="button-lift inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
            >
              Zum Login
            </Link>
            {state.authSource === "token" ? (
              <button
                type="button"
                onClick={() => {
                  clearStoredAdminToken();
                  setState((current) => ({ ...current, loading: true }));
                  void checkAdmin();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Admin-Token entfernen
              </button>
            ) : null}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="admin-token">
              Admin-Token Fallback
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="admin-token"
                type="password"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="ADMIN_TOKEN eingeben"
                className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-200/50"
              />
              <button
                type="button"
                onClick={() => {
                  saveStoredAdminToken(manualToken);
                  setManualToken("");
                  setTokenMessage("Admin-Token lokal gespeichert. Zugriff wird erneut geprüft.");
                  setState((current) => ({ ...current, loading: true }));
                  void checkAdmin();
                }}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Prüfen
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Wird nur lokal in diesem Browser gespeichert und als <code>x-admin-token</code> an Admin-APIs gesendet.
            </p>
            {tokenMessage ? <p className="mt-2 text-xs text-emerald-200">{tokenMessage}</p> : null}
          </div>
        </GlassCard>
      </Section>
    );
  }

  return <>{children}</>;
}
