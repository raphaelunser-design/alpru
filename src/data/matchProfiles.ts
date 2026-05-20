import type { MusicPreference, PartyPreference } from "@/lib/resortEvents";
import type { TripStyle } from "@/lib/resortSignals";
import type { SkiCourseNeed } from "@/lib/skiCourses";

export type MatchProfilePrefs = Partial<{
  tripStyle: TripStyle;
  tripStartDate: string | null;
  tripEndDate: string | null;
  budgetMin: number;
  budgetMax: number;
  peopleCount: number;
  apres: number;
  emptySlopes: number;
  infrastructure: number;
  huts: number;
  snowpark: number;
  easyRuns: number;
  challenging: number;
  snowReliability: number;
  valueForMoney: number;
  family: number;
  panorama: number;
  summerGlacier: number;
  offPiste: number;
  partyPreference: PartyPreference;
  musicPreference: MusicPreference;
  foodSpendLevel: "budget" | "standard" | "comfort";
  rentalMode: "own" | "rent";
  skiCourseNeed: SkiCourseNeed;
  travelMode: "car" | "train" | "bus" | "flight";
  excludeCountries: string[];
  excludeGlacier: boolean;
  excludePremium: boolean;
  excludeFamilyOnly: boolean;
}>;

export type MatchProfileFilters = Partial<{
  countryFilter: string;
  minPisteKm: string;
  maxDriveHours: string;
}>;

export type MatchProfile = {
  id: TripStyle;
  displayTitle: string;
  displaySubtitle: string;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  tags: string[];
  prefs: MatchProfilePrefs;
  filters: MatchProfileFilters;
};

