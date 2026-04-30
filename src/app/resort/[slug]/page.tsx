"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";
import ApresSkiSpots, { type ApresSpot } from "@/components/ApresSkiSpots";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import PisteMapSection from "@/components/PisteMapSection";
import ResortVibe from "@/components/ResortVibe";
import Section from "@/components/Section";
import TravelConnectionPanel, { type TravelMode } from "@/components/TravelConnectionPanel";
import { deriveResortDecision, resortSignalSelect, type ResortSignalRow } from "@/lib/resortSignals";
import { findMvpResortBySlug, sanitizeResortRow } from "@/lib/mvpResorts";

type Resort = ResortSignalRow & {
  skipass_price_from: number | null;
  skipass_price_currency: string | null;
  skipass_price_last_checked: string | null;
  skipass_price_note: string | null;
  distance_km: number | null;
  drive_hours: number | null;
};

type RatingStats = {
  avg: number | null;
  count: number;
};

type WeatherPointData = {
  label: "Tal" | "Berg";
  elevation_m: number | null;
  data_quality: "elevation_adjusted" | "fallback";
  current: {
    time: string | null;
    temperature_c: number | null;
    apparent_temperature_c: number | null;
    wind_kph: number | null;
    precipitation_mm: number | null;
    snowfall_cm: number | null;
    snowfall_24h_cm: number | null;
    weather_code: number | null;
    cloud_cover_pct: number | null;
    ski_hint: string;
  };
  hourly: Array<{
    time: string;
    temperature_c: number | null;
    apparent_temperature_c: number | null;
    wind_kph: number | null;
    precipitation_mm: number | null;
    snowfall_cm: number | null;
    weather_code: number | null;
  }>;
  daily: Array<{
    date: string;
    temp_max_c: number | null;
    temp_min_c: number | null;
    snowfall_cm: number | null;
    precipitation_mm: number | null;
    wind_max_kph: number | null;
  }>;
};

type WeatherData = {
  timezone: string;
  timezone_abbreviation: string | null;
  resort_local_time: string | null;
  valley: WeatherPointData;
  mountain: WeatherPointData;
  current: {
    temperature_c: number | null;
    apparent_temperature_c: number | null;
    wind_kph: number | null;
    precipitation_mm: number | null;
    snowfall_cm: number | null;
    snowfall_24h_cm: number | null;
    weather_code: number | null;
    cloud_cover_pct: number | null;
    ski_hint: string;
  };
  daily: Array<{
    date: string;
    temp_max_c: number | null;
    temp_min_c: number | null;
    snowfall_cm: number | null;
    precipitation_mm: number | null;
    wind_max_kph: number | null;
  }>;
  weather_updated_at: string;
  updated_at: string;
  cache: string;
};

type SkipassPriceRow = {
  id: string;
  resort_slug: string;
  ticket_name: string;
  ticket_category: string;
  age_group: string;
  age_label: string;
  min_age: number | null;
  max_age: number | null;
  season_label: string | null;
  valid_from: string | null;
  valid_to: string | null;
  currency: string;
  price: number;
  price_type: "fixed" | "from";
  source_url: string | null;
  source_label: string | null;
  affiliate_url: string | null;
  last_checked: string | null;
  note: string | null;
};

type StoredOrigin = {
  lat: number;
  lon: number;
  label: string;
} | null;

type TravelPrefs = {
  travelMode: TravelMode;
  tripStartDate: string | null;
  tripEndDate: string | null;
};

const weatherLabels: Record<number, string> = {
  0: "Klar",
  1: "Überwiegend klar",
  2: "Teilweise bewölkt",
  3: "Bewölkt",
  45: "Nebel",
  48: "Reifnebel",
  51: "Leichter Niesel",
  53: "Niesel",
  55: "Starker Niesel",
  61: "Leichter Regen",
  63: "Regen",
  65: "Starker Regen",
  71: "Leichter Schnee",
  73: "Schnee",
  75: "Starker Schnee",
  77: "Schneekörner",
  80: "Schauer",
  81: "Starke Schauer",
  82: "Heftige Schauer",
  85: "Schneeschauer",
  86: "Starke Schneeschauer",
  95: "Gewitter",
  96: "Gewitter + Hagel",
  99: "Starkes Gewitter + Hagel",
};

const resortDetailSelect = [
  resortSignalSelect,
  "skipass_price_currency",
  "skipass_price_last_checked",
  "skipass_price_note",
].join(",");

