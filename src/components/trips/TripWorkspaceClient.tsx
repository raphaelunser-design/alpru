"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { DataFreshnessNote } from "@/components/DataStatusBadge";
import AppShell from "@/components/premium/AppShell";
import GlassCard from "@/components/GlassCard";
import MetricChip from "@/components/premium/MetricChip";
import PageHeader from "@/components/premium/PageHeader";
import ResortActionHub from "@/components/premium/ResortActionHub";
import SelectControl from "@/components/SelectControl";
import SkipassAssistant from "@/components/premium/SkipassAssistant";
import Toast from "@/components/Toast";
import AvailabilityCalendar from "@/components/trips/AvailabilityCalendar";
import BestDatesPanel from "@/components/trips/BestDatesPanel";
import BudgetSummary from "@/components/trips/BudgetSummary";
import ComparisonTable from "@/components/trips/ComparisonTable";
import ExpenseList from "@/components/trips/ExpenseList";
import InviteDialog from "@/components/trips/InviteDialog";
import ParticipantList from "@/components/trips/ParticipantList";
import ResortFavoriteCard from "@/components/trips/ResortFavoriteCard";
import SettlementCard from "@/components/trips/SettlementCard";
import TripNavigation from "@/components/trips/TripNavigation";
import TripsStateCard from "@/components/trips/TripsStateCard";
import { getAlpivoResortBySlug, getResortActionLinks } from "@/data/resorts";
import { useAlpivoGuestState } from "@/hooks/useAlpivoGuestState";
import {
  buildComparisonRows,
  budgetCategoryLabels,
  computeBudgetSummary,
  computeExpenseBalances,
  computeExpenseSummary,
  formatCurrency,
  formatDateRange,
  getTripMemberName,
  type SkiTripAvailabilityRecord,
  type SkiTripAvailabilityStatus,
  type SkiTripBudgetCategory,
  type SkiTripBundle,
  type SkiTripFavoriteRecord,
  type SkiTripMemberRecord,
  type SkiTripPriceSnapshotRecord,
  type ComparisonRow,
  type TripWorkspaceView,
} from "@/lib/tripPlanner";
import { loadTripBundleById, shouldFallbackToDemo } from "@/lib/tripPlannerData";
import { supabase } from "@/lib/supabase";
import type { ResortLoadResult } from "@/lib/resortRepository";
import type { ResortSignalRow } from "@/lib/resortSignals";
import type { AlpivoGuestState } from "@/types/alpivo";

type ResortCandidate = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string | null;
  image_url: string | null;
  piste_km_total: number | null;
  piste_km: number | null;
  skipass_price_from: number | null;
  elevation_max_m: number | null;
};

type SnapshotFormState = {
  favoriteId: string;
  dateOptionId: string;
  skipass: string;
  accommodation: string;
  travel: string;
  rental: string;
  skiSchool: string;
  food: string;
  buffer: string;
  note: string;
};

type BudgetFormState = {
  category: SkiTripBudgetCategory;
  description: string;
  amount: string;
  dueDate: string;
  note: string;
};

type ExpenseFormState = {
  category: SkiTripBudgetCategory;
  description: string;
  amount: string;
  incurredOn: string;
  dueDate: string;
  note: string;
  splitMode: "even" | "custom";
  payerMemberId: string;
  selectedMemberIds: string[];
  customAmounts: Record<string, string>;
};

type PlanActionKey = keyof AlpivoGuestState["completedActions"];

type TripPlanAction = {
  key: PlanActionKey;
  title: string;
  text: string;
  href: string;
  external?: boolean;
};

type CostPlanningItem = {
  key: PlanActionKey;
  title: string;
  value: string;
  text: string;
  href: string;
  external?: boolean;
};

const budgetCategoryOptions = Object.entries(budgetCategoryLabels).map(([value, label]) => ({ value, label }));

