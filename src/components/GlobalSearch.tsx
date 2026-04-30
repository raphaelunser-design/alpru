"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchResult = {
  type: "resort" | "page";
  title: string;
  subtitle: string;
  href: string;
  meta: string | null;
  price: string | null;
  imageUrl: string | null;
};

type GlobalSearchProps = {
  variant: "full" | "compact" | "icon";
  className: string;
};

const staticItems: SearchResult[] = [
  {
    type: "page",
    title: "Skigebiet finden",
    subtitle: "Matching starten und passende Resorts berechnen",
    href: "/quiz",
    meta: "Match",
  },
  {
    type: "page",
    title: "Ski-Trip planen",
    subtitle: "Gruppenplanung, Budget und Favoriten",
    href: "/trips",
    meta: "Trips",
  },
  {
    type: "page",
    title: "Karte",
    subtitle: "Alpenkarte mit allen Skigebieten",
    href: "/map",
    meta: "Karte",
  },
  {
    type: "page",
    title: "Resorts",
    subtitle: "Alle Resortdaten und direkte Resortsuche",
    href: "/resorts",
    meta: "Bibliothek",
  },
  {
    type: "page",
    title: "Ergebnisse",
    subtitle: "Deine letzte Match-Auswertung öffnen",
    href: "/results",
    meta: "Ranking",
  },
  {
    type: "page",
    title: "Checkliste",
    subtitle: "Packliste und To-dos für den Skitrip",
    href: "/checklist",
    meta: "Planung",
  },
  {
    type: "page",
    title: "Konto",
    subtitle: "Profil, Alpivo DNA und Login",
    href: "/account",
    meta: "Profil",
  },
  {
    type: "page",
    title: "Admin",
    subtitle: "Resortdaten, Preise und Inhalte pflegen",
    href: "/admin",
    meta: "Verwaltung",
  },
];

function normalize(value: string) {
  return value
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

function SearchIcon({ className = "h-4 w-4" }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m20 20-4.2-4.2m1.7-4.6a6.3 6.3 0 1 1-12.6 0 6.3 6.3 0 0 1 12.6 0Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GlobalSearch({ variant = "full", className = "" }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [resortResults, setResortResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const staticResults = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return staticItems.slice(0, 6);
    return staticItems
      .filter((item) => normalize(`${item.title} ${item.subtitle} ${item.meta ?? ""}`).includes(normalizedQuery))
      .slice(0, 4);
  }, [query]);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return staticResults;
    return [...resortResults, ...staticResults].slice(0, 10);
  }, [query, resortResults, staticResults]);

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;

    if (trimmed.length < 2) {
      setResortResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/searchq=${encodeURIComponent(trimmed)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Suche fehlgeschlagen");
          return res.json() as Promise<{ results: SearchResult[] }>;
        })
        .then((data) => {
          if (cancelled) return;
          setResortResults(data.results ?? []);
        })
        .catch(() => {
          if (cancelled) return;
          setResortResults([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function goTo(item: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(Math.max(0, results.length - 1), current + 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      goTo(results[activeIndex]);
    }
  }

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
        aria-label="Suche öffnen"
      >
        <SearchIcon />
      </button>
    ) : variant === "compact" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
        aria-label="Alpivo durchsuchen"
      >
        <SearchIcon className="h-4 w-4 shrink-0 text-slate-500" />
        <span>Suche</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
        aria-label="Alpivo durchsuchen"
      >
        <SearchIcon className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="min-w-0 flex-1 truncate">Resort, Karte, Trip oder Funktion suchen</span>
        <span className="hidden shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:inline">
          Suche
        </span>
      </button>
    );

  return (
    <div className={className}>
      {trigger}

      {open (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/55 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Alpivo Suche"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_28px_100px_rgba(2,6,23,0.45)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-slate-50/90 p-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Suche nach Skigebieten, Karte, Trips, Konto..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-12 pr-24 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  aria-label="Alpivo durchsuchen"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  ESC
                </button>
              </div>
            </div>

            <div className="max-h-[min(68vh,560px)] overflow-y-auto p-2">
              {loading ? <div className="px-3 py-4 text-sm font-medium text-slate-500">Suche Resorts...</div> : null}

              {!loading && results.length === 0 ? (
                <div className="px-3 py-5 text-sm text-slate-500">
                  Kein Treffer. Probiere z. B. "Ischgl", "Karte", "Trip" oder "Checkliste".
                </div>
              ) : null}

              {results.map((item, index) => (
                <button
                  key={`${item.type}-${item.href}`}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    activeIndex === index ? "bg-sky-50 text-slate-950" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                    {item.type === "resort" && item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      <SearchIcon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span>
                    {item.price ? <span className="mt-1 block text-[11px] text-slate-500">{item.price}</span> : null}
                  </span>
                  <span className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline-flex">
                    {item.meta ?? (item.type === "resort" ? "Resort" : "Seite")}
                    <ArrowIcon />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
