import {
  addGuestTripDraftResort,
  readGuestState,
  setGuestChecklistState,
  setGuestSelectedResort,
  toggleGuestFavoriteSlug,
} from "@/lib/guestState";
import type { ChecklistState } from "@/types/alpivo";

export type ChecklistReadinessState = ChecklistState;

export function getFavoriteSlugs() {
  return readGuestState().favoriteResortSlugs;
}

export function isFavoriteSlug(slug: string) {
  return getFavoriteSlugs().includes(slug);
}

export function toggleFavoriteSlug(slug: string) {
  return toggleGuestFavoriteSlug(slug);
}

export function getTripDraftSlugs() {
  return readGuestState().tripDraft?.resortSlugs ?? [];
}

export function addTripDraftResort(slug: string) {
  return addGuestTripDraftResort(slug).tripDraft?.resortSlugs ?? [];
}

export function setSelectedMapResort(slug: string) {
  setGuestSelectedResort(slug);
}

export function getSelectedMapResort() {
  return readGuestState().selectedResortSlug ?? "";
}

export function setChecklistReadiness(state: Omit<ChecklistReadinessState, "updatedAt">) {
  setGuestChecklistState(state);
}

export function getChecklistReadiness(): ChecklistReadinessState | null {
  const state = readGuestState().checklistState;
  return state.updatedAt || state.total > 0 ? state : null;
}
