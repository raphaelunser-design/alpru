import "server-only";
import { loadAllResortRows, loadResortDetailRow, type ResortDetailResult, type ResortLoadResult } from "@/lib/resortRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function readPublicCatalog<T>(path: string): Promise<T | null> {
  if (process.env.VERCEL_ENV !== "preview") return null;

  try {
    const response = await fetch(`https://alpivo.de/api/resorts${path}`, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    });
    return response.ok ? await response.json() as T : null;
  } catch {
    return null;
  }
}

export async function loadPublicResorts(): Promise<ResortLoadResult> {
  const result = await loadAllResortRows(supabaseAdmin, { orderBy: "name" });
  if (!result.usingFallback) return result;

  const published = await readPublicCatalog<ResortLoadResult>("");
  if (published?.source === "supabase" && published.usingFallback === false && Array.isArray(published.resorts) && published.resorts.length) {
    return { ...published, error: null };
  }
  return result;
}

export async function loadPublicResortDetail(slug: string): Promise<ResortDetailResult> {
  const result = await loadResortDetailRow(supabaseAdmin, slug);
  if (result.resort && !result.usingFallback) return result;

  const published = await readPublicCatalog<ResortDetailResult>(`/${encodeURIComponent(slug)}`);
  if (published?.source === "supabase" && published.usingFallback === false && typeof published.resort?.name === "string") {
    return { ...published, error: null };
  }
  return result;
}