const demoParticipants = [
  {
    displayName: "Max Mustermann",
    email: "max.demo@alpivo.test",
    demoProfile: { budget: 420, apres: 4, level: "mixed", note: "preisbewusst, Après-Ski wichtig" },
  },
  {
    displayName: "Lena Beispiel",
    email: "lena.demo@alpivo.test",
    demoProfile: { budget: 520, snow: 5, level: "advanced", note: "schneesicher und sportlich" },
  },
  {
    displayName: "Jonas Testfahrer",
    email: "jonas.demo@alpivo.test",
    demoProfile: { budget: 360, distance: 5, level: "beginner", note: "kurze Anfahrt und Anfängerkomfort" },
  },
  {
    displayName: "Sophie Powder",
    email: "sophie.demo@alpivo.test",
    demoProfile: { budget: 580, powder: 5, snowpark: 4, level: "advanced", note: "Powder, Snowpark, hohe Lage" },
  },
];

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <MetricChip icon="data" value={value} label={`${label}${hint ? ` · ${hint}` : ""}`} variant="glass" />
  );
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstNumber(value: string) {
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function expenseDefaultState(memberId: string | null, memberIds: string[]): ExpenseFormState {
  return {
    category: "other",
    description: "",
    amount: "",
    incurredOn: "",
    dueDate: "",
    note: "",
    splitMode: "even",
    payerMemberId: memberId ?? "",
    selectedMemberIds: memberIds,
    customAmounts: {},
  };
}

function ActionTarget({
  href,
  external,
  children,
  className = "",
  onClick,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const classes = `button-lift inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-sm font-extrabold text-white hover:bg-white/[0.09] ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={classes}>
      {children}
    </Link>
  );
}

function TripActionChecklist({
  actions,
  completedActions,
  onToggle,
}: {
  actions: TripPlanAction[];
  completedActions: AlpivoGuestState["completedActions"];
  onToggle: (key: PlanActionKey, completed: boolean) => void;
}) {
  return (
    <div className="grid gap-3">
      {actions.map((action) => {
        const completed = Boolean(completedActions[action.key]);
        return (
          <div key={action.key} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onToggle(action.key, !completed)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border text-xs font-black ${
                    completed
                      ? "border-emerald-300/35 bg-emerald-300/18 text-emerald-100"
                      : "border-white/18 bg-slate-950/35 text-slate-400"
                  }`}
                >
                  {completed ? "✓" : ""}
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-white">{action.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{action.text}</span>
                </span>
              </button>
              <ActionTarget href={action.href} external={action.external} className="min-h-10 px-3 text-xs">
                Öffnen
              </ActionTarget>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TripReadinessPanel({
  percent,
  completed,
  total,
  nextAction,
}: {
  percent: number;
  completed: number;
  total: number;
  nextAction: string;
}) {
  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip Readiness</p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="grid h-28 w-28 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/10 text-center shadow-[0_16px_48px_rgba(16,185,129,0.14)]">
          <div>
            <div className="text-3xl font-black text-white">{percent}%</div>
            <div className="text-xs font-bold text-emerald-100">bereit</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-white">{completed} von {total} Planungsaktionen erledigt</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Nächster sinnvoller Schritt: {nextAction}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-300" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function CompareDecisionCards({
  rows,
  onTripDraft,
  onSkipass,
}: {
  rows: ComparisonRow[];
  onTripDraft: (slug: string) => void;
  onSkipass: (slug: string) => void;
}) {
  const bestRowsByResort = Array.from(
    rows
      .reduce((map, row) => {
        const current = map.get(row.favorite.resortSlug);
        if (!current || row.combinedScore > current.combinedScore) map.set(row.favorite.resortSlug, row);
        return map;
      }, new Map<string, ComparisonRow>())
      .values()
  ).sort((a, b) => b.combinedScore - a.combinedScore);
  const winner = bestRowsByResort[0] ?? rows[0] ?? null;

  if (!winner) return null;

  return (
    <div className="grid gap-4">
      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Beste Wahl für diese Gruppe</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <h2 className="text-2xl font-black text-white">
              {winner.resort?.name ?? winner.favorite.resortSlug} für {formatDateRange(winner.dateOption.startDate, winner.dateOption.endDate)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Alpivo liest hier Kosten, Gruppenverfügbarkeit und Resort-Fit zusammen. Ausschlaggebend ist {winner.decisionReason}; die Beträge bleiben Beta-Orientierung und sollten offiziell geprüft werden.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <MetricChip icon="cost" value={formatCurrency(winner.totalPerPerson)} label="p. P. Orientierung" variant="glass" />
            <MetricChip icon="vibe" value={`${Math.round(winner.combinedScore * 100)}%`} label="Entscheidungs-Fit" variant="glass" />
            <MetricChip icon="piste" value={`${winner.resort?.matchPct ?? 52}%`} label="Alpivo-Fit" variant="glass" />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {bestRowsByResort.slice(0, 6).map((row) => {
          const central = getAlpivoResortBySlug(row.favorite.resortSlug);
          const links = getResortActionLinks(row.favorite.resortSlug);
          const skipassUrl = links.skipassShop?.url ?? links.ticketInfo?.url;
          return (
            <article key={`${row.favorite.id}-${row.dateOption.id}`} className="rounded-[1.5rem] border border-white/12 bg-slate-950/68 p-4 shadow-[0_20px_70px_rgba(2,6,23,0.24)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">{central?.name ?? row.resort?.name ?? row.favorite.resortSlug}</h3>
                  <p className="mt-1 text-xs text-slate-400">{central?.regionLabel ?? row.resort?.region ?? "Resort-Favorit"}</p>
                </div>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/12 px-3 py-1 text-xs font-black text-emerald-100">
                  {central?.score ?? row.resort?.matchPct ?? 52} Match
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <MetricChip icon="cost" value={formatCurrency(row.totalPerPerson)} label="p. P." variant="glass" />
                <MetricChip icon="time" value={formatDateRange(row.dateOption.startDate, row.dateOption.endDate)} label={row.dateOption.label} variant="glass" />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{row.decisionReason}</p>
              {central ? (
                <div className="mt-3 grid gap-1 text-xs text-slate-400">
                  <span>Schnee: {central.snowLabel}</span>
                  <span>Vibe: {central.vibeLabel}</span>
                  <span>Haken: {central.drawback}</span>
                </div>
              ) : null}
              <div className="mt-4 grid gap-2">
                <ActionTarget href={`/resort/${encodeURIComponent(row.favorite.resortSlug)}`} className="min-h-10 text-xs">
                  Details ansehen
                </ActionTarget>
                <ActionTarget href={`/map?resort=${encodeURIComponent(row.favorite.resortSlug)}`} className="min-h-10 text-xs">
                  Auf Karte ansehen
                </ActionTarget>
                {skipassUrl ? (
                  <ActionTarget href={skipassUrl} external onClick={() => onSkipass(row.favorite.resortSlug)} className="min-h-10 text-xs">
                    Skipass offiziell prüfen
                  </ActionTarget>
                ) : null}
                <button
                  type="button"
                  onClick={() => onTripDraft(row.favorite.resortSlug)}
                  className="button-lift inline-flex min-h-10 items-center justify-center rounded-2xl bg-sky-500 px-4 text-xs font-extrabold text-white hover:bg-sky-400"
                >
                  Zum Trip hinzufügen
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ExpensePlanningPanel({
  items,
  completedActions,
  onToggle,
}: {
  items: CostPlanningItem[];
  completedActions: AlpivoGuestState["completedActions"];
  onToggle: (key: PlanActionKey, completed: boolean) => void;
}) {
  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Kostenrechner</p>
          <h2 className="mt-2 text-2xl font-black text-white">Orientierung vor der Buchung</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Die Werte sind Beta-Orientierung für die Gruppe. Skipass, Unterkunft, Storno und Live-Status werden bewusst über offizielle Quellen geprüft.
          </p>
        </div>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-xs font-black text-amber-100">Schätzung</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const completed = Boolean(completedActions[item.key]);
          return (
            <div key={item.key} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-white">{item.title}</div>
                  <div className="mt-1 text-2xl font-black text-white">{item.value}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{item.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(item.key, !completed)}
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-xs font-black ${
                    completed ? "border-emerald-300/35 bg-emerald-300/18 text-emerald-100" : "border-white/14 bg-slate-950/45 text-slate-400"
                  }`}
                  aria-label={completed ? `${item.title} wieder öffnen` : `${item.title} als geprüft markieren`}
                >
                  {completed ? "✓" : ""}
                </button>
              </div>
              <ActionTarget href={item.href} external={item.external} className="mt-4 min-h-10 w-full text-xs">
                {item.external ? "Offiziell prüfen" : "Öffnen"}
              </ActionTarget>
            </div>
          );
        })}
      </div>
      <DataFreshnessNote className="mt-5">
        Kostenrechner und Gruppensplit sind Planungswerte. Offizielle Skipasspreise, Unterkunft, Storno- und Zahlungsbedingungen bitte außerhalb von Alpivo prüfen.
      </DataFreshnessNote>
    </GlassCard>
  );
}

export default function TripWorkspaceClient({ tripId, view }: { tripId: string; view: TripWorkspaceView }) {
  const [bundle, setBundle] = useState<SkiTripBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [resortCandidates, setResortCandidates] = useState<ResortCandidate[]>([]);
  const [resortSearch, setResortSearch] = useState("");
  const [snapshotForm, setSnapshotForm] = useState<SnapshotFormState>({
    favoriteId: "",
    dateOptionId: "",
    skipass: "",
    accommodation: "",
    travel: "",
    rental: "",
    skiSchool: "",
    food: "",
    buffer: "",
    note: "",
  });
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>({
    category: "skipass",
    description: "",
    amount: "",
    dueDate: "",
    note: "",
  });
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(expenseDefaultState(null, []));
  const [busy, setBusy] = useState(false);
  const { state: guestState, markActionCompleted, setActionCompleted, addTripDraftResort } = useAlpivoGuestState();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const { data: userData } = await supabase.auth.getUser();
      const nextUserId = userData.user?.id ?? null;
      if (!mounted) return;
      setUserId(nextUserId);

      try {
        const loaded = await loadTripBundleById(tripId, nextUserId);
        if (!mounted) return;
        if (!loaded) {
          setError("Trip nicht gefunden oder keine Berechtigung.");
          setBundle(null);
        } else {
          setBundle(loaded);
        }
      } catch (loadError) {
        if (!mounted) return;
        if (shouldFallbackToDemo(loadError as { code: string; message: string })) {
          setError("Die Trip-Tabellen sind remote noch nicht aktiv. Öffne ein Gast-Tripboard über /trips.");
        } else {
          setError(loadError instanceof Error ? loadError.message : "Trip konnte nicht geladen werden");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    fetch("/api/resorts", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return {
            resorts: [],
            total: 0,
            loaded: 0,
            source: "fallback",
            usingFallback: true,
            fallbackReason: "error",
            error: null,
            pageSize: 0,
            hasMore: false,
          } as ResortLoadResult<ResortSignalRow>;
        }
        return (await response.json()) as ResortLoadResult<ResortSignalRow>;
      })
      .then((result) => {
        if (!mounted) return;
        const candidates = (result.resorts ?? [])
          .map(
            (resort): ResortCandidate => ({
              id: resort.id,
              slug: resort.slug || resort.id,
              name: resort.name,
              country: resort.country,
              region: resort.region ?? null,
              image_url: resort.image_url ?? null,
              piste_km_total: resort.piste_km_total ?? null,
              piste_km: resort.piste_km ?? null,
              skipass_price_from: resort.skipass_price_from ?? null,
              elevation_max_m: resort.elevation_max_m ?? null,
            })
          )
          .sort((a, b) => (b.piste_km_total ?? b.piste_km ?? 0) - (a.piste_km_total ?? a.piste_km ?? 0));
        setResortCandidates(candidates);
      })
      .catch(() => {
        if (!mounted) return;
        setResortCandidates([]);
      });

    return () => {
      mounted = false;
    };
  }, [tripId]);

  const currentMember = useMemo(() => {
    if (!bundle) return null;
    return bundle.members.find((member) => member.userId === userId) ?? (bundle.isDemo ? bundle.members[0] ?? null : null);
  }, [bundle, userId]);

  const joinedMembers = useMemo(
    () => (bundle ? bundle.members.filter((member) => member.status === "joined" || member.role === "admin") : []),
    [bundle]
  );

  useEffect(() => {
    const memberIds = joinedMembers.map((member) => member.id);
    setExpenseForm((current) =>
      current.selectedMemberIds.length
        ? current
        : expenseDefaultState(currentMember ? currentMember.id : null, memberIds)
    );
  }, [currentMember, joinedMembers]);

  const isAdmin = currentMember ? currentMember.role === "admin" : false;
  const heroResort = bundle
    ? bundle.resorts[bundle.favorites.find((favorite) => favorite.isPinned)?.resortSlug ?? ""] ??
      bundle.resorts[bundle.favorites[0]?.resortSlug ?? ""] ??
      null
    : null;
  const primaryFavoriteSlug = bundle?.favorites.find((favorite) => favorite.isPinned)?.resortSlug ?? bundle?.favorites[0]?.resortSlug ?? "obertauern";
  const primaryAlpivoResort = getAlpivoResortBySlug(primaryFavoriteSlug);
  const primaryDateOption = bundle?.dateOptions[0] ?? null;
  const skipassPreferences = {
    ...guestState.preferences,
    tripStartDate: primaryDateOption?.startDate ?? guestState.preferences.tripStartDate,
    tripEndDate: primaryDateOption?.endDate ?? guestState.preferences.tripEndDate,
    peopleCount: joinedMembers.length || guestState.preferences.peopleCount,
  };
  const comparisonRows = useMemo(() => (bundle ? buildComparisonRows(bundle) : []), [bundle]);
  const budgetSummary = useMemo(() => (bundle ? computeBudgetSummary(bundle) : null), [bundle]);
  const balances = useMemo(() => (bundle ? computeExpenseBalances(bundle) : []), [bundle]);
  const expenseSummary = useMemo(() => (bundle ? computeExpenseSummary(bundle) : null), [bundle]);
  const bestDecisionRow = useMemo(
    () => comparisonRows.reduce<ComparisonRow | null>((best, row) => (!best || row.combinedScore > best.combinedScore ? row : best), null),
    [comparisonRows]
  );
  const primaryActionLinks = primaryAlpivoResort ? getResortActionLinks(primaryAlpivoResort.slug) : null;
  const planActions = useMemo<TripPlanAction[]>(() => {
    const slug = primaryAlpivoResort?.slug ?? primaryFavoriteSlug;
    const links = primaryActionLinks;
    return [
      {
        key: "groupDecisionChecked",
        title: "Gruppenentscheidung finalisieren",
        text: "Vergleicht Favoriten, Zeitfenster und Gruppen-Fit, bevor ihr euch festlegt.",
        href: `/trips/${encodeURIComponent(tripId)}/compare`,
      },
      {
        key: "budgetChecked",
        title: "Budget und Gruppenkosten prüfen",
        text: "Kosten bleiben Orientierung, werden aber pro Person und Gruppe zusammengeführt.",
        href: `/trips/${encodeURIComponent(tripId)}/expenses`,
      },
      {
        key: "skipassChecked",
        title: "Skipass offiziell prüfen",
        text: "Ticketdauer, Altersgruppen und KeyCard-Regeln müssen offiziell bestätigt werden.",
        href: links?.skipassShop?.url ?? links?.ticketInfo?.url ?? `/feedback?category=link-fehlt&feature=skipass&resort=${encodeURIComponent(slug)}`,
        external: Boolean(links?.skipassShop?.url ?? links?.ticketInfo?.url),
      },
      {
        key: "accommodationChecked",
        title: "Unterkunftsverfügbarkeit prüfen",
        text: "Unterkunft, Storno und Lage zum Lift offiziell gegenchecken.",
        href: links?.accommodationSearch?.url ?? `/feedback?category=link-fehlt&feature=unterkunft&resort=${encodeURIComponent(slug)}`,
        external: Boolean(links?.accommodationSearch?.url),
      },
      {
        key: "routeChecked",
        title: "Route und Wetterlage prüfen",
        text: "Route, Wochenendverkehr, Live-Status und Webcams vor Abfahrt aktualisieren.",
        href: `/map?resort=${encodeURIComponent(slug)}`,
      },
    ];
  }, [primaryActionLinks, primaryAlpivoResort?.slug, primaryFavoriteSlug, tripId]);
  const completedPlanActions = planActions.filter((action) => guestState.completedActions[action.key]).length;
  const readinessPercent = Math.round((completedPlanActions / Math.max(planActions.length, 1)) * 100);
  const nextPlanAction = planActions.find((action) => !guestState.completedActions[action.key])?.title ?? "Trip final bestätigen";
  const expensePlanningItems = useMemo<CostPlanningItem[]>(() => {
    const slug = primaryAlpivoResort?.slug ?? primaryFavoriteSlug;
    const links = primaryActionLinks;
    const snapshot = bestDecisionRow?.snapshot;
    const accommodation = snapshot?.accommodation ?? primaryAlpivoResort?.pricePerPerson ?? 0;
    const skipass = snapshot?.skipass ?? 0;
    const travel = snapshot?.travel ?? firstNumber(primaryAlpivoResort?.fuelCost ?? "") ?? 0;
    const food = snapshot?.food ?? 0;
    return [
      {
        key: "accommodationChecked",
        title: "Unterkunft",
        value: accommodation ? formatCurrency(accommodation) : "offen",
        text: "Preis und Verfügbarkeit offiziell prüfen, keine Alpivo-Buchung.",
        href: links?.accommodationSearch?.url ?? `/feedback?category=link-fehlt&feature=unterkunft&resort=${encodeURIComponent(slug)}`,
        external: Boolean(links?.accommodationSearch?.url),
      },
      {
        key: "skipassChecked",
        title: "Skipass",
        value: skipass ? formatCurrency(skipass) : "offiziell prüfen",
        text: "Ticketdauer und Altersgruppen im offiziellen Shop bestätigen.",
        href: links?.skipassShop?.url ?? links?.ticketInfo?.url ?? `/feedback?category=link-fehlt&feature=skipass&resort=${encodeURIComponent(slug)}`,
        external: Boolean(links?.skipassShop?.url ?? links?.ticketInfo?.url),
      },
      {
        key: "routeChecked",
        title: "Anreise",
        value: travel ? formatCurrency(travel) : primaryAlpivoResort?.travelTimeFromMunich ?? "prüfen",
        text: "Route, Wetter und Verkehr vor Abfahrt aktualisieren.",
        href: `/map?resort=${encodeURIComponent(slug)}`,
      },
      {
        key: "budgetChecked",
        title: "Food & Puffer",
        value: food ? formatCurrency(food) : "Orientierung",
        text: "Hütten, Abendessen und Puffer mit der Gruppe abstimmen.",
        href: `/trips/${encodeURIComponent(tripId)}/budget`,
      },
    ];
  }, [bestDecisionRow?.snapshot, primaryActionLinks, primaryAlpivoResort, primaryFavoriteSlug, tripId]);

  useEffect(() => {
    if (!bundle) return;
    const firstFavoriteId = bundle.favorites[0]?.id ?? "";
    const firstDateOptionId = bundle.dateOptions[0]?.id ?? "";
    const existingRow = comparisonRows.find((row) => row.favorite.id === firstFavoriteId && row.dateOption.id === firstDateOptionId);
    const existingSnapshot = existingRow ? existingRow.snapshot : null;
    setSnapshotForm({
      favoriteId: firstFavoriteId,
      dateOptionId: firstDateOptionId,
      skipass: existingSnapshot ? String(existingSnapshot.skipass || "") : "",
      accommodation: existingSnapshot ? String(existingSnapshot.accommodation || "") : "",
      travel: existingSnapshot ? String(existingSnapshot.travel || "") : "",
      rental: existingSnapshot ? String(existingSnapshot.rental || "") : "",
      skiSchool: existingSnapshot ? String(existingSnapshot.skiSchool || "") : "",
      food: existingSnapshot ? String(existingSnapshot.food || "") : "",
      buffer: existingSnapshot ? String(existingSnapshot.buffer || "") : "",
      note: existingSnapshot ? existingSnapshot.note || "" : "",
    });
  }, [bundle, comparisonRows]);

  useEffect(() => {
    const matchingRow = comparisonRows.find(
      (row) => row.favorite.id === snapshotForm.favoriteId && row.dateOption.id === snapshotForm.dateOptionId
    );
    const snapshot = matchingRow ? matchingRow.snapshot : null;
    if (!snapshot) return;
    setSnapshotForm((current) => ({
      ...current,
      skipass: String(snapshot.skipass || ""),
      accommodation: String(snapshot.accommodation || ""),
      travel: String(snapshot.travel || ""),
      rental: String(snapshot.rental || ""),
      skiSchool: String(snapshot.skiSchool || ""),
      food: String(snapshot.food || ""),
      buffer: String(snapshot.buffer || ""),
      note: snapshot ? snapshot.note || "" : "",
    }));
  }, [comparisonRows, snapshotForm.favoriteId, snapshotForm.dateOptionId]);

  async function mutateDemo(nextBundle: SkiTripBundle, successMessage: string) {
    setBundle(nextBundle);
    setToast(successMessage);
  }

  async function handleAddDemoParticipants() {
    if (!bundle || !currentMember || !isAdmin) return;
    const existingNames = new Set(bundle.members.map((member) => member.displayName));
    const nextMembers = demoParticipants
      .filter((participant) => !existingNames.has(participant.displayName))
      .map((participant) => ({
        id: crypto.randomUUID(),
        tripId: bundle.trip.id,
        userId: null,
        displayName: participant.displayName,
        email: participant.email,
        role: "member" as const,
        status: "joined" as const,
        isDemo: true,
        demoProfile: participant.demoProfile,
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));

    if (!nextMembers.length) {
      setToast("Beispiel-Teilnehmer sind bereits im Trip.");
      return;
    }

    if (bundle.isDemo) {
      await mutateDemo({ ...bundle, members: [...bundle.members, ...nextMembers] }, "Beispiel-Teilnehmer hinzugefügt.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_members")
      .insert(
        nextMembers.map((member) => ({
          trip_id: bundle.trip.id,
          user_id: null,
          display_name: member.displayName,
          email: member.email,
          role: "member",
          status: "joined",
          is_demo: true,
          demo_profile: member.demoProfile,
          joined_at: member.joinedAt,
        }))
      )
      .select("*");

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            members: [
              ...currentBundle.members,
              ...(data ?? []).map((row): SkiTripMemberRecord => ({
                id: String(row.id),
                tripId: String(row.trip_id),
                userId: typeof row.user_id === "string" ? row.user_id : null,
                displayName: String(row.display_name),
                email: typeof row.email === "string" ? row.email : null,
                role: row.role === "admin" ? "admin" : "member",
                status: row.status === "invited" || row.status === "open" ? row.status : "joined",
                isDemo: Boolean(row.is_demo),
                demoProfile: row.demo_profile && typeof row.demo_profile === "object" ? (row.demo_profile as Record<string, unknown>) : {},
                joinedAt: typeof row.joined_at === "string" ? row.joined_at : null,
                createdAt: typeof row.created_at === "string" ? row.created_at : null,
              })),
            ],
          }
        : currentBundle
    );
    setToast("Beispiel-Teilnehmer hinzugefügt.");
  }

  async function handleCreateInvite(payload: { email: string; role: "admin" | "member"; note: string }) {
    if (!bundle || !currentMember || !isAdmin) return null;
    const inviteUrl = `${window.location.origin}/trips/invite/${crypto.randomUUID()}`;

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          invites: [
            ...bundle.invites,
            {
              id: crypto.randomUUID(),
              tripId: bundle.trip.id,
              email: payload.email || null,
              role: payload.role,
              inviteToken: inviteUrl.split("/").pop() ?? crypto.randomUUID(),
              note: payload.note || null,
              status: "invited",
              expiresAt: null,
              createdAt: new Date().toISOString(),
            },
          ],
        },
        "Gast-Invite erzeugt."
      );
      return { url: inviteUrl };
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_invites")
      .insert({
        trip_id: bundle.trip.id,
        email: payload.email || null,
        role: payload.role,
        note: payload.note || null,
        status: "invited",
        created_by: userId,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Invite konnte nicht erzeugt werden.");
      return null;
    }

    setBundle((current) =>
      current
        ? {
            ...current,
            invites: [
              ...current.invites,
              {
                id: String(data.id),
                tripId: String(data.trip_id),
                email: typeof data.email === "string" ? data.email : null,
                role: data.role === "admin" ? "admin" : "member",
                inviteToken: String(data.invite_token),
                note: typeof data.note === "string" ? data.note : null,
                status: data.status === "joined" || data.status === "open" ? data.status : "invited",
                expiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
                createdAt: typeof data.created_at === "string" ? data.created_at : null,
              },
            ],
          }
        : current
    );
    setToast("Invite-Link erzeugt.");
    return { url: `${window.location.origin}/trips/invite/${data.invite_token}` };
  }

  async function handleCreateDateOption(payload: { label: string; startDate: string; endDate: string; note: string }) {
    if (!bundle || !currentMember) return;
    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          dateOptions: [
            ...bundle.dateOptions,
            {
              id: crypto.randomUUID(),
              tripId: bundle.trip.id,
              label: payload.label,
              startDate: payload.startDate,
              endDate: payload.endDate,
              note: payload.note || null,
              createdBy: currentMember.userId,
              createdAt: new Date().toISOString(),
            },
          ].sort((a, b) => a.startDate.localeCompare(b.startDate)),
        },
        "Zeitraum angelegt."
      );
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_date_options")
      .insert({
        trip_id: bundle.trip.id,
        label: payload.label,
        start_date: payload.startDate,
        end_date: payload.endDate,
        note: payload.note || null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Zeitraum konnte nicht angelegt werden.");
      return;
    }

    setBundle((current) =>
      current
        ? {
            ...current,
            dateOptions: [
              ...current.dateOptions,
              {
                id: String(data.id),
                tripId: String(data.trip_id),
                label: String(data.label),
                startDate: String(data.start_date),
                endDate: String(data.end_date),
                note: typeof data.note === "string" ? data.note : null,
                createdBy: typeof data.created_by === "string" ? data.created_by : null,
                createdAt: typeof data.created_at === "string" ? data.created_at : null,
              },
            ].sort((a, b) => a.startDate.localeCompare(b.startDate)),
          }
        : current
    );
    setToast("Zeitraum gespeichert.");
  }

  async function handleSaveAvailability(dateOptionId: string, status: SkiTripAvailabilityStatus) {
    if (!bundle || !currentMember) return;
    const current = bundle.availability.find((entry) => entry.dateOptionId === dateOptionId && entry.memberId === currentMember.id) ?? null;

    if (bundle.isDemo) {
      const nextEntry: SkiTripAvailabilityRecord = {
        id: current?.id ?? crypto.randomUUID(),
        tripId: bundle.trip.id,
        dateOptionId,
        memberId: currentMember.id,
        userId: currentMember.userId,
        status,
        note: current ? current.note || null : null,
        updatedAt: new Date().toISOString(),
      };
      await mutateDemo(
        {
          ...bundle,
          availability: current
            ? bundle.availability.map((entry) => (entry.id === current.id ? nextEntry : entry))
            : [...bundle.availability, nextEntry],
        },
        "Verfügbarkeit aktualisiert."
      );
      return;
    }

    const { data, error: upsertError } = await supabase
      .from("ski_trip_availability")
      .upsert(
        {
          id: current ? current.id : crypto.randomUUID(),
          trip_id: bundle.trip.id,
          date_option_id: dateOptionId,
          member_id: currentMember.id,
          user_id: userId,
          status,
          note: current?.note ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date_option_id,member_id" }
      )
      .select("*")
      .single();

    if (upsertError || !data) {
      setError(upsertError?.message ?? "Verfügbarkeit konnte nicht gespeichert werden.");
      return;
    }

    const nextEntry: SkiTripAvailabilityRecord = {
      id: String(data.id),
      tripId: String(data.trip_id),
      dateOptionId: String(data.date_option_id),
      memberId: String(data.member_id),
      userId: typeof data.user_id === "string" ? data.user_id : null,
      status: data.status === "available" || data.status === "maybe" ? data.status : "unavailable",
      note: typeof data.note === "string" ? data.note : null,
      updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
    };

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            availability: current
              ? currentBundle.availability.map((entry) => (entry.id === current.id ? nextEntry : entry))
              : [...currentBundle.availability, nextEntry],
          }
        : currentBundle
    );
    setToast("Verfügbarkeit aktualisiert.");
  }

  async function handleAddFavorite(candidate: ResortCandidate) {
    if (!bundle || !currentMember) return;
    if (bundle.favorites.some((favorite) => favorite.resortSlug === candidate.slug)) {
      setToast("Resort ist bereits als Favorit hinterlegt.");
      return;
    }

    const nextFavorite: SkiTripFavoriteRecord = {
      id: crypto.randomUUID(),
      tripId: bundle.trip.id,
      resortId: candidate.id,
      resortSlug: candidate.slug,
      note: `${candidate.name} als Kandidat für die Gruppe vorgemerkt.`,
      proposedByMemberId: currentMember.id,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    const centralResort = getAlpivoResortBySlug(candidate.slug);

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          favorites: [...bundle.favorites, nextFavorite],
          resorts: {
            ...bundle.resorts,
            [candidate.slug]: {
              id: candidate.id,
              slug: centralResort?.slug ?? candidate.slug,
              name: centralResort?.name ?? candidate.name,
              country: centralResort?.country ?? candidate.country,
              region: centralResort?.region ?? candidate.region,
              imageUrl: centralResort?.image ?? candidate.image_url ?? "/bg/skilandschaft.png",
              pisteKm: centralResort ? Number(centralResort.pisteKm.match(/\d+/)?.[0] ?? 0) : candidate.piste_km_total ?? candidate.piste_km ?? null,
              elevationMinM: centralResort ? Number(centralResort.altitude.match(/\d+/)?.[0] ?? 0) : null,
              elevationMaxM: candidate.elevation_max_m ?? null,
              verticalM: null,
              skipassPriceFrom: candidate.skipass_price_from ?? null,
              officialUrl: centralResort?.detail.externalLinks.find((link) => /^https?:\/\//.test(link.href))?.href ?? null,
              lat: centralResort?.coordinates.lat ?? null,
              lon: centralResort?.coordinates.lon ?? null,
              matchPct: centralResort?.score ?? 68,
            },
          },
        },
        "Resort-Favorit hinzugefügt."
      );
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_favorites")
      .insert({
        trip_id: bundle.trip.id,
        resort_id: candidate.id,
        resort_slug: candidate.slug,
        note: nextFavorite.note,
        proposed_by_member_id: currentMember.id,
        is_pinned: false,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Resort konnte nicht hinzugefügt werden.");
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            favorites: [
              ...currentBundle.favorites,
              {
                id: String(data.id),
                tripId: String(data.trip_id),
                resortId: typeof data.resort_id === "string" ? data.resort_id : null,
                resortSlug: String(data.resort_slug),
                note: typeof data.note === "string" ? data.note : null,
                proposedByMemberId: typeof data.proposed_by_member_id === "string" ? data.proposed_by_member_id : null,
                isPinned: Boolean(data.is_pinned),
                createdAt: typeof data.created_at === "string" ? data.created_at : null,
              },
            ],
          }
        : currentBundle
    );
    setToast("Resort-Favorit hinzugefügt.");
  }

  async function handleVote(favoriteId: string, kind: "like" | "favorite") {
    if (!bundle || !currentMember) return;
    const existing = bundle.votes.find(
      (entry) => entry.favoriteId === favoriteId && entry.memberId === currentMember.id && entry.voteKind === kind
    );

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          votes: existing
            ? bundle.votes.filter((entry) => entry.id !== existing.id)
            : [
                ...bundle.votes,
                {
                  id: crypto.randomUUID(),
                  tripId: bundle.trip.id,
                  favoriteId,
                  memberId: currentMember.id,
                  voteKind: kind,
                  createdAt: new Date().toISOString(),
                },
              ],
        },
        existing ? "Vote entfernt." : "Vote gespeichert."
      );
      return;
    }

    if (existing) {
      const { error: deleteError } = await supabase.from("ski_trip_favorite_votes").delete().eq("id", existing.id);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setBundle((currentBundle) =>
        currentBundle ? { ...currentBundle, votes: currentBundle.votes.filter((entry) => entry.id !== existing.id) } : currentBundle
      );
      setToast("Vote entfernt.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_favorite_votes")
      .insert({
        trip_id: bundle.trip.id,
        favorite_id: favoriteId,
        member_id: currentMember.id,
        vote_kind: kind,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Vote konnte nicht gespeichert werden.");
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            votes: [
              ...currentBundle.votes,
              {
                id: String(data.id),
                tripId: String(data.trip_id),
                favoriteId: String(data.favorite_id),
                memberId: String(data.member_id),
                voteKind: data.vote_kind === "favorite" ? "favorite" : "like",
                createdAt: typeof data.created_at === "string" ? data.created_at : null,
              },
            ],
          }
        : currentBundle
    );
    setToast("Vote gespeichert.");
  }

  async function handleComment(favoriteId: string, body: string) {
    if (!bundle || !currentMember) return;

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          comments: [
            ...bundle.comments,
            {
              id: crypto.randomUUID(),
              tripId: bundle.trip.id,
              favoriteId,
              memberId: currentMember.id,
              body,
              createdAt: new Date().toISOString(),
            },
          ],
        },
        "Kommentar gespeichert."
      );
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_comments")
      .insert({
        trip_id: bundle.trip.id,
        favorite_id: favoriteId,
        member_id: currentMember.id,
        body,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Kommentar konnte nicht gespeichert werden.");
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            comments: [
              ...currentBundle.comments,
              {
                id: String(data.id),
                tripId: String(data.trip_id),
                favoriteId: String(data.favorite_id),
                memberId: String(data.member_id),
                body: String(data.body),
                createdAt: typeof data.created_at === "string" ? data.created_at : null,
              },
            ],
          }
        : currentBundle
    );
    setToast("Kommentar gespeichert.");
  }

  async function handlePin(favoriteId: string, nextPinned: boolean) {
    if (!bundle || !currentMember) return;

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          favorites: bundle.favorites.map((favorite) => ({
            ...favorite,
            isPinned: favorite.id === favoriteId ? nextPinned : nextPinned ? false : favorite.isPinned && favorite.id !== favoriteId ? favorite.isPinned : false,
          })),
        },
        nextPinned ? "Favorit angeheftet." : "Anheftung gelöst."
      );
      return;
    }

    if (nextPinned) {
      const { error: resetError } = await supabase.from("ski_trip_favorites").update({ is_pinned: false }).eq("trip_id", bundle.trip.id);
      if (resetError) {
        setError(resetError.message);
        return;
      }
    }
    const { error: updateError } = await supabase.from("ski_trip_favorites").update({ is_pinned: nextPinned }).eq("id", favoriteId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            favorites: currentBundle.favorites.map((favorite) => ({
              ...favorite,
              isPinned: favorite.id === favoriteId ? nextPinned : nextPinned ? false : favorite.isPinned,
            })),
          }
        : currentBundle
    );
    setToast(nextPinned ? "Favorit angeheftet." : "Anheftung gelöst.");
  }

  async function handleSaveSnapshot() {
    if (!bundle || !currentMember || !snapshotForm.favoriteId || !snapshotForm.dateOptionId) return;
    setBusy(true);
    const existing = bundle.priceSnapshots.find(
      (entry) => entry.favoriteId === snapshotForm.favoriteId && entry.dateOptionId === snapshotForm.dateOptionId
    );

    const nextSnapshot: SkiTripPriceSnapshotRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      tripId: bundle.trip.id,
      favoriteId: snapshotForm.favoriteId,
      dateOptionId: snapshotForm.dateOptionId,
      currency: "EUR",
      skipass: toNumber(snapshotForm.skipass),
      accommodation: toNumber(snapshotForm.accommodation),
      travel: toNumber(snapshotForm.travel),
      rental: toNumber(snapshotForm.rental),
      skiSchool: toNumber(snapshotForm.skiSchool),
      food: toNumber(snapshotForm.food),
      buffer: toNumber(snapshotForm.buffer),
      totalOverride: null,
      note: snapshotForm.note.trim() || null,
      sourceKind: bundle.isDemo ? "seed" : "manual",
      updatedByMemberId: currentMember.id,
      updatedAt: new Date().toISOString(),
    };

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          priceSnapshots: existing
            ? bundle.priceSnapshots.map((entry) => (entry.id === existing.id ? nextSnapshot : entry))
            : [...bundle.priceSnapshots, nextSnapshot],
        },
        "Preis-Snapshot gespeichert."
      );
      setBusy(false);
      return;
    }

    const { data, error: upsertError } = await supabase
      .from("ski_trip_price_snapshots")
      .upsert(
        {
          id: nextSnapshot.id,
          trip_id: bundle.trip.id,
          favorite_id: snapshotForm.favoriteId,
          date_option_id: snapshotForm.dateOptionId,
          currency: "EUR",
          skipass: nextSnapshot.skipass,
          accommodation: nextSnapshot.accommodation,
          travel: nextSnapshot.travel,
          rental: nextSnapshot.rental,
          ski_school: nextSnapshot.skiSchool,
          food: nextSnapshot.food,
          buffer: nextSnapshot.buffer,
          total_override: null,
          note: nextSnapshot.note,
          source_kind: "manual",
          updated_by_member_id: currentMember.id,
          updated_at: nextSnapshot.updatedAt,
        },
        { onConflict: "favorite_id,date_option_id" }
      )
      .select("*")
      .single();

    setBusy(false);
    if (upsertError || !data) {
      setError(upsertError?.message ?? "Preis-Snapshot konnte nicht gespeichert werden.");
      return;
    }

    const normalized: SkiTripPriceSnapshotRecord = {
      id: String(data.id),
      tripId: String(data.trip_id),
      favoriteId: String(data.favorite_id),
      dateOptionId: String(data.date_option_id),
      currency: typeof data.currency === "string" ? data.currency : "EUR",
      skipass: typeof data.skipass === "number" ? data.skipass : 0,
      accommodation: typeof data.accommodation === "number" ? data.accommodation : 0,
      travel: typeof data.travel === "number" ? data.travel : 0,
      rental: typeof data.rental === "number" ? data.rental : 0,
      skiSchool: typeof data.ski_school === "number" ? data.ski_school : 0,
      food: typeof data.food === "number" ? data.food : 0,
      buffer: typeof data.buffer === "number" ? data.buffer : 0,
      totalOverride: typeof data.total_override === "number" ? data.total_override : null,
      note: typeof data.note === "string" ? data.note : null,
      sourceKind: data.source_kind === "seed" || data.source_kind === "estimate" ? data.source_kind : "manual",
      updatedByMemberId: typeof data.updated_by_member_id === "string" ? data.updated_by_member_id : null,
      updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
    };

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            priceSnapshots: existing
              ? currentBundle.priceSnapshots.map((entry) => (entry.id === existing.id ? normalized : entry))
              : [...currentBundle.priceSnapshots, normalized],
          }
        : currentBundle
    );
    setToast("Preis-Snapshot gespeichert.");
  }

  async function handleAddBudgetItem() {
    if (!bundle || !currentMember) return;
    if (!budgetForm.description.trim()) {
      setError("Bitte eine Beschreibung für den Budgetposten eintragen.");
      return;
    }
    const amount = toNumber(budgetForm.amount);
    if (amount <= 0) {
      setError("Bitte einen Betrag größer 0 eintragen.");
      return;
    }
    setError("");
    const nextItem = {
      id: crypto.randomUUID(),
      tripId: bundle.trip.id,
      category: budgetForm.category,
      description: budgetForm.description.trim(),
      amount,
      dueDate: budgetForm.dueDate || null,
      isPaid: false,
      paidByMemberId: null,
      note: budgetForm.note.trim() || null,
      createdByMemberId: currentMember.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (bundle.isDemo) {
      await mutateDemo({ ...bundle, budgetItems: [...bundle.budgetItems, nextItem] }, "Budgetposten hinzugefügt.");
      setBudgetForm({ category: "skipass", description: "", amount: "", dueDate: "", note: "" });
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ski_trip_budget_items")
      .insert({
        trip_id: bundle.trip.id,
        category: nextItem.category,
        description: nextItem.description,
        amount: nextItem.amount,
        due_date: nextItem.dueDate,
        note: nextItem.note,
        created_by_member_id: currentMember.id,
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Budgetposten konnte nicht gespeichert werden.");
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            budgetItems: [
              ...currentBundle.budgetItems,
              {
                id: String(data.id),
                tripId: String(data.trip_id),
                category: data.category as SkiTripBudgetCategory,
                description: String(data.description),
                amount: typeof data.amount === "number" ? data.amount : 0,
                dueDate: typeof data.due_date === "string" ? data.due_date : null,
                isPaid: Boolean(data.is_paid),
                paidByMemberId: typeof data.paid_by_member_id === "string" ? data.paid_by_member_id : null,
                note: typeof data.note === "string" ? data.note : null,
                createdByMemberId: typeof data.created_by_member_id === "string" ? data.created_by_member_id : null,
                createdAt: typeof data.created_at === "string" ? data.created_at : null,
                updatedAt: typeof data.updated_at === "string" ? data.updated_at : null,
              },
            ],
          }
        : currentBundle
    );
    setBudgetForm({ category: "skipass", description: "", amount: "", dueDate: "", note: "" });
    setToast("Budgetposten hinzugefügt.");
  }

  async function handleToggleBudgetItemPaid(itemId: string, nextPaid: boolean) {
    if (!bundle || !currentMember) return;
    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          budgetItems: bundle.budgetItems.map((item) =>
            item.id === itemId
              ? { ...item, isPaid: nextPaid, paidByMemberId: nextPaid ? currentMember.id : null, updatedAt: new Date().toISOString() }
              : item
          ),
        },
        nextPaid ? "Budgetposten als bezahlt markiert." : "Budgetposten wieder offen."
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("ski_trip_budget_items")
      .update({
        is_paid: nextPaid,
        paid_by_member_id: nextPaid ? currentMember.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            budgetItems: currentBundle.budgetItems.map((item) =>
              item.id === itemId ? { ...item, isPaid: nextPaid, paidByMemberId: nextPaid ? currentMember.id : null } : item
            ),
          }
        : currentBundle
    );
    setToast(nextPaid ? "Budgetposten als bezahlt markiert." : "Budgetposten wieder offen.");
  }

  async function handleAddExpense() {
    if (!bundle || !currentMember) return;
    if (!expenseForm.description.trim()) {
      setError("Bitte eine Beschreibung für die Ausgabe eintragen.");
      return;
    }
    const amount = toNumber(expenseForm.amount);
    if (amount <= 0) {
      setError("Bitte einen Betrag größer 0 eintragen.");
      return;
    }
    if (!expenseForm.payerMemberId) {
      setError("Bitte auswählen, wer bezahlt hat.");
      return;
    }
    const selectedMemberIds = expenseForm.selectedMemberIds.length ? expenseForm.selectedMemberIds : joinedMembers.map((member) => member.id);
    if (!selectedMemberIds.length) {
      setError("Bitte mindestens eine Person auswählen, für die die Ausgabe gilt.");
      return;
    }
    const splitRows =
      expenseForm.splitMode === "custom"
        ? selectedMemberIds.map((memberId) => ({
            memberId,
            amount: toNumber(expenseForm.customAmounts[memberId] ?? "0"),
          }))
        : selectedMemberIds.map((memberId) => ({
            memberId,
            amount: selectedMemberIds.length ? amount / selectedMemberIds.length : 0,
          }));
    const splitTotal = splitRows.reduce((sum, split) => sum + split.amount, 0);
    if (expenseForm.splitMode === "custom" && Math.abs(splitTotal - amount) > 0.01) {
      setError("Individuelle Splits müssen zusammen exakt den Betrag ergeben.");
      return;
    }
    setError("");

    const expenseId = crypto.randomUUID();

    if (bundle.isDemo) {
      await mutateDemo(
        {
          ...bundle,
          expenses: [
            ...bundle.expenses,
            {
              id: expenseId,
              tripId: bundle.trip.id,
              category: expenseForm.category,
              description: expenseForm.description.trim(),
              amount,
              paidByMemberId: expenseForm.payerMemberId || null,
              incurredOn: expenseForm.incurredOn || null,
              dueDate: expenseForm.dueDate || null,
              note: expenseForm.note.trim() || null,
              isSettled: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          expenseSplits: [
            ...bundle.expenseSplits,
            ...splitRows.map((split) => ({
              id: crypto.randomUUID(),
              tripId: bundle.trip.id,
              expenseId,
              memberId: split.memberId,
              amount: split.amount,
              createdAt: new Date().toISOString(),
            })),
          ],
        },
        "Ausgabe hinzugefügt."
      );
      setExpenseForm(expenseDefaultState(currentMember.id, joinedMembers.map((member) => member.id)));
      return;
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from("ski_trip_expenses")
      .insert({
        trip_id: bundle.trip.id,
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        amount,
        paid_by_member_id: expenseForm.payerMemberId || null,
        incurred_on: expenseForm.incurredOn || null,
        due_date: expenseForm.dueDate || null,
        note: expenseForm.note.trim() || null,
      })
      .select("*")
      .single();

    if (expenseError || !expenseData) {
      setError(expenseError?.message ?? "Ausgabe konnte nicht gespeichert werden.");
      return;
    }

    const { data: splitData, error: splitError } = await supabase
      .from("ski_trip_expense_splits")
      .insert(
        splitRows.map((split) => ({
          trip_id: bundle.trip.id,
          expense_id: expenseData.id,
          member_id: split.memberId,
          amount: split.amount,
        }))
      )
      .select("*");

    if (splitError) {
      setError(splitError.message);
      return;
    }

    setBundle((currentBundle) =>
      currentBundle
        ? {
            ...currentBundle,
            expenses: [
              ...currentBundle.expenses,
              {
                id: String(expenseData.id),
                tripId: String(expenseData.trip_id),
                category: expenseData.category as SkiTripBudgetCategory,
                description: String(expenseData.description),
                amount: typeof expenseData.amount === "number" ? expenseData.amount : 0,
                paidByMemberId: typeof expenseData.paid_by_member_id === "string" ? expenseData.paid_by_member_id : null,
                incurredOn: typeof expenseData.incurred_on === "string" ? expenseData.incurred_on : null,
                dueDate: typeof expenseData.due_date === "string" ? expenseData.due_date : null,
                note: typeof expenseData.note === "string" ? expenseData.note : null,
                isSettled: Boolean(expenseData.is_settled),
                createdAt: typeof expenseData.created_at === "string" ? expenseData.created_at : null,
                updatedAt: typeof expenseData.updated_at === "string" ? expenseData.updated_at : null,
              },
            ],
            expenseSplits: [
              ...currentBundle.expenseSplits,
              ...(splitData ?? []).map((split) => ({
                id: String(split.id),
                tripId: String(split.trip_id),
                expenseId: String(split.expense_id),
                memberId: String(split.member_id),
                amount: typeof split.amount === "number" ? split.amount : 0,
                createdAt: typeof split.created_at === "string" ? split.created_at : null,
              })),
            ],
          }
        : currentBundle
    );
    setExpenseForm(expenseDefaultState(currentMember.id, joinedMembers.map((member) => member.id)));
    setToast("Ausgabe hinzugefügt.");
  }

  const selectedStatusByOptionId = useMemo(() => {
    if (!bundle || !currentMember) return {};
    return Object.fromEntries(
      bundle.dateOptions.map((dateOption) => {
        const statusEntry = bundle.availability.find((entry) => entry.dateOptionId === dateOption.id && entry.memberId === currentMember.id);
        return [dateOption.id, statusEntry ? statusEntry.status : undefined];
      })
    ) as Record<string, SkiTripAvailabilityStatus | undefined>;
  }, [bundle, currentMember]);

  const filteredResortCandidates = useMemo(() => {
    const activeSlugs = new Set((bundle?.favorites ?? []).map((favorite) => favorite.resortSlug));
    const needle = resortSearch.trim().toLowerCase();
    return resortCandidates.filter((candidate) => {
      if (!candidate.slug || activeSlugs.has(candidate.slug)) return false;
      if (!needle) return true;
      return `${candidate.name} ${candidate.country} ${candidate.region ?? ""}`.toLowerCase().includes(needle);
    });
  }, [bundle, resortCandidates, resortSearch]);

  if (loading) {
    return (
      <AppShell>
        <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
          <div className="mx-auto max-w-[1480px]">
            <div className="h-[420px] animate-pulse rounded-[1.7rem] border border-white/10 bg-white/[0.05]" />
          </div>
        </main>
      </AppShell>
    );
  }

  if (!bundle) {
    return (
      <AppShell>
        <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
          <div className="mx-auto max-w-[1480px]">
            <TripsStateCard
              title="Trip nicht verfügbar"
              text={error || "Dieser Trip konnte nicht geladen werden."}
              tone="error"
              action={
                <div className="flex flex-wrap gap-3">
                  <Link href="/trips" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 px-4 text-sm font-extrabold text-white hover:bg-white/10">
                    Zurück zu Trips
                  </Link>
                  <Link href="/trips/new" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-sky-500 px-4 text-sm font-extrabold text-white hover:bg-sky-400">
                    Neuen Trip planen
                  </Link>
                </div>
              }
            />
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen px-4 py-7 md:px-8 md:py-10">
        <div className="mx-auto grid w-full max-w-[1480px] gap-6">
          <PageHeader
            eyebrow={bundle.isDemo ? "Gast-Tripboard" : "Trip Workspace"}
            title={bundle.trip.title}
            subtitle={bundle.trip.description ?? "Ski-Trip mit Gruppenlogik, Alpivo-Resorts und transparenter Kostenplanung."}
            actions={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trips"
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.065] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                >
                  Zurück zu Trips
                </Link>
                <Link
                  href={`/checklist?tripId=${encodeURIComponent(bundle.trip.id)}`}
                  className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                >
                  Checkliste öffnen
                </Link>
              </div>
            }
          />

        <section
          className="overflow-hidden rounded-[1.8rem] border border-white/12 bg-slate-950/72 shadow-[0_30px_90px_rgba(2,6,23,0.34)]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(2,8,23,0.94), rgba(2,8,23,0.68), rgba(2,8,23,0.42)), url("${heroResort ? heroResort.imageUrl || "/bg/skilandschaft.png" : "/bg/skilandschaft.png"}")`,
            backgroundPosition: "center 48%",
            backgroundSize: "cover",
          }}
        >
          <div className="grid gap-5 p-5 md:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span className="rounded-full border border-sky-200/24 bg-sky-300/12 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-sky-100">
                Ein Board statt Chat-Chaos
              </span>
              <h2 className="mt-5 text-3xl font-black leading-tight text-white md:text-5xl">{bundle.trip.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                {bundle.trip.description ?? "Alles Wichtige an einem Ort: Zeitraum, Resorts, Kosten, Gruppe und nächste To-dos."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricChip icon="vibe" value={`${joinedMembers.length}`} label="Mitglieder" variant="glass" />
              <MetricChip icon="time" value={`${bundle.dateOptions.length}`} label="Zeitfenster" variant="glass" />
              <MetricChip icon="piste" value={`${bundle.favorites.length}`} label="Resort-Favoriten" variant="glass" />
              <MetricChip
                icon="cost"
                value={budgetSummary ? formatCurrency(budgetSummary.total) : "-"}
                label={budgetSummary ? `${formatCurrency(budgetSummary.perPerson)} pro Person` : "Budget offen"}
                variant="glass"
              />
            </div>
          </div>
        </section>

        {bundle.isDemo ? (
          <TripsStateCard
            title="Gast-Tripboard"
            text="Diese Ansicht läuft lokal im Browser und zeigt den Gruppen-Workflow, solange die dauerhafte Supabase-Speicherung remote noch nicht aktiv ist."
            tone="default"
          />
        ) : null}
        {error ? <TripsStateCard title="Hinweis" text={error} tone="error" /> : null}

        <TripNavigation tripId={bundle.trip.id} activeView={view} />

        <div className="grid gap-4 md:grid-cols-4">
          <StatTile label="Mitglieder" value={String(joinedMembers.length)} hint="aktive Gruppe" />
          <StatTile label="Zeitfenster" value={String(bundle.dateOptions.length)} hint="mögliche Trips" />
          <StatTile label="Favoriten" value={String(bundle.favorites.length)} hint="Resorts im Rennen" />
          <StatTile
            label="Plan-Budget"
            value={budgetSummary ? formatCurrency(budgetSummary.total) : "-"}
            hint={budgetSummary ? `${formatCurrency(budgetSummary.perPerson)} pro Person` : "noch offen"}
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip Header</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricChip icon="time" value={primaryDateOption ? formatDateRange(primaryDateOption.startDate, primaryDateOption.endDate) : "Zeitraum offen"} label={primaryDateOption?.label ?? "Reisedaten"} variant="glass" />
              <MetricChip icon="data" value={bundle.isDemo ? "Gastmodus" : "Live"} label="Status: Planung" variant="glass" />
              <MetricChip icon="cost" value={bundle.trip.budgetPerPerson ? formatCurrency(bundle.trip.budgetPerPerson) : "Budget offen"} label="Budget p. P." variant="glass" />
              <MetricChip icon="route" value={bundle.trip.startRegion ?? guestState.preferences.originLabel} label="Abfahrt" variant="glass" />
            </div>
          </GlassCard>
          <TripReadinessPanel percent={readinessPercent} completed={completedPlanActions} total={planActions.length} nextAction={nextPlanAction} />
        </section>

        {primaryAlpivoResort ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
            <ResortActionHub
              resortSlug={primaryAlpivoResort.slug}
              variant="trip"
              limit={5}
              title={`Direkt weiterplanen: ${primaryAlpivoResort.name}`}
              subtitle="Öffne offizielle Ticket-, Live-, Unterkunfts- und Anreisequellen für das führende Resort im Tripboard."
              onActionClick={(link) => {
                if (link.kind === "skipass_shop" || link.kind === "ticket_info") markActionCompleted("skipassChecked", primaryAlpivoResort.slug);
                if (link.kind === "live_status" || link.kind === "webcam") markActionCompleted("liveStatusChecked", primaryAlpivoResort.slug);
                if (link.kind === "accommodation") markActionCompleted("accommodationChecked", primaryAlpivoResort.slug);
                if (link.kind === "travel") markActionCompleted("routeChecked", primaryAlpivoResort.slug);
              }}
            />
            <SkipassAssistant
              resort={primaryAlpivoResort}
              preferences={skipassPreferences}
              groupSize={joinedMembers.length || guestState.preferences.peopleCount}
              variant="trip"
              completed={guestState.completedActions.skipassChecked}
              onComplete={() => markActionCompleted("skipassChecked", primaryAlpivoResort.slug)}
            />
          </section>
        ) : null}

        {view === "overview" ? (
          <div className="grid gap-5">
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <GlassCard className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Beste Zeiträume</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Gemeinsame Verfügbarkeit</h2>
                </div>
                <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href={`/trips/${encodeURIComponent(bundle.trip.id)}/availability`}>
                  Kalender
                </Link>
              </div>
              <div className="mt-5">
                <BestDatesPanel bundle={bundle} />
              </div>
              </GlassCard>

              <div className="grid gap-5">
                <GlassCard className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Team</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Teilnehmer</h2>
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-sky-200/25 bg-sky-200/10 px-3 py-2 text-xs font-semibold text-sky-50 hover:bg-sky-200/15"
                        type="button"
                        onClick={handleAddDemoParticipants}
                      >
                        Beispiel-Teilnehmer hinzufügen
                      </button>
                      <InviteDialog onCreateInvite={handleCreateInvite} />
                    </div>
                  ) : null}
                </div>
                <div className="mt-5">
                  <ParticipantList members={bundle.members} highlightMemberId={currentMember?.id ?? null} />
                </div>
                </GlassCard>

                <GlassCard className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Vorne im Rennen</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Top-Resorts</h2>
                  </div>
                  <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href={`/trips/${encodeURIComponent(bundle.trip.id)}/favorites`}>
                    Favoriten
                  </Link>
                </div>
                <div className="mt-5 grid gap-3">
                  {bundle.favorites.slice(0, 3).map((favorite) => {
                    const resort = bundle.resorts[favorite.resortSlug] ?? null;
                    return (
                      <div key={favorite.id} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{resort?.name ?? favorite.resortSlug}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {resort?.country ?? "Resort"}
                              {resort?.pisteKm ? ` · ${Math.round(resort.pisteKm)} km` : ""}
                            </div>
                          </div>
                          {favorite.isPinned ? (
                            <span className="rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-1 text-xs text-sky-50">Lead</span>
                          ) : null}
                        </div>
                        {favorite.note ? <div className="mt-2 text-sm text-slate-300">{favorite.note}</div> : null}
                      </div>
                    );
                  })}
                </div>
                </GlassCard>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <GlassCard className="p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Nächste konkrete Aktion</p>
                <h2 className="mt-2 text-2xl font-black text-white">{nextPlanAction}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Diese Schritte verbinden Tripboard, Resortdaten und offizielle Quellen. Erledigte Punkte bleiben im Gastmodus lokal gespeichert.
                </p>
                <div className="mt-5">
                  <TripActionChecklist
                    actions={planActions}
                    completedActions={guestState.completedActions}
                    onToggle={(key, completed) => setActionCompleted(key, completed, primaryAlpivoResort?.slug ?? primaryFavoriteSlug)}
                  />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Aktivität</p>
                    <h2 className="mt-2 text-2xl font-black text-white">Was zuletzt passiert ist</h2>
                  </div>
                  <Link href={`/trips/${encodeURIComponent(bundle.trip.id)}/compare`} className="rounded-2xl border border-white/12 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10">
                    Favoriten vergleichen
                  </Link>
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    { label: "Top Match im Tripboard gesetzt", detail: primaryAlpivoResort ? primaryAlpivoResort.name : primaryFavoriteSlug },
                    { label: "Budgetrahmen vorbereitet", detail: budgetSummary ? `${formatCurrency(budgetSummary.perPerson)} p. P. Orientierung` : "Budget noch offen" },
                    { label: "Checkliste gekoppelt", detail: `${readinessPercent}% Readiness aus lokalen Aktionen` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <div className="text-sm font-extrabold text-white">{item.label}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        ) : null}

        {view === "availability" ? (
          <div className="grid gap-5">
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Availability Planner</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Beste gemeinsame Zeiträume finden</h2>
                </div>
                <div className="text-sm text-slate-300">
                  {currentMember ? `Du planst als ${getTripMemberName(currentMember)}.` : "Nur lesender Zugriff."}
                </div>
              </div>
              <div className="mt-5">
                <AvailabilityCalendar
                  dateOptions={bundle.dateOptions}
                  selectedByOptionId={selectedStatusByOptionId}
                  onSaveStatus={handleSaveAvailability}
                  onCreateDateOption={handleCreateDateOption}
                  canCreateDateOption={Boolean(currentMember)}
                />
              </div>
            </GlassCard>
            <GlassCard className="p-6">
              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Best Dates</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Überschneidungen</h2>
                  <div className="mt-5">
                    <BestDatesPanel bundle={bundle} />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Participants</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Wer kann wann</h2>
                  <div className="mt-5">
                    <ParticipantList members={bundle.members} highlightMemberId={currentMember?.id ?? null} />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        ) : null}

        {view === "favorites" ? (
          <div className="grid gap-5">
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Resort Discovery</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Resorts aus Alpivo ins Rennen holen</h2>
                </div>
                <div className="text-sm text-slate-300">Bestehende Alpivo-Resorts werden direkt verlinkt und später in Preisfenster übersetzt.</div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                  placeholder="Nach Resort, Land oder Region suchen"
                  value={resortSearch}
                  onChange={(event) => setResortSearch(event.target.value)}
                />
                <div className="text-sm text-slate-300">
                  {filteredResortCandidates.length} Resorts zum Hinzufügen
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {filteredResortCandidates.slice(0, 18).map((candidate) => (
                  <button
                    key={candidate.slug}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.1]"
                    onClick={() => handleAddFavorite(candidate)}
                  >
                    {candidate.name}
                  </button>
                ))}
              </div>
            </GlassCard>

            <div className="grid gap-5 xl:grid-cols-2">
              {bundle.favorites.map((favorite) => (
                <ResortFavoriteCard
                  key={favorite.id}
                  bundle={bundle}
                  favorite={favorite}
                  currentMember={currentMember}
                  onVote={handleVote}
                  onComment={handleComment}
                  onPin={handlePin}
                />
              ))}
            </div>
          </div>
        ) : null}

        {view === "compare" ? (
          <div className="grid gap-5">
            <CompareDecisionCards
              rows={comparisonRows}
              onTripDraft={(slug) => {
                addTripDraftResort(slug);
                setToast("Resort im lokalen Trip-Entwurf vorgemerkt.");
              }}
              onSkipass={(slug) => markActionCompleted("skipassChecked", slug)}
            />

            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Vergleich</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Welches Skigebiet in welchem Zeitraum gewinnt</h2>
                </div>
                <div className="text-sm text-slate-300">
                  Preis, Verfügbarkeit und Alpivo-Resortwert werden gemeinsam gelesen.
                </div>
              </div>
              <div className="mt-5">
                <ComparisonTable rows={comparisonRows} />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Snapshot Editor</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Preisfenster manuell verfeinern</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <SelectControl
                  value={snapshotForm.favoriteId}
                  ariaLabel="Favorit für Snapshot"
                  options={bundle.favorites.map((favorite) => ({
                    value: favorite.id,
                    label: bundle.resorts[favorite.resortSlug]?.name ?? favorite.resortSlug,
                  }))}
                  onChange={(value) => setSnapshotForm((current) => ({ ...current, favoriteId: value }))}
                />
                <SelectControl
                  value={snapshotForm.dateOptionId}
                  ariaLabel="Zeitraum für Snapshot"
                  options={bundle.dateOptions.map((dateOption) => ({
                    value: dateOption.id,
                    label: `${dateOption.label} · ${formatDateRange(dateOption.startDate, dateOption.endDate)}`,
                  }))}
                  onChange={(value) => setSnapshotForm((current) => ({ ...current, dateOptionId: value }))}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                {[
                  ["skipass", "Skipass"],
                  ["accommodation", "Unterkunft"],
                  ["travel", "Anreise"],
                  ["rental", "Verleih"],
                  ["skiSchool", "Skischule"],
                  ["food", "Food"],
                  ["buffer", "Puffer"],
                ].map(([key, label]) => (
                  <label key={key} className="grid gap-2 text-sm text-slate-300">
                    {label}
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white"
                      type="number"
                      min={0}
                      value={snapshotForm[key as keyof SnapshotFormState] as string}
                      onChange={(event) => setSnapshotForm((current) => ({ ...current, [key]: event.target.value }))}
                    />
                  </label>
                ))}
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-4">
                  Notiz
                  <textarea
                    className="min-h-[88px] rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white"
                    value={snapshotForm.note}
                    onChange={(event) => setSnapshotForm((current) => ({ ...current, note: event.target.value }))}
                  />
                </label>
              </div>
              <button
                className="button-lift mt-5 rounded-lg bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
                disabled={busy}
                onClick={handleSaveSnapshot}
              >
                {busy ? "Speichert..." : "Snapshot speichern"}
              </button>
            </GlassCard>
          </div>
        ) : null}

        {view === "budget" ? (
          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <GlassCard className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Budget Plan</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Geplante Kosten pro Ski-Trip</h2>
              <div className="mt-5">
                <BudgetSummary summary={budgetSummary!} items={bundle.budgetItems} />
              </div>

              <div className="mt-5 grid gap-3">
                {bundle.budgetItems.map((item) => (
                  <button
                    key={`toggle-${item.id}`}
                    className="justify-self-start rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
                    onClick={() => handleToggleBudgetItemPaid(item.id, !item.isPaid)}
                  >
                    {item.isPaid ? "Wieder offen setzen" : "Als bezahlt markieren"} · {item.description}
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Neuer Posten</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Budget ergänzen</h2>
              <div className="mt-5 grid gap-3">
                <SelectControl
                  value={budgetForm.category}
                  ariaLabel="Budget-Kategorie"
                  options={budgetCategoryOptions}
                  onChange={(value) => setBudgetForm((current) => ({ ...current, category: value as SkiTripBudgetCategory }))}
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                  placeholder="Beschreibung"
                  value={budgetForm.description}
                  onChange={(event) => setBudgetForm((current) => ({ ...current, description: event.target.value }))}
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                  type="number"
                  min={0}
                  placeholder="Betrag"
                  value={budgetForm.amount}
                  onChange={(event) => setBudgetForm((current) => ({ ...current, amount: event.target.value }))}
                />
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Fälligkeitsdatum</span>
                  <input
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    type="date"
                    value={budgetForm.dueDate}
                    onChange={(event) => setBudgetForm((current) => ({ ...current, dueDate: event.target.value }))}
                  />
                  <span className="text-xs text-slate-500">Optional: Wann soll diese Zahlung spätestens erledigt sein</span>
                </label>
                <textarea
                  className="min-h-[88px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                  placeholder="Notiz"
                  value={budgetForm.note}
                  onChange={(event) => setBudgetForm((current) => ({ ...current, note: event.target.value }))}
                />
                <button
                  className="button-lift rounded-lg bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
                  onClick={handleAddBudgetItem}
                >
                  Budgetposten speichern
                </button>
              </div>
            </GlassCard>
          </div>
        ) : null}

        {view === "expenses" ? (
          <div className="grid gap-5">
            {primaryAlpivoResort ? (
              <SkipassAssistant
                resort={primaryAlpivoResort}
                preferences={skipassPreferences}
                groupSize={joinedMembers.length || guestState.preferences.peopleCount}
                variant="trip"
                completed={guestState.completedActions.skipassChecked}
                onComplete={() => markActionCompleted("skipassChecked", primaryAlpivoResort.slug)}
              />
            ) : null}

            <ExpensePlanningPanel
              items={expensePlanningItems}
              completedActions={guestState.completedActions}
              onToggle={(key, completed) => setActionCompleted(key, completed, primaryAlpivoResort?.slug ?? primaryFavoriteSlug)}
            />

            <GlassCard className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Splitwise Layer</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Zusatzkosten und Ausgleich</h2>
              {expenseSummary ? (
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <StatTile label="Gesamt" value={formatCurrency(expenseSummary.total)} hint="alle erfassten Gruppenausgaben" />
                  <StatTile label="Pro Person" value={formatCurrency(expenseSummary.perPerson)} hint="bei gleichmäßiger Gesamtbetrachtung" />
                  <StatTile label="Vorgestreckt" value={formatCurrency(expenseSummary.paidByGroup)} hint="bisher bezahlt" />
                  <StatTile label="Auszugleichen" value={formatCurrency(expenseSummary.openBalances)} hint="offene positive Salden" />
                </div>
              ) : null}
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {balances.map((balance) => (
                  <div key={balance.memberId} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="text-sm font-semibold text-white">{balance.name}</div>
                    <div className="mt-2 text-xs text-slate-400">
                      gezahlt {formatCurrency(balance.paid)} · schuldet {formatCurrency(balance.owes)}
                    </div>
                    <div className={`mt-2 text-xl font-semibold ${balance.balance >= 0 ? "text-emerald-100" : "text-amber-100"}`}>
                      {balance.balance >= 0 ? "+" : ""}
                      {formatCurrency(balance.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <GlassCard className="p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Expenses</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Aktuelle Gruppenausgaben</h2>
                <div className="mt-5">
                  <ExpenseList bundle={bundle} />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Neue Ausgabe</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Kosten verteilen</h2>
                <div className="mt-5 grid gap-3">
                  <SelectControl
                    value={expenseForm.category}
                    ariaLabel="Expense-Kategorie"
                    options={budgetCategoryOptions}
                    onChange={(value) => setExpenseForm((current) => ({ ...current, category: value as SkiTripBudgetCategory }))}
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                    placeholder="Beschreibung"
                    value={expenseForm.description}
                    onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    type="number"
                    min={0}
                    placeholder="Betrag"
                    value={expenseForm.amount}
                    onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                  />
                  <label className="grid gap-2 text-sm text-slate-300">
                    <span>Bezahlt am</span>
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      type="date"
                      value={expenseForm.incurredOn}
                      onChange={(event) => setExpenseForm((current) => ({ ...current, incurredOn: event.target.value }))}
                    />
                    <span className="text-xs text-slate-500">Optional: Wann wurde gezahlt? Ohne Datum bleibt die Ausgabe trotzdem gültig.</span>
                  </label>
                  <label className="grid gap-2 text-sm text-slate-300">
                    <span>Fälligkeitsdatum optional</span>
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      type="date"
                      value={expenseForm.dueDate}
                      onChange={(event) => setExpenseForm((current) => ({ ...current, dueDate: event.target.value }))}
                    />
                    <span className="text-xs text-slate-500">Optional: Wann soll diese Zahlung spätestens erledigt sein</span>
                  </label>
                  <SelectControl
                    value={expenseForm.payerMemberId}
                    ariaLabel="Bezahlt von"
                    options={joinedMembers.map((member) => ({ value: member.id, label: getTripMemberName(member) }))}
                    onChange={(value) => setExpenseForm((current) => ({ ...current, payerMemberId: value }))}
                  />
                  <SelectControl
                    value={expenseForm.splitMode}
                    ariaLabel="Split-Modus"
                    options={[
                      { value: "even", label: "Gleichmäßig" },
                      { value: "custom", label: "Individuell" },
                    ]}
                    onChange={(value) => setExpenseForm((current) => ({ ...current, splitMode: value as "even" | "custom" }))}
                  />

                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="text-sm font-medium text-white">Aufteilen auf</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {joinedMembers.map((member) => {
                        const active = expenseForm.selectedMemberIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            className={`rounded-full border px-3 py-2 text-xs transition ${
                              active
                                ? "border-sky-200/25 bg-sky-200/10 text-sky-50"
                                : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]"
                            }`}
                            onClick={() =>
                              setExpenseForm((current) => ({
                                ...current,
                                selectedMemberIds: current.selectedMemberIds.includes(member.id)
                                  ? current.selectedMemberIds.filter((entry) => entry !== member.id)
                                  : [...current.selectedMemberIds, member.id],
                              }))
                            }
                          >
                            {getTripMemberName(member)}
                          </button>
                        );
                      })}
                    </div>
                    {expenseForm.splitMode === "custom" ? (
                      <div className="mt-4 grid gap-3">
                        {expenseForm.selectedMemberIds.map((memberId) => {
                          const member = joinedMembers.find((entry) => entry.id === memberId) ?? null;
                          return (
                            <label key={memberId} className="grid gap-2 text-sm text-slate-300">
                              {member ? getTripMemberName(member) : "Mitglied"}
                              <input
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white"
                                type="number"
                                min={0}
                                value={expenseForm.customAmounts[memberId] ?? ""}
                                onChange={(event) =>
                                  setExpenseForm((current) => ({
                                    ...current,
                                    customAmounts: { ...current.customAmounts, [memberId]: event.target.value },
                                  }))
                                }
                              />
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <textarea
                    className="min-h-[88px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
                    placeholder="Notiz"
                    value={expenseForm.note}
                    onChange={(event) => setExpenseForm((current) => ({ ...current, note: event.target.value }))}
                  />
                  <button
                    className="button-lift rounded-lg bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
                    onClick={handleAddExpense}
                  >
                    Ausgabe speichern
                  </button>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Settlements</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Wer schuldet wem wie viel</h2>
              <div className="mt-5">
                <SettlementCard bundle={bundle} />
              </div>
            </GlassCard>
          </div>
        ) : null}
        </div>

      <AnimatePresence>{toast ? <Toast message={toast} /> : null}</AnimatePresence>
      </main>
    </AppShell>
  );
}
