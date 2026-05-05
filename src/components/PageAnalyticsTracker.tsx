"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "alpivo_session_id";

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
    if (!pathname || pathname.startsWith("/api/")) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      const sessionId = getSessionId();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "";

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
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
