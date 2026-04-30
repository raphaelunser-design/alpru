"use client";

import { useEffect, useState } from "react";
import { defaultLocale, isSupportedLocale, type SupportedLocale } from "@/lib/i18n";

export const LOCALE_STORAGE_KEY = "alpivo_locale";
export const LOCALE_EVENT = "alpivo_locale_change";

function readStoredLocale(): SupportedLocale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isSupportedLocale(stored) ? stored : defaultLocale;
}

export function setClientLocale(next: SupportedLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  document.documentElement.lang = next;
  window.dispatchEvent(new CustomEvent<SupportedLocale>(LOCALE_EVENT, { detail: next }));
}

export function useClientLocale() {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

  useEffect(() => {
    const initialLocale = readStoredLocale();
    setLocale(initialLocale);
    document.documentElement.lang = initialLocale;

    function onLocaleChange(event: Event) {
      const next = (event as CustomEvent<SupportedLocale>).detail;
      if (isSupportedLocale(next)) {
        setLocale(next);
        document.documentElement.lang = next;
      }
    }

    function onStorageChange() {
      setLocale(readStoredLocale());
    }

    window.addEventListener(LOCALE_EVENT, onLocaleChange);
    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener(LOCALE_EVENT, onLocaleChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  return locale;
}
