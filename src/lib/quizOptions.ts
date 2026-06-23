import { MATCH_PREF_DEFAULTS } from "@/lib/matching/matchPayload";
import type { MusicPreference, PartyPreference } from "@/lib/resortEvents";

export const ALPINE_COUNTRIES_DE = [
  "all",
  "Österreich",
  "Schweiz",
  "Deutschland",
  "Frankreich",
  "Italien",
  "Liechtenstein",
  "Monaco",
  "Slowenien",
];

export const countryOptions = ALPINE_COUNTRIES_DE.map((country) => ({
  value: country,
  label: country === "all" ? "Alle Länder" : country,
}));

export const partyOptions: Array<{ value: PartyPreference; label: string }> = [
  { value: "indifferent", label: "Egal, Hauptsache gutes Skigebiet" },
  { value: "some_apres", label: "Ein bisschen Après-Ski wäre gut" },
  { value: "party_places", label: "Wir suchen bewusst Party-Orte" },
  { value: "festival_event", label: "Wir wollen ein Festival oder Event mitnehmen" },
  { value: "quiet_no_events", label: "Wir wollen eher Ruhe und keine großen Events" },
];

export const musicOptions: Array<{ value: MusicPreference; label: string }> = [
  { value: "edm_electronic", label: "EDM / Electronic" },
  { value: "techno_house", label: "Techno / House" },
  { value: "apres_schlager", label: "Après-Ski / Schlager" },
  { value: "pop_mainstream", label: "Pop / Mainstream" },
  { value: "rock_indie_live", label: "Rock / Indie / Livebands" },
  { value: "hiphop_urban", label: "Hip-Hop / Urban" },
  { value: "any", label: "Egal" },
];

export const exclusionCountryOptions = ["Frankreich", "Schweiz", "Österreich", "Italien", "Deutschland"];

export const wizardSteps = [
  {
    label: "Profil",
    title: "Wer plant den Ski-Trip?",
    text: "Wählt euer Profil. Alpivo übernimmt sinnvolle Startwerte und ihr könnt danach feinjustieren.",
  },
  {
    label: "Prioritäten",
    title: "Was ist euch wichtig?",
    text: "Legt Vibe, Events und die wichtigsten Match-Signale fest.",
  },
  {
    label: "Details",
    title: "Budget, Zeitraum und harte Grenzen",
    text: "Setzt die planbaren Rahmenbedingungen, bevor Alpivo die Liste berechnet.",
  },
  {
    label: "Ergebnis",
    title: "Feinschliff und Match starten",
    text: "Prüft die Zusammenfassung und öffnet dann eure Empfehlungen.",
  },
] as const;

export const defaultPrefs = { ...MATCH_PREF_DEFAULTS };

export function signalLabel(value: number) {
  if (value >= 5) return "sehr hoch";
  if (value >= 4) return "hoch";
  if (value >= 2) return "mittel";
  return "optional";
}

export function parseIsoDate(value: string | null) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
