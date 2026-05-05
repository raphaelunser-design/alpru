export function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}

export function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function scoreFromZeroOne(value: unknown, fallback = 50) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  if (value <= 1) return clamp(value * 100);
  return clamp(value);
}

export function normalizePriority(value: unknown, fallback = 3) {
  const resolved = safeNumber(value, fallback);
  if (resolved <= 1) return clamp(resolved, 0.15, 1);
  return clamp(resolved / 5, 0.15, 1.35);
}

export function weightedAverage(items: Array<{ value: number; weight: number }>, fallback = 50) {
  const valid = items.filter((item) => Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0);
  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return fallback;
  return clamp(valid.reduce((sum, item) => sum + clamp(item.value) * item.weight, 0) / totalWeight);
}

export function normalizeWeights<T extends string>(weights: Record<T, number>) {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, value]) => sum + Math.max(0, safeNumber(value)), 0);
  const fallback = total > 0 ? total : 1;
  return Object.fromEntries(entries.map(([key, value]) => [key, Math.max(0, safeNumber(value)) / fallback])) as Record<T, number>;
}

export function logScaleScore(value: unknown, cap: number, fallback = 50) {
  const resolved = optionalNumber(value);
  if (resolved === undefined || resolved <= 0) return fallback;
  return clamp((Math.log1p(resolved) / Math.log1p(cap)) * 100);
}

export function ratioScore(value: unknown, max: number, fallback = 50) {
  const resolved = optionalNumber(value);
  if (resolved === undefined || max <= 0) return fallback;
  return clamp((resolved / max) * 100);
}

export function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString("de-DE")} €`;
}

export function formatPercentDelta(actual: number, reference: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(reference) || reference <= 0) return "";
  const delta = Math.round(((actual - reference) / reference) * 100);
  if (delta <= 0) return `${Math.abs(delta)} % unter Budget`;
  return `${delta} % über Budget`;
}
