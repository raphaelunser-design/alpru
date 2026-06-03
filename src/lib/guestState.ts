import { buildMatchPayload, MATCH_PREF_DEFAULTS, type MatchPayload } from "@/lib/matching/matchPayload";
import type { ActivityItem, AlpivoGuestState, ChecklistState, TripDraft, TripPreferences } from "@/types/alpivo";

export const ALPIVO_GUEST_STATE_KEY = "alpivo_guest_state_v1";
export const ALPIVO_GUEST_STATE_EVENT = "alpivo-guest-state-change";

const FAVORITES_KEY = "alpivo_favorite_resorts";
const TRIP_DRAFT_KEY = "alpivo_trip_draft_resorts";
const SELECTED_MAP_KEY = "alpivo_selected_map_resort";
const CHECKLIST_READINESS_KEY = "alpivo_checklist_readiness";
const QUIZ_PREFS_KEY = "alpivo_quiz_prefs";
const RESULTS_FILTERS_KEY = "alpivo_results_filters";

const DEFAULT_PRIORITIES = ["Après-Ski & Events", "Pistenvielfalt", "Schneesicherheit"];

export const DEFAULT_GUEST_PREFERENCES: TripPreferences = {
  ...MATCH_PREF_DEFAULTS,
  excludeCountries: [...MATCH_PREF_DEFAULTS.excludeCountries],
  originLabel: "München",
  priorities: DEFAULT_PRIORITIES,
  maxTravelHours: "",
  minPisteKm: "",
};

