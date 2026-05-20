export type DataConfidence = "verified" | "official" | "estimated" | "demo" | "missing";

export type DataSource = {
  id: string;
  label: string;
  url?: string;
  sourceType: "official_resort" | "alpivo_estimate" | "community" | "internal_demo" | "unknown";
  lastChecked?: string;
  confidence: DataConfidence;
  notes?: string;
};

export type AlpivoScoreFactor =
  | "snow"
  | "vibe"
  | "pistes"
  | "travel"
  | "budget"
  | "family"
  | "events"
  | "accommodation";

export type ResortScoreBreakdown = {
  factor: AlpivoScoreFactor;
  label: string;
  score: number;
  weight: number;
  explanation: string;
  confidence: DataConfidence;
  sourceIds: string[];
};

export type Resort = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rank?: number;
  matchScore: number;
  matchLabel?: string;
  heroImage?: string;
  mapImage?: string;
  tags: string[];
  shortDescription: string;
  longDescription?: string;
  price: {
    estimatedPerPerson: number;
    currency: "EUR";
    range?: {
      min: number;
      max: number;
    };
    confidence: DataConfidence;
    sourceIds: string[];
  };
  travelFromMunich: {
    durationLabel: string;
    durationMinutes?: number;
    distanceKm?: number;
    fuelEstimate?: number;
    carRouteLabel?: string;
    trainOptionLabel?: string;
    caveat?: string;
    confidence: DataConfidence;
    sourceIds: string[];
  };
  snow: {
    label: "sehr gut" | "gut" | "mittel" | "unsicher";
    seasonLabel?: string;
    altitudeMin?: number;
    altitudeMax?: number;
    glacier?: boolean;
    snowmakingNote?: string;
    caveat?: string;
    confidence: DataConfidence;
    sourceIds: string[];
  };
  skiArea: {
    pisteKm?: number;
    lifts?: number;
    altitudeLabel?: string;
    blueKm?: number;
    redKm?: number;
    blackKm?: number;
    beginnerFit?: number;
    intermediateFit?: number;
    advancedFit?: number;
    confidence: DataConfidence;
    sourceIds: string[];
  };
  vibe: {
    label: string;
    apresFit?: number;
    familyFit?: number;
    quietFit?: number;
    sportFit?: number;
    eventFit?: number;
    notes?: string[];
    confidence: DataConfidence;
    sourceIds: string[];
  };
  accommodation: {
    fitLabel?: string;
    examples?: {
      name: string;
      type: string;
      priceTier: "€" | "€€" | "€€€" | "€€€€";
      note?: string;
      confidence: DataConfidence;
    }[];
    caveat?: string;
  };
  actionLinks: ResortActionLinks;
  matchReasons: string[];
  drawback: string;
  scoreBreakdown: ResortScoreBreakdown[];
  officialInfoUrl?: string;
  dataStatus: {
    summary: string;
    missingFields: string[];
    lastUpdated?: string;
    overallConfidence: DataConfidence;
  };
};

export type ExternalActionLink = {
  label: string;
  url: string;
  kind:
    | "official"
    | "skipass_shop"
    | "ticket_info"
    | "live_status"
    | "webcam"
    | "piste_map"
    | "accommodation"
    | "travel"
    | "ski_school"
    | "rental"
    | "events"
    | "weather";
  sourceName: string;
  confidence: DataConfidence;
  note?: string;
};

export type ResortActionLinks = {
  officialInfo?: ExternalActionLink;
  skipassShop?: ExternalActionLink;
  ticketInfo?: ExternalActionLink;
  liveStatus?: ExternalActionLink;
  webcams?: ExternalActionLink;
  pisteMap?: ExternalActionLink;
  accommodationSearch?: ExternalActionLink;
  schmittenShop?: ExternalActionLink;
  kitzsteinhornTicketInfo?: ExternalActionLink;
  travelInfo?: ExternalActionLink;
  skiSchool?: ExternalActionLink;
  rental?: ExternalActionLink;
  events?: ExternalActionLink;
  weather?: ExternalActionLink;
};

export type DemoTripState = {
  id: string;
  title: string;
  dateLabel: string;
  startRegion: string;
  budgetPerPerson: number;
  groupSize: number;
  resortSlugs: string[];
};
