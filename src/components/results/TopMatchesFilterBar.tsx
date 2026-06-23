"use client";

import type { ReactNode } from "react";
import { Card, FilterPill } from "@/components/ui";

export type ResultsSortKey = "match" | "price" | "drive";

export type ActiveFilter = {
  id: string;
  label: string;
  icon: ReactNode;
  onRemove?: () => void;
};

type TopMatchesFilterBarProps = {
  filters: ActiveFilter[];
  sort: ResultsSortKey;
  onSortChange: (sort: ResultsSortKey) => void;
};

export function SnowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v18M5 7l14 10M19 7 5 17M7 4l1 4-4-1M17 4l-1 4 4-1M7 20l1-4-4 1M17 20l-1-4 4 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 16h14M7 16l1.4-5h7.2L17 16M7 19h.01M17 19h.01M4 16v3h16v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WalletIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13M16 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FamilyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 19v-1a4 4 0 0 0-8 0v1m4-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 8v-1.2a3 3 0 0 0-2-2.8m-1-9.5a2.5 2.5 0 0 1 0 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--alpivo-deep-navy)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TopMatchesFilterBar({ filters, sort, onSortChange }: TopMatchesFilterBarProps) {
  return (
    <Card className="p-3 shadow-[var(--alpivo-shadow-md)] md:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(270px,360px)] lg:items-center">
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {filters.map((filter) => (
            <FilterPill
              key={filter.id}
              active
              icon={filter.icon}
              removable={Boolean(filter.onRemove)}
              onClick={filter.onRemove}
              aria-label={filter.onRemove ? `${filter.label} entfernen` : filter.label}
              className="min-w-[160px] justify-between rounded-[var(--alpivo-radius-md)] border-[var(--alpivo-border-subtle)] bg-white px-4"
            >
              {filter.label}
            </FilterPill>
          ))}
        </div>

        <label className="relative flex min-h-[58px] items-center gap-4 border-t border-[var(--alpivo-border-subtle)] pt-3 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-[var(--alpivo-ink-muted)]">Sortieren nach</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as ResultsSortKey)}
              className="mt-1 w-full appearance-none bg-transparent pr-8 text-base font-semibold text-[var(--alpivo-deep-navy)] outline-none"
              aria-label="Sortieren nach"
            >
              <option value="match">Beste Übereinstimmung</option>
              <option value="price">Budget</option>
              <option value="drive">Kurze Anreise</option>
            </select>
          </span>
          <ChevronIcon />
        </label>
      </div>
    </Card>
  );
}