export const DEFAULT_CHECKLIST_STATE: ChecklistState = {
  percent: 0,
  completed: 0,
  total: 0,
  open: 0,
  nextTask: "Unterkunft finalisieren",
  updatedAt: "",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readStringArray(key: string) {
  const parsed = readJson<unknown>(key);
  return Array.isArray(parsed) ? Array.from(new Set(parsed.filter((item): item is string => typeof item === "string"))) : [];
}

function readLegacyChecklist(): ChecklistState {
  const parsed = readJson<Partial<ChecklistState>>(CHECKLIST_READINESS_KEY);
  if (!parsed || !Number.isFinite(Number(parsed.percent))) return DEFAULT_CHECKLIST_STATE;
  return normalizeChecklistState(parsed);
}

function normalizeChecklistState(value: Partial<ChecklistState>): ChecklistState {
  return {
    percent: Math.max(0, Math.min(100, Math.round(Number(value.percent ?? 0)))),
    completed: Math.max(0, Math.round(Number(value.completed ?? 0))),
    total: Math.max(0, Math.round(Number(value.total ?? 0))),
    open: Math.max(0, Math.round(Number(value.open ?? 0))),
    nextTask: String(value.nextTask || "Unterkunft finalisieren"),
    updatedAt: String(value.updatedAt || ""),
  };
}

function normalizePreferences(value: unknown): TripPreferences {
  const record = value && typeof value === "object" ? (value as Partial<TripPreferences>) : {};
  const payload = buildMatchPayload(record);
  return {
    ...payload,
    excludeCountries: [...payload.excludeCountries],
    originLabel: typeof record.originLabel === "string" && record.originLabel.trim() ? record.originLabel.trim() : DEFAULT_GUEST_PREFERENCES.originLabel,
    priorities: Array.isArray(record.priorities) && record.priorities.length ? record.priorities.filter((item): item is string => typeof item === "string") : DEFAULT_PRIORITIES,
    maxTravelHours: typeof record.maxTravelHours === "string" ? record.maxTravelHours : "",
    minPisteKm: typeof record.minPisteKm === "string" ? record.minPisteKm : "",
  };
}

function buildDateLabel(preferences: TripPreferences) {
  if (!preferences.tripStartDate || !preferences.tripEndDate) return "20. - 24. Januar 2027";
  const from = new Date(preferences.tripStartDate);
  const to = new Date(preferences.tripEndDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "20. - 24. Januar 2027";
  const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  return `${from.getDate()}. - ${to.getDate()}. ${monthFormatter.format(to)}`;
}

function buildBudgetLabel(preferences: TripPreferences) {
  return `€ ${preferences.budgetMin} - € ${preferences.budgetMax} p. P.`;
}

function normalizeTripDraft(value: Partial<TripDraft> | undefined, preferences: TripPreferences): TripDraft | undefined {
  const resortSlugs = Array.isArray(value?.resortSlugs) ? Array.from(new Set(value.resortSlugs.filter((item): item is string => typeof item === "string"))) : [];
  if (!resortSlugs.length) return undefined;
  return {
    id: typeof value?.id === "string" && value.id ? value.id : "guest-trip-draft",
    title: typeof value?.title === "string" && value.title ? value.title : `Ski-Trip mit ${resortSlugs.length} Option${resortSlugs.length === 1 ? "" : "en"}`,
    primaryResortSlug: typeof value?.primaryResortSlug === "string" ? value.primaryResortSlug : resortSlugs[0],
    resortSlugs,
    originLabel: typeof value?.originLabel === "string" && value.originLabel ? value.originLabel : preferences.originLabel,
    dateLabel: typeof value?.dateLabel === "string" && value.dateLabel ? value.dateLabel : buildDateLabel(preferences),
    budgetLabel: typeof value?.budgetLabel === "string" && value.budgetLabel ? value.budgetLabel : buildBudgetLabel(preferences),
    groupSize: Number.isFinite(Number(value?.groupSize)) ? Math.max(1, Math.round(Number(value?.groupSize))) : preferences.peopleCount,
    updatedAt: typeof value?.updatedAt === "string" && value.updatedAt ? value.updatedAt : nowIso(),
    source: "guest",
  };
}

function normalizeActivity(value: unknown): ActivityItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): ActivityItem | null => {
      const row = item && typeof item === "object" ? (item as Partial<ActivityItem>) : {};
      if (!row.type || !row.label) return null;
      return {
        id: typeof row.id === "string" && row.id ? row.id : `${row.type}-${row.createdAt || nowIso()}`,
        type: row.type,
        label: String(row.label),
        createdAt: typeof row.createdAt === "string" && row.createdAt ? row.createdAt : nowIso(),
        resortSlug: typeof row.resortSlug === "string" ? row.resortSlug : undefined,
        href: typeof row.href === "string" ? row.href : undefined,
      };
    })
    .filter((item): item is ActivityItem => Boolean(item))
    .slice(0, 12);
}

function normalizeState(value: Partial<AlpivoGuestState> | null): AlpivoGuestState {
  const legacyPrefs = readJson<unknown>(QUIZ_PREFS_KEY);
  const preferences = normalizePreferences(value?.preferences ?? legacyPrefs ?? DEFAULT_GUEST_PREFERENCES);
  const legacyDraftSlugs = readStringArray(TRIP_DRAFT_KEY);
  const draftFromLegacy = legacyDraftSlugs.length
    ? {
        id: "guest-trip-draft",
        resortSlugs: legacyDraftSlugs,
      }
    : undefined;

  return {
    preferences,
    selectedResortSlug:
      typeof value?.selectedResortSlug === "string" && value.selectedResortSlug
        ? value.selectedResortSlug
        : canUseStorage()
          ? window.localStorage.getItem(SELECTED_MAP_KEY) || "obertauern"
          : "obertauern",
    favoriteResortSlugs: Array.from(
      new Set([
        ...(Array.isArray(value?.favoriteResortSlugs) ? value.favoriteResortSlugs.filter((item): item is string => typeof item === "string") : []),
        ...readStringArray(FAVORITES_KEY),
      ])
    ),
    tripDraft: normalizeTripDraft(value?.tripDraft ?? draftFromLegacy, preferences),
    checklistState: normalizeChecklistState(value?.checklistState ?? readLegacyChecklist()),
    completedActions: {
      skipassChecked: Boolean(value?.completedActions?.skipassChecked),
      accommodationChecked: Boolean(value?.completedActions?.accommodationChecked),
      routeChecked: Boolean(value?.completedActions?.routeChecked),
      liveStatusChecked: Boolean(value?.completedActions?.liveStatusChecked),
      budgetChecked: Boolean(value?.completedActions?.budgetChecked),
      rentalChecked: Boolean(value?.completedActions?.rentalChecked),
      skiSchoolChecked: Boolean(value?.completedActions?.skiSchoolChecked),
      groupDecisionChecked: Boolean(value?.completedActions?.groupDecisionChecked),
    },
    recentActivity: normalizeActivity(value?.recentActivity),
  };
}

