import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization").replace("Bearer ", "");
  const headerToken = req.headers.get("x-admin-token");
  const urlToken = new URL(req.url).searchParams.get("token");
  return authHeader || headerToken || urlToken || "";
}

function isEmailAllowed(email: string) {
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length) return false;
  return allow.includes(email.toLowerCase());
}

async function isEmailAdmin(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (isEmailAllowed(normalized)) return true;

  try {
    const { data, error } = await supabaseAdmin
      .from("app_admins")
      .select("role")
      .eq("email", normalized)
      .eq("role", "admin")
      .maybeSingle();
    if (!error && data.role === "admin") return true;
  } catch {
    // Migration may not exist in older local environments. ADMIN_EMAILS remains the fallback.
  }

  return false;
}

export async function getAdminStatus(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) return { isAdmin: false, email: null };

  // Email-based admin via Supabase Auth
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user.email) {
      const email = data.user.email.toLowerCase();
      return { isAdmin: await isEmailAdmin(email), email };
    }
  } catch {
    // ignore
  }

  // Optional fallback: explicit ADMIN_TOKEN
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (adminToken && token === adminToken) return { isAdmin: true, email: null };

  return { isAdmin: false, email: null };
}

export async function isAdminRequest(req: Request) {
  return (await getAdminStatus(req)).isAdmin;
}
