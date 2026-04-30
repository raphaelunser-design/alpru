"use client";

import { useClientLocale } from "@/lib/clientLocale";
import type { SupportedLocale } from "@/lib/i18n";

const navCopy = {
  de: {
    match: "Match starten",
    trip: "Ski-Trip planen",
    results: "Ergebnisse",
    map: "Karte",
    resorts: "Resorts",
    checklist: "Checkliste",
    account: "Konto",
    mobileStart: "Start",
    mobileMatch: "Match",
    mobileTrips: "Trips",
    mobileList: "Liste",
  },
  en: {
    match: "Start match",
    trip: "Plan ski trip",
    results: "Results",
    map: "Map",
    resorts: "Resorts",
    checklist: "Checklist",
    account: "Account",
    mobileStart: "Start",
    mobileMatch: "Match",
    mobileTrips: "Trips",
    mobileList: "List",
  },
  fr: {
    match: "Lancer le match",
    trip: "Planifier le séjour",
    results: "Résultats",
    map: "Carte",
    resorts: "Stations",
    checklist: "Checklist",
    account: "Compte",
    mobileStart: "Accueil",
    mobileMatch: "Match",
    mobileTrips: "Séjours",
    mobileList: "Liste",
  },
  nl: {
    match: "Match starten",
    trip: "Skitrip plannen",
    results: "Resultaten",
    map: "Kaart",
    resorts: "Resorts",
    checklist: "Checklist",
    account: "Account",
    mobileStart: "Start",
    mobileMatch: "Match",
    mobileTrips: "Trips",
    mobileList: "Lijst",
  },
} satisfies Record<SupportedLocale, Record<string, string>>;

export type LocaleTextKey = keyof (typeof navCopy)["de"];

export function getLocaleText(locale: SupportedLocale, textKey: LocaleTextKey) {
  return navCopy[locale][textKey] ?? navCopy.de[textKey];
}

export default function LocaleText({ textKey }: { textKey: LocaleTextKey }) {
  const locale = useClientLocale();
  return <>{getLocaleText(locale, textKey)}</>;
}