export function getDefaultGuestState(): AlpivoGuestState {
  return normalizeState({
    preferences: DEFAULT_GUEST_PREFERENCES,
    selectedResortSlug: "obertauern",
    favoriteResortSlugs: [],
    checklistState: DEFAULT_CHECKLIST_STATE,
    completedActions: {},
    recentActivity: [],
  });
}

export function readGuestState(): AlpivoGuestState {
  return normalizeState(readJson<Partial<AlpivoGuestState>>(ALPIVO_GUEST_STATE_KEY));
}

function mirrorLegacyState(state: AlpivoGuestState) {
  if (!canUseStorage()) return;
  writeJson(QUIZ_PREFS_KEY, state.preferences);
  writeJson(FAVORITES_KEY, state.favoriteResortSlugs);
  writeJson(TRIP_DRAFT_KEY, state.tripDraft?.resortSlugs ?? []);
  writeJson(CHECKLIST_READINESS_KEY, state.checklistState);
  if (state.selectedResortSlug) window.localStorage.setItem(SELECTED_MAP_KEY, state.selectedResortSlug);

  const existingFilters = readJson<Record<string, unknown>>(RESULTS_FILTERS_KEY) ?? {};
  writeJson(RESULTS_FILTERS_KEY, {
    ...existingFilters,
    originLabel: state.preferences.originLabel,
    minPisteKm: state.preferences.minPisteKm ?? "",
    maxDriveHours: state.preferences.maxTravelHours ?? "",
    budgetMin: state.preferences.budgetMin,
    budgetMax: state.preferences.budgetMax,
    budgetFilterActive: false,
  });
}

function emitGuestStateChange(state: AlpivoGuestState) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ALPIVO_GUEST_STATE_EVENT, { detail: state }));
  window.dispatchEvent(new CustomEvent("alpivo-local-state-change", { detail: { key: ALPIVO_GUEST_STATE_KEY } }));
}

export function writeGuestState(state: AlpivoGuestState) {
  const normalized = normalizeState(state);
  if (canUseStorage()) {
    writeJson(ALPIVO_GUEST_STATE_KEY, normalized);
    mirrorLegacyState(normalized);
  }
  emitGuestStateChange(normalized);
  return normalized;
}

export function updateGuestState(updater: (state: AlpivoGuestState) => AlpivoGuestState): AlpivoGuestState {
  return writeGuestState(updater(readGuestState()));
}

function appendActivity(state: AlpivoGuestState, item: Omit<ActivityItem, "id" | "createdAt">): AlpivoGuestState {
  const createdAt = nowIso();
  return {
    ...state,
    recentActivity: [
      {
        id: `${item.type}-${item.resortSlug ?? "alpivo"}-${createdAt}`,
        createdAt,
        ...item,
      },
      ...state.recentActivity,
    ].slice(0, 12),
  };
}

export function setGuestPreferences(input: Partial<TripPreferences> | MatchPayload) {
  return updateGuestState((state) =>
    appendActivity(
      {
        ...state,
        preferences: normalizePreferences({ ...state.preferences, ...input }),
      },
      { type: "match_created", label: "Match-Präferenzen aktualisiert", href: "/results" }
    )
  );
}

