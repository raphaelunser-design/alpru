"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AccordionRow, AppHeader, Button, Card, IconStat, MatchScoreRing } from "@/components/ui";
import { getResortActionLinks } from "@/data/resortActionLinks";
import { getAlpivoResortBySlug, type AlpivoResort } from "@/data/resorts";
import { findMvpResortBySlug, type MvpResortRow } from "@/lib/mvpResorts";
import { useAlpivoGuestState } from "@/hooks/useAlpivoGuestState";

const fallbackImage = "/bg/skilandschaft.png";

const displayScores: Record<string, number> = {
  obertauern: 96,
  solden: 92,
  "serfaus-fiss-ladis": 88,
};

const navItems = [
  { href: "/resorts", label: "Resorts", active: true },
  { href: "/map", label: "3D Karte" },
  { href: "/#so-funktionierts", label: "So funktioniert's" },
];

type ResortView = {
  slug: string;
  name: string;
  regionLabel: string;
  score: number;
  priceLabel: string;
  travelTimeLabel: string;
  snowLabel: string;
  snowStrength: string;
  vibeLabel: string;
  pisteKm: string;
  altitude: string;
  lifts: string;
  seasonLabel: string;
  description: string;
  image: string;
  tags: string[];
  reasons: string[];
  whyItFits: Array<{ title: string; text: string; icon: ReactNode }>;
  keyFacts: Array<{ label: string; value: string; icon: ReactNode }>;
  overviewFacts: Array<{ label: string; value: string; detail?: string }>;
  slopeDifficulty: Array<{ label: string; value: string; width: number }>;
  stayOptions: Array<{ name: string; type: string; fit: string; price: string }>;
  travelOptions: Array<{ mode: string; duration: string; route: string; note: string }>;
  bestSeasonNote: string;
  dataGaps: string[];
};

type ActionRowProps = {
  description: string;
  href?: string;
  icon: ReactNode;
  onClick?: () => void;
  title: string;
};

function MountainIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 18 6.8-12 4.2 7 2.2-3.5L21 18H3Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.8 6 1.5 4.6 2.7 2.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M12 11.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function SnowIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v18M5 6l14 12M19 6 5 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="m9 4 3 3 3-3M9 20l3-3 3 3M4 9l4 1-1-4M20 15l-4-1 1 4M20 9l-4 1 1-4M4 15l4-1-1 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LiftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16M12 5v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8 10h8l-1 6H9l-1-6Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M9 19h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 1.7-4.2A2 2 0 0 1 8.6 6h6.8a2 2 0 0 1 1.9 1.3L19 12" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M4 12h16v5H4v-5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M7 17v2M17 17v2M7.5 15h.1M16.4 15h.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4H6.5A2.5 2.5 0 0 1 4 6.5v11A2.5 2.5 0 0 0 6.5 20H20V9H6.5" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M16.5 14.5h.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9L12 3Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

function SkiIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4v6.5l-2.4 3.2M15 4v6.5l2.4 3.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M4 19c4.5 1.5 11.5 1.5 16 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="m6 14 3 2M18 14l-3 2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11V6h11a3 3 0 0 1 3 3v2" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M4 18v-5h16v5M7 11V9h4v2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4v3M18 4v3M4.5 9h15M6.5 6h13v14h-15V6h2Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20s-7-4.4-8.6-9A4.6 4.6 0 0 1 11 6.2l1 1 1-1A4.6 4.6 0 0 1 20.6 11C19 15.6 12 20 12 20Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizeSnowLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("sehr")) return "Sehr hoch";
  if (lower.includes("gut")) return "Hoch";
  if (lower.includes("mittel")) return "Mittel";
  return label || "Prüfen";
}

function priceRangeFromSinglePrice(value: number | null | undefined) {
  if (!value) return "Preis prüfen";
  const lower = Math.max(350, Math.round((value * 9) / 10 / 25) * 25);
  const upper = Math.round((value * 1.2) / 25) * 25;
  return `${lower.toLocaleString("de-DE")}–${upper.toLocaleString("de-DE")} €`;
}

