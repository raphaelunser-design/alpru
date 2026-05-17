import { getPremiumMatches, heroAlpivoMatch, type PremiumMatch } from "@/lib/alpivoResortData";

export type { PremiumMatch };

export const premiumMatches: PremiumMatch[] = getPremiumMatches();
export const heroMatch = heroAlpivoMatch;
