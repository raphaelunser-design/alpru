import type { DataSource } from "@/types/alpivo";

export const alpivoDataSources = {
  alpivoPilot: {
    id: "alpivo-pilot",
    label: "Alpivo Pilotdatensatz",
    sourceType: "internal_demo",
    lastChecked: "2026-05-17",
    confidence: "demo",
    notes: "Kuratierte Beta-Daten für die Produktlogik. Werte dienen als Orientierung und werden nicht als Live-Verfügbarkeit behauptet.",
  },
  alpivoEstimate: {
    id: "alpivo-estimate",
    label: "Alpivo Kostenschätzung",
    sourceType: "alpivo_estimate",
    lastChecked: "2026-05-17",
    confidence: "estimated",
    notes: "Kostenkorridore sind Beta-Schätzungen aus Skipass-, Unterkunfts-, Anreise- und Verpflegungsannahmen.",
  },
  officialResortInfo: {
    id: "official-resort-info",
    label: "Offizielle Resort-Informationen",
    sourceType: "official_resort",
    lastChecked: "2026-05-17",
    confidence: "official",
    notes: "Offizielle Seiten müssen vor Buchung für Preise, Öffnungszeiten, Wetter, Lawinenlage und Verfügbarkeit geprüft werden.",
  },
  missingLiveAvailability: {
    id: "missing-live-availability",
    label: "Live-Verfügbarkeit fehlt",
    sourceType: "unknown",
    confidence: "missing",
    notes: "Alpivo nutzt noch keine verbindlichen Live-Buchungs- oder Unterkunftsverfügbarkeiten.",
  },
} satisfies Record<string, DataSource>;

export const defaultPilotSourceIds = [
  alpivoDataSources.alpivoPilot.id,
  alpivoDataSources.alpivoEstimate.id,
  alpivoDataSources.officialResortInfo.id,
];
