"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import { supabase } from "@/lib/supabase";

type CallbackState = {
  status: "loading" | "error";
  message: string;
};

function accountTarget(authMode: string | null) {
  if (authMode === "recovery") return "/account?auth=recovery";
  if (authMode === "magic") return "/account?auth=magic";
  return "/account";
}

function readableError(value: string | null) {
  if (!value) return "Der Auth-Link konnte nicht verarbeitet werden.";
  return decodeURIComponent(value.replace(/\+/g, " "));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    message: "Alpivo bestätigt deinen sicheren Link.",
  });

  useEffect(() => {
    let mounted = true;

    const completeAuth = async () => {
      const url = new URL(window.location.href);
      const authMode = url.searchParams.get("auth");
      const authCode = url.searchParams.get("code");
      const authError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

      if (authError) {
        throw new Error(readableError(authError));
      }

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) throw error;
      } else {
        // Implicit-flow links are detected by the Supabase client during page load.
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      if (!mounted) return;
      router.replace(accountTarget(authMode));
    };

    completeAuth().catch((error: unknown) => {
      if (!mounted) return;
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Der Auth-Link konnte nicht verarbeitet werden.",
      });
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <Section className="flex min-h-[70vh] items-center justify-center py-16">
      <GlassCard className="w-full max-w-xl p-8 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Sicherer Alpivo-Link</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {state.status === "loading" ? "Link wird geprüft" : "Link konnte nicht geprüft werden"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">{state.message}</p>
        {state.status === "error" ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white" href="/account">
              Zur Kontoansicht
            </Link>
            <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10" href="/">
              Zur Startseite
            </Link>
          </div>
        ) : null}
      </GlassCard>
    </Section>
  );
}
