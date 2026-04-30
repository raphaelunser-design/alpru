export type SkiTripLevel = "beginner" | "mixed" | "advanced";
export type SkiTripFocus =
  | "budget"
  | "apres"
  | "family"
  | "snow"
  | "piste_km"
  | "distance"
  | "quiet"
  | "weekend"
  | "luxury";
export type SkiTripMemberRole = "admin" | "member";
export type SkiTripMemberStatus = "invited" | "open" | "joined";
export type SkiTripAvailabilityStatus = "available" | "maybe" | "unavailable";
export type SkiTripVoteKind = "like" | "favorite";
export type SkiTripBudgetCategory =
  | "skipass"
  | "accommodation"
  | "travel"
  | "rental"
  | "ski_school"
  | "food"
  | "other";
export type SkiTripSourceKind = "manual" | "seed" | "estimate";
export type SkiTripSettlementStatus = "open" | "paid";
export type TripWorkspaceView = "overview" | "availability" | "favorites" | "compare" | "budget" | "expenses";

export type SkiTripRecord = {
  id: string;
  title: string;
  description: string | null;
  startRegion: string | null;
  participantTarget: number | null;
  budgetPerPerson: number | null;
  skiLevel: SkiTripLevel;
  focus: SkiTripFocus[];
  preferredResortSlugs: string[];
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SkiTripMemberRecord = {
  id: string;
  tripId: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  role: SkiTripMemberRole;
  status: SkiTripMemberStatus;
  isDemo: boolean;
  demoProfile: Record<string, unknown>;
  joinedAt: string | null;
  createdAt: string | null;
};

export type SkiTripInviteRecord = {
  id: string;
  tripId: string;
  email: string | null;
  role: SkiTripMemberRole;
  inviteToken: string;
  note: string | null;
  status: SkiTripMemberStatus;
  expiresAt: string | null;
  createdAt: string | null;
};

export type SkiTripDateOptionRecord = {
  id: string;
  tripId: string;
  label: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string | null;
};

export type SkiTripAvailabilityRecord = {
  id: string;
  tripId: string;
  dateOptionId: string;
  memberId: string;
  userId: string | null;
  status: SkiTripAvailabilityStatus;
  note: string | null;
  updatedAt: string | null;
};

export type SkiTripFavoriteRecord = {
  id: string;
  tripId: string;
  resortId: string | null;
  resortSlug: string;
  note: string | null;
  proposedByMemberId: string | null;
  isPinned: boolean;
  createdAt: string | null;
};

export type SkiTripFavoriteVoteRecord = {
  id: string;
  tripId: string;
  favoriteId: string;
  memberId: string;
  voteKind: SkiTripVoteKind;
  createdAt: string | null;
};

export type SkiTripCommentRecord = {
  id: string;
  tripId: string;
  favoriteId: string;
  memberId: string;
  body: string;
  createdAt: string | null;
};

export type SkiTripPriceSnapshotRecord = {
  id: string;
  tripId: string;
  favoriteId: string;
  dateOptionId: string;
  currency: string;
  skipass: number;
  accommodation: number;
  travel: number;
  rental: number;
  skiSchool: number;
  food: number;
  buffer: number;
  totalOverride: number | null;
  note: string | null;
  sourceKind: SkiTripSourceKind;
  updatedByMemberId: string | null;
  updatedAt: string | null;
};

export type SkiTripBudgetItemRecord = {
  id: string;
  tripId: string;
  category: SkiTripBudgetCategory;
  description: string;
  amount: number;
  dueDate: string | null;
  isPaid: boolean;
  paidByMemberId: string | null;
  note: string | null;
  createdByMemberId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SkiTripExpenseRecord = {
  id: string;
  tripId: string;
  category: SkiTripBudgetCategory;
  description: string;
  amount: number;
  paidByMemberId: string | null;
  incurredOn: string | null;
  dueDate: string | null;
  note: string | null;
  isSettled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SkiTripExpenseSplitRecord = {
  id: string;
  tripId: string;
  expenseId: string;
  memberId: string;
  amount: number;
  createdAt: string | null;
};

export type SkiTripSettlementRecord = {
  id: string;
  tripId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  status: SkiTripSettlementStatus;
  note: string | null;
  settledAt: string | null;
  createdAt: string | null;
};

export type TripResortLite = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string | null;
  imageUrl: string | null;
  pisteKm: number | null;
  elevationMinM: number | null;
  elevationMaxM: number | null;
  verticalM: number | null;
  skipassPriceFrom: number | null;
  officialUrl: string | null;
  lat: number | null;
  lon: number | null;
  matchPct: number | null;
};

export type SkiTripBundle = {
  trip: SkiTripRecord;
  members: SkiTripMemberRecord[];
  invites: SkiTripInviteRecord[];
  dateOptions: SkiTripDateOptionRecord[];
  availability: SkiTripAvailabilityRecord[];
  favorites: SkiTripFavoriteRecord[];
  votes: SkiTripFavoriteVoteRecord[];
  comments: SkiTripCommentRecord[];
  priceSnapshots: SkiTripPriceSnapshotRecord[];
  budgetItems: SkiTripBudgetItemRecord[];
  expenses: SkiTripExpenseRecord[];
  expenseSplits: SkiTripExpenseSplitRecord[];
  settlements: SkiTripSettlementRecord[];
  resorts: Record<string, TripResortLite>;
  isDemo: boolean;
};

export type AvailabilitySummary = {
  dateOption: SkiTripDateOptionRecord;
  availableCount: number;
  maybeCount: number;
  unavailableCount: number;
  participationCount: number;
  score: number;
  fitLabel: string;
};

export type ComparisonRow = {
  favorite: SkiTripFavoriteRecord;
  resort: TripResortLite | null;
  dateOption: SkiTripDateOptionRecord;
  availability: AvailabilitySummary;
  snapshot: SkiTripPriceSnapshotRecord | null;
  total: number;
  totalPerPerson: number;
  combinedScore: number;
  decisionReason: string;
};

export type BudgetSummary = {
  total: number;
  paid: number;
  open: number;
  perPerson: number;
  itemCount: number;
};

export type ExpenseSummary = {
  total: number;
  paidByGroup: number;
  perPerson: number;
  openBalances: number;
};

export type ExpenseBalance = {
  memberId: string;
  name: string;
  paid: number;
  owes: number;
  balance: number;
};

export type SettlementSuggestion = {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
};

export const tripWorkspaceTabs: Array<{ view: TripWorkspaceView; label: string }> = [
  { view: "overview", label: "Übersicht" },
  { view: "availability", label: "Verfügbarkeit" },
  { view: "favorites", label: "Favoriten" },
  { view: "compare", label: "Vergleich" },
  { view: "budget", label: "Budget" },
  { view: "expenses", label: "Ausgaben" },
];

export const tripFocusOptions: Array<{ value: SkiTripFocus; label: string; description: string }> = [
  { value: "budget", label: "Preiswert", description: "Kosten und Value stehen vorne." },
  { value: "apres", label: "Après-Ski", description: "Gruppe sucht Energie, Bars und Hütten." },
  { value: "family", label: "Familienfreundlich", description: "Planbar, entspannt und mit Einsteiger-Fokus." },
  { value: "snow", label: "Schneesicherheit", description: "Höhenlage und Zuverlässigkeit zählen." },
  { value: "piste_km", label: "Pistenkilometer", description: "Größe und Abwechslung sind wichtig." },
  { value: "distance", label: "Entfernung", description: "Kurze Anreise und Wochenend-Fit." },
  { value: "quiet", label: "Ruhe", description: "Weniger Trubel, mehr Berg-Vibe." },
  { value: "weekend", label: "Weekend Fit", description: "Schnell organisierbar für kurze Trips." },
  { value: "luxury", label: "Premium", description: "Komfort, gute Hotels und hochwertiger Rahmen." },
];

export const availabilityOptions: Array<{ value: SkiTripAvailabilityStatus; label: string; chipClass: string }> = [
  { value: "available", label: "Verfügbar", chipClass: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" },
  { value: "maybe", label: "Vielleicht", chipClass: "border-amber-300/35 bg-amber-300/10 text-amber-100" },
  { value: "unavailable", label: "Nicht möglich", chipClass: "border-rose-300/35 bg-rose-300/10 text-rose-100" },
];

export const budgetCategoryLabels: Record<SkiTripBudgetCategory, string> = {
  skipass: "Skipass",
  accommodation: "Unterkunft",
  travel: "Anreise",
  rental: "Skiverleih",
  ski_school: "Skischule",
  food: "Verpflegung",
  other: "Sonstiges",
};

export const tripLevelLabels: Record<SkiTripLevel, string> = {
  beginner: "Anfänger",
  mixed: "Gemischt",
  advanced: "Fortgeschritten",
};

export const focusLabels: Record<SkiTripFocus, string> = {
  budget: "Preiswert",
  apres: "Après-Ski",
  family: "Familienfreundlich",
  snow: "Schneesicherheit",
  piste_km: "Pistenkilometer",
  distance: "Entfernung",
  quiet: "Ruhe",
  weekend: "Weekend",
  luxury: "Premium",
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return currencyFormatter.format(value);
}

export function formatShortDate(value: string | null | undefined) {
  const date = parseIsoDate(value);
  if (!date) return "-";
  return shortDateFormatter.format(date);
}

export function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start && !end) return "Offen";
  if (start && end) return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  return formatShortDate(start end);
}

export function getTripMemberName(member: SkiTripMemberRecord | null | undefined) {
  if (!member) return "Unbekannt";
  return member.displayName || member.email || "Mitglied";
}

export function getTripDurationDays(dateOption: SkiTripDateOptionRecord | null | undefined) {
  const start = parseIsoDate(dateOption.startDate);
  const end = parseIsoDate(dateOption.endDate);
  if (!start || !end) return 1;
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, diffDays);
}

