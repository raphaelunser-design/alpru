import type { SupabaseClient } from "@supabase/supabase-js";
import { findMvpResortBySlug, getMvpResorts, sanitizeResortRow, sanitizeResortRows } from "@/lib/mvpResorts";
import { resortSignalSelect, resortSignalSelectWithEvents, type ResortSignalRow } from "@/lib/resortSignals";

export type ResortDataSource = "supabase" | "fallback";
export type FallbackReason = "empty" | "error" | null;

export type ResortLoadResult<T extends ResortSignalRow = ResortSignalRow> = {
  resorts: T[];
  total: number;
  loaded: number;
  source: ResortDataSource;
  usingFallback: boolean;
  fallbackReason: FallbackReason;
  error: string | null;
  pageSize: number;
  hasMore: boolean;
};

export type ResortDetailRow = ResortSignalRow & {
  skipass_price_currency: string | null;
  skipass_price_last_checked: string | null;
  skipass_price_note: string | null;
  distance_km: number | null;
  drive_hours: number | null;
};

export type ResortDetailResult = {
  resort: ResortDetailRow | null;
  source: ResortDataSource;
  usingFallback: boolean;
  fallbackReason: FallbackReason;
  error: string | null;
};

export const RESORT_FETCH_PAGE_SIZE = 1000;
export const resortDetailSelectBase = [
  resortSignalSelect,
  "skipass_price_currency",
  "skipass_price_last_checked",
  "skipass_price_note",
].join(",");
export const resortDetailSelect = [
  resortSignalSelectWithEvents,
  "skipass_price_currency",
  "skipass_price_last_checked",
  "skipass_price_note",
].join(",");

function fallbackRows<T extends ResortSignalRow = ResortSignalRow>() {
  return getMvpResorts() as T[];
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Resortdaten konnten nicht geladen werden.";
}

