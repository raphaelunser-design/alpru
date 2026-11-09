import type { MatchPayload, MatchResultMeta, MatchResultSnapshot, ResortQuery } from "./matchPayload";

export async function requestMatch(
  prefs: MatchPayload,
  filters: ResortQuery,
  originLabel: string,
  signal?: AbortSignal,
): Promise<MatchResultSnapshot & { meta: MatchResultMeta }> {
  const response = await fetch("/api/match", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(prefs),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data?.results)) {
    const message = typeof data?.error === "string" ? data.error : "Fehler beim Matching";
    throw Object.assign(new Error(message), { status: response.status });
  }

  const results = data.results;
  const excluded = Array.isArray(data.excluded) ? data.excluded : [];
  return {
    results,
    excluded,
    meta: {
      createdAt: new Date().toISOString(),
      source: data.source ?? "unknown",
      usingFallback: Boolean(data.usingFallback),
      total: data.total ?? results.length,
      loaded: data.loaded ?? results.length,
      resultCount: results.length,
      excludedCount: excluded.length,
      prefs,
      filters,
      originLabel,
    },
  };
}