function formatScore(value: number | null | undefined, fallback = 82) {
  if (typeof value !== "number") return fallback;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function getCanonicalView(resort: AlpivoResort): ResortView {
  const snowStrength = normalizeSnowLabel(resort.snowLabel);
  const snowFactor = resort.detail.factorScores.find((factor) => factor.label.toLowerCase().includes("schnee"));
  const pisteFactor = resort.detail.factorScores.find((factor) => factor.label.toLowerCase().includes("pisten"));
  const vibeFactor = resort.detail.factorScores.find((factor) => factor.label.toLowerCase().includes("vibe"));

  return {
    slug: resort.slug,
    name: resort.name,
    regionLabel: resort.regionLabel,
    score: displayScores[resort.slug] ?? resort.score,
    priceLabel: `€€ · ${resort.priceLabel} p. P.`,
    travelTimeLabel: resort.travelTimeFromMunich,
    snowLabel: resort.snowLabel,
    snowStrength,
    vibeLabel: resort.vibeLabel,
    pisteKm: resort.pisteKm,
    altitude: resort.altitude,
    lifts: resort.detail.lifts,
    seasonLabel: resort.detail.seasonLabel,
    description: resort.description,
    image: resort.image || fallbackImage,
    tags: resort.tags,
    reasons: resort.reasons,
    whyItFits: [
      {
        title: snowStrength === "Sehr hoch" ? "Extrem schneesicher" : "Gute Schneesicherheit",
        text: snowFactor?.note ?? resort.reasons[0] ?? "Höhenlage und Saisonfenster passen gut zum Wintertrip.",
        icon: <SnowIcon />,
      },
      {
        title: "Abwechslungsreiche Abfahrten",
        text: pisteFactor?.note ?? `${resort.pisteKm} Pisten mit Profil für gemischte Gruppen.`,
        icon: <SkiIcon />,
      },
      {
        title: "Moderne Liftinfrastruktur",
        text: `${resort.detail.lifts} und kurze Wege machen den Skitag planbarer.`,
        icon: <LiftIcon />,
      },
      {
        title: resort.vibeLabel.toLowerCase().includes("lebendig") ? "Lebendige, aber entspannte Atmosphäre" : "Passender Vibe für die Gruppe",
        text: vibeFactor?.note ?? resort.reasons[2] ?? "Der Vibe passt zur gewählten Reiseart.",
        icon: <HeartIcon />,
      },
    ],
    keyFacts: [
      { label: "Anreise ab München", value: resort.travelTimeFromMunich, icon: <CarIcon /> },
      { label: "Preisniveau", value: `€€ · ${resort.priceLabel} p. P.`, icon: <WalletIcon /> },
      { label: "Schneegarantie", value: snowStrength, icon: <SnowIcon /> },
      { label: "Vibe", value: resort.vibeLabel, icon: <StarIcon /> },
    ],
    overviewFacts: resort.detail.facts,
    slopeDifficulty: resort.detail.slopeDifficulty,
    stayOptions: resort.detail.stayOptions,
    travelOptions: resort.detail.travelOptions,
    bestSeasonNote:
      resort.detail.facts.find((fact) => fact.label.toLowerCase().includes("beste"))?.detail ??
      `${resort.detail.seasonLabel}. Live-Wetter und Öffnungszeiten vor Buchung prüfen.`,
    dataGaps: resort.detail.dataStatus,
  };
}

function getMvpView(resort: MvpResortRow): ResortView {
  const slug = resort.slug || resort.id;
  const pisteKm = resort.piste_km_total ?? resort.piste_km;
  const lifts = resort.lifts_count_total;
  const snowStrength = resort.resort_style.includes("snow") || resort.resort_style.includes("glacier") ? "Hoch" : "Prüfen";
  const priceRange = priceRangeFromSinglePrice(resort.skipass_price_from ? resort.skipass_price_from * 7 : null);
  const regionLabel = [resort.region, resort.country].filter(Boolean).join(", ") || resort.country;
  const easyKm = resort.piste_km_easy ?? 0;
  const redKm = resort.piste_km_intermediate ?? 0;
  const blackKm = resort.piste_km_advanced ?? 0;
  const totalForWidths = Math.max(1, easyKm + redKm + blackKm);

  return {
    slug,
    name: resort.name,
    regionLabel,
    score: displayScores[slug] ?? Math.round((formatScore(resort.infra_score, 80) + formatScore(resort.beginner_score, 75) + formatScore(resort.apres_score, 70)) / 3),
    priceLabel: `€€ · ${priceRange}`,
    travelTimeLabel: "Anreise prüfen",
    snowLabel: snowStrength,
    snowStrength,
    vibeLabel: resort.resort_style.includes("family") ? "familienfreundlich" : resort.resort_style.includes("sport") ? "sportlich" : "ausgewogen",
    pisteKm: pisteKm ? `${pisteKm} km` : "Pisten prüfen",
    altitude:
      resort.elevation_min_m && resort.elevation_max_m
        ? `${resort.elevation_min_m.toLocaleString("de-DE")} - ${resort.elevation_max_m.toLocaleString("de-DE")} m`
        : "Höhe prüfen",
    lifts: lifts ? `${lifts} Anlagen` : "Lifte prüfen",
    seasonLabel: resort.resort_style.includes("glacier") ? "November bis April" : "Dezember bis April",
    description: `${resort.name} ist als Alpivo-MVP-Resort hinterlegt. Das Profil nutzt vorhandene Skigebiets-Signale und markiert fehlende Detaildaten transparent.`,
    image: resort.hero_image_url || resort.image_url || fallbackImage,
    tags: resort.resort_style.slice(0, 3).map((style) => style[0].toUpperCase() + style.slice(1)),
    reasons: [
      pisteKm ? `${pisteKm} km Pisten als starke Vergleichsbasis` : "Pistenprofil als Vergleichsbasis vorhanden",
      lifts ? `${lifts} Liftanlagen für Infrastruktur-Fit` : "Infrastruktur-Signal vorhanden",
      resort.resort_style.includes("family") ? "Sehr guter Familien-Fit" : "Passender Vibe für die gewählte Reiseart",
    ],
    whyItFits: [
      {
        title: snowStrength === "Hoch" ? "Gute Schneesicherheit" : "Schneelage bewusst prüfen",
        text: resort.resort_style.includes("snow") || resort.resort_style.includes("glacier")
          ? "Das Resort ist in den MVP-Daten als schneeorientiert markiert."
          : "Für dieses Resort fehlen noch detaillierte Schneesignale.",
        icon: <SnowIcon />,
      },
      {
        title: "Abwechslungsreiche Abfahrten",
        text: pisteKm ? `${pisteKm} km Pisten liefern eine solide Vergleichsbasis.` : "Pistendetails werden im MVP-Datensatz noch ergänzt.",
        icon: <SkiIcon />,
      },
      {
        title: "Infrastruktur-Fit",
        text: lifts ? `${lifts} Liftanlagen sind als Infrastruktur-Signal vorhanden.` : "Liftanzahl wird im Detaildatensatz noch ergänzt.",
        icon: <LiftIcon />,
      },
      {
        title: "Vibe-Signal vorhanden",
        text: `Alpivo ordnet den Stil aktuell als ${resort.resort_style.join(", ")} ein.`,
        icon: <HeartIcon />,
      },
    ],
    keyFacts: [
      { label: "Anreise ab München", value: "prüfen", icon: <CarIcon /> },
      { label: "Preisniveau", value: `€€ · ${priceRange}`, icon: <WalletIcon /> },
      { label: "Schneegarantie", value: snowStrength, icon: <SnowIcon /> },
      { label: "Vibe", value: resort.resort_style.slice(0, 2).join(", ") || "ausgewogen", icon: <StarIcon /> },
    ],
    overviewFacts: [
      { label: "Region", value: regionLabel, detail: "Aus dem Alpivo-MVP-Datensatz." },
      { label: "Pisten", value: pisteKm ? `${pisteKm} km` : "Daten fehlen", detail: "Pistenkilometer aus dem MVP-Signal." },
      { label: "Lifte", value: lifts ? `${lifts} Anlagen` : "Daten fehlen", detail: "Liftanzahl aus dem MVP-Signal." },
      {
        label: "Höhe",
        value:
          resort.elevation_min_m && resort.elevation_max_m
            ? `${resort.elevation_min_m.toLocaleString("de-DE")} - ${resort.elevation_max_m.toLocaleString("de-DE")} m`
            : "Daten fehlen",
      },
    ],
    slopeDifficulty: [
      { label: "Blau", value: easyKm ? `${easyKm} km` : "offen", width: Math.max(12, Math.round((easyKm / totalForWidths) * 100)) },
      { label: "Rot", value: redKm ? `${redKm} km` : "offen", width: Math.max(12, Math.round((redKm / totalForWidths) * 100)) },
      { label: "Schwarz", value: blackKm ? `${blackKm} km` : "offen", width: Math.max(12, Math.round((blackKm / totalForWidths) * 100)) },
    ],
    stayOptions: [
      { name: "Unterkünfte offiziell prüfen", type: "Offizielle Suche", fit: "Verfügbarkeit und Lage offen", price: "prüfen" },
      { name: "Gruppenunterkunft", type: "Fallback", fit: "Preis und Stornooption vergleichen", price: "€€" },
    ],
    travelOptions: [
      { mode: "Auto", duration: "prüfen", route: "Route ab München", note: "Für dieses Resort fehlen noch belastbare Alpivo-Anreisedaten." },
      { mode: "Bahn + Transfer", duration: "prüfen", route: "Bahnhof + Shuttle", note: "Transferzeiten vor Buchung mit offiziellen Quellen prüfen." },
    ],
    bestSeasonNote: "Beste Reisezeit wird aus dem vollständigen Detaildatensatz noch ergänzt. Live-Schnee, Liftstatus und Saisonfenster vor Buchung prüfen.",
    dataGaps: [
      "MVP-Resort: Detaildaten sind noch nicht so vollständig wie bei den Pilotprofilen Obertauern, Sölden, Zell am See und Saalbach.",
      "Anreisezeit ab München, Unterkunftsdaten und Preisrange sind kontrollierte Fallbacks.",
      "Live-Schnee, Liftstatus und offizielle Preise müssen vor Buchung geprüft werden.",
    ],
  };
}

function getResortView(slug: string | null | undefined) {
  const canonical = getAlpivoResortBySlug(slug);
  if (canonical) return getCanonicalView(canonical);
  const fallback = slug ? findMvpResortBySlug(slug) : null;
  return fallback ? getMvpView(fallback) : null;
}

function ActionRow({ description, href, icon, onClick, title }: ActionRowProps) {
  const className =
    "group flex min-h-16 w-full items-center gap-4 rounded-[var(--alpivo-radius-lg)] border border-[var(--alpivo-border-subtle)] bg-white px-4 py-3 text-left text-[var(--alpivo-deep-navy)] shadow-[var(--alpivo-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[rgba(47,107,255,0.28)] hover:shadow-[var(--alpivo-shadow-md)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(47,107,255,0.5)]";
  const content = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--alpivo-radius-md)] bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-deep-navy)]" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--alpivo-ink-muted)]">{description}</span>
      </span>
      <span className="text-[var(--alpivo-deep-navy)] transition group-hover:translate-x-1" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </>
  );

  if (href?.startsWith("http")) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link className={className} href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} type="button" onClick={onClick}>
      {content}
    </button>
  );
}

