"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addGuestTripDraftResort,
  getDefaultGuestState,
  markGuestActionCompleted,
  readGuestState,
  setGuestActionCompleted,
  setGuestChecklistState,
  setGuestPreferences,
  setGuestSelectedResort,
  subscribeGuestState,
  toggleGuestFavoriteSlug,
} from "@/lib/guestState";
import type { AlpivoGuestState, ChecklistState, TripPreferences } from "@/types/alpivo";
import type { MatchPayload } from "@/lib/matching/matchPayload";

export function useAlpivoGuestState() {
  const [state, setState] = useState<AlpivoGuestState>(() => getDefaultGuestState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(readGuestState());
    sync();
    setHydrated(true);
    return subscribeGuestState(sync);
  }, []);

  const setPreferences = useCallback((preferences: Partial<TripPreferences> | MatchPayload) => {
    setState(setGuestPreferences(preferences));
  }, []);

  const selectResort = useCallback((slug: string) => {
    setState(setGuestSelectedResort(slug));
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    const isFavorite = toggleGuestFavoriteSlug(slug);
    setState(readGuestState());
    return isFavorite;
  }, []);

  const addTripDraftResort = useCallback((slug: string) => {
    const next = addGuestTripDraftResort(slug);
    setState(next);
    return next.tripDraft;
  }, []);

  const setChecklist = useCallback((checklistState: Omit<ChecklistState, "updatedAt"> | ChecklistState) => {
    setState(setGuestChecklistState(checklistState));
  }, []);

  const markActionCompleted = useCallback((action: keyof AlpivoGuestState["completedActions"], resortSlug?: string) => {
    setState(markGuestActionCompleted(action, resortSlug));
  }, []);

  const setActionCompleted = useCallback((action: keyof AlpivoGuestState["completedActions"], completed: boolean, resortSlug?: string) => {
    setState(setGuestActionCompleted(action, completed, resortSlug));
  }, []);

  return {
    state,
    hydrated,
    setPreferences,
    selectResort,
    toggleFavorite,
    addTripDraftResort,
    setChecklist,
    markActionCompleted,
    setActionCompleted,
  };
}
