import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (cachedBrowserClient) return cachedBrowserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const safeUrl = url || "https://placeholder.supabase.co";
  const safeAnonKey = anonKey || "placeholder-anon-key";

  if ((!url || !anonKey) && typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn("[alpivo] Supabase public env vars are missing. Client auth/data calls run in local fallback mode.");
  }

  cachedBrowserClient = createBrowserClient(safeUrl, safeAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "alpivo-auth",
    },
  });

  return cachedBrowserClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
