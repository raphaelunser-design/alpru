import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeEmail } from "@/lib/adminShared";
import { getUserFromAccessToken } from "@/lib/authUser";
import { ensureProfileForUser, roleForEmail } from "@/lib/profiles";

function getTokenFromRequest(req: Request) {
  const authHeader = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const headerToken = (req.headers.get("x-admin-token") || "").trim();
  const urlToken = (new URL(req.url).searchParams.get("token") || "").trim();
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
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (roleForEmail(normalized) === "admin") return true;
  if (isEmailAllowed(normalized)) return true;

  try {
    const { data, error } = await supabaseAdmin
      .from("app_admins")
      .select("role")
      .eq("email", normalized)
      .eq("role", "admin")
      .maybeSingle();
    if (!error && data && data.role === "admin") return true;
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
    const user = await getUserFromAccessToken(token);
    if (user?.email) {
      const email = normalizeEmail(user.email);
      let profile: Awaited<ReturnType<typeof ensureProfileForUser>> = null;
      try {
        profile = await ensureProfileForUser(user);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[alpivo-admin] profile sync failed during admin check", { error, email });
        }
      }
      const profileIsAdmin = profile?.role === "admin";
      return { isAdmin: profileIsAdmin || (await isEmailAdmin(email)), email };
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[alpivo-admin] admin status check failed", { error });
    }
  }

  // Optional fallback: explicit ADMIN_TOKEN
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  if (adminToken && token === adminToken) return { isAdmin: true, email: null };

  return { isAdmin: false, email: null };
}

export async function isAdminRequest(req: Request) {
  return (await getAdminStatus(req)).isAdmin;
}
