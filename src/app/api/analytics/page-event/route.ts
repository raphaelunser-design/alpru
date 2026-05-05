import { NextResponse } from "next/server";
import { ensureProfileForUser } from "@/lib/profiles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function clean(value: unknown, max = 500) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function detectDevice(userAgent: string) {
  const lower = userAgent.toLowerCase();
  if (/mobile|iphone|android/.test(lower)) return "mobile";
  if (/ipad|tablet/.test(lower)) return "tablet";
  return "desktop";
}

function detectBrowser(userAgent: string) {
  const lower = userAgent.toLowerCase();
  if (lower.includes("edg/")) return "Edge";
  if (lower.includes("chrome/")) return "Chrome";
  if (lower.includes("safari/") && !lower.includes("chrome/")) return "Safari";
  if (lower.includes("firefox/")) return "Firefox";
  return "Unbekannt";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      referrer?: string;
      sessionId?: string;
      eventType?: string;
    };

    const path = clean(body.path, 500);
    if (!path || path.startsWith("/api/")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
        await ensureProfileForUser(data.user);
      }
    }

    const userAgent = clean(req.headers.get("user-agent"), 700);
    const { error } = await supabaseAdmin.from("page_events").insert({
      user_id: userId,
      user_email: userEmail,
      path,
      referrer: clean(body.referrer, 700) || null,
      user_agent: userAgent || null,
      event_type: body.eventType === "page_view" || !body.eventType ? "page_view" : "page_view",
      session_id: clean(body.sessionId, 120) || null,
      device_type: userAgent ? detectDevice(userAgent) : null,
      browser: userAgent ? detectBrowser(userAgent) : null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Page Event konnte nicht gespeichert werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
