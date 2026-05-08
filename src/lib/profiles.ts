import "server-only";
import type { User } from "@supabase/supabase-js";
import { isOwnerAdminEmail, normalizeEmail } from "@/lib/adminShared";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ProfileRole = "user" | "admin";

export type ProfileRecord = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
};

export function roleForEmail(email: string | null | undefined): ProfileRole {
  return isOwnerAdminEmail(email) ? "admin" : "user";
}

function fallbackDisplayName(user: Pick<User, "email" | "user_metadata">) {
  const metaName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "";
  const cleanMeta = metaName.trim();
  if (cleanMeta) return cleanMeta.slice(0, 80);
  const email = normalizeEmail(user.email);
  return email ? email.split("@")[0].slice(0, 80) : "Alpivo Nutzer";
}

export async function ensureProfileForUser(user: Pick<User, "id" | "email" | "user_metadata">) {
  const email = normalizeEmail(user.email);
  const desiredRole = roleForEmail(email);

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id,email,display_name,avatar_url,role,created_at,updated_at,last_seen_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  const payload = {
    id: user.id,
    email,
    display_name: existing?.display_name || fallbackDisplayName(user),
    role: desiredRole === "admin" ? "admin" : existing?.role || "user",
    last_seen_at: new Date().toISOString(),
  };

  const query = existing
    ? supabaseAdmin
        .from("profiles")
        .update({
          email: payload.email,
          display_name: payload.display_name,
          role: payload.role,
          last_seen_at: payload.last_seen_at,
        })
        .eq("id", user.id)
    : supabaseAdmin.from("profiles").insert(payload);

  const { error } = await query;
  if (error) {
    // Older deployments may not have the migration yet; keep auth usable and let
    // the UI show a graceful fallback.
    return null;
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id,email,display_name,avatar_url,role,created_at,updated_at,last_seen_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  return data ?? null;
}

export async function updateProfileName(userId: string, displayName: string) {
  const cleaned = displayName.replace(/\s+/g, " ").trim().slice(0, 80);
  if (cleaned.length < 2) throw new Error("Der Anzeigename muss mindestens 2 Zeichen haben.");

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ display_name: cleaned })
    .eq("id", userId)
    .select("id,email,display_name,avatar_url,role,created_at,updated_at,last_seen_at")
    .maybeSingle<ProfileRecord>();

  if (error) throw new Error(error.message);
  return data;
}
