export type ResortEventDataQuality = "official" | "estimated" | "outdated" | "missing";
export type ResortEventType = "festival" | "concert" | "apres_ski" | "opening" | "closing" | "local_event";
export type PartyPreference = "indifferent" | "some_apres" | "party_places" | "festival_event" | "quiet_no_events";
export type MusicPreference =
  | "edm_electronic"
  | "techno_house"
  | "apres_schlager"
  | "pop_mainstream"
  | "rock_indie_live"
  | "hiphop_urban"
  | "any";

export type ResortEvent = {
  id: string;
  resort_id?: string | null;
  name: string;
  event_type: ResortEventType | string;
  music_genres: string[] | null;
  vibe_tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
  recurring_month: number | null;
  location_name: string | null;
  altitude_m: number | null;
  ticket_required: boolean | null;
  ticket_price_from: number | null;
  official_url: string | null;
  short_description: string | null;
  best_for: string | null;
  not_ideal_for: string | null;
  data_quality: ResortEventDataQuality | string | null;
  last_checked_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type EventTripFit = "exact" | "seasonal" | "none";

export type FestivalFitOptions = {
  partyPreference?: PartyPreference;
  musicPreference?: MusicPreference;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  apresSkiScore?: number | null;
  crowdScore?: number | null;
  wantsApresSki?: boolean;
  wantsQuiet?: boolean;
};

export type FestivalFitResult = {
  score: number;
  events: ResortEvent[];
  matchingEvents: ResortEvent[];
  exactTripEvent: boolean;
  seasonalTripEvent: boolean;
  musicFit: boolean;
  hasMajorPartyEvent: boolean;
  eventNames: string[];
};

const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const periodFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number, fallback = 0.5) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function toArray(value: unknown) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthFromDate(value: string | null | undefined) {
  const date = parseIsoDate(value);
  return date ? date.getUTCMonth() + 1 : null;
}

