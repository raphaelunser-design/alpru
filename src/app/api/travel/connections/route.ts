import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TravelMode = "car" | "train" | "bus" | "flight";
type ProviderId = "db" | "omio" | "trainline";

type ProviderState = {
  id: ProviderId;
  label: string;
  status: "ready" | "link-only" | "not-applicable";
  capability: string;
};

type TravelConnectionOffer = {
  id: string;
  provider: ProviderId;
  mode: TravelMode;
  title: string;
  departureTime: string | null;
  arrivalTime: string | null;
  durationMinutes: number | null;
  changes: number | null;
  price: number | null;
  currency: string;
  bookingUrl: string | null;
  source: "provider-api" | "search-link";
};

const providerSettings: Record<ProviderId, { label: string; envKeys: string[]; modes: TravelMode[]; capability: string }> = {
  db: {
    label: "DB",
    envKeys: ["DB_TRAVEL_API_KEY", "DB_PARTNER_ID"],
    modes: ["train"],
    capability: "Bahnverbindung, Dauer, Umstiege und Buchungslink",
  },
  omio: {
    label: "Omio",
    envKeys: ["OMIO_API_KEY", "OMIO_PARTNER_ID"],
    modes: ["train", "bus", "flight"],
    capability: "Vergleich für Bahn, Bus, Flug und Partnerlink",
  },
  trainline: {
    label: "Trainline",
    envKeys: ["TRAINLINE_API_KEY", "TRAINLINE_PARTNER_ID"],
    modes: ["train"],
    capability: "Internationale Bahnverbindungen und Buchungslink",
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function normalizeMode(value: unknown): TravelMode {
  if (value === "train" || value === "bus" || value === "flight") return value;
  return "car";
}

function hasProviderConfig(envKeys: string[]) {
  return envKeys.some((key) => Boolean(process.env[key]?.trim()));
}

export async function POST(req: Request) {
  const body = asRecord(await req.json().catch(() => null));
  const travelMode = normalizeMode(body.travelMode);
  const tripStartDate = typeof body.tripStartDate === "string" ? body.tripStartDate : null;

  const providers = (Object.entries(providerSettings) as Array<[ProviderId, (typeof providerSettings)[ProviderId]]>).map(
    ([id, config]): ProviderState => {
      const applicable = config.modes.includes(travelMode) || travelMode === "car";
      if (!applicable) {
        return {
          id,
          label: config.label,
          status: "not-applicable",
          capability: config.capability,
        };
      }

      return {
        id,
        label: config.label,
        status: hasProviderConfig(config.envKeys) ? "ready" : "link-only",
        capability: config.capability,
      };
    }
  );

  const configured = providers.some((provider) => provider.status === "ready");
  const connections: TravelConnectionOffer[] = [];

  return NextResponse.json({
    configured,
    providers,
    connections,
    cheapest: connections
      .filter((connection) => typeof connection.price === "number")
      .sort((a, b) => Number(a.price) - Number(b.price))[0] ?? null,
    requestedDate: tripStartDate,
    note: configured
      ? "Mindestens ein Travel-Provider ist konfiguriert. Sobald die konkrete Provider-Integration aktiv ist, erscheinen hier echte Preise."
      : "Noch kein Travel-Provider ist per API oder Partner-ID konfiguriert. Alpivo nutzt deshalb aktuell nur ausgehende Suchlinks.",
  });
}
