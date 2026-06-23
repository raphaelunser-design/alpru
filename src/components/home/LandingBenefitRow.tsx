import type { ReactNode } from "react";

import { Card, IconStat, SectionContainer } from "@/components/ui";

const benefits = [
  {
    title: "Weniger suchen",
    text: "Eine Suche. Alle relevanten Skigebiete auf einen Blick.",
    icon: "search",
  },
  {
    title: "Besser vergleichen",
    text: "Objektive Daten und echte Erfahrungen für den besten Vergleich.",
    icon: "chart",
  },
  {
    title: "Sicherer entscheiden",
    text: "Finde mit Vertrauen den Ski-Trip, der wirklich zu dir passt.",
    icon: "shield",
  },
] as const;

function BenefitIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, ReactNode> = {
    search: <path {...common} d="m20 20-4.7-4.7M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
    chart: <path {...common} d="M4 19h16M7 16v-6m5 6V5m5 11v-9" />,
    shield: <path {...common} d="M12 21s7-3.8 7-10V6l-7-3-7 3v5c0 6.2 7 10 7 10Zm-3-10 2 2 4-5" />,
  };

  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] ?? icons.search}
    </svg>
  );
}

export default function LandingBenefitRow() {
  return (
    <SectionContainer id="so-funktionierts" className="bg-[var(--alpivo-snow-white)] pt-2">
      <Card className="p-5 md:p-7">
        <div className="grid gap-4 md:grid-cols-3 md:divide-x md:divide-[var(--alpivo-border-subtle)]">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="md:px-7 first:md:pl-0 last:md:pr-0">
              <IconStat icon={<BenefitIcon name={benefit.icon} />} label={benefit.text} value={benefit.title} tone="blue" className="border-0 bg-transparent px-0 shadow-none" />
            </div>
          ))}
        </div>
      </Card>
    </SectionContainer>
  );
}
