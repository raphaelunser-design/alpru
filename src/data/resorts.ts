export {
  actionLinkOrder,
  flattenResortActionLinks,
  getResortActionLinks,
  resortActionLinks,
} from "@/data/resortActionLinks";

export {
  alpivoCanonicalResorts,
  alpivoResorts,
  getAlpivoResortBySlug,
  getAlpivoTopMatches,
  getCanonicalResortBySlug,
  getPremiumMatches,
  heroAlpivoMatch,
  heroAlpivoResort,
  toCanonicalResort,
  toPremiumMatch,
} from "@/lib/alpivoResortData";
export type { AlpivoResort, PremiumMatch } from "@/lib/alpivoResortData";
export type { DataConfidence, DataSource, ExternalActionLink, ResortActionLinks, Resort as CanonicalResort, ResortScoreBreakdown } from "@/types/alpivo";
