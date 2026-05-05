import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getSiteContent<T extends Record<string, string>>(key: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_content")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data || !data.value) return null;
    return data.value as T;
  } catch {
    return null;
  }
}
