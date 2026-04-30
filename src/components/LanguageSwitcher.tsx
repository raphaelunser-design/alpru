"use client";

import { useEffect, useState } from "react";
import { setClientLocale } from "@/lib/clientLocale";
import { defaultLocale, isSupportedLocale, supportedLocales, type SupportedLocale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem("alpivo_locale");
    if (isSupportedLocale(stored)) {
      setLocale(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function changeLocale(next: string) {
    if (!isSupportedLocale(next)) return;
    setLocale(next);
    setClientLocale(next);
  }

  return (
    <label className="inline-flex items-center" htmlFor="alpivo-language">
      <span className="sr-only">Sprache wählen</span>
      <select
        id="alpivo-language"
        value={locale}
        onChange={(event) => changeLocale(event.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50"
      >
        {supportedLocales.map((item) => (
          <option key={item.code} value={item.code}>
            {item.shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
