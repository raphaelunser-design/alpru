import { getPremiumMatches, heroAlpivoMatch, type PremiumMatch } from "@/data/resorts";

export type { PremiumMatch };

export const premiumMatches: PremiumMatch[] = getPremiumMatches();
export const heroMatch = heroAlpivoMatch;