const FILTER_STORAGE_KEY = "alpivo_results_filters";
const QUIZ_STORAGE_KEY = "alpivo_quiz_prefs";

function formatMaybeNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${new Intl.NumberFormat("de-DE").format(value)}${suffix}`;
}

function weatherLabel(code: number | null | undefined) {
  if (code === null || code === undefined) return "Unbekannt";
  return weatherLabels[code] `Code ${code}`;
}

function formatUpdated(value: string | null | undefined, timeZone: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: timeZone || "Europe/Berlin",
      hourCycle: "h23",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short", hourCycle: "h23" }).format(date);
  }
}

function formatWeatherLocalTime(value: string | null | undefined) {
  if (!value) return "-";
  const [datePart, timePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour = "00", minute = "00"] = timePart.split(":");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}, ${hour}:${minute}`;
}

function formatWeatherHour(value: string | null | undefined) {
  if (!value) return "-";
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const [hour = "00", minute = "00"] = timePart.split(":");
  return `${hour}:${minute}`;
}

function formatWeatherDay(value: string | null | undefined) {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(
    new Date(year, month - 1, day)
  );
}

function buildTrackingUrl(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const keys = Array.from(url.searchParams.keys()).map((k) => k.toLowerCase());
    const hasTracking = keys.some((k) => k.startsWith("utm_"));
    if (!hasTracking) {
      url.searchParams.set("utm_source", "alpivo");
      url.searchParams.set("utm_medium", "affiliate");
      url.searchParams.set("utm_campaign", "skipass");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function tag(label: string) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur">
      {label}
    </span>
  );
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${new Intl.NumberFormat("de-DE").format(value)}${suffix}`;
}

function formatPrice(value: number | null | undefined, currency = "EUR", priceType: "fixed" | "from" = "fixed") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const symbol = currency.toUpperCase() === "EUR" "€" : currency.toUpperCase();
  const prefix = priceType === "from" ? "ab " : "";
  return `${prefix}${formatNumber(value)} ${symbol}`;
}

function ageRangeLabel(row: SkipassPriceRow) {
  if (row.min_age !== null && row.max_age !== null) return `${row.age_label} (${row.min_age}-${row.max_age})`;
  if (row.min_age !== null) return `${row.age_label} (ab ${row.min_age})`;
  if (row.max_age !== null) return `${row.age_label} (bis ${row.max_age})`;
  return row.age_label;
}

function pickPisteKm(resort: Resort) {
  return resort.piste_km_total resort.piste_km null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function scoreDisplay(value: number | null | undefined, label: string) {
  if (value === null || value === undefined) return { title: label, value: "Daten in Arbeit" };
  return { title: label, value: `${Math.round(value * 100)}%` };
}

function glacierDisplay(value: number | null | undefined) {
  const pct = typeof value === "number" Math.round(value * 100) : 0;
  if (pct >= 66) return { value: `${pct}%`, note: "Starker Kandidat. Sommerbetrieb trotzdem offiziell prüfen." };
  if (pct >= 50) return { value: `${pct}%`, note: "Möglicher Kandidat, aber saisonal stark abhängig." };
  return { value: `${pct}%`, note: "Kein starkes Sommer-Gletscher-Signal in den vorhandenen Daten." };
}

function WeatherPointCard({ point }: { point: WeatherPointData }) {
  const hourly = point.hourly.slice(0, 6) [];
  const qualityLabel = point.data_quality === "fallback" "Höhe geschätzt" : "höhenkorrigiert";
  const stats = [
    { label: "Wind", value: formatMaybeNumber(point.current.wind_kph, " km/h") },
    { label: "Schnee 24h", value: formatMaybeNumber(point.current.snowfall_24h_cm, " cm") },
    { label: "Wolken", value: formatMaybeNumber(point.current.cloud_cover_pct, " %") },
  ];

  return (
    <div className="relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-sky-200/[0.14] via-white/[0.065] to-slate-950/30 p-5 shadow-[0_22px_70px_rgba(2,8,23,0.32)] backdrop-blur-xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase text-slate-300">{point.label}wetter</div>
            <div className="mt-1 text-sm text-slate-400">
              {point.elevation_m formatNumber(point.elevation_m, " m") : "Höhe nicht gepflegt"} · {qualityLabel}
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-xs text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            {weatherLabel(point.current.weather_code)}
          </div>
        </div>

        <div className="w-fit max-w-full rounded-2xl border border-sky-200/20 bg-sky-200/[0.11] px-3.5 py-2 text-sm leading-snug text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
          {point.current.ski_hint "Bedingungen prüfen"}
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between gap-5">
        <div className="min-w-0">
          <div className="text-6xl font-semibold leading-none text-white md:text-7xl">
            {formatMaybeNumber(point.current.temperature_c, "°")}
          </div>
          <div className="mt-3 text-base text-slate-200">{weatherLabel(point.current.weather_code)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="text-xs uppercase text-slate-500">gefühlt</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {formatMaybeNumber(point.current.apparent_temperature_c, " °C")}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="min-h-[78px] rounded-2xl border border-white/10 bg-slate-950/22 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="text-xs text-slate-500">{stat.label}</div>
            <div className="mt-2 text-lg font-semibold leading-tight text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {hourly.length (
        <div className="mt-auto pt-6">
          <div className="mb-3 text-xs font-semibold uppercase text-slate-400">Stundenverlauf</div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {hourly.map((hour) => (
            <div
              key={hour.time}
              className="min-w-[86px] rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-center text-xs text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <div className="text-slate-500">{formatWeatherHour(hour.time)}</div>
              <div className="mt-2 text-lg font-semibold leading-none text-white">{formatMaybeNumber(hour.temperature_c, "°")}</div>
              <div className="mt-2 text-[11px] text-sky-100">Schnee {formatMaybeNumber(hour.snowfall_cm, " cm")}</div>
            </div>
          ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ResortDetail() {
  const params = useParams<{ slug: string }>();
  const slug = useMemo(() => {
    const raw = Array.isArray(params.slug) params.slug[0] : params.slug;
    return raw decodeURIComponent(raw) : "";
  }, [params]);

  const [r, setR] = useState<Resort | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailError, setDetailError] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(7);
  const [ratingStats, setRatingStats] = useState<RatingStats>({ avg: null, count: 0 });
  const [ratingError, setRatingError] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [skipassPrices, setSkipassPrices] = useState<SkipassPriceRow[]>([]);
  const [skipassPriceHint, setSkipassPriceHint] = useState("");
  const [apresSpots, setApresSpots] = useState<ApresSpot[]>([]);
  const [apresSpotHint, setApresSpotHint] = useState("");
  const [storedOrigin, setStoredOrigin] = useState<StoredOrigin>(null);
  const [travelPrefs, setTravelPrefs] = useState<TravelPrefs>({
    travelMode: "car",
    tripStartDate: null,
    tripEndDate: null,
  });

  useEffect(() => {
    try {
      const rawFilters = localStorage.getItem(FILTER_STORAGE_KEY);
      if (rawFilters) {
        const saved = JSON.parse(rawFilters) as Partial<Record<string, string>>;
        const lat = Number(saved.originLat);
        const lon = Number(saved.originLon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setStoredOrigin({
            lat,
            lon,
            label: saved.originLabel || "Gespeicherter Standort",
          });
        }
      }

      const rawPrefs = localStorage.getItem(QUIZ_STORAGE_KEY);
      if (rawPrefs) {
        const saved = JSON.parse(rawPrefs) as {
          travelMode: string;
          tripStartDate: string | null;
          tripEndDate: string | null;
        };
        const travelMode =
          saved.travelMode === "train" || saved.travelMode === "bus" || saved.travelMode === "flight"
            saved.travelMode
            : "car";
        setTravelPrefs({
          travelMode,
          tripStartDate: saved.tripStartDate null,
          tripEndDate: saved.tripEndDate null,
        });
      }
    } catch {
      // ignore invalid local storage
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user.id null);
      setUserEmail(data.user.email null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session.user.id null);
      setUserEmail(session.user.email null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setDetailError("");

      const safeSlug = slug.trim();
      if (!safeSlug) {
        setR(null);
        setLoading(false);
        return;
      }

      const { data: bySlug, error: slugError } = await supabase
        .from("resorts")
        .select(resortDetailSelect)
        .eq("slug", safeSlug)
        .maybeSingle<Resort>();

      if (slugError) {
        setDetailError(slugError.message);
      }

      let resolved = bySlug null;
      if (!resolved && isUuid(safeSlug)) {
        const { data: byId, error: idError } = await supabase
          .from("resorts")
          .select(resortDetailSelect)
          .eq("id", safeSlug)
          .maybeSingle<Resort>();

        if (idError) {
          setDetailError(idError.message);
        }
        resolved = byId null;
      }

      if (resolved) {
        setR(sanitizeResortRow(resolved));
      } else {
        const fallback = findMvpResortBySlug(safeSlug);
        if (fallback) {
          setR(fallback as Resort);
          setDetailError("");
        } else {
          setR(null);
        }
      }

      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setWeatherLoading(true);
    setWeatherError("");

    fetch(`/api/resorts/${encodeURIComponent(slug)}/weather`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Wetter konnte nicht geladen werden.");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setWeather(data as WeatherData);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setWeatherError(err.message);
      })
      .finally(() => {
        if (!mounted) return;
        setWeatherLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setSkipassPriceHint("");

    fetch(`/api/resorts/${encodeURIComponent(slug)}/skipass-prices`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Skipasspreise konnten nicht geladen werden.");
        return res.json();
      })
      .then((data: { prices: SkipassPriceRow[]; configured: boolean; hint: string }) => {
        if (!mounted) return;
        setSkipassPrices(data.prices []);
        setSkipassPriceHint(data.hint "");
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setSkipassPrices([]);
        setSkipassPriceHint(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setApresSpotHint("");

    fetch(`/api/resorts/${encodeURIComponent(slug)}/apres-spots`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Après-Ski-Adressen konnten nicht geladen werden.");
        return res.json();
      })
      .then((data: { spots: ApresSpot[]; configured: boolean; hint: string }) => {
        if (!mounted) return;
        setApresSpots(data.spots []);
        setApresSpotHint(data.hint "");
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setApresSpots([]);
        setApresSpotHint(err.message);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const loadRatings = async () => {
      setRatingError("");

      const { data, error } = await supabase.from("resort_ratings").select("rating").eq("resort_slug", slug);

      if (error) {
        setRatingError(error.message);
        return;
      }

      const ratings = data [];
      const count = ratings.length;
      const avg =
        count > 0 Math.round((ratings.reduce((sum, row) => sum + Number(row.rating 0), 0) / count) * 10) / 10 : null;

      setRatingStats({ avg, count });

      if (userId) {
        const { data: myRating } = await supabase
          .from("resort_ratings")
          .select("rating")
          .eq("resort_slug", slug)
          .eq("user_id", userId)
          .maybeSingle();

        if (myRating.rating !== undefined && myRating.rating !== null) {
          setRatingValue(Number(myRating.rating));
        }
      }
    };

    loadRatings();
  }, [slug, userId]);

  const saveRating = async () => {
    if (!userId) {
      setRatingError("Bitte zuerst anmelden.");
      return;
    }

    setRatingSaving(true);
    setRatingError("");
    const { error } = await supabase.from("resort_ratings").upsert(
      {
        resort_slug: slug,
        user_id: userId,
        rating: ratingValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resort_slug,user_id" }
    );

    if (error) {
      setRatingError(error.message);
    } else {
      setToast("Bewertung gespeichert");
    }

    setRatingSaving(false);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  if (loading) {
    return (
      <Section>
        <GlassCard className="p-6">Lade Resort</GlassCard>
      </Section>
    );
  }

  if (!r) {
    return (
      <Section>
        <GlassCard className="p-6">
          Resort nicht gefunden
          {detailError <div className="mt-2 text-xs text-red-300">{detailError}</div> : null}
          <div className="mt-3">
            <Link className="underline" href="/results">
              Zurück
            </Link>
          </div>
        </GlassCard>
      </Section>
    );
  }

  const decision = deriveResortDecision(r, {
    apres: 3,
    emptySlopes: 3,
    infrastructure: 4,
    huts: 3,
    snowpark: 1,
    easyRuns: 3,
    challenging: 3,
    budgetMax: 450,
  });
  const heroUrl = r.hero_image_url.trim() || r.image_url.trim() || "/bg/skilandschaft.png";
  const heroCredit =
    r.hero_image_url && (r.image_credit || r.image_license)
      
      [r.image_credit, r.image_license].filter(Boolean).join(" · ")
      : null;
  const pisteKm = pickPisteKm(r);
  const apres = scoreDisplay(r.apres_score null, "Après-Ski");
  const quiet = scoreDisplay(r.crowd_score == null null : 1 - r.crowd_score, "Wenig Andrang");
  const infra = scoreDisplay(decision.infrastructureScore, "Infrastruktur");
  const infrastructure = decision.infrastructureProfile;
  const skipassTrackingUrl = buildTrackingUrl(r.skipass_url);
  const skipassCurrency = (r.skipass_price_currency "EUR").toUpperCase();
  const skipassSymbol = skipassCurrency === "EUR" "€" : skipassCurrency;
  const glacier = glacierDisplay(decision.summerGlacierScore);
  const strongestDecisionSignal = [
    { label: "Pistenprofil", value: decision.fitProfile.slope },
    { label: "Vibe", value: decision.fitProfile.vibe },
    { label: "Schneesicherheit", value: decision.fitProfile.snow },
    { label: "Sommer-Gletscher", value: decision.fitProfile.summer },
    { label: "Off-Piste", value: decision.fitProfile.offPiste },
    { label: "Value", value: decision.fitProfile.value },
    { label: "Komfort", value: decision.fitProfile.comfort },
  ].sort((a, b) => b.value - a.value)[0];
  const primaryReason = decision.reasons[0] "Guter Kandidat für deinen Kriterienmix.";
  const firstDrawback = decision.drawbacks[0] "Preise, Verfügbarkeit und Pistenkarte vor der Buchung prüfen.";
  const decisionCostRange = `${formatNumber(decision.cost.totalMin, " €")} - ${formatNumber(decision.cost.totalMax, " €")}`;
  const nextCheck = r.skipass_price_from "Zeitraum und Buchung prüfen" : "Skipasspreise prüfen";

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc={heroUrl} heightClass="min-h-[360px]">
        <div className="mx-auto flex min-h-[360px] w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-12 md:px-6">
          <Link href="/results" className="text-sm text-white/70 underline">
            Zurück zu Ergebnissen
          </Link>

          <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">{r.name}</h1>

          <div className="mt-2 text-white/75">
            {r.country}
            {r.region `, ${r.region}` : ""}
            {pisteKm `, ${pisteKm} km` : ""}
            {r.drive_hours `, ca. ${r.drive_hours} h` : ""}
            {r.distance_km `, ${r.distance_km} km` : ""}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {decision.vibeTags.slice(0, 5).map((t) => (
              <span key={t.label}>{tag(t.label)}</span>
            ))}
            <span>{tag(`${decision.matchPct}% Match`)}</span>
          </div>
          {heroCredit (
            <div className="mt-4 w-fit max-w-full rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-[11px] text-white/60 backdrop-blur">
              Bild: {heroCredit}
            </div>
          ) : null}
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        <GlassCard className="p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr] lg:items-start">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Entscheidung auf einen Blick</p>
              <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                {decision.matchPct}% Match für dein Alpivo-Profil
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{primaryReason}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-sky-200/20 bg-sky-200/[0.08] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-100/80">Warum es passt</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-100">
                    {decision.reasons.slice(0, 3).map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200/20 bg-amber-200/[0.07] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-100/80">Vor Buchung prüfen</div>
                  <p className="mt-3 text-sm leading-relaxed text-amber-50">{firstDrawback}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["Wetter", "#wetter"],
                  ["Anreise", "#anreise"],
                  ["Skipass", "#skipass"],
                  ["Pistenkarte", "#pistenkarte"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-200/30 hover:bg-sky-200/10 hover:text-white"
                  >
                    {label} ansehen
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-xl border border-sky-200/20 bg-sky-200/10 p-4">
                <div className="text-xs text-slate-300">Match</div>
                <div className="mt-1 text-3xl font-semibold text-white">{decision.matchPct}%</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                <div className="text-xs text-slate-400">Stärkster Treiber</div>
                <div className="mt-1 font-semibold text-white">{strongestDecisionSignal.label}</div>
                <div className="mt-1 text-xs text-slate-400">{Math.round(strongestDecisionSignal.value * 100)}%</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                <div className="text-xs text-slate-400">Kostenrahmen p. P.</div>
                <div className="mt-1 font-semibold text-white">{decisionCostRange}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                <div className="text-xs text-slate-400">Skipass ab</div>
                <div className="mt-1 font-semibold text-white">{formatPrice(r.skipass_price_from, skipassCurrency, "from")}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <div className="text-xs text-slate-400">Nächster Check</div>
                <div className="mt-1 font-semibold text-white">{nextCheck}</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <GlassCard id="wetter" className="scroll-mt-24 p-6 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Skiwetter</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Tal und Berg getrennt</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Lokal berechnete Wetterpunkte für Tal und Berg, damit Temperatur, Wind und Schnee nicht wie Stadtwetter wirken.
                </p>
              </div>
              {weather.resort_local_time (
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  Lokal: {formatWeatherLocalTime(weather.resort_local_time)}
                </div>
              ) : null}
            </div>
            {weatherLoading (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-[430px] animate-pulse rounded-3xl bg-white/10" />
                  ))}
                </div>
                <div className="h-28 animate-pulse rounded-3xl bg-white/10" />
              </div>
            ) : weatherError (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {weatherError}
              </div>
            ) : weather (
              <>
                {weather.valley && weather.mountain (
                  <div className="mt-6 grid items-stretch gap-4 xl:grid-cols-2">
                    <WeatherPointCard point={weather.valley} />
                    <WeatherPointCard point={weather.mountain} />
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                    <div className="text-3xl font-semibold text-white">
                      {formatMaybeNumber(weather.current.temperature_c, " °C")}
                      <span className="ml-2 text-sm font-medium text-slate-300">
                        {weatherLabel(weather.current.weather_code)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-200">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs text-slate-400">Wind</div>
                        <div className="mt-1 font-semibold text-white">{formatMaybeNumber(weather.current.wind_kph, " km/h")}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs text-slate-400">Niederschlag</div>
                        <div className="mt-1 font-semibold text-white">
                          {formatMaybeNumber(weather.current.precipitation_mm, " mm")}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs text-slate-400">Schnee 24h</div>
                        <div className="mt-1 font-semibold text-white">{formatMaybeNumber(weather.current.snowfall_24h_cm, " cm")}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase text-slate-400">Mehrtagesvorschau</div>
                      <div className="mt-1 text-sm text-slate-500">Bergpunkt, sofern verfügbar</div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {(weather.mountain.daily weather.daily).slice(0, 5).map((day) => (
                      <div
                        key={day.date}
                        className="min-h-[142px] rounded-2xl border border-white/10 bg-slate-950/22 p-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      >
                        <div className="text-xs font-semibold uppercase text-slate-500">{formatWeatherDay(day.date)}</div>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-2xl font-semibold leading-none text-white">{formatMaybeNumber(day.temp_max_c, "°")}</span>
                          <span className="text-sm text-slate-500">{formatMaybeNumber(day.temp_min_c, "°")}</span>
                        </div>
                        <div className="mt-4 grid gap-1.5 text-xs text-slate-400">
                          <div className="flex items-center justify-between gap-3">
                            <span>Schnee</span>
                            <span className="font-medium text-slate-200">{formatMaybeNumber(day.snowfall_cm, " cm")}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Wind</span>
                            <span className="font-medium text-slate-200">{formatMaybeNumber(day.wind_max_kph, " km/h")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 text-xs leading-relaxed text-slate-500">
                  Quelle: Open-Meteo, Zeitzone {weather.timezone "automatisch"}. Aktualisiert{" "}
                  {formatUpdated(weather.weather_updated_at weather.updated_at, weather.timezone)}.
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                Keine Wetterdaten vorhanden.
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-sm text-slate-400">{apres.title}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{apres.value}</div>
            <div className="mt-1 text-xs text-slate-400">Basiert auf verfügbaren Quellen</div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-sm text-slate-400">{quiet.title}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{quiet.value}</div>
            <div className="mt-1 text-xs text-slate-400">Basiert auf verfügbaren Quellen</div>
          </GlassCard>
        </div>

        <ResortVibe decision={decision} />

        <ApresSkiSpots
          resortName={r.name}
          apresScore={r.apres_score null}
          officialUrl={r.official_url}
          spots={apresSpots}
          hint={apresSpotHint}
        />

        <div id="anreise" className="scroll-mt-24">
          <TravelConnectionPanel
            title="Anreise zu diesem Resort"
            resortName={r.name}
            country={r.country}
            region={r.region}
            destinationLat={r.lat}
            destinationLon={r.lon}
            origin={storedOrigin}
            travelMode={travelPrefs.travelMode}
            tripStartDate={travelPrefs.tripStartDate}
            tripEndDate={travelPrefs.tripEndDate}
            roadDurationHours={r.drive_hours}
            roadDistanceKm={r.distance_km}
            routeSource={r.drive_hours "fallback" : null}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <GlassCard id="details" className="scroll-mt-24 p-6">
            <h2 className="text-lg font-semibold text-white">Fakten</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Pisten gesamt</div>
                <div className="mt-1 font-semibold text-white">{formatNumber(pisteKm, " km")}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Höhenlage</div>
                <div className="mt-1 font-semibold text-white">
                  {formatNumber(r.elevation_min_m)} - {formatNumber(r.elevation_max_m)} m
                </div>
              </div>
              <div className="rounded-xl border border-sky-200/20 bg-sky-200/10 p-3">
                <div className="text-xs text-slate-300">Sommer-Gletscher</div>
                <div className="mt-1 font-semibold text-white">{glacier.value}</div>
                <div className="mt-1 text-[11px] text-slate-300">{glacier.note}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Vertical</div>
                <div className="mt-1 font-semibold text-white">{formatNumber(r.vertical_m, " m")}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Lifte / Runs</div>
                <div className="mt-1 font-semibold text-white">
                  {formatNumber(r.lifts_count_total)} / {formatNumber(r.runs_count_total)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Einfach</div>
                <div className="mt-1 font-semibold text-white">{formatNumber(r.piste_km_easy, " km")}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Mittel</div>
                <div className="mt-1 font-semibold text-white">{formatNumber(r.piste_km_intermediate, " km")}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Schwer</div>
                <div className="mt-1 font-semibold text-white">{formatNumber(r.piste_km_advanced, " km")}</div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold text-white">Warum Alpivo dieses Resort versteht</h3>
              <div className="mt-3 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Warum es passt</div>
                  <ul className="mt-2 space-y-1.5">
                    {decision.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Potenzielle Haken</div>
                  <ul className="mt-2 space-y-1.5">
                    {decision.drawbacks.map((drawback) => (
                      <li key={drawback} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                        <span>{drawback}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-sm font-semibold text-white">Kostenrahmen</h3>
              <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-400">Tagestrip</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatNumber(decision.cost.dayTripMin, " EUR")} - {formatNumber(decision.cost.dayTripMax, " EUR")}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-400">Wochenende</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatNumber(decision.cost.weekendMin, " EUR")} - {formatNumber(decision.cost.weekendMax, " EUR")}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-400">Skiwoche</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatNumber(decision.cost.weekMin, " EUR")} - {formatNumber(decision.cost.weekMax, " EUR")}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-4">
            <GlassCard className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-400">{infra.title}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{infra.value}</div>
                </div>
                <span className="rounded-full border border-sky-200/20 bg-sky-200/10 px-2.5 py-1 text-[11px] text-sky-100">
                  {infrastructure.sourceLabel}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{infrastructure.summary}</p>
              <div className="mt-4 grid gap-2">
                {infrastructure.signals.map((signal) => (
                  <div key={signal.label} className="rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-300">{signal.label}</span>
                      <span className="font-semibold text-white">{signal.value}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-sky-200" style={{ width: `${Math.round(signal.score * 100)}%` }} />
                      </div>
                      <span className="w-14 text-right text-[11px] text-slate-400">{signal.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard id="skipass" className="scroll-mt-24 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Skipasspreise</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">Altersgruppen & Ticketarten</h2>
                </div>
                {skipassPrices.length > 0 (
                  <span className="rounded-full border border-emerald-200/25 bg-emerald-200/10 px-2.5 py-1 text-[11px] text-emerald-100">
                    offiziell gepflegt
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2.5 py-1 text-[11px] text-amber-100">
                    ausbaufähig
                  </span>
                )}
              </div>

              {skipassPrices.length > 0 (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <div className="grid grid-cols-[1.2fr_1fr_0.8fr] border-b border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400">
                    <span>Kategorie</span>
                    <span>Ticket</span>
                    <span className="text-right">Preis</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {skipassPrices.slice(0, 8).map((price) => (
                      <div key={price.id} className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-2 px-3 py-3 text-sm text-slate-200">
                        <div>
                          <div className="font-medium text-white">{ageRangeLabel(price)}</div>
                          {price.season_label <div className="mt-1 text-[11px] text-slate-400">{price.season_label}</div> : null}
                        </div>
                        <div>
                          <div>{price.ticket_name}</div>
                          {price.valid_from || price.valid_to (
                            <div className="mt-1 text-[11px] text-slate-400">
                              {price.valid_from ""} - {price.valid_to ""}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right font-semibold text-white">
                          {formatPrice(price.price, price.currency, price.price_type)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  {r.skipass_price_from (
                    <>
                      Aktuell ist nur ein Basispreis hinterlegt:{" "}
                      <span className="font-semibold text-white">
                        {formatMaybeNumber(r.skipass_price_from)} {skipassSymbol}
                      </span>
                      . Für exakte Altersgruppen müssen die offiziellen Preiszeilen noch importiert werden.
                    </>
                  ) : (
                    "Für dieses Resort sind noch keine gepflegten Skipasspreise hinterlegt."
                  )}
                  {skipassPriceHint <div className="mt-2 text-[11px] text-slate-400">{skipassPriceHint}</div> : null}
                </div>
              )}

              <div className="mt-3 text-[11px] text-slate-400">
                Preise können je nach Saison, Kauftag, Online-Rabatt, Alter und Gebietsteil abweichen. Verbindlich ist die offizielle Quelle.
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-white">Links</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div className="text-xs uppercase tracking-wide text-slate-400">Skipass Preis (Tag)</div>
                {r.skipass_price_from (
                  <div className="mt-2 text-lg font-semibold text-white">
                    {formatMaybeNumber(r.skipass_price_from)} {skipassSymbol}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-300">Kein Preis hinterlegt.</div>
                )}
                {r.skipass_price_last_checked (
                  <div className="mt-2 text-[11px] text-slate-400">
                    Stand: {r.skipass_price_last_checked}
                  </div>
                ) : null}
                {r.skipass_price_note (
                  <div className="mt-2 text-[11px] text-slate-400">{r.skipass_price_note}</div>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                {r.official_url (
                  <a
                    className="rounded-xl border border-white/10 px-4 py-3 text-slate-200 hover:bg-white/10"
                    href={r.official_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Offizielle Website
                  </a>
                ) : null}
                {r.piste_map_url (
                  <a
                    className="rounded-xl border border-white/10 px-4 py-3 text-slate-200 hover:bg-white/10"
                    href={r.piste_map_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pistenplan
                  </a>
                ) : null}
                {r.skipass_url (
                  <div className="rounded-xl border border-white/10 bg-white/5">
                    <a
                      className="block px-4 py-3 text-slate-200 hover:bg-white/10"
                      href={skipassTrackingUrl r.skipass_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Skipass Preise
                    </a>
                    <div className="px-4 pb-3 text-[11px] text-slate-400">UTM-Tracking</div>
                  </div>
                ) : null}
                {r.openskimap_url (
                  <a
                    className="rounded-xl border border-white/10 px-4 py-3 text-slate-200 hover:bg-white/10"
                    href={r.openskimap_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenSkiMap
                  </a>
                ) : null}
                {!r.official_url && !r.piste_map_url && !r.skipass_url && !r.openskimap_url (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
                    Keine externen Links verfügbar.
                  </div>
                ) : null}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Bewertungen</h2>
                <div className="text-sm text-slate-300">
                  {ratingStats.count > 0
                    `Durchschnitt: ${formatNumber(ratingStats.avg)} / 10 (${ratingStats.count})`
                    : "Noch keine Bewertungen"}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="text-xs text-slate-400">Deine Bewertung (0-10)</div>
                <div className="mt-3 flex items-center gap-4">
                  <input
                    className="w-full"
                    type="range"
                    min={0}
                    max={10}
                    value={ratingValue}
                    onChange={(event) => setRatingValue(Number(event.target.value))}
                  />
                  <div className="w-10 text-center text-lg font-semibold text-white">{ratingValue}</div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                    onClick={saveRating}
                    disabled={ratingSaving}
                  >
                    {ratingSaving "Speichern..." : "Bewertung speichern"}
                  </button>
                  {!userId (
                    <Link className="text-xs text-slate-300 underline" href="/account">
                      Anmelden, um zu bewerten
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Bewertest als {userEmail "Nutzer"}</span>
                  )}
                </div>

                {ratingError <div className="mt-3 text-xs text-red-300">{ratingError}</div> : null}
              </div>
            </GlassCard>
          </div>
        </div>

        <div id="pistenkarte" className="scroll-mt-24">
          <PisteMapSection
            resortName={r.name}
            pisteMapUrl={r.piste_map_url}
            openskimapUrl={r.openskimap_url}
            officialUrl={r.official_url}
          />
        </div>

        <AnimatePresence>{toast <Toast message={toast} /> : null}</AnimatePresence>
      </Section>
    </div>
  );
}