function normalizedText(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function eventText(event: ResortEvent) {
  return normalizedText(
    [
      event.name,
      event.event_type,
      ...(event.music_genres ?? []),
      ...(event.vibe_tags ?? []),
      event.short_description,
      event.best_for,
      event.not_ideal_for,
    ].join(" ")
  );
}

function eventSortKey(event: ResortEvent) {
  const start = parseIsoDate(event.start_date);
  if (start) return start.getTime();
  if (event.recurring_month) return Date.UTC(2100, event.recurring_month - 1, 1);
  return Date.UTC(2200, 0, 1);
}

export function normalizeResortEvents(input: unknown): ResortEvent[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((event) => {
      const row = event as Partial<ResortEvent>;
      const id = String(row.id ?? "").trim();
      const name = String(row.name ?? "").trim();
      if (!id || !name) return null;
      const recurringMonth =
        typeof row.recurring_month === "number" && row.recurring_month >= 1 && row.recurring_month <= 12
          ? row.recurring_month
          : null;
      const normalizedEvent: ResortEvent = {
        id,
        resort_id: row.resort_id ?? null,
        name,
        event_type: row.event_type ?? "local_event",
        music_genres: toArray(row.music_genres),
        vibe_tags: toArray(row.vibe_tags),
        start_date: row.start_date ?? null,
        end_date: row.end_date ?? null,
        recurring_month: recurringMonth,
        location_name: row.location_name ?? null,
        altitude_m: typeof row.altitude_m === "number" ? row.altitude_m : null,
        ticket_required: typeof row.ticket_required === "boolean" ? row.ticket_required : null,
        ticket_price_from: typeof row.ticket_price_from === "number" ? row.ticket_price_from : null,
        official_url: row.official_url ?? null,
        short_description: row.short_description ?? null,
        best_for: row.best_for ?? null,
        not_ideal_for: row.not_ideal_for ?? null,
        data_quality: row.data_quality ?? "estimated",
        last_checked_at: row.last_checked_at ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      };
      return normalizedEvent;
    })
    .filter((event): event is ResortEvent => event !== null)
    .sort((a, b) => eventSortKey(a) - eventSortKey(b) || a.name.localeCompare(b.name, "de-DE"));
}

export function eventTypeLabel(type: string | null | undefined) {
  if (type === "festival") return "Festival";
  if (type === "concert") return "Konzert";
  if (type === "apres_ski") return "Après-Ski";
  if (type === "opening") return "Opening";
  if (type === "closing") return "Closing";
  return "Lokales Event";
}

export function dataQualityLabel(value: string | null | undefined) {
  if (value === "official") return "Offiziell";
  if (value === "outdated") return "Datum prüfen";
  if (value === "missing") return "Daten fehlen";
  return "Saisonal geschätzt";
}

export function dataQualityHint(value: string | null | undefined) {
  if (value === "official") return "Quelle und Zeitraum sind als offizielle Basisdaten gepflegt.";
  if (value === "outdated") return "Das Event ist bekannt, der hinterlegte Zeitraum kann bereits vorbei sein.";
  if (value === "missing") return "Basisdaten sind noch unvollständig.";
  return "Saisonaler oder wiederkehrender Zeitraum, vor Buchung offiziell prüfen.";
}

export function formatEventPeriod(event: ResortEvent) {
  const start = parseIsoDate(event.start_date);
  const end = parseIsoDate(event.end_date);
  if (start && end) {
    if (start.getTime() === end.getTime()) return periodFormatter.format(start);
    return `${periodFormatter.format(start)} - ${periodFormatter.format(end)}`;
  }
  if (start) return `ab ${periodFormatter.format(start)}`;
  if (event.recurring_month) return `saisonal im ${monthNames[event.recurring_month - 1]}`;
  return "Zeitraum offen";
}

function monthsBetween(start: Date, end: Date) {
  const months = new Set<number>();
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const limit = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  let guard = 0;
  while (cursor <= limit && guard < 24) {
    months.add(cursor.getUTCMonth() + 1);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    guard += 1;
  }
  return months;
}

export function eventTripFit(event: ResortEvent, tripStartDate?: string | null, tripEndDate?: string | null): EventTripFit {
  const tripStart = parseIsoDate(tripStartDate);
  const tripEnd = parseIsoDate(tripEndDate) ?? tripStart;
  if (!tripStart || !tripEnd) return "none";

  const eventStart = parseIsoDate(event.start_date);
  const eventEnd = parseIsoDate(event.end_date) ?? eventStart;
  if (eventStart && eventEnd && eventEnd >= tripStart && eventStart <= tripEnd) return "exact";

  const months = monthsBetween(tripStart, tripEnd);
  const recurringMonth = event.recurring_month ?? monthFromDate(event.start_date);
  if (recurringMonth && months.has(recurringMonth)) return "seasonal";
  return "none";
}

function preferenceTokens(preference: MusicPreference | undefined) {
  if (!preference || preference === "any") return [];
  if (preference === "edm_electronic") return ["edm", "electronic", "elektronisch"];
  if (preference === "techno_house") return ["techno", "house"];
  if (preference === "apres_schlager") return ["apres", "schlager"];
  if (preference === "pop_mainstream") return ["pop", "mainstream"];
  if (preference === "rock_indie_live") return ["rock", "indie", "live"];
  if (preference === "hiphop_urban") return ["hip hop", "hiphop", "urban", "rap"];
  return [];
}

export function musicPreferenceLabel(preference: MusicPreference | undefined) {
  if (preference === "edm_electronic") return "EDM/Electronic";
  if (preference === "techno_house") return "Techno/House";
  if (preference === "apres_schlager") return "Après/Schlager";
  if (preference === "pop_mainstream") return "Pop/Mainstream";
  if (preference === "rock_indie_live") return "Rock/Indie/Live-Musik";
  if (preference === "hiphop_urban") return "Hip-Hop/Urban";
  return "Musikrichtung offen";
}

export function musicMatchesEvent(event: ResortEvent, preference: MusicPreference | undefined) {
  const tokens = preferenceTokens(preference);
  if (!tokens.length) return true;
  const text = eventText(event);
  return tokens.some((token) => text.includes(normalizedText(token)));
}

export function isMajorPartyEvent(event: ResortEvent) {
  const text = eventText(event);
  return (
    event.event_type === "festival" ||
    event.event_type === "concert" ||
    text.includes("party") ||
    text.includes("young crowd") ||
    text.includes("electronic") ||
    text.includes("big stage") ||
    text.includes("apres")
  );
}

function eventStrength(event: ResortEvent) {
  const text = eventText(event);
  let score = 0.35;
  if (event.event_type === "festival") score += 0.32;
  if (event.event_type === "concert") score += 0.22;
  if (event.event_type === "apres_ski") score += 0.2;
  if (text.includes("party")) score += 0.13;
  if (text.includes("young crowd") || text.includes("student friendly")) score += 0.1;
  if (text.includes("big stage") || text.includes("mountain stage")) score += 0.08;
  if (event.data_quality === "official") score += 0.06;
  if (event.data_quality === "outdated" || event.data_quality === "missing") score -= 0.08;
  return clamp01(score);
}

export function deriveEventBadges(eventsInput: unknown, quietScore?: number | null) {
  const events = normalizeResortEvents(eventsInput);
  const labels: string[] = [];
  const allText = normalizedText(events.map(eventText).join(" "));

  if (events.some((event) => event.event_type === "festival")) labels.push("Festival");
  if (allText.includes("edm") || allText.includes("electronic") || allText.includes("techno") || allText.includes("house")) {
    labels.push("EDM");
  }
  if (allText.includes("apres") || allText.includes("schlager")) labels.push("Après");
  if (allText.includes("live") || allText.includes("rock") || allText.includes("indie") || events.some((event) => event.event_type === "concert")) {
    labels.push("Live-Musik");
  }
  if (allText.includes("young crowd") || allText.includes("student friendly")) labels.push("Junge Gruppen");
  if (typeof quietScore === "number" && quietScore >= 0.68 && !events.some(isMajorPartyEvent)) labels.push("Ruhiger Ort");

  return Array.from(new Set(labels)).slice(0, 5);
}

function resolvePartyPreference(options: FestivalFitOptions): PartyPreference {
  if (options.partyPreference) return options.partyPreference;
  if (options.wantsQuiet) return "quiet_no_events";
  if (options.wantsApresSki) return "some_apres";
  return "indifferent";
}

export function calculateFestivalFit(eventsInput: unknown, options: FestivalFitOptions = {}): FestivalFitResult {
  const events = normalizeResortEvents(eventsInput);
  const partyPreference = resolvePartyPreference(options);
  const musicPreference = options.musicPreference ?? "any";
  const apresScore = clamp01(options.apresSkiScore ?? 0.5);
  const quietScore = 1 - clamp01(options.crowdScore ?? 0.5);
  const hasTripDates = Boolean(options.tripStartDate && options.tripEndDate);
  const fits = events.map((event) => ({
    event,
    fit: eventTripFit(event, options.tripStartDate, options.tripEndDate),
    strength: eventStrength(event),
    music: musicMatchesEvent(event, musicPreference),
  }));
  const matchingEvents = fits
    .filter((entry) => !hasTripDates || entry.fit !== "none" || partyPreference !== "festival_event")
    .filter((entry) => entry.music || musicPreference === "any")
    .map((entry) => entry.event);
  const exactTripEvent = fits.some((entry) => entry.fit === "exact");
  const seasonalTripEvent = fits.some((entry) => entry.fit === "seasonal");
  const hasMajorPartyEvent = events.some(isMajorPartyEvent);
  const musicFit = musicPreference === "any" || fits.some((entry) => entry.music);
  const bestStrength = fits.reduce((max, entry) => Math.max(max, entry.strength), 0);
  const tripSignal = exactTripEvent ? 1 : seasonalTripEvent ? 0.82 : events.length ? 0.45 : 0;
  const musicSignal = musicPreference === "any" ? 0.66 : musicFit ? 1 : 0.28;
  const youthSignal = events.some((event) => {
    const text = eventText(event);
    return text.includes("young crowd") || text.includes("student friendly");
  })
    ? 1
    : 0.45;

  let score = 62;
  if (partyPreference === "indifferent") {
    score = events.length ? 64 + bestStrength * 8 : 62;
  } else if (partyPreference === "some_apres") {
    score = 46 + apresScore * 26 + bestStrength * 13 + tripSignal * 9 + musicSignal * 6;
  } else if (partyPreference === "party_places") {
    score = 42 + apresScore * 24 + bestStrength * 18 + tripSignal * 11 + musicSignal * 5;
  } else if (partyPreference === "festival_event") {
    score = events.length ? 38 + tripSignal * 30 + bestStrength * 20 + musicSignal * 8 + youthSignal * 4 : 38 + apresScore * 8;
  } else if (partyPreference === "quiet_no_events") {
    const eventPenalty = exactTripEvent && hasMajorPartyEvent ? 42 : seasonalTripEvent && hasMajorPartyEvent ? 28 : hasMajorPartyEvent ? 13 : 0;
    score = 70 + quietScore * 24 - eventPenalty - bestStrength * 8;
    if (!hasMajorPartyEvent) score += 5;
  }

  return {
    score: Math.round(clamp(score)),
    events,
    matchingEvents,
    exactTripEvent,
    seasonalTripEvent,
    musicFit,
    hasMajorPartyEvent,
    eventNames: matchingEvents.map((event) => event.name),
  };
}
