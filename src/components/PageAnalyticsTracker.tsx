"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "alpivo_session_id";
const hasPublicSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const next =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `alpivo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return null;
  }
}

export default function PageAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!hasPublicSupabaseConfig) return;
    if (!pathname || pathname.startsWith("/api/")) return;

    let cancelled = false;
    let idleId: number | null = null;
    const run = async () => {
      if (cancelled) return;
      const sessionId = getSessionId();
      const token = await import("@/lib/supabase")
        .then(({ supabase }) => supabase.auth.getSession())
        .then(({ data }) => data.session?.access_token ?? "")
        .catch(() => "");

      await fetch("/api/analytics/page-event", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          path: `${window.location.pathname}${window.location.search}`,
          referrer: document.referrer || null,
          sessionId,
          eventType: "page_view",
        }),
        keepalive: true,
      }).catch(() => null);
    };

    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(run, { timeout: 2500 });
      } else {
        void run();
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [pathname]);

  return null;
}
