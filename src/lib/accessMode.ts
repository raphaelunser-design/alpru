import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ACCESS_MODE_SETTING_KEY, getEnvAccessMode, normalizeAccessMode, type AlpivoAccessMode } from "@/lib/accessModeShared";

export type AccessModeState = {
  mode: AlpivoAccessMode;
  source: "supabase" | "environment" | "default";
};

export async function getAccessModeFromSettings(): Promise<AlpivoAccessMode | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", ACCESS_MODE_SETTING_KEY)
      .maybeSingle();

    if (error) return null;
    return data ? normalizeAccessMode(data.value) : null;
  } catch {
    return null;
  }
}

export async function getAccessMode(): Promise<AccessModeState> {
  const dbMode = await getAccessModeFromSettings();
  if (dbMode) return { mode: dbMode, source: "supabase" };

  const envMode = normalizeAccessMode(process.env.ALPIVO_ACCESS_MODE);
  if (envMode) return { mode: envMode, source: "environment" };

  return { mode: getEnvAccessMode(), source: "default" };
}

export async function updateAccessMode(mode: AlpivoAccessMode, updatedBy: string | null) {
  const normalized = normalizeAccessMode(mode);
  if (!normalized) throw new Error("Invalid access mode");

  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .upsert(
      {
        key: ACCESS_MODE_SETTING_KEY,
        value: normalized,
        updated_by: updatedBy ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .select("key,value,updated_at,updated_by")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