function FactList({ facts }: { facts: ResortView["overviewFacts"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={`${fact.label}-${fact.value}`} className="rounded-[var(--alpivo-radius-lg)] border border-[var(--alpivo-border-subtle)] bg-[var(--alpivo-snow-white)] p-4">
          <p className="text-sm font-medium text-[var(--alpivo-ink-muted)]">{fact.label}</p>
          <p className="mt-1 text-base font-semibold text-[var(--alpivo-deep-navy)]">{fact.value}</p>
          {fact.detail ? <p className="mt-2 text-sm leading-6 text-[var(--alpivo-ink-muted)]">{fact.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

export default function ResortDetailClient({ slug }: { slug: string }) {
  const resort = useMemo(() => getResortView(slug), [slug]);
  const actionLinks = useMemo(() => getResortActionLinks(resort?.slug), [resort?.slug]);
  const { addTripDraftResort, markActionCompleted, selectResort } = useAlpivoGuestState();
  const [message, setMessage] = useState("");

  if (!resort) {
    return (
      <div className="min-h-screen bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]">
        <AppHeader navItems={navItems} />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center px-[var(--alpivo-space-page-x)] py-12">
          <Card className="p-8 md:p-10">
            <p className="text-sm font-semibold text-[var(--alpivo-alpine-blue)]">Resort nicht gefunden</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">Dieses Skigebiet ist in Alpivo noch nicht verfügbar.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--alpivo-ink-muted)]">
              Öffne die Resort-Übersicht oder starte den Match, um verfügbare Skigebiete zu vergleichen.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/resorts" variant="primary">Resorts ansehen</Button>
              <Button href="/quiz" variant="secondary">Match starten</Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const skipassLink = actionLinks.skipassShop ?? actionLinks.ticketInfo ?? (resort.slug && findMvpResortBySlug(resort.slug)?.skipass_url
    ? {
        label: "Skipass prüfen",
        url: findMvpResortBySlug(resort.slug)?.skipass_url ?? "",
      }
    : null);
  const accommodationLink = actionLinks.accommodationSearch;
  const officialUrl = actionLinks.officialInfo?.url ?? findMvpResortBySlug(resort.slug)?.official_url ?? "/resorts";

  const handleTripSave = () => {
    addTripDraftResort(resort.slug);
    setMessage(`${resort.name} wurde deinem lokalen Trip-Entwurf hinzugefügt.`);
  };

  return (
    <div className="min-h-screen bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]">
      <AppHeader navItems={navItems} />

      <main className="pb-20">
        <section className="relative isolate min-h-[520px] overflow-hidden bg-[var(--alpivo-deep-navy)] sm:min-h-[560px] lg:min-h-[590px]">
          <Image
            src={resort.image}
            alt={`${resort.name} Winterpanorama`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 48%" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,27,58,0.72)_0%,rgba(7,27,58,0.3)_42%,rgba(7,27,58,0.04)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,rgba(248,251,255,0)_0%,rgba(248,251,255,0.92)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-[1480px] flex-col justify-end px-[var(--alpivo-space-page-x)] pb-24 pt-16 sm:min-h-[560px] lg:min-h-[590px] lg:pb-28">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-4xl text-white">
                <h1 className="text-5xl font-semibold leading-none sm:text-6xl lg:text-7xl">{resort.name}</h1>
                <p className="mt-4 flex items-center gap-2 text-lg font-medium text-white/94">
                  <MapPinIcon />
                  <span>{resort.regionLabel}</span>
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <IconStat icon={<SnowIcon />} label="Schneesicher" value={resort.snowStrength} className="w-full max-w-[260px] bg-white/94 shadow-[var(--alpivo-shadow-md)] sm:w-auto" tone="blue" />
                  <IconStat icon={<LiftIcon />} label="Liftanlagen" value={resort.lifts} className="w-full max-w-[260px] bg-white/94 shadow-[var(--alpivo-shadow-md)] sm:w-auto" />
                  <IconStat icon={<CarIcon />} label="ab München" value={resort.travelTimeLabel} className="w-full max-w-[260px] bg-white/94 shadow-[var(--alpivo-shadow-md)] sm:w-auto" />
                </div>
              </div>
              <div className="flex justify-start lg:justify-end">
                <MatchScoreRing value={resort.score} size="lg" className="shadow-[0_22px_70px_rgba(7,27,58,0.24)]" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-14 w-full max-w-[1240px] px-[var(--alpivo-space-page-x)]">
          <Card className="grid gap-0 overflow-hidden rounded-[var(--alpivo-radius-xl)] p-0 shadow-[var(--alpivo-shadow-lg)] md:grid-cols-2 lg:grid-cols-4">
            {resort.keyFacts.map((fact, index) => (
              <div key={fact.label} className={`p-5 md:p-6 ${index > 0 ? "border-t border-[var(--alpivo-border-subtle)] md:border-l md:border-t-0" : ""}`}>
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--alpivo-radius-md)] bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-deep-navy)]" aria-hidden="true">
                    {fact.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--alpivo-ink-muted)]">{fact.label}</span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--alpivo-deep-navy)]">{fact.value}</span>
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </section>

        <section className="mx-auto mt-8 grid w-full max-w-[1240px] gap-6 px-[var(--alpivo-space-page-x)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
          <Card as="section" className="p-6 md:p-7">
            <h2 className="text-2xl font-semibold leading-tight">Warum es passt</h2>
            <div className="mt-6 space-y-5">
              {resort.whyItFits.map((reason) => (
                <div key={reason.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgba(47,107,255,0.08)] text-[var(--alpivo-alpine-blue)]" aria-hidden="true">
                    {reason.icon}
                  </span>
                  <span>
                    <span className="block text-base font-semibold">{reason.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--alpivo-ink-muted)]">{reason.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card as="aside" className="p-6 md:p-7">
            <h2 className="text-2xl font-semibold leading-tight">Nächste Schritte</h2>
            <div className="mt-6 space-y-3">
              <ActionRow
                description="Preise & Optionen ansehen"
                href={skipassLink?.url ?? officialUrl}
                icon={<CalendarIcon />}
                onClick={() => markActionCompleted("skipassChecked", resort.slug)}
                title="Skipass prüfen"
              />
              <ActionRow
                description={`Die besten Unterkünfte in ${resort.name}`}
                href={accommodationLink?.url ?? officialUrl}
                icon={<BedIcon />}
                onClick={() => markActionCompleted("accommodationChecked", resort.slug)}
                title="Unterkünfte ansehen"
              />
              <ActionRow description="Resort auf deine Merkliste setzen" icon={<HeartIcon />} onClick={handleTripSave} title="Trip speichern" />
            </div>
            {message ? (
              <p className="mt-4 rounded-[var(--alpivo-radius-md)] border border-[rgba(47,107,255,0.18)] bg-[rgba(47,107,255,0.06)] px-4 py-3 text-sm text-[var(--alpivo-deep-navy)]">
                {message}
              </p>
            ) : null}
          </Card>
        </section>

        <section className="mx-auto mt-6 w-full max-w-[1240px] space-y-3 px-[var(--alpivo-space-page-x)]">
          <AccordionRow title="Überblick" icon={<MountainIcon />} open>
            <p>{resort.description}</p>
            <div className="mt-4">
              <FactList facts={resort.overviewFacts.slice(0, 4)} />
            </div>
          </AccordionRow>

          <AccordionRow title="Pisten & Lifte" icon={<LiftIcon />}>
            <p>
              {resort.name} bietet {resort.pisteKm} Pisten und {resort.lifts}. Die Höhenlage liegt bei {resort.altitude}.
            </p>
            <div className="mt-4 space-y-3">
              {resort.slopeDifficulty.map((slope) => (
                <div key={slope.label}>
                  <div className="mb-2 flex justify-between gap-4 text-sm font-medium">
                    <span>{slope.label}</span>
                    <span>{slope.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--alpivo-mist-gray)]">
                    <div className="h-full rounded-full bg-[var(--alpivo-alpine-blue)]" style={{ width: `${Math.max(8, Math.min(100, slope.width))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </AccordionRow>

          <AccordionRow title="Unterkünfte" icon={<BedIcon />}>
            <div className="grid gap-3 md:grid-cols-3">
              {resort.stayOptions.map((stay) => (
                <div key={`${stay.name}-${stay.type}`} className="rounded-[var(--alpivo-radius-md)] border border-[var(--alpivo-border-subtle)] bg-white p-4">
                  <p className="font-semibold text-[var(--alpivo-deep-navy)]">{stay.name}</p>
                  <p className="mt-1 text-sm text-[var(--alpivo-ink-muted)]">{stay.type} · {stay.fit}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--alpivo-alpine-blue)]">{stay.price}</p>
                </div>
              ))}
            </div>
          </AccordionRow>

          <AccordionRow title="Anreise" icon={<CarIcon />}>
            <div className="grid gap-3 md:grid-cols-2">
              {resort.travelOptions.map((option) => (
                <div key={`${option.mode}-${option.duration}`} className="rounded-[var(--alpivo-radius-md)] border border-[var(--alpivo-border-subtle)] bg-white p-4">
                  <p className="text-sm font-medium text-[var(--alpivo-ink-muted)]">{option.mode}</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--alpivo-deep-navy)]">{option.duration}</p>
                  <p className="mt-2 text-sm text-[var(--alpivo-deep-navy)]">{option.route}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--alpivo-ink-muted)]">{option.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                href={`/map?resort=${encodeURIComponent(resort.slug)}`}
                onClick={() => {
                  selectResort(resort.slug);
                  markActionCompleted("routeChecked", resort.slug);
                }}
                variant="secondary"
              >
                Auf Karte ansehen
              </Button>
            </div>
          </AccordionRow>

          <AccordionRow title="Beste Reisezeit" icon={<CalendarIcon />}>
            <p>
              <span className="font-semibold text-[var(--alpivo-deep-navy)]">{resort.seasonLabel}</span>
              <span> · {resort.bestSeasonNote}</span>
            </p>
            <ul className="mt-4 space-y-2">
              {resort.dataGaps.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-[var(--alpivo-alpine-blue)]" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </AccordionRow>
        </section>
      </main>
    </div>
  );
}