export function computeAvailabilitySummary(
  dateOption: SkiTripDateOptionRecord,
  availability: SkiTripAvailabilityRecord[],
  members: SkiTripMemberRecord[]
): AvailabilitySummary {
  const relevant = availability.filter((entry) => entry.dateOptionId === dateOption.id);
  const availableCount = relevant.filter((entry) => entry.status === "available").length;
  const maybeCount = relevant.filter((entry) => entry.status === "maybe").length;
  const unavailableCount = relevant.filter((entry) => entry.status === "unavailable").length;
  const participationCount = relevant.length;
  const score = availableCount * 1 + maybeCount * 0.45 - unavailableCount * 0.7;
  const joinedMembers = members.filter((member) => member.status === "joined").length || members.length || 1;
  const ratio = clamp((availableCount + maybeCount * 0.5) / joinedMembers, 0, 1);
  const fitLabel = ratio >= 0.8 "starker Fit" : ratio >= 0.6 "brauchbar" : "kritisch";

  return {
    dateOption,
    availableCount,
    maybeCount,
    unavailableCount,
    participationCount,
    score,
    fitLabel,
  };
}

export function getBestDateSummaries(bundle: SkiTripBundle) {
  return bundle.dateOptions
    .map((dateOption) => computeAvailabilitySummary(dateOption, bundle.availability, bundle.members))
    .sort((a, b) => b.score - a.score || a.dateOption.startDate.localeCompare(b.dateOption.startDate));
}