export function setGuestSelectedResort(slug: string) {
  return updateGuestState((state) =>
    appendActivity(
      {
        ...state,
        selectedResortSlug: slug,
      },
      { type: "map_resort_selected", label: `${slug} auf der Karte ausgewählt`, resortSlug: slug, href: `/map?resort=${encodeURIComponent(slug)}` }
    )
  );
}

export function toggleGuestFavoriteSlug(slug: string) {
  let isFavorite = false;
  updateGuestState((state) => {
    isFavorite = !state.favoriteResortSlugs.includes(slug);
    const favoriteResortSlugs = isFavorite
      ? [...state.favoriteResortSlugs, slug]
      : state.favoriteResortSlugs.filter((item) => item !== slug);
    return appendActivity(
      {
        ...state,
        favoriteResortSlugs,
      },
      {
        type: isFavorite ? "favorite_added" : "favorite_removed",
        label: isFavorite ? "Favorit gespeichert" : "Favorit entfernt",
        resortSlug: slug,
        href: `/resort/${encodeURIComponent(slug)}`,
      }
    );
  });
  return isFavorite;
}

export function addGuestTripDraftResort(slug: string) {
  return updateGuestState((state) => {
    const currentDraft = normalizeTripDraft(state.tripDraft, state.preferences);
    const resortSlugs = Array.from(new Set([...(currentDraft?.resortSlugs ?? []), slug]));
    const tripDraft = normalizeTripDraft(
      {
        ...currentDraft,
        resortSlugs,
        primaryResortSlug: currentDraft?.primaryResortSlug ?? slug,
        updatedAt: nowIso(),
      },
      state.preferences
    );

    return appendActivity(
      {
        ...state,
        selectedResortSlug: slug,
        tripDraft,
      },
      { type: "trip_draft_updated", label: "Resort zum Trip-Entwurf hinzugefügt", resortSlug: slug, href: "/trips" }
    );
  });
}

export function setGuestChecklistState(state: Omit<ChecklistState, "updatedAt"> | ChecklistState) {
  return updateGuestState((current) =>
    appendActivity(
      {
        ...current,
        checklistState: normalizeChecklistState({ ...state, updatedAt: "updatedAt" in state ? state.updatedAt : nowIso() }),
      },
      { type: "checklist_updated", label: "Checkliste aktualisiert", href: "/checklist" }
    )
  );
}

export function markGuestActionCompleted(action: keyof AlpivoGuestState["completedActions"], resortSlug?: string) {
  return updateGuestState((state) =>
    appendActivity(
      {
        ...state,
        completedActions: {
          ...state.completedActions,
          [action]: true,
        },
      },
      { type: "action_completed", label: "Planungsaktion erledigt", resortSlug, href: resortSlug ? `/resort/${encodeURIComponent(resortSlug)}` : undefined }
    )
  );
}

export function setGuestActionCompleted(action: keyof AlpivoGuestState["completedActions"], completed: boolean, resortSlug?: string) {
  return updateGuestState((state) =>
    appendActivity(
      {
        ...state,
        completedActions: {
          ...state.completedActions,
          [action]: completed,
        },
      },
      {
        type: "action_completed",
        label: completed ? "Planungsaktion erledigt" : "Planungsaktion wieder geöffnet",
        resortSlug,
        href: resortSlug ? `/resort/${encodeURIComponent(resortSlug)}` : undefined,
      }
    )
  );
}

export function subscribeGuestState(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ALPIVO_GUEST_STATE_EVENT, listener);
  window.addEventListener("alpivo-local-state-change", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(ALPIVO_GUEST_STATE_EVENT, listener);
    window.removeEventListener("alpivo-local-state-change", listener);
    window.removeEventListener("storage", listener);
  };
}
