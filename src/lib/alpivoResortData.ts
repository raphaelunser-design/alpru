export type AlpivoResort = {
  slug: string;
  aliases?: string[];
  name: string;
  country: string;
  region: string;
  regionLabel: string;
  rank: number;
  score: number;
  pricePerPerson: number;
  priceLabel: string;
  travelTimeFromMunich: string;
  distanceFromMunich: string;
  fuelCost: string;
  snowLabel: string;
  vibeLabel: string;
  pisteKm: string;
  altitude: string;
  description: string;
  image: string;
  tags: string[];
  reasons: string[];
  drawback: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  mapPosition: {
    x: number;
    y: number;
  };
  routeSummary: {
    origin: string;
    destination: string;
    distance: string;
    duration: string;
    fuelCost: string;
    note: string;
  };
};

export type PremiumMatch = {
  rank: number;
  name: string;
  slug: string;
  region: string;
  country: string;
  image: string;
  score: number;
  cost: string;
  drive: string;
  distance: string;
  snow: string;
  vibe: string;
  pisteKm: string;
  elevation: string;
  tags: string[];
  reasons: string[];
  drawback: string;
  description: string;
  marker: { x: number; y: number };
};

export const alpivoResorts: AlpivoResort[] = [
  {
    slug: "obertauern",
    name: "Obertauern",
    country: "Österreich",
    region: "Salzburg",
    regionLabel: "Salzburg, Österreich",
    rank: 1,
    score: 92,
    pricePerPerson: 520,
    priceLabel: "€ 520",
    travelTimeFromMunich: "3:45 h",
    distanceFromMunich: "315 km",
    fuelCost: "ca. € 45",
    snowLabel: "sehr gut",
    vibeLabel: "lebendig",
    pisteKm: "100 km",
    altitude: "1.740 - 2.313 m",
    description: "Schneesicheres Hochplateau mit breiten Pisten, klarer Anreise und starkem Gruppen-Vibe.",
    image: "/bg/site-hero.jpg",
    tags: ["Top Match", "Schneesicher", "Après & Events"],
    reasons: ["Schneesicher von Dez. bis April", "Top Pistenvielfalt für jedes Level", "Legendäres Après-Ski & Events"],
    drawback: "In der Hochsaison kann es an Wochenenden voller sein.",
    coordinates: { lat: 47.248, lon: 13.556 },
    mapPosition: { x: 58, y: 48 },
    routeSummary: {
      origin: "München",
      destination: "Obertauern",
      distance: "315 km",
      duration: "3:45 h",
      fuelCost: "ca. € 45",
      note: "A10 Tauernroute: An Wochenenden kann erhöhter Verkehr möglich sein.",
    },
  },
  {
    slug: "solden",
    aliases: ["soelden", "sölden"],
    name: "Sölden",
    country: "Österreich",
    region: "Tirol",
    regionLabel: "Tirol, Österreich",
    rank: 2,
    score: 89,
    pricePerPerson: 610,
    priceLabel: "€ 610",
    travelTimeFromMunich: "3:30 h",
    distanceFromMunich: "238 km",
    fuelCost: "ca. € 38",
    snowLabel: "sehr gut",
    vibeLabel: "sportlich",
    pisteKm: "144 km",
    altitude: "1.350 - 3.340 m",
    description: "Starker Schnee-Fit mit Gletscher, sportlicher Energie und viel Pistenleistung.",
    image: "/images/ski.jpg",
    tags: ["Gletscher", "Sportlich"],
    reasons: ["Zuverlässiger Gletscherbetrieb", "Moderne Liftanlagen & Pisten", "Top für sportliche Skifahrer"],
    drawback: "In der Hochsaison teils höhere Preise.",
    coordinates: { lat: 46.969, lon: 11.007 },
    mapPosition: { x: 35, y: 67 },
    routeSummary: {
      origin: "München",
      destination: "Sölden",
      distance: "238 km",
      duration: "3:30 h",
      fuelCost: "ca. € 38",
      note: "Inntalroute: Bei starkem Wochenendverkehr mehr Puffer einplanen.",
    },
  },
  {
    slug: "zell-am-see",
    name: "Zell am See",
    country: "Österreich",
    region: "Salzburg",
    regionLabel: "Salzburg, Österreich",
    rank: 3,
    score: 86,
    pricePerPerson: 470,
    priceLabel: "€ 470",
    travelTimeFromMunich: "3:15 h",
    distanceFromMunich: "168 km",
    fuelCost: "ca. € 30",
    snowLabel: "gut",
    vibeLabel: "See & Stadt",
    pisteKm: "138 km",
    altitude: "757 - 3.029 m",
    description: "Vielseitiger Match für Gruppen, die Pisten, Stadtgefühl und Budget stärker balancieren.",
    image: "/bg/skilandschaft.png",
    tags: ["Lebendig", "See & Stadt"],
    reasons: ["Kombination aus Bergen & See", "Gutes Preis-Leistungs-Verhältnis", "Vielseitige Freizeitmöglichkeiten"],
    drawback: "Schneesicherheit etwas wetterabhängiger.",
    coordinates: { lat: 47.323, lon: 12.797 },
    mapPosition: { x: 49, y: 70 },
    routeSummary: {
      origin: "München",
      destination: "Zell am See",
      distance: "168 km",
      duration: "3:15 h",
      fuelCost: "ca. € 30",
      note: "Kurze Anreise, aber wetterabhängigere Schneelage als Gletscherziele.",
    },
  },
  {
    slug: "saalbach",
    aliases: ["saalbach-hinterglemm"],
    name: "Saalbach",
    country: "Österreich",
    region: "Salzburg",
    regionLabel: "Salzburg, Österreich",
    rank: 4,
    score: 84,
    pricePerPerson: 540,
    priceLabel: "€ 540",
    travelTimeFromMunich: "3:50 h",
    distanceFromMunich: "270 km",
    fuelCost: "ca. € 42",
    snowLabel: "sehr gut",
    vibeLabel: "lebendig",
    pisteKm: "270 km",
    altitude: "1.003 - 2.096 m",
    description: "Großer, lebendiger Resort-Fit für Gruppen, die Auswahl, Abende und Infrastruktur wollen.",
    image: "/bg/banner-bild-4k.png",
    tags: ["Sehr lebendig", "Großes Gebiet"],
    reasons: ["Eines der größten Skigebiete", "Legendäre Après-Ski-Szene", "Ideal für Gruppen & Freunde"],
    drawback: "An Wochenenden oft sehr beliebt.",
    coordinates: { lat: 47.391, lon: 12.636 },
    mapPosition: { x: 44, y: 57 },
    routeSummary: {
      origin: "München",
      destination: "Saalbach",
      distance: "270 km",
      duration: "3:50 h",
      fuelCost: "ca. € 42",
      note: "Großes Gebiet mit starkem Gruppen-Fit, Wochenenden früh planen.",
    },
  },
];