export function computeSnapshotTotal(snapshot: SkiTripPriceSnapshotRecord | null | undefined) {
  if (!snapshot) return 0;
  if (typeof snapshot.totalOverride === "number" && Number.isFinite(snapshot.totalOverride)) return snapshot.totalOverride;
  return (
    (snapshot.skipass || 0) +
    (snapshot.accommodation || 0) +
    (snapshot.travel || 0) +
    (snapshot.rental || 0) +
    (snapshot.skiSchool || 0) +
    (snapshot.food || 0) +
    (snapshot.buffer || 0)
  );
}

export function buildSeedSnapshot(
  tripId: string,
  favoriteId: string,
  dateOptionId: string,
  resort: TripResortLite | null,
  durationDays: number
): SkiTripPriceSnapshotRecord {
  const normalizedDays = Math.max(1, durationDays);
  const pisteFactor = typeof resort.pisteKm === "number" clamp(resort.pisteKm / 140, 0.35, 1.35) : 0.8;
  const passBase = (resort.skipassPriceFrom 61) * normalizedDays;
  const accommodation = Math.round(78 * normalizedDays * (0.85 + pisteFactor * 0.35));
  const travel = Math.round((55 + pisteFactor * 28) / Math.max(1, 3));
  const rental = Math.round(24 * normalizedDays * (resort.skipassPriceFrom 0.85 : 1));
  const skiSchool = 0;
  const food = Math.round(32 * normalizedDays);
  const buffer = Math.round((passBase + accommodation + travel + rental + food) * 0.08);

  return {
    id: `seed-${favoriteId}-${dateOptionId}`,
    tripId,
    favoriteId,
    dateOptionId,
    currency: "EUR",
    skipass: Math.round(passBase),
    accommodation,
    travel,
    rental,
    skiSchool,
    food,
    buffer,
    totalOverride: null,
    note: "Automatisch vorbereitete MVP-Schätzung.",
    sourceKind: "estimate",
    updatedByMemberId: null,
    updatedAt: null,
  };
}

