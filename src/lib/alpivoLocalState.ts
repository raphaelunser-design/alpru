const FAVORITES_KEY = "alpivo_favorite_resorts";
const TRIP_DRAFT_KEY = "alpivo_trip_draft_resorts";
const SELECTED_MAP_KEY = "alpivo_selected_map_resort";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStringArray(key: string) {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, value: string[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(value))));
  window.dispatchEvent(new CustomEvent("alpivo-local-state-change", { detail: { key } }));
}

export function getFavoriteSlugs() {
  return readStringArray(FAVORITES_KEY);
}

export function isFavoriteSlug(slug: string) {
  return getFavoriteSlugs().includes(slug);
}

export function toggleFavoriteSlug(slug: string) {
  const current = getFavoriteSlugs();
  const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
  writeStringArray(FAVORITES_KEY, next);
  return next.includes(slug);
}

export function getTripDraftSlugs() {
  return readStringArray(TRIP_DRAFT_KEY);
}

export function addTripDraftResort(slug: string) {
  const current = getTripDraftSlugs();
  if (!current.includes(slug)) {
    writeStringArray(TRIP_DRAFT_KEY, [...current, slug]);
  }
  return getTripDraftSlugs();
}

export function setSelectedMapResort(slug: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SELECTED_MAP_KEY, slug);
  window.dispatchEvent(new CustomEvent("alpivo-local-state-change", { detail: { key: SELECTED_MAP_KEY } }));
}

export function getSelectedMapResort() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(SELECTED_MAP_KEY) ?? "";
}
