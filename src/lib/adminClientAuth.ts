"use client";

import { supabase } from "@/lib/supabase";

export const ADMIN_TOKEN_STORAGE_KEY = "alpivo-admin-token";

export type AdminAuthContext = {
  headers: Record<string, string>;
  email: string | null;
  source: "supabase" | "token" | "none";
};

export function getStoredAdminToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() ?? "";
}

export function saveStoredAdminToken(token: string) {
  if (typeof window === "undefined") return;
  const cleaned = token.trim();
  if (cleaned) window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, cleaned);
  else window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function clearStoredAdminToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export async function getAdminAuthContext(): Promise<AdminAuthContext> {
  const storedToken = getStoredAdminToken();

  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token ?? "";
    if (accessToken) {
      return {
        headers: { Authorization: `Bearer ${accessToken}` },
        email: data.session?.user?.email ?? null,
        source: "supabase",
      };
    }
  } catch {
    // Fall through to explicit admin token. This keeps the admin area usable if
    // Supabase client auth is temporarily unavailable.
  }

  if (storedToken) return { headers: { "x-admin-token": storedToken }, email: null, source: "token" };
  return { headers: {}, email: null, source: "none" };
}

export async function getAdminRequestHeaders() {
  return (await getAdminAuthContext()).headers;
}