export function buildComparisonRows(bundle: SkiTripBundle) {
  const participantCount = Math.max(bundle.members.filter((member) => member.status === "joined").length, 1);
  const availabilitySummaries = getBestDateSummaries(bundle);
  const availabilityByOptionId = new Map(availabilitySummaries.map((summary) => [summary.dateOption.id, summary]));

  return bundle.favorites
    .flatMap((favorite) =>
      bundle.dateOptions.map((dateOption) => {
        const resort = bundle.resorts[favorite.resortSlug] null;
        const snapshot =
          bundle.priceSnapshots.find((entry) => entry.favoriteId === favorite.id && entry.dateOptionId === dateOption.id) 
          buildSeedSnapshot(bundle.trip.id, favorite.id, dateOption.id, resort, getTripDurationDays(dateOption));
        const total = computeSnapshotTotal(snapshot);
        const availability = availabilityByOptionId.get(dateOption.id) computeAvailabilitySummary(dateOption, bundle.availability, bundle.members);
        const priceScore = total > 0 clamp(1 - total / 1200, 0, 1) : 0.3;
        const availabilityScore = clamp((availability.availableCount + availability.maybeCount * 0.35) / participantCount, 0, 1);
        const resortScore = clamp((resort.matchPct 52) / 100, 0, 1);
        const combinedScore = priceScore * 0.32 + availabilityScore * 0.4 + resortScore * 0.28;
        const decisionReason =
          availabilityScore >= 0.78 && priceScore >= 0.62
            "starke Gruppenverfügbarkeit bei gutem Kostenrahmen"
            : priceScore >= availabilityScore && priceScore >= resortScore
              "günstigster Kostenhebel"
              : availabilityScore >= resortScore
                "beste zeitliche Überschneidung"
                : "stärkster Alpivo-Resort-Fit";

        return {
          favorite,
          resort,
          dateOption,
          availability,
          snapshot,
          total,
          totalPerPerson: total / participantCount,
          combinedScore,
          decisionReason,
        } satisfies ComparisonRow;
      })
    )
    .sort((a, b) => a.total - b.total || b.combinedScore - a.combinedScore);
}

