"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { isOwnerAdminEmail } from "@/lib/adminShared";
import { fetchJsonWithTimeout } from "@/lib/clientFetch";
import { supabase } from "@/lib/supabase";

type AdminGateState = {
  loading: boolean;
  isAdmin: boolean;
  email: string | null;
  reason: "loading" | "logged-out" | "forbidden" | "allowed";
};

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdminGateState>({
    loading: true,
    isAdmin: false,
    email: null,
    reason: "loading",
  });

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "";
      const email = data.session?.user?.email ?? null;
      const ownerFallback = isOwnerAdminEmail(email);

      if (sessionError && process.env.NODE_ENV !== "production") {
        console.warn("[alpivo-admin] Supabase session could not be read", { error: sessionError.message });
      }

      if (!token && !ownerFallback) {
        if (mounted) setState({ loading: false, isAdmin: false, email, reason: "logged-out" });
        return;
      }

      try {
        const { response, body } = await fetchJsonWithTimeout<{ isAdmin: boolean; email: string | null }>(
          "/api/admin/me",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: "no-store",
          },
          10000
        );

        if (!mounted) return;
        const isAdmin = Boolean(response.ok && body?.isAdmin) || ownerFallback;
        setState({
          loading: false,
          isAdmin,
          email: body?.email ?? email,
          reason: isAdmin ? "allowed" : "forbidden",
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[alpivo-admin] admin status request failed", { error, email });
        }
        if (mounted) {
          setState({
            loading: false,
            isAdmin: ownerFallback,
            email,
            reason: ownerFallback ? "allowed" : "forbidden",
          });
        }
      }
    };

    check();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
              ? "Melde dich mit dem Alpivo-Konto an, das Adminrechte besitzt."
              : `Dieses Konto${state.email ? ` (${state.email})` : ""} ist nicht als Alpivo-Admin freigegeben.`}
          </p>
          <Link
            href="/account"
            className="button-lift mt-5 inline-flex min-h-11 items-center rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
          >
            Zum Login
          </Link>
        </GlassCard>
      </Section>
    );
  }

  return <>{children}</>;
}