function withDetailDefaults(row: ResortSignalRow | ResortDetailRow): ResortDetailRow {
  const detail = row as Partial<ResortDetailRow>;
  return {
    ...row,
    skipass_price_currency: detail.skipass_price_currency ?? "EUR",
    skipass_price_last_checked: detail.skipass_price_last_checked ?? null,
    skipass_price_note: detail.skipass_price_note ?? null,
    distance_km: detail.distance_km ?? null,
    drive_hours: detail.drive_hours ?? null,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function slugVariants(slug: string) {
  const variants = new Set([slug]);
  const aliases: Record<string, string[]> = {
    "st-anton-am-arlberg": ["st-anton-st-christoph-stuben"],
  };
  for (const alias of aliases[slug] ?? []) variants.add(alias);
  if (slug.startsWith("st-")) variants.add(slug.replace(/^st-/, "sankt-"));
  if (slug.startsWith("sankt-")) variants.add(slug.replace(/^sankt-/, "st-"));
  return Array.from(variants).filter(Boolean);
}

async function findResortDetail(client: SupabaseClient, safeSlug: string, select: string) {
  let resolved: ResortDetailRow | null = null;
  let loadError: string | null = null;

  for (const variant of slugVariants(safeSlug)) {
    const { data, error } = await client.from("resorts").select(select).eq("slug", variant).maybeSingle();
    if (error) loadError = error.message;
    if (data) {
      resolved = data as unknown as ResortDetailRow;
      break;
    }
  }

  if (!resolved && isUuid(safeSlug)) {
    const { data, error } = await client.from("resorts").select(select).eq("id", safeSlug).maybeSingle();
    if (error) loadError = error.message;
    if (data) resolved = data as unknown as ResortDetailRow;
  }

  return { resolved, loadError };
}

export async function loadAllResortRows<T extends ResortSignalRow = ResortSignalRow>(
  client: SupabaseClient,
  options: {
    select?: string;
    orderBy?: string;
    ascending?: boolean;
    pageSize?: number;
  } = {}
): Promise<ResortLoadResult<T>> {
  const pageSize = options.pageSize ?? RESORT_FETCH_PAGE_SIZE;
  const select = options.select ?? resortSignalSelectWithEvents;
  const orderBy = options.orderBy ?? "name";
  const ascending = options.ascending ?? true;

  try {
    const rows: T[] = [];
    let total: number | null = null;
    let offset = 0;

    while (true) {
      const { data, error, count } = await client
        .from("resorts")
        .select(select, { count: offset === 0 ? "exact" : undefined })
        .order(orderBy, { ascending })
        .range(offset, offset + pageSize - 1)
        .returns<T[]>();

      if (error) throw error;
      if (typeof count === "number") total = count;

      const page = data ?? [];
      rows.push(...page);

      if (!page.length || page.length < pageSize) break;
      if (typeof total === "number" && rows.length >= total) break;
      offset += pageSize;
    }

    const sanitized = sanitizeResortRows(rows) as T[];
    if (sanitized.length) {
      return {
        resorts: sanitized,
        total: total ?? sanitized.length,
        loaded: sanitized.length,
        source: "supabase",
        usingFallback: false,
        fallbackReason: null,
        error: null,
        pageSize,
        hasMore: typeof total === "number" ? sanitized.length < total : false,
      };
    }

    const fallback = fallbackRows<T>();
    return {
      resorts: fallback,
      total: fallback.length,
      loaded: fallback.length,
      source: "fallback",
      usingFallback: true,
      fallbackReason: "empty",
      error: null,
      pageSize,
      hasMore: false,
    };
  } catch (error) {
    const message = errorMessage(error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[alpivo-resorts] Supabase resort query failed; falling back defensively", {
        orderBy,
        ascending,
        pageSize,
        select: options.select ? "custom" : select === resortSignalSelectWithEvents ? "signals-with-events" : "signals",
        error: message,
      });
    }
    if (!options.select && select === resortSignalSelectWithEvents) {
      const retry = await loadAllResortRows<T>(client, {
        ...options,
        select: resortSignalSelect,
      });
      if (!retry.usingFallback) {
        return {
          ...retry,
          error: message,
        };
      }
    }
    const fallback = fallbackRows<T>();
    return {
      resorts: fallback,
      total: fallback.length,
      loaded: fallback.length,
      source: "fallback",
      usingFallback: true,
      fallbackReason: "error",
      error: message,
      pageSize,
      hasMore: false,
    };
  }
}

export async function loadResortDetailRow(client: SupabaseClient, slug: string): Promise<ResortDetailResult> {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return { resort: null, source: "supabase", usingFallback: false, fallbackReason: null, error: null };
  }

  try {
    let { resolved, loadError } = await findResortDetail(client, safeSlug, resortDetailSelect);
    if (!resolved && loadError) {
      const retry = await findResortDetail(client, safeSlug, resortDetailSelectBase);
      resolved = retry.resolved;
      loadError = loadError || retry.loadError;
    }

    if (resolved) {
      return {
        resort: withDetailDefaults(sanitizeResortRow(resolved)),
        source: "supabase",
        usingFallback: false,
        fallbackReason: null,
        error: loadError,
      };
    }

    const fallback = findMvpResortBySlug(safeSlug);
    if (fallback) {
      return {
        resort: withDetailDefaults(fallback),
        source: "fallback",
        usingFallback: true,
        fallbackReason: "empty",
        error: loadError,
      };
    }

    return { resort: null, source: "supabase", usingFallback: false, fallbackReason: null, error: loadError };
  } catch (error) {
    const fallback = findMvpResortBySlug(safeSlug);
    return {
      resort: fallback ? withDetailDefaults(fallback) : null,
      source: fallback ? "fallback" : "supabase",
      usingFallback: Boolean(fallback),
      fallbackReason: fallback ? "error" : null,
      error: errorMessage(error),
    };
  }
}
