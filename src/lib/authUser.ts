import "server-only";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getUserFromAccessToken(token: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) return data.user;
  } catch {
    // The admin client may be unavailable in local or misconfigured deployments.
    // Fall back to Supabase's public auth endpoint below so admin status checks
    // can still validate the user token and report a clear authorization result.
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as User;
}
