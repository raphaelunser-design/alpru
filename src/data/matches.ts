import { getPremiumMatches, heroAlpivoMatch, type PremiumMatch } from "@/data/resorts";

export const heroMatch = heroAlpivoMatch;
export const topMatches: PremiumMatch[] = getPremiumMatches();

export function getTopMatches() {
  return getPremiumMatches();
}

export type { PremiumMatch };