export const matchProfiles: MatchProfile[] = [
  {
    id: "budget",
    displayTitle: "Individuell",
    displaySubtitle: "Entscheidet selbst, was zählt. Alpivo hält Budget, Anreise und Vibe sauber zusammen.",
    image: "/bg/skilandschaft.png",
    badge: "Flexibel",
    title: "Smart Budget",
    subtitle: "Viel Skitag pro Euro, gute Value-Signale, kein Luxus-Fokus.",
    tags: ["Preis-Leistung", "kurze Wege", "clever planen"],
    prefs: {
      budgetMin: 150,
      budgetMax: 320,
      apres: 2,
      emptySlopes: 3,
      infrastructure: 3,
      huts: 2,
      easyRuns: 3,
      challenging: 2,
      snowReliability: 3,
      valueForMoney: 5,
      family: 2,
      panorama: 2,
    },
    filters: { minPisteKm: "10" },
  },
  {
    id: "apres",
    displayTitle: "Freunde-Trip",
    displaySubtitle: "Gemeinsame Zeit, gute Vibes und unvergessliche Abende.",
    image: "/bg/banner-bild-4k.png",
    badge: "Crew",
    title: "Après & Crew",
    subtitle: "Energie, Hütten, Gruppen-Vibe und genug Pisten für ein Wochenende.",
    tags: ["Party", "Gruppe", "Hütten"],
    prefs: {
      budgetMin: 450,
      budgetMax: 650,
      apres: 5,
      emptySlopes: 1,
      infrastructure: 4,
      huts: 5,
      easyRuns: 2,
      challenging: 3,
      snowReliability: 5,
      valueForMoney: 4,
      family: 1,
      panorama: 3,
      partyPreference: "party_places",
      musicPreference: "any",
    },
    filters: { minPisteKm: "35" },
  },
  {
    id: "family",
    displayTitle: "Familien-Trip",
    displaySubtitle: "Spaß für Groß und Klein, sicher und entspannt.",
    image: "/bg/site-hero.jpg",
    badge: "Ruhig",
    title: "Family Calm",
    subtitle: "Einfachere Pisten, weniger Stress, gute Infrastruktur und planbare Kosten.",
    tags: ["Familie", "leichte Pisten", "ruhiger"],
    prefs: {
      budgetMin: 220,
      budgetMax: 480,
      apres: 1,
      emptySlopes: 5,
      infrastructure: 4,
      huts: 3,
      snowpark: 1,
      easyRuns: 5,
      challenging: 1,
      snowReliability: 3,
      valueForMoney: 4,
      family: 5,
      panorama: 3,
    },
    filters: { minPisteKm: "8" },
  },
  {
    id: "sport",
    displayTitle: "Ski & Sport Club",
    displaySubtitle: "Gemeinsame Leidenschaft, Wettkampf und Natur.",
    image: "/images/ski.jpg",
    badge: "Sport",
    title: "Big Mountain",
    subtitle: "Mehr Pisten, sportliches Profil, moderne Lifte und Höhenlage.",
    tags: ["sportlich", "großes Gebiet", "schnell"],
    prefs: {
      budgetMin: 320,
      budgetMax: 750,
      apres: 2,
      emptySlopes: 3,
      infrastructure: 5,
      huts: 3,
      snowpark: 3,
      easyRuns: 2,
      challenging: 5,
      snowReliability: 5,
      valueForMoney: 3,
      family: 1,
      panorama: 4,
    },
    filters: { minPisteKm: "80" },
  },
  {
    id: "premium",
    displayTitle: "Firmenausflug",
    displaySubtitle: "Teamgefühl stärken, gemeinsam erleben.",
    image: "/bg/site-hero.jpg",
    badge: "Team",
    title: "Premium Alpine",
    subtitle: "Panorama, starke Infrastruktur, Hütten und schneesichere Höhenlage.",
    tags: ["Premium", "Panorama", "Komfort"],
    prefs: {
      budgetMin: 450,
      budgetMax: 900,
      apres: 3,
      emptySlopes: 3,
      infrastructure: 5,
      huts: 5,
      snowpark: 2,
      easyRuns: 3,
      challenging: 4,
      snowReliability: 5,
      valueForMoney: 1,
      family: 2,
      panorama: 5,
    },
    filters: { minPisteKm: "50" },
  },
  {
    id: "quiet",
    displayTitle: "Paar-Retreat",
    displaySubtitle: "Zeit zu zweit, Erholung und besondere Momente.",
    image: "/bg/site-hero.jpg",
    badge: "Ruhig",
    title: "Quiet Escape",
    subtitle: "Ruhiger Alpen-Vibe, schöne Lage und weniger Trubel.",
    tags: ["ruhig", "zu zweit", "Natur"],
    prefs: {
      budgetMin: 220,
      budgetMax: 520,
      apres: 0,
      emptySlopes: 5,
      infrastructure: 3,
      huts: 4,
      snowpark: 0,
      easyRuns: 4,
      challenging: 2,
      snowReliability: 4,
      valueForMoney: 3,
      family: 3,
      panorama: 5,
      partyPreference: "quiet_no_events",
      musicPreference: "any",
    },
    filters: { minPisteKm: "8" },
  },
  {
    id: "glacier",
    displayTitle: "Premium Alpine",
    displaySubtitle: "Panorama, Höhenlage und schneesichere Signale.",
    image: "/bg/skilandschaft.png",
    badge: "Schnee",
    title: "Summer Glacier",
    subtitle: "Hohe Lage, Gletscher-Signale und Resorts, bei denen Sommer-Ski realistischer ist.",
    tags: ["Gletscher-Fit", "hohe Lage", "Schnee"],
    prefs: {
      budgetMin: 280,
      budgetMax: 760,
      apres: 1,
      emptySlopes: 3,
      infrastructure: 4,
      huts: 3,
      snowpark: 2,
      easyRuns: 2,
      challenging: 3,
      snowReliability: 5,
      valueForMoney: 2,
      family: 1,
      panorama: 4,
      summerGlacier: 5,
    },
    filters: { minPisteKm: "10" },
  },
  {
    id: "offpiste",
    displayTitle: "Off-Piste Finder",
    displaySubtitle: "Höhenlage, sportliches Gelände und weniger Andrang.",
    image: "/images/ski.jpg",
    badge: "Freeride",
    title: "Off-Piste Finder",
    subtitle: "Höhenlage, sportliches Gelände, Schnee und weniger Andrang für Fahrer abseits der Standardpiste.",
    tags: ["Freeride", "sportlich", "Schnee"],
    prefs: {
      budgetMin: 320,
      budgetMax: 760,
      apres: 1,
      emptySlopes: 4,
      infrastructure: 3,
      huts: 2,
      snowpark: 3,
      easyRuns: 1,
      challenging: 5,
      snowReliability: 5,
      valueForMoney: 2,
      family: 0,
      panorama: 4,
      offPiste: 5,
    },
    filters: { minPisteKm: "25" },
  },
];
