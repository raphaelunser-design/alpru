import type { TripPreferences } from "@/types/alpivo";
import type { MatchPayload } from "@/lib/matching/matchPayload";

export type SkipassRecommendation = {
  fullSkiDays: number;
  possibleTicketDays: number;
  ticketTypeLabel: string;
  dateHint: string;
  groupHint: string;
  officialCheckHint: string;
};

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function diffCalendarDays(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.round((endUtc - startUtc) / 86_400_000));
}

export function getSkipassRecommendation(preferences: Partial<TripPreferences> | MatchPayload, groupSize?: number): SkipassRecommendation {
  const start = parseIsoDate(preferences.tripStartDate);
  const end = parseIsoDate(preferences.tripEndDate);
  const peopleCount = Math.max(1, Math.round(Number(groupSize ?? preferences.peopleCount ?? 1)));

  if (!start || !end) {
    return {
      fullSkiDays: 1,
      possibleTicketDays: 1,
      ticketTypeLabel: "1-Tages- oder Mehrtages-Ticket prüfen",
      dateHint: "Wähle zuerst Anreise und Abreise, damit Alpivo die möglichen Skitage genauer einordnen kann.",
      groupHint: peopleCount > 1 ? `Für ${peopleCount} Personen Altersgruppen und Gruppenregeln offiziell prüfen.` : "Altersgruppe und Ticketregeln offiziell prüfen.",
      officialCheckHint: "Preise, Altersgruppen und KeyCard-/Smartphone-Ticket-Regeln bitte im offiziellen Shop prüfen.",
    };
  }

  const tripDays = Math.max(1, diffCalendarDays(start, end));
  const fullSkiDays = Math.max(1, tripDays - 1);
  const possibleTicketDays = Math.max(fullSkiDays, Math.min(tripDays, fullSkiDays + 1));
  const ticketTypeLabel =
    possibleTicketDays > fullSkiDays
      ? `${fullSkiDays}- oder ${possibleTicketDays}-Tages-Ticket prüfen`
      : `${fullSkiDays}-Tages-Ticket prüfen`;

  return {
    fullSkiDays,
    possibleTicketDays,
    ticketTypeLabel,
    dateHint:
      possibleTicketDays > fullSkiDays
        ? `Bei diesem Zeitraum sind ${fullSkiDays} volle Skitage wahrscheinlich. Je nach Anreisezeit kann auch ein ${possibleTicketDays}-Tages-Ticket sinnvoll sein.`
        : `Bei diesem Zeitraum sind etwa ${fullSkiDays} volle Skitage wahrscheinlich.`,
    groupHint:
      peopleCount > 1
        ? `Für ${peopleCount} Personen bitte Erwachsene, Jugendliche, Kinder und mögliche Gruppentarife offiziell prüfen.`
        : "Bitte Altersgruppe, Ticketmedium und Gültigkeitsbereich offiziell prüfen.",
    officialCheckHint: "Preise, Altersgruppen und KeyCard-/Smartphone-Ticket-Regeln bitte im offiziellen Shop prüfen.",
  };
}
