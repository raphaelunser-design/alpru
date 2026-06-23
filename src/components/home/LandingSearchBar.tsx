import type { ReactNode } from "react";

import { Button, Card } from "@/components/ui";

const fields = [
  { name: "origin", label: "Abfahrtsort", placeholder: "z. B. München", icon: "pin" },
  { name: "duration", label: "Reisedauer", placeholder: "z. B. 4-7 Tage", icon: "calendar" },
  { name: "budget", label: "Budget", placeholder: "z. B. 800-1.500 €", icon: "wallet" },
  { name: "group", label: "Gruppe", placeholder: "z. B. Freunde", icon: "users" },
  { name: "priorities", label: "Prioritäten", placeholder: "z. B. Schnee, Vibe", icon: "star" },
] as const;

function FieldIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, ReactNode> = {
    pin: <path {...common} d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Zm0-9a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />,
    calendar: <path {...common} d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v14H4V7a2 2 0 0 1 2-2Z" />,
    wallet: <path {...common} d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13M16 14h.01" />,
    users: <path {...common} d="M16 19v-1a4 4 0 0 0-8 0v1m4-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 8v-1.2a3 3 0 0 0-2-2.8m-1-9.5a2.5 2.5 0 0 1 0 5" />,
    star: <path {...common} d="m12 3 2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.5 6.8 19.3l1-5.9-4.3-4.2 5.9-.8L12 3Z" />,
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] ?? icons.star}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20 20-4.7-4.7M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function LandingSearchBar() {
  return (
    <Card className="p-3 shadow-[var(--alpivo-shadow-lg)] md:p-4">
      <form action="/quiz" className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_76px] lg:items-stretch">
        {fields.map((field) => (
          <label
            key={field.name}
            className="flex min-h-[74px] items-center gap-3 rounded-[var(--alpivo-radius-md)] border border-[var(--alpivo-border-subtle)] bg-white px-4 transition focus-within:border-[rgba(47,107,255,0.5)] focus-within:ring-4 focus-within:ring-[rgba(47,107,255,0.1)]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--alpivo-radius-sm)] text-[var(--alpivo-deep-navy)]" aria-hidden="true">
              <FieldIcon name={field.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--alpivo-deep-navy)]">{field.label}</span>
              <input
                name={field.name}
                placeholder={field.placeholder}
                className="mt-1 w-full bg-transparent text-sm text-[var(--alpivo-ink)] outline-none placeholder:text-[var(--alpivo-ink-muted)]"
                aria-label={field.label}
              />
            </span>
          </label>
        ))}

        <Button type="submit" className="min-h-[74px] px-4" aria-label="Match suchen">
          <SearchIcon />
        </Button>
      </form>
    </Card>
  );
}