export function computeExpenseSummary(bundle: SkiTripBundle): ExpenseSummary {
  const balances = computeExpenseBalances(bundle);
  const total = bundle.expenses.reduce((sum, item) => sum + item.amount, 0);
  const participantCount = Math.max(bundle.members.filter((member) => member.status === "joined" || member.role === "admin").length, 1);
  return {
    total,
    paidByGroup: balances.reduce((sum, entry) => sum + entry.paid, 0),
    perPerson: total / participantCount,
    openBalances: balances.reduce((sum, entry) => sum + Math.max(0, entry.balance), 0),
  };
}

export function computeBudgetSummary(bundle: SkiTripBundle): BudgetSummary {
  const total = bundle.budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const paid = bundle.budgetItems.filter((item) => item.isPaid).reduce((sum, item) => sum + item.amount, 0);
  const participantCount = Math.max(bundle.members.filter((member) => member.status === "joined").length, 1);
  return {
    total,
    paid,
    open: Math.max(total - paid, 0),
    perPerson: total / participantCount,
    itemCount: bundle.budgetItems.length,
  };
}

export function computeExpenseBalances(bundle: SkiTripBundle): ExpenseBalance[] {
  const members = bundle.members.filter((member) => member.status === "joined" || member.role === "admin");
  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();

  for (const member of members) {
    paidMap.set(member.id, 0);
    owedMap.set(member.id, 0);
  }

  for (const expense of bundle.expenses) {
    if (expense.paidByMemberId) {
      paidMap.set(expense.paidByMemberId, (paidMap.get(expense.paidByMemberId) 0) + expense.amount);
    }
  }

  for (const split of bundle.expenseSplits) {
    owedMap.set(split.memberId, (owedMap.get(split.memberId) 0) + split.amount);
  }

  return members
    .map((member) => {
      const paid = paidMap.get(member.id) 0;
      const owes = owedMap.get(member.id) 0;
      return {
        memberId: member.id,
        name: getTripMemberName(member),
        paid,
        owes,
        balance: paid - owes,
      } satisfies ExpenseBalance;
    })
    .sort((a, b) => b.balance - a.balance);
}

export function computeSettlementSuggestions(bundle: SkiTripBundle): SettlementSuggestion[] {
  const balances = computeExpenseBalances(bundle);
  const creditors = balances
    .filter((entry) => entry.balance > 0.99)
    .map((entry) => ({ ...entry, remaining: entry.balance }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = balances
    .filter((entry) => entry.balance < -0.99)
    .map((entry) => ({ ...entry, remaining: Math.abs(entry.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const suggestions: SettlementSuggestion[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = Math.min(creditor.remaining, debtor.remaining);

    suggestions.push({
      fromMemberId: debtor.memberId,
      fromName: debtor.name,
      toMemberId: creditor.memberId,
      toName: creditor.name,
      amount,
    });

    creditor.remaining -= amount;
    debtor.remaining -= amount;

    if (creditor.remaining <= 0.99) creditorIndex += 1;
    if (debtor.remaining <= 0.99) debtorIndex += 1;
  }

  return suggestions;
}

export function getFavoriteVoteSummary(bundle: SkiTripBundle, favoriteId: string) {
  const votes = bundle.votes.filter((entry) => entry.favoriteId === favoriteId);
  return {
    likes: votes.filter((entry) => entry.voteKind === "like").length,
    favorites: votes.filter((entry) => entry.voteKind === "favorite").length,
  };
}

export function getFavoriteComments(bundle: SkiTripBundle, favoriteId: string) {
  return bundle.comments
    .filter((entry) => entry.favoriteId === favoriteId)
    .sort((a, b) => (a.createdAt "").localeCompare(b.createdAt ""));
}

export function buildTripRoute(tripId: string, view: TripWorkspaceView) {
  if (view === "overview") return `/trips/${encodeURIComponent(tripId)}`;
  return `/trips/${encodeURIComponent(tripId)}/${view}`;
}
