import {
  ACCESS_MODE_SETTING_KEY,
  getEnvAccessMode,
  normalizeAccessMode,
  type AlpivoAccessMode,
} from "@/lib/accessModeShared";

type CachedAccessMode = {
  mode: AlpivoAccessMode;
  expiresAt: number;
};

let cached: CachedAccessMode | null = null;

async function getAccessModeFromSupabase(): Promise<AlpivoAccessMode | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return null;

  try {
    const endpoint = new URL("/rest/v1/app_settings", url);
    endpoint.searchParams.set("key", `eq.${ACCESS_MODE_SETTING_KEY}`);
    endpoint.searchParams.set("select", "value");

    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const rows = (await response.json()) as Array<{ value: string }>;
    return normalizeAccessMode(rows[0].value);
  } catch {
    return null;
  }
}

export async function getProxyAccessMode() {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.mode;

  const mode = (await getAccessModeFromSupabase()) ?? getEnvAccessMode();
  cached = {
    mode,
    // Short cache keeps admin toggles responsive without hitting Supabase on every asset request.
    expiresAt: now + 3000,
  };
  return mode;
}