export function toPremiumMatch(resort: AlpivoResort): PremiumMatch {
  return {
    rank: resort.rank,
    name: resort.name,
    slug: resort.slug,
    region: resort.region,
    country: resort.country,
    image: resort.image,
    score: resort.score,
    cost: resort.priceLabel,
    drive: resort.travelTimeFromMunich,
    distance: resort.distanceFromMunich,
    snow: resort.snowLabel,
    vibe: resort.vibeLabel,
    pisteKm: resort.pisteKm,
    elevation: resort.altitude,
    tags: resort.tags,
    reasons: resort.reasons,
    drawback: resort.drawback,
    description: resort.description,
    marker: resort.mapPosition,
  };
}

export function getAlpivoTopMatches() {
  return [...alpivoResorts].sort((a, b) => a.rank - b.rank);
}

export function getPremiumMatches() {
  return getAlpivoTopMatches().map(toPremiumMatch);
}

export function getAlpivoResortBySlug(slug: string | null | undefined) {
  const normalized = decodeURIComponent(slug ?? "").trim().toLowerCase();
  if (!normalized) return null;

  return (
    alpivoResorts.find((resort) => resort.slug === normalized || resort.aliases?.some((alias) => alias.toLowerCase() === normalized)) ?? null
  );
}

export const heroAlpivoResort = alpivoResorts[0];
export const heroAlpivoMatch = toPremiumMatch(heroAlpivoResort);
