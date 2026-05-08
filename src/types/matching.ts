import type { MusicPreference, PartyPreference, ResortEvent } from "@/lib/resortEvents";

export type TripType = "day_trip" | "weekend" | "multi_day" | "week";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert" | "mixed";
export type TravelMode = "car" | "train" | "bus" | "unknown";
export type SpendStyle = "budget" | "standard" | "comfort";
export type CostConfidence = "low" | "medium" | "high";
export type CostDataQuality = "real" | "estimated" | "missing";
export type CostComponent = "skiPass" | "accommodation" | "transport" | "foodDrink" | "rental" | "extras";

export type UserPreferences = {
  origin?: {
    lat?: number;
    lng?: number;
    postalCode?: string;
    country?: string;
  };
  tripType?: TripType;
  days?: number;
  people?: number;
  budgetPerPerson?: number;
  skillLevel?: SkillLevel;
  priorities?: {
    budget?: number;
    distance?: number;
    snow?: number;
    apresSki?: number;
    quiet?: number;
    pisteSize?: number;
    offPiste?: number;
    familyFriendly?: number;
    beginnerFriendly?: number;
    comfort?: number;
  };
  travelMode?: TravelMode;
  hasTripDates?: boolean;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  foodStyle?: SpendStyle;
  accommodationStyle?: SpendStyle;
  wantsApresSki?: boolean;
  wantsFestival?: boolean;
  wantsOffPiste?: boolean;
  wantsQuiet?: boolean;
  wantsSnowpark?: boolean;
  wantsFamilyFriendly?: boolean;
  needsRental?: boolean;
  partyPreference?: PartyPreference;
  musicPreference?: MusicPreference;
};

export type ResortInput = {
  id: string;
  name: string;
  country?: string;
  region?: string;
  lat?: number;
  lng?: number;
  pisteKmTotal?: number;
  pisteKmBlue?: number;
  pisteKmRed?: number;
  pisteKmBlack?: number;
  liftsCountTotal?: number;
  elevationMin?: number;
  elevationMax?: number;
  verticalDrop?: number;
  adultDayPassPrice?: number;
  accommodationAvgNight?: number;
  apresSkiScore?: number;
  familyScore?: number;
  beginnerScore?: number;
  offPisteScore?: number;
  snowparkScore?: number;
  crowdScore?: number;
  snowReliabilityScore?: number;
  weatherScore?: number;
  currentTemperature?: number;
  snowDepthMountain?: number;
  freshSnow24h?: number;
  distanceKm?: number;
  driveMinutes?: number;
  events?: ResortEvent[];
};

export type ScoreCategory =
  | "budget"
  | "distance"
  | "weatherSnow"
  | "skillFit"
  | "pisteFit"
  | "apresSki"
  | "crowd"
  | "offPiste"
  | "infrastructure"
  | "valueForMoney"
  | "tripTypeFit"
  | "festivalFit";

export type CategoryScores = Record<ScoreCategory, number>;

export type EstimatedTripCosts = {
  totalPerPerson: number;
  accommodationPerPerson: number;
  skiPassPerPerson: number;
  transportPerPerson: number;
  foodDrinkPerPerson: number;
  rentalPerPerson: number;
  extrasPerPerson: number;
  componentQuality: Record<CostComponent, CostDataQuality>;
  componentNotes: Partial<Record<CostComponent, string>>;
  confidence: CostConfidence;
  assumptions: string[];
};

export type AlpivoScoreResult = {
  resortId: string;
  totalScore: number;
  matchLabel: string;
  recommendationType: string;
  categoryScores: CategoryScores;
  weights: Record<ScoreCategory, number>;
  weightedScores: Record<ScoreCategory, number>;
  estimatedCosts: EstimatedTripCosts;
  reasons: string[];
  warnings: string[];
  missingDataNotes: string[];
};
