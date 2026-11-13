const resortFacts: Record<string, { pisteKm: number; lifts: number; pisteNote?: string; liftNote?: string; source: string }> = {
  obertauern: {
    pisteKm: 100,
    lifts: 26,
    source: "https://app.obertauern.com/obertauern-facts",
  },
  solden: {
    pisteKm: 147,
    lifts: 31,
    source: "https://www.soelden.com/de/aktivitaeten/winter/skifahren-snowboarden/skigebietsinformationen",
  },
  "serfaus-fiss-ladis": {
    pisteKm: 214,
    lifts: 38,
    pisteNote: "Gefahrene Kilometer inklusive Skirouten. Der offizielle Pistenplan nennt 162 gemessene Kilometer.",
    liftNote: "Zusätzlich 30 Förderbänder und Stricklifte.",
    source: "https://www.serfaus-fiss-ladis.at/de/winterurlaub/skigebiet-und-winteraktivitaeten",
  },
  "alta-badia": {
    pisteKm: 130,
    lifts: 54,
    source: "https://www.altabadia.org/de/alta-badia-skipass/alta-badia-skigebiet-preise",
  },
};

export function getResortFacts(slug: string) {
  return Object.hasOwn(resortFacts, slug) ? resortFacts[slug] : undefined;
}
