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

export const premiumMatches: PremiumMatch[] = [
  {
    rank: 1,
    name: "Obertauern",
    slug: "obertauern",
    region: "Salzburg",
    country: "Österreich",
    image: "/bg/site-hero.jpg",
    score: 92,
    cost: "€ 520",
    drive: "3:45 h",
    distance: "315 km",
    snow: "sehr gut",
    vibe: "lebendig",
    pisteKm: "100 km",
    elevation: "2.313 m",
    tags: ["Top Match", "Schneesicher", "Après & Events"],
    reasons: ["Schneesicher von Dez. bis April", "Top Pistenvielfalt für jedes Level", "Legendäres Après-Ski & Events"],
    drawback: "In der Hochsaison kann es an Wochenenden voller sein.",
    description: "Schneesicheres Hochplateau mit breiten Pisten, klarer Anreise und starkem Gruppen-Vibe.",
    marker: { x: 57, y: 47 },
  },
  {
    rank: 2,
    name: "Sölden",
    slug: "solden",
    region: "Tirol",
    country: "Österreich",
    image: "/images/ski.jpg",
    score: 89,
    cost: "€ 610",
    drive: "3:30 h",
    distance: "238 km",
    snow: "sehr gut",
    vibe: "sportlich",
    pisteKm: "144 km",
    elevation: "3.340 m",
    tags: ["Gletscher", "Sportlich"],
    reasons: ["Zuverlässiger Gletscherbetrieb", "Moderne Liftanlagen & Pisten", "Top für sportliche Skifahrer"],
    drawback: "In der Hochsaison teils höhere Preise.",
    description: "Starker Schnee-Fit mit Gletscher, sportlicher Energie und viel Pistenleistung.",
    marker: { x: 35, y: 66 },
  },
  {
    rank: 3,
    name: "Zell am See",
    slug: "zell-am-see",
    region: "Salzburg",
    country: "Österreich",
    image: "/bg/skilandschaft.png",
    score: 86,
    cost: "€ 470",
    drive: "3:15 h",
    distance: "168 km",
    snow: "gut",
    vibe: "See & Stadt",
    pisteKm: "138 km",
    elevation: "3.029 m",
    tags: ["Lebendig", "See & Stadt"],
    reasons: ["Kombination aus Bergen & See", "Gutes Preis-Leistungs-Verhältnis", "Vielseitige Freizeitmöglichkeiten"],
    drawback: "Schneesicherheit etwas wetterabhängiger.",
    description: "Vielseitiger Match für Gruppen, die Pisten, Stadtgefühl und Budget stärker balancieren.",
    marker: { x: 50, y: 70 },
  },
  {
    rank: 4,
    name: "Saalbach",
    slug: "saalbach-hinterglemm",
    region: "Salzburg",
    country: "Österreich",
    image: "/bg/banner-bild-4k.png",
    score: 84,
    cost: "€ 540",
    drive: "3:50 h",
    distance: "270 km",
    snow: "sehr gut",
    vibe: "Après & Events",
    pisteKm: "270 km",
    elevation: "2.096 m",
    tags: ["Sehr lebendig", "Großes Gebiet"],
    reasons: ["Eines der größten Skigebiete", "Legendäre Après-Ski-Szene", "Ideal für Gruppen & Freunde"],
    drawback: "An Wochenenden oft sehr beliebt.",
    description: "Großer, lebendiger Resort-Fit für Gruppen, die Auswahl, Abende und Infrastruktur wollen.",
    marker: { x: 44, y: 56 },
  },
];

export const heroMatch = premiumMatches[0];
