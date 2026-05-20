export type ChecklistTemplateItem = {
  id: string;
  title: string;
  description: string;
  category: "booking" | "travel" | "gear" | "budget" | "documents" | "group";
  recommendedOrder: number;
};

export const alpivoChecklistTemplate: ChecklistTemplateItem[] = [
  {
    id: "dates",
    title: "Reisezeitraum festlegen",
    description: "Finales Fenster fuer Gruppe, Unterkunft und Anreise fixieren.",
    category: "booking",
    recommendedOrder: 1,
  },
  {
    id: "budget",
    title: "Budgetrahmen bestaetigen",
    description: "Kostenkorridor pro Person mit Skipass, Unterkunft und Anreise pruefen.",
    category: "budget",
    recommendedOrder: 2,
  },
  {
    id: "stay",
    title: "Unterkunft finalisieren",
    description: "Lage, Stornobedingungen und Zimmermix fuer die Gruppe sichern.",
    category: "booking",
    recommendedOrder: 3,
  },
  {
    id: "route",
    title: "Anreiseoption waehlen",
    description: "Auto, Bahn oder Shuttle verbindlich abstimmen und Puffer einplanen.",
    category: "travel",
    recommendedOrder: 4,
  },
  {
    id: "gear",
    title: "Ausruestung pruefen",
    description: "Ski, Boots, Helm, Brille und warme Schichten vor Abfahrt checken.",
    category: "gear",
    recommendedOrder: 5,
  },
  {
    id: "skipass",
    title: "Skipass und Zeiten pruefen",
    description: "Offizielle Preise, Oeffnungszeiten und Wetterlage kurz vor Buchung validieren.",
    category: "documents",
    recommendedOrder: 6,
  },
];

export function computeChecklistReadiness(completedIds: string[], total = alpivoChecklistTemplate.length) {
  const completed = new Set(completedIds);
  const done = alpivoChecklistTemplate.filter((item) => completed.has(item.id)).length;
  const resolvedTotal = Math.max(total, alpivoChecklistTemplate.length);
  const open = Math.max(0, resolvedTotal - done);
  const percent = resolvedTotal ? Math.round((done / resolvedTotal) * 100) : 0;
  const nextItem = alpivoChecklistTemplate.find((item) => !completed.has(item.id)) ?? null;

  return {
    percent,
    done,
    open,
    total: resolvedTotal,
    nextItem,
  };
}
