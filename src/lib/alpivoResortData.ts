import { alpivoDataSources, defaultPilotSourceIds } from "@/data/dataSources";
import { getResortActionLinks } from "@/data/resortActionLinks";
import type { AlpivoScoreFactor, DataConfidence, Resort as CanonicalResort, ResortScoreBreakdown } from "@/types/alpivo";

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
  detail: AlpivoResortDetail;
};

export type AlpivoResortDetail = {
  seasonLabel: string;
  lifts: string;
  slopeDifficulty: Array<{ label: string; value: string; width: number }>;
  facts: Array<{ label: string; value: string; detail?: string }>;
  factorScores: Array<{ label: string; score: number; note: string }>;
  weather: {
    headline: string;
    summary: string;
    metrics: Array<{ label: string; value: string; note: string }>;
    forecast: Array<{ day: string; summary: string; temp: string; snow: string }>;
  };
  costs: Array<{ label: string; value: string; note: string }>;
  skipass: Array<{ label: string; value: string; note: string }>;
  travelOptions: Array<{ mode: string; duration: string; route: string; note: string }>;
  stayOptions: Array<{ name: string; type: string; fit: string; price: string }>;
  vibeDetails: Array<{ label: string; value: string; note: string }>;
  eventHighlights: string[];
  skiServices: string[];
  dataStatus: string[];
  externalLinks: Array<{ label: string; href: string }>;
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
    detail: {
      seasonLabel: "Dezember bis April",
      lifts: "26 Anlagen",
      slopeDifficulty: [
        { label: "Blau", value: "61 km", width: 61 },
        { label: "Rot", value: "35 km", width: 35 },
        { label: "Schwarz", value: "4 km", width: 4 },
      ],
      facts: [
        { label: "Gebietstyp", value: "Hochplateau", detail: "Viele Unterkünfte liegen nah an Liften und Pisten." },
        { label: "Höhe", value: "1.740 - 2.313 m", detail: "Guter Höhen-Fit für Schneesicherheit." },
        { label: "Pisten", value: "100 km", detail: "Breite Mischung für Gruppen mit verschiedenen Levels." },
        { label: "Lifte", value: "26 Anlagen", detail: "Kompaktes Gebiet mit kurzen Wegen." },
        { label: "Beste Reisezeit", value: "Jan. - März", detail: "Sehr starker Fit für die Demo-Reise 20. - 24. Jan. 2027." },
        { label: "Gruppen-Fit", value: "Sehr hoch", detail: "Viele Treffpunkte, kurze Wege, lebendiger Abend." },
      ],
      factorScores: [
        { label: "Schneesicherheit", score: 94, note: "Höhenlage, Saisonfenster und Nordalpenlage passen stark." },
        { label: "Vibe & Events", score: 91, note: "Lebendiger Ort mit Après-Ski, Hütten und Gruppenenergie." },
        { label: "Pistenvielfalt", score: 88, note: "Sehr gut für gemischte Gruppen, weniger riesig als Saalbach." },
        { label: "Anreise", score: 82, note: "Ab München gut planbar, Wochenenden brauchen Puffer." },
        { label: "Budget-Fit", score: 78, note: "€ 520 p. P. liegt im Zielkorridor € 450 - € 650." },
      ],
      weather: {
        headline: "Schneesicheres Hochplateau",
        summary:
          "Obertauern passt stark, weil die Lage über 1.700 m und das kompakte Hochplateau gute Schneesignale für Dezember bis April liefern. Wetterwerte sind in der Beta Orientierung, keine Live-Garantie.",
        metrics: [
          { label: "Schnee-Fit", value: "Sehr gut", note: "Höhenlage und Saisonfenster sprechen für stabile Bedingungen." },
          { label: "Saison", value: "Dez. - Apr.", note: "Für Januar besonders plausibler Zeitraum." },
          { label: "Wind-Check", value: "Mittel", note: "Hochplateau kann windiger sein, Bergwetter vor Abfahrt prüfen." },
        ],
        forecast: [
          { day: "Tag 1", summary: "Kalt & klar", temp: "-7 bis -2 °C", snow: "griffig" },
          { day: "Tag 2", summary: "Leichter Schneefall", temp: "-6 bis -1 °C", snow: "frisch" },
          { day: "Tag 3", summary: "Wolken/Sonne", temp: "-5 bis 0 °C", snow: "kompakt" },
        ],
      },
      costs: [
        { label: "Orientierung gesamt", value: "€ 520 p. P.", note: "Budget-Fit für 4 Nächte, ohne harte Buchungsgarantie." },
        { label: "Unterkunft", value: "ca. € 280 - 360", note: "Je nach Lage, Stornooption und Zimmermix." },
        { label: "Skipass", value: "ca. € 240 - 280", note: "Mehrtagesticket, genaue Preise offiziell prüfen." },
        { label: "Anreiseanteil", value: "ca. € 45", note: "Spritkosten grob bei geteilter Autofahrt ab München." },
      ],
      skipass: [
        { label: "Erwachsene", value: "ab ca. € 64 / Tag", note: "Preis variiert nach Saison, Kaufkanal und Ticketdauer." },
        { label: "Mehrtagesticket", value: "ca. € 240 - 280", note: "Passend für 20. - 24. Januar als Orientierung." },
        { label: "Gruppenhinweis", value: "Früh prüfen", note: "Bei 6 Personen lohnt Vergleich von Unterkunft + Skipass-Paket." },
      ],
      travelOptions: [
        { mode: "Auto", duration: "3:45 h", route: "München - A8/A10 - Obertauern", note: "315 km, Wochenendverkehr am Tauernkorridor einplanen." },
        { mode: "Bahn + Shuttle", duration: "ca. 4:45 - 5:30 h", route: "München - Salzburg/Radstadt - Shuttle", note: "Gute Alternative, aber Transferzeiten prüfen." },
        { mode: "Crew-Fahrt", duration: "1 Fahrzeug / 6 Pers.", route: "Kosten teilen", note: "Für Budgetgruppen effizient, Parkplatz der Unterkunft vorher klären." },
      ],
      stayOptions: [
        { name: "Almdorf Obertauern", type: "Apartment / Chalet", fit: "Gruppen & Freunde", price: "€€€" },
        { name: "Hotel Steiner", type: "Hotel", fit: "Komfort & kurze Wege", price: "€€€" },
        { name: "Montana Apartments", type: "Apartment", fit: "Budgetkontrolle", price: "€€" },
      ],
      vibeDetails: [
        { label: "Après-Ski", value: "Lebendig", note: "Stark für Freunde-Trip und Gruppenabende." },
        { label: "Pistenstart", value: "Sehr nah", note: "Viele Unterkünfte sind nah an Liften oder Pisten." },
        { label: "Abendprogramm", value: "Hütten & Bars", note: "Gut planbar ohne lange Transfers." },
      ],
      eventHighlights: ["Hüttenabende und Après-Ski rund um den Ort", "Saison-Events und Musikabende je nach Termin", "Gemeinsame Gruppenpunkte nah an Pisten und Unterkünften"],
      skiServices: [
        "Skischulen und Techniktraining für gemischte Levels",
        "Verleih und Service direkt im Ort",
        "Privatstunden für Wiedereinsteiger oder Fortgeschrittene als Planungsoption",
      ],
      dataStatus: [
        "Score, Kosten und Wetter-/Schneesignal sind Beta-Orientierungswerte.",
        "Alpivo erklärt die Empfehlung mit Gründen und Haken, ersetzt aber keine finale Buchungsprüfung.",
        "Offizielle Preise, Öffnungszeiten und Lawinen-/Wetterlage vor der Buchung prüfen.",
      ],
      externalLinks: [
        { label: "Offizielle Resort-Infos prüfen", href: "https://www.obertauern.com/" },
        { label: "Anreise auf Karte ansehen", href: "/map?resort=obertauern" },
      ],
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
    detail: {
      seasonLabel: "November bis April",
      lifts: "31 Anlagen",
      slopeDifficulty: [
        { label: "Blau", value: "69 km", width: 48 },
        { label: "Rot", value: "45 km", width: 31 },
        { label: "Schwarz", value: "30 km", width: 21 },
      ],
      facts: [
        { label: "Gebietstyp", value: "Gletscher & Sport", detail: "Sehr stark bei Schneesicherheit und sportlichem Profil." },
        { label: "Höhe", value: "1.350 - 3.340 m", detail: "Gletscherlage mit hoher Schneereserve." },
        { label: "Pisten", value: "144 km", detail: "Großes Gebiet für fortgeschrittene Fahrer." },
        { label: "Lifte", value: "31 Anlagen", detail: "Leistungsstarkes Liftangebot." },
        { label: "Beste Reisezeit", value: "Dez. - März", detail: "Gletscher erweitert das Saisonfenster." },
        { label: "Gruppen-Fit", value: "Hoch", detail: "Sportlich, lebendig, preislich höher." },
      ],
      factorScores: [
        { label: "Schneesicherheit", score: 96, note: "Gletscher und Höhe liefern sehr starke Signale." },
        { label: "Pistenvielfalt", score: 90, note: "Viel Terrain für sportliche Fahrer." },
        { label: "Anreise", score: 84, note: "Ab München relativ schnell erreichbar." },
        { label: "Vibe & Events", score: 82, note: "Lebendig, aber stärker sportlich als gemütlich." },
        { label: "Budget-Fit", score: 70, note: "Oft teurer als Obertauern und Zell am See." },
      ],
      weather: {
        headline: "Gletscher als Schneereserve",
        summary: "Sölden ist ein starker Kandidat, wenn Schneesicherheit und sportliche Pisten höher gewichtet sind als Budgetruhe.",
        metrics: [
          { label: "Schnee-Fit", value: "Sehr gut", note: "Gletscher, Höhe und lange Saison." },
          { label: "Saison", value: "Nov. - Apr.", note: "Langes Fenster, offizielle Betriebszeiten prüfen." },
          { label: "Wind-Check", value: "Mittel", note: "Hohe Lagen können wetteranfälliger sein." },
        ],
        forecast: [
          { day: "Tag 1", summary: "Kalt", temp: "-9 bis -3 °C", snow: "hart" },
          { day: "Tag 2", summary: "Sonne/Wolken", temp: "-8 bis -2 °C", snow: "kompakt" },
          { day: "Tag 3", summary: "Schnee möglich", temp: "-7 bis -1 °C", snow: "frisch" },
        ],
      },
      costs: [
        { label: "Orientierung gesamt", value: "€ 610 p. P.", note: "Höherer Budgetbedarf, dafür sehr starke Schneesignale." },
        { label: "Unterkunft", value: "ca. € 340 - 430", note: "Stark termin- und lageabhängig." },
        { label: "Skipass", value: "ca. € 260 - 310", note: "Gletscher-/Gebietspreise offiziell prüfen." },
        { label: "Anreiseanteil", value: "ca. € 38", note: "Grobe Autofahrt-Schätzung ab München." },
      ],
      skipass: [
        { label: "Erwachsene", value: "ab ca. € 70 / Tag", note: "Orientierung, je nach Saison abweichend." },
        { label: "Mehrtagesticket", value: "ca. € 270 - 320", note: "Für sportliche Gruppen oft zentraler Kostenblock." },
        { label: "Gruppenhinweis", value: "Pakete prüfen", note: "Unterkunft + Skipass kann Preis stark verändern." },
      ],
      travelOptions: [
        { mode: "Auto", duration: "3:30 h", route: "München - Inntal - Ötztal", note: "238 km, Talverkehr einplanen." },
        { mode: "Bahn + Bus", duration: "ca. 4:30 - 5:15 h", route: "München - Ötztal Bahnhof - Bus", note: "Umstieg und Gepäcklogistik prüfen." },
      ],
      stayOptions: [
        { name: "Sporthotel Sölden", type: "Hotel", fit: "Sport & Komfort", price: "€€€" },
        { name: "Central Apartments", type: "Apartment", fit: "Gruppe", price: "€€€" },
      ],
      vibeDetails: [
        { label: "Vibe", value: "Sportlich", note: "Mehr Performance als Ruhe." },
        { label: "Après", value: "Aktiv", note: "Gute Szene, teils höheres Preisniveau." },
      ],
      eventHighlights: ["Sportliche Saison-Events", "Gletscher- und Weltcup-Flair", "Lebendige Abendoptionen im Ort"],
      skiServices: ["Skischulen und Guiding", "Freeride- und Technikangebote", "Verleih/Service im Ort"],
      dataStatus: ["Beta-Orientierungsdaten.", "Offizielle Gletscher- und Skipassinfos vor Buchung prüfen."],
      externalLinks: [{ label: "Offizielle Resort-Infos prüfen", href: "https://www.soelden.com/" }],
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
    detail: {
      seasonLabel: "Dezember bis März",
      lifts: "ca. 50+ Anlagen im Verbund",
      slopeDifficulty: [
        { label: "Blau", value: "56 km", width: 41 },
        { label: "Rot", value: "49 km", width: 36 },
        { label: "Schwarz", value: "33 km", width: 23 },
      ],
      facts: [
        { label: "Gebietstyp", value: "See, Stadt & Ski", detail: "Guter Mix aus Pisten, Ort und Freizeit." },
        { label: "Höhe", value: "757 - 3.029 m", detail: "Mit Gletscherverbund stärker als reines Talgebiet." },
        { label: "Pisten", value: "138 km", detail: "Vielseitig für gemischte Gruppen." },
        { label: "Anreise", value: "3:15 h", detail: "Kürzester Anreise-Fit im Demo-Set." },
        { label: "Budget", value: "€ 470 p. P.", detail: "Guter Value-Fit." },
        { label: "Gruppen-Fit", value: "Ausgewogen", detail: "Mehr Stadtgefühl, weniger reiner Party-Fokus." },
      ],
      factorScores: [
        { label: "Budget-Fit", score: 86, note: "Starkes Preis-Leistungs-Signal." },
        { label: "Anreise", score: 88, note: "Kurz und gut planbar ab München." },
        { label: "Vibe & Ort", score: 84, note: "See, Stadt und Freizeitoptionen." },
        { label: "Pistenvielfalt", score: 81, note: "Gut, aber weniger fokussiert als reine Sportziele." },
        { label: "Schneesicherheit", score: 76, note: "Guter Fit, aber wetterabhängiger als Hochplateau/Gletscher." },
      ],
      weather: {
        headline: "Guter Schnee-Fit mit stärkerer Wetterabhängigkeit",
        summary: "Zell am See überzeugt über Balance, kurze Anreise und Freizeitwert. Schnee sollte je nach Termin genauer geprüft werden.",
        metrics: [
          { label: "Schnee-Fit", value: "Gut", note: "Mit höheren Bereichen solide, Talbereiche wetterabhängiger." },
          { label: "Saison", value: "Dez. - März", note: "Januar/Februar am plausibelsten." },
          { label: "Wetterrisiko", value: "Mittel", note: "Vor Buchung Schneelage prüfen." },
        ],
        forecast: [
          { day: "Tag 1", summary: "Wolkig", temp: "-4 bis 2 °C", snow: "gemischt" },
          { day: "Tag 2", summary: "Sonne", temp: "-3 bis 3 °C", snow: "kompakt" },
          { day: "Tag 3", summary: "Niederschlag möglich", temp: "-2 bis 3 °C", snow: "variabel" },
        ],
      },
      costs: [
        { label: "Orientierung gesamt", value: "€ 470 p. P.", note: "Günstigste Top-3-Empfehlung." },
        { label: "Unterkunft", value: "ca. € 250 - 330", note: "Stadtlage und Seeblick können Preis erhöhen." },
        { label: "Skipass", value: "ca. € 230 - 280", note: "Verbund-/Saisonpreise offiziell prüfen." },
        { label: "Anreiseanteil", value: "ca. € 30", note: "Kurzer Demo-Routenfit ab München." },
      ],
      skipass: [
        { label: "Erwachsene", value: "ab ca. € 62 / Tag", note: "Orientierung, je nach Ticketverbund." },
        { label: "Mehrtagesticket", value: "ca. € 235 - 285", note: "Für Gruppenbudget gut kalkulierbar." },
      ],
      travelOptions: [
        { mode: "Auto", duration: "3:15 h", route: "München - Chiemgau - Zell am See", note: "168 km, kurze Anreise." },
        { mode: "Bahn", duration: "ca. 3:45 - 4:30 h", route: "München - Zell am See", note: "Attraktiv, wenn Unterkunft zentral liegt." },
      ],
      stayOptions: [
        { name: "Central Zell Apartments", type: "Apartment", fit: "Budget & Stadt", price: "€€" },
        { name: "Seehotel", type: "Hotel", fit: "Komfort & Ausblick", price: "€€€" },
      ],
      vibeDetails: [
        { label: "Vibe", value: "See & Stadt", note: "Mehr Abwechslung neben der Piste." },
        { label: "Abend", value: "Entspannt-lebendig", note: "Gute Gastronomie, weniger reiner Après-Fokus." },
      ],
      eventHighlights: ["Stadt- und Seeprogramm", "Hüttenabende je nach Saison", "Alternative Aktivitäten bei Wetterwechsel"],
      skiServices: ["Skischulen", "Verleih im Ort", "Familien- und Wiedereinsteigerangebote"],
      dataStatus: ["Beta-Orientierungsdaten.", "Schneelage für Talbereiche immer aktuell prüfen."],
      externalLinks: [{ label: "Offizielle Resort-Infos prüfen", href: "https://www.zellamsee-kaprun.com/" }],
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
    detail: {
      seasonLabel: "Dezember bis März",
      lifts: "70 Anlagen",
      slopeDifficulty: [
        { label: "Blau", value: "140 km", width: 52 },
        { label: "Rot", value: "112 km", width: 41 },
        { label: "Schwarz", value: "18 km", width: 7 },
      ],
      facts: [
        { label: "Gebietstyp", value: "Großer Skicircus", detail: "Sehr viele Pisten und Orte im Verbund." },
        { label: "Höhe", value: "1.003 - 2.096 m", detail: "Breit, aber nicht so hoch wie Obertauern/Sölden." },
        { label: "Pisten", value: "270 km", detail: "Stärkste Pistenmenge im Demo-Set." },
        { label: "Lifte", value: "70 Anlagen", detail: "Sehr hohe Infrastrukturbreite." },
        { label: "Beste Reisezeit", value: "Jan. - März", detail: "Für Gruppen und Events stark." },
        { label: "Gruppen-Fit", value: "Sehr hoch", detail: "Perfekt, wenn Größe und Abendprogramm zählen." },
      ],
      factorScores: [
        { label: "Pistenvielfalt", score: 95, note: "Sehr großes Gebiet mit vielen Optionen." },
        { label: "Vibe & Events", score: 90, note: "Sehr lebendig und gruppentauglich." },
        { label: "Schneesicherheit", score: 80, note: "Gut, aber niedrigere Höhen als Gletscher/Hochplateau." },
        { label: "Budget-Fit", score: 74, note: "Beliebtes Gebiet, früh buchen hilft." },
        { label: "Anreise", score: 78, note: "Planbar, aber nicht die kürzeste Option." },
      ],
      weather: {
        headline: "Großes Gebiet, gute Beschneiung",
        summary: "Saalbach punktet mit Größe und Infrastruktur. Schneesicherheit ist gut, aber stärker abhängig von Termin und Höhenlage.",
        metrics: [
          { label: "Schnee-Fit", value: "Sehr gut", note: "Großes Gebiet mit guter Infrastruktur." },
          { label: "Saison", value: "Dez. - März", note: "Januar bis März als Kernzeit." },
          { label: "Wetterrisiko", value: "Mittel", note: "Niedrigere Höhen als Gletscherziele beachten." },
        ],
        forecast: [
          { day: "Tag 1", summary: "Sonne/Wolken", temp: "-5 bis 1 °C", snow: "gut" },
          { day: "Tag 2", summary: "Schneeschauer", temp: "-6 bis 0 °C", snow: "frisch" },
          { day: "Tag 3", summary: "Klar", temp: "-7 bis -1 °C", snow: "griffig" },
        ],
      },
      costs: [
        { label: "Orientierung gesamt", value: "€ 540 p. P.", note: "Mittlerer bis höherer Budget-Fit." },
        { label: "Unterkunft", value: "ca. € 300 - 390", note: "Beliebte Wochenenden früh vergleichen." },
        { label: "Skipass", value: "ca. € 250 - 300", note: "Großes Verbundgebiet." },
        { label: "Anreiseanteil", value: "ca. € 42", note: "Grobe Autofahrt-Schätzung ab München." },
      ],
      skipass: [
        { label: "Erwachsene", value: "ab ca. € 68 / Tag", note: "Orientierung, offizielle Preise prüfen." },
        { label: "Mehrtagesticket", value: "ca. € 255 - 305", note: "Großes Gebiet spiegelt sich im Preis." },
      ],
      travelOptions: [
        { mode: "Auto", duration: "3:50 h", route: "München - Tirol/Salzburg - Saalbach", note: "270 km, Wochenendpuffer sinnvoll." },
        { mode: "Bahn + Bus", duration: "ca. 4:45 - 5:45 h", route: "München - Zell am See - Bus", note: "Transfers vorher abstimmen." },
      ],
      stayOptions: [
        { name: "Saalbach Lodge", type: "Apartment", fit: "Gruppen", price: "€€€" },
        { name: "Hinterglemm Base", type: "Hotel", fit: "Après & Piste", price: "€€€" },
      ],
      vibeDetails: [
        { label: "Vibe", value: "Sehr lebendig", note: "Stark für Gruppen und Après." },
        { label: "Gebietsgefühl", value: "Groß & vielfältig", note: "Mehr Planung nötig als in kompakten Resorts." },
      ],
      eventHighlights: ["Après-Ski und Hüttenabende", "Große Gruppenoptionen", "Viele Tagesrouten im Verbund"],
      skiServices: ["Skischulen", "Guides und Verleih", "Gruppenfreundliche Infrastruktur"],
      dataStatus: ["Beta-Orientierungsdaten.", "Beliebte Termine früh prüfen."],
      externalLinks: [{ label: "Offizielle Resort-Infos prüfen", href: "https://www.saalbach.com/" }],
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

function firstNumber(value: string) {
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function allNumbers(value: string) {
  return Array.from(value.matchAll(/\d+(?:[.,]\d+)?/g))
    .map((match) => Number(match[0].replace(",", ".")))
    .filter(Number.isFinite);
}

function parseDistanceKm(value: string) {
  return firstNumber(value);
}

function parseFuelCost(value: string) {
  return firstNumber(value);
}

function parseDurationMinutes(value: string) {
  const hours = value.match(/(\d+(?:[.,]\d+)?)\s*h/);
  const minutes = value.match(/(\d+)\s*min/);
  const hourValue = hours ? Number(hours[1].replace(",", ".")) : 0;
  const minuteValue = minutes ? Number(minutes[1]) : 0;
  const total = Math.round(hourValue * 60 + minuteValue);
  return total > 0 ? total : undefined;
}

function parseAltitude(value: string) {
  const values = allNumbers(value);
  return {
    min: values[0],
    max: values.length > 1 ? values[1] : values[0],
  };
}

function pisteDifficultyKm(resort: AlpivoResort, label: string) {
  return firstNumber(resort.detail.slopeDifficulty.find((item) => item.label.toLowerCase() === label)?.value ?? "");
}

function scoreFactorFromLabel(label: string): AlpivoScoreFactor {
  const normalized = label.toLowerCase();
  if (normalized.includes("schnee")) return "snow";
  if (normalized.includes("vibe") || normalized.includes("après") || normalized.includes("event")) return "vibe";
  if (normalized.includes("pisten")) return "pistes";
  if (normalized.includes("anreise")) return "travel";
  if (normalized.includes("budget") || normalized.includes("preis")) return "budget";
  if (normalized.includes("famil")) return "family";
  if (normalized.includes("unterkunft")) return "accommodation";
  return "events";
}

function normalizeSnowLabel(value: string): CanonicalResort["snow"]["label"] {
  if (value === "sehr gut" || value === "gut" || value === "mittel" || value === "unsicher") return value;
  return "mittel";
}

function scoreBreakdown(resort: AlpivoResort): ResortScoreBreakdown[] {
  const totalScore = resort.detail.factorScores.reduce((sum, item) => sum + item.score, 0) || 1;
  return resort.detail.factorScores.map((item) => ({
    factor: scoreFactorFromLabel(item.label),
    label: item.label,
    score: item.score,
    weight: Math.round((item.score / totalScore) * 100) / 100,
    explanation: item.note,
    confidence: "estimated",
    sourceIds: defaultPilotSourceIds,
  }));
}

function confidenceSummary(resort: AlpivoResort): { confidence: DataConfidence; missingFields: string[] } {
  const missingFields = [
    "Live-Unterkunftsverfügbarkeit",
    "verbindliche Skipasspreise je Datum",
    "Live-Wetter-/Lawinenlage",
  ];

  if (!resort.detail.externalLinks.length) missingFields.push("offizielle Resort-Quelle");
  return {
    confidence: resort.rank <= 4 ? "demo" : "estimated",
    missingFields,
  };
}

export function toCanonicalResort(resort: AlpivoResort): CanonicalResort {
  const altitude = parseAltitude(resort.altitude);
  const dataQuality = confidenceSummary(resort);
  const officialInfoUrl =
    getResortActionLinks(resort.slug).officialInfo?.url ??
    resort.detail.externalLinks.find((link) => /^https?:\/\//.test(link.href))?.href;

  return {
    id: resort.slug,
    slug: resort.slug,
    name: resort.name,
    country: resort.country,
    region: resort.region,
    coordinates: { lat: resort.coordinates.lat, lng: resort.coordinates.lon },
    rank: resort.rank,
    matchScore: resort.score,
    matchLabel: resort.rank === 1 ? "Top Match" : `#${resort.rank} Match`,
    heroImage: resort.image,
    mapImage: resort.image,
    tags: resort.tags,
    shortDescription: resort.description,
    longDescription: resort.detail.weather.summary,
    price: {
      estimatedPerPerson: resort.pricePerPerson,
      currency: "EUR",
      range: {
        min: Math.max(0, resort.pricePerPerson - 70),
        max: resort.pricePerPerson + 90,
      },
      confidence: "estimated",
      sourceIds: [alpivoDataSources.alpivoEstimate.id, alpivoDataSources.alpivoPilot.id],
    },
    travelFromMunich: {
      durationLabel: resort.travelTimeFromMunich,
      durationMinutes: parseDurationMinutes(resort.travelTimeFromMunich),
      distanceKm: parseDistanceKm(resort.distanceFromMunich),
      fuelEstimate: parseFuelCost(resort.fuelCost),
      carRouteLabel: resort.detail.travelOptions.find((option) => option.mode === "Auto")?.route,
      trainOptionLabel: resort.detail.travelOptions.find((option) => option.mode.toLowerCase().includes("bahn"))?.duration,
      caveat: resort.routeSummary.note,
      confidence: "estimated",
      sourceIds: defaultPilotSourceIds,
    },
    snow: {
      label: normalizeSnowLabel(resort.snowLabel),
      seasonLabel: resort.detail.seasonLabel,
      altitudeMin: altitude.min,
      altitudeMax: altitude.max,
      glacier: resort.tags.some((tag) => tag.toLowerCase().includes("gletscher")),
      snowmakingNote: resort.detail.weather.metrics.find((metric) => metric.label.toLowerCase().includes("schnee"))?.note,
      caveat: resort.detail.weather.metrics.find((metric) => metric.label.toLowerCase().includes("risiko") || metric.label.toLowerCase().includes("wind"))?.note,
      confidence: "estimated",
      sourceIds: defaultPilotSourceIds,
    },
    skiArea: {
      pisteKm: firstNumber(resort.pisteKm),
      lifts: firstNumber(resort.detail.lifts),
      altitudeLabel: resort.altitude,
      blueKm: pisteDifficultyKm(resort, "blau"),
      redKm: pisteDifficultyKm(resort, "rot"),
      blackKm: pisteDifficultyKm(resort, "schwarz"),
      beginnerFit: resort.detail.factorScores.find((score) => score.label.toLowerCase().includes("pisten"))?.score,
      intermediateFit: resort.score,
      advancedFit: resort.detail.factorScores.find((score) => score.label.toLowerCase().includes("sport"))?.score,
      confidence: "estimated",
      sourceIds: defaultPilotSourceIds,
    },
    vibe: {
      label: resort.vibeLabel,
      apresFit: resort.detail.factorScores.find((score) => score.label.toLowerCase().includes("vibe"))?.score,
      familyFit: resort.detail.factorScores.find((score) => score.label.toLowerCase().includes("famil"))?.score,
      quietFit: resort.vibeLabel.toLowerCase().includes("ruhig") ? 85 : undefined,
      sportFit: resort.vibeLabel.toLowerCase().includes("sport") ? 88 : undefined,
      eventFit: resort.detail.eventHighlights.length ? 76 : undefined,
      notes: resort.detail.vibeDetails.map((item) => `${item.label}: ${item.note}`),
      confidence: "demo",
      sourceIds: [alpivoDataSources.alpivoPilot.id],
    },
    accommodation: {
      fitLabel: resort.detail.stayOptions[0]?.fit,
      examples: resort.detail.stayOptions.map((option) => ({
        name: option.name,
        type: option.type,
        priceTier: option.price as "€" | "€€" | "€€€" | "€€€€",
        note: option.fit,
        confidence: "demo",
      })),
      caveat: "Beispiel-Unterkünfte sind Produktdaten für die Beta und keine geprüfte Live-Verfügbarkeit.",
    },
    actionLinks: getResortActionLinks(resort.slug),
    matchReasons: resort.reasons,
    drawback: resort.drawback,
    scoreBreakdown: scoreBreakdown(resort),
    officialInfoUrl,
    dataStatus: {
      summary: "Beta-Daten: Score, Kosten und Signale sind kuratierte Orientierung, keine Buchungsgarantie.",
      missingFields: dataQuality.missingFields,
      lastUpdated: "2026-05-17",
      overallConfidence: dataQuality.confidence,
    },
  };
}

export const alpivoCanonicalResorts = alpivoResorts.map(toCanonicalResort);

export function getCanonicalResortBySlug(slug: string | null | undefined) {
  const resort = getAlpivoResortBySlug(slug);
  return resort ? toCanonicalResort(resort) : null;
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
