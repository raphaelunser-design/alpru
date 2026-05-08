import type {
  SkiTripBundle,
  SkiTripBudgetItemRecord,
  SkiTripCommentRecord,
  SkiTripDateOptionRecord,
  SkiTripExpenseRecord,
  SkiTripExpenseSplitRecord,
  SkiTripFavoriteRecord,
  SkiTripFavoriteVoteRecord,
  SkiTripInviteRecord,
  SkiTripMemberRecord,
  SkiTripPriceSnapshotRecord,
  SkiTripRecord,
  SkiTripSettlementRecord,
  TripResortLite,
} from "@/lib/tripPlanner";

const demoResortFallbacks: Record<string, TripResortLite> = {
  "soelden": {
    id: "demo-resort-soelden",
    slug: "soelden",
    name: "Sölden",
    country: "Österreich",
    region: "Tirol",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 144,
    elevationMinM: 1350,
    elevationMaxM: 3340,
    verticalM: 1990,
    skipassPriceFrom: 76,
    officialUrl: null,
    lat: 46.9693,
    lon: 11.0074,
    matchPct: 82,
  },
  "ischgl": {
    id: "demo-resort-ischgl",
    slug: "ischgl",
    name: "Ischgl",
    country: "Österreich",
    region: "Tirol",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 239,
    elevationMinM: 1377,
    elevationMaxM: 2872,
    verticalM: 1495,
    skipassPriceFrom: 79,
    officialUrl: null,
    lat: 47.0127,
    lon: 10.2922,
    matchPct: 84,
  },
  "serfaus-fiss-ladis": {
    id: "demo-resort-serfaus-fiss-ladis",
    slug: "serfaus-fiss-ladis",
    name: "Serfaus-Fiss-Ladis",
    country: "Österreich",
    region: "Tirol",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 214,
    elevationMinM: 1200,
    elevationMaxM: 2820,
    verticalM: 1620,
    skipassPriceFrom: 72,
    officialUrl: null,
    lat: 47.0405,
    lon: 10.6031,
    matchPct: 81,
  },
  "sankt-anton-am-arlberg": {
    id: "demo-resort-st-anton",
    slug: "sankt-anton-am-arlberg",
    name: "St. Anton am Arlberg",
    country: "Österreich",
    region: "Tirol",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 305,
    elevationMinM: 1304,
    elevationMaxM: 2811,
    verticalM: 1507,
    skipassPriceFrom: 78,
    officialUrl: null,
    lat: 47.1286,
    lon: 10.2641,
    matchPct: 86,
  },
  "kitzbuehel-kirchberg": {
    id: "demo-resort-kitz",
    slug: "kitzbuehel-kirchberg",
    name: "Kitzbühel",
    country: "Österreich",
    region: "Tirol",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 188,
    elevationMinM: 800,
    elevationMaxM: 2000,
    verticalM: 1200,
    skipassPriceFrom: 74,
    officialUrl: null,
    lat: 47.4464,
    lon: 12.3929,
    matchPct: 77,
  },
  "zermatt": {
    id: "demo-resort-zermatt",
    slug: "zermatt",
    name: "Zermatt",
    country: "Schweiz",
    region: "Wallis",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 360,
    elevationMinM: 1620,
    elevationMaxM: 3883,
    verticalM: 2263,
    skipassPriceFrom: 92,
    officialUrl: null,
    lat: 46.0207,
    lon: 7.7491,
    matchPct: 87,
  },
  "laax": {
    id: "demo-resort-laax",
    slug: "laax",
    name: "Laax",
    country: "Schweiz",
    region: "Graubünden",
    imageUrl: "/bg/skilandschaft.png",
    pisteKm: 224,
    elevationMinM: 1100,
    elevationMaxM: 3018,
    verticalM: 1918,
    skipassPriceFrom: 83,
    officialUrl: null,
    lat: 46.836,
    lon: 9.2575,
    matchPct: 79,
  },
};

export const demoTripIds = ["demo-trip-crew", "demo-trip-family", "demo-trip-spring"] as const;
export const demoTripResortSlugs = Object.keys(demoResortFallbacks);

type DemoTripRaw = {
  trip: SkiTripRecord;
  members: SkiTripMemberRecord[];
  invites: SkiTripInviteRecord[];
  dateOptions: SkiTripDateOptionRecord[];
  availability: Array<{
    id: string;
    tripId: string;
    dateOptionId: string;
    memberId: string;
    status: "available" | "maybe" | "unavailable";
    note?: string | null;
  }>;
  favorites: SkiTripFavoriteRecord[];
  votes: SkiTripFavoriteVoteRecord[];
  comments: SkiTripCommentRecord[];
  priceSnapshots: SkiTripPriceSnapshotRecord[];
  budgetItems: SkiTripBudgetItemRecord[];
  expenses: SkiTripExpenseRecord[];
  expenseSplits: SkiTripExpenseSplitRecord[];
  settlements: SkiTripSettlementRecord[];
};

const demoTrips: DemoTripRaw[] = [
  {
    trip: {
      id: "demo-trip-crew",
      title: "Wochenende mit Freunden",
      description: "Vierergruppe für einen sportlichen Januar-Trip mit Après-Puffer und klaren Kosten.",
      startRegion: "München",
      participantTarget: 4,
      budgetPerPerson: 540,
      skiLevel: "mixed",
      focus: ["apres", "snow", "weekend", "piste_km"],
      preferredResortSlugs: ["ischgl", "soelden", "serfaus-fiss-ladis"],
      createdBy: "demo-user-raphael",
      createdAt: "2027-01-08T08:30:00Z",
      updatedAt: "2027-01-10T11:30:00Z",
    },
    members: [
      {
        id: "demo-member-raphael",
        tripId: "demo-trip-crew",
        userId: "demo-user-raphael",
        displayName: "Raphael",
        email: "raphael@alpivo.demo",
        role: "admin",
        status: "joined",
        joinedAt: "2027-01-08T08:30:00Z",
        createdAt: "2027-01-08T08:30:00Z",
      },
      {
        id: "demo-member-luca",
        tripId: "demo-trip-crew",
        userId: "demo-user-luca",
        displayName: "Luca",
        email: "luca@alpivo.demo",
        role: "member",
        status: "joined",
        joinedAt: "2027-01-08T09:05:00Z",
        createdAt: "2027-01-08T09:05:00Z",
      },
      {
        id: "demo-member-anna",
        tripId: "demo-trip-crew",
        userId: "demo-user-anna",
        displayName: "Anna",
        email: "anna@alpivo.demo",
        role: "member",
        status: "joined",
        joinedAt: "2027-01-08T09:11:00Z",
        createdAt: "2027-01-08T09:11:00Z",
      },
      {
        id: "demo-member-max",
        tripId: "demo-trip-crew",
        userId: "demo-user-max",
        displayName: "Max",
        email: "max@alpivo.demo",
        role: "member",
        status: "joined",
        joinedAt: "2027-01-08T09:13:00Z",
        createdAt: "2027-01-08T09:13:00Z",
      },
    ],
    invites: [
      {
        id: "demo-invite-crew-1",
        tripId: "demo-trip-crew",
        email: "sophie@alpivo.demo",
        role: "member",
        inviteToken: "demo-invite-crew-1",
        note: "Falls noch jemand nachrückt.",
        status: "invited",
        expiresAt: "2027-01-20T00:00:00Z",
        createdAt: "2027-01-08T10:00:00Z",
      },
    ],
    dateOptions: [
      {
        id: "demo-date-crew-1",
        tripId: "demo-trip-crew",
        label: "Mitte Januar",
        startDate: "2027-01-16",
        endDate: "2027-01-18",
        note: "Freitag bis Sonntag",
        createdBy: "demo-user-raphael",
        createdAt: "2027-01-08T10:15:00Z",
      },
      {
        id: "demo-date-crew-2",
        tripId: "demo-trip-crew",
        label: "Ende Januar",
        startDate: "2027-01-30",
        endDate: "2027-02-01",
        note: "Besser für Luca, knapper für Anna",
        createdBy: "demo-user-raphael",
        createdAt: "2027-01-08T10:18:00Z",
      },
      {
        id: "demo-date-crew-3",
        tripId: "demo-trip-crew",
        label: "Anfang Februar",
        startDate: "2027-02-06",
        endDate: "2027-02-08",
        note: "Teurer, aber starker Schnee-Fit",
        createdBy: "demo-user-raphael",
        createdAt: "2027-01-08T10:20:00Z",
      },
    ],
    availability: [
      { id: "demo-av-1", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-1", memberId: "demo-member-raphael", status: "available" },
      { id: "demo-av-2", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-1", memberId: "demo-member-luca", status: "available" },
      { id: "demo-av-3", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-1", memberId: "demo-member-anna", status: "maybe" },
      { id: "demo-av-4", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-1", memberId: "demo-member-max", status: "available" },
      { id: "demo-av-5", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-2", memberId: "demo-member-raphael", status: "available" },
      { id: "demo-av-6", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-2", memberId: "demo-member-luca", status: "available" },
      { id: "demo-av-7", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-2", memberId: "demo-member-anna", status: "unavailable" },
      { id: "demo-av-8", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-2", memberId: "demo-member-max", status: "available" },
      { id: "demo-av-9", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-3", memberId: "demo-member-raphael", status: "available" },
      { id: "demo-av-10", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-3", memberId: "demo-member-luca", status: "maybe" },
      { id: "demo-av-11", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-3", memberId: "demo-member-anna", status: "available" },
      { id: "demo-av-12", tripId: "demo-trip-crew", dateOptionId: "demo-date-crew-3", memberId: "demo-member-max", status: "available" },
    ],
    favorites: [
      { id: "demo-fav-crew-1", tripId: "demo-trip-crew", resortId: null, resortSlug: "ischgl", note: "Starker Mix aus Pisten, Nightlife und Schnee.", proposedByMemberId: "demo-member-raphael", isPinned: true, createdAt: "2027-01-08T10:25:00Z" },
      { id: "demo-fav-crew-2", tripId: "demo-trip-crew", resortId: null, resortSlug: "soelden", note: "Gletscher-Fit und gute Wochenend-Anreise.", proposedByMemberId: "demo-member-luca", isPinned: false, createdAt: "2027-01-08T10:26:00Z" },
      { id: "demo-fav-crew-3", tripId: "demo-trip-crew", resortId: null, resortSlug: "serfaus-fiss-ladis", note: "Sehr rund, aber für die Crew etwas ruhiger.", proposedByMemberId: "demo-member-anna", isPinned: false, createdAt: "2027-01-08T10:28:00Z" },
    ],
    votes: [
      { id: "demo-vote-1", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-1", memberId: "demo-member-raphael", voteKind: "favorite", createdAt: "2027-01-08T10:31:00Z" },
      { id: "demo-vote-2", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-1", memberId: "demo-member-max", voteKind: "like", createdAt: "2027-01-08T10:32:00Z" },
      { id: "demo-vote-3", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-2", memberId: "demo-member-luca", voteKind: "favorite", createdAt: "2027-01-08T10:33:00Z" },
      { id: "demo-vote-4", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-2", memberId: "demo-member-anna", voteKind: "like", createdAt: "2027-01-08T10:34:00Z" },
    ],
    comments: [
      { id: "demo-comment-1", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-1", memberId: "demo-member-luca", body: "Preislich okay, solange wir früh Unterkunft fixen.", createdAt: "2027-01-08T10:40:00Z" },
      { id: "demo-comment-2", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-2", memberId: "demo-member-anna", body: "Sölden bleibt für Anfang Februar mein Schnee-Favorit.", createdAt: "2027-01-08T10:42:00Z" },
    ],
    priceSnapshots: [
      { id: "demo-price-1", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-1", dateOptionId: "demo-date-crew-1", currency: "EUR", skipass: 159, accommodation: 220, travel: 85, rental: 0, skiSchool: 0, food: 96, buffer: 38, totalOverride: null, note: "Apartment zu viert", sourceKind: "seed", updatedByMemberId: "demo-member-raphael", updatedAt: "2027-01-08T11:20:00Z" },
      { id: "demo-price-2", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-1", dateOptionId: "demo-date-crew-3", currency: "EUR", skipass: 164, accommodation: 255, travel: 88, rental: 0, skiSchool: 0, food: 104, buffer: 44, totalOverride: null, note: "Hauptsaison", sourceKind: "seed", updatedByMemberId: "demo-member-raphael", updatedAt: "2027-01-08T11:22:00Z" },
      { id: "demo-price-3", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-2", dateOptionId: "demo-date-crew-1", currency: "EUR", skipass: 154, accommodation: 205, travel: 78, rental: 0, skiSchool: 0, food: 92, buffer: 32, totalOverride: null, note: "Bestes Value-Fenster", sourceKind: "seed", updatedByMemberId: "demo-member-luca", updatedAt: "2027-01-08T11:25:00Z" },
      { id: "demo-price-4", tripId: "demo-trip-crew", favoriteId: "demo-fav-crew-3", dateOptionId: "demo-date-crew-2", currency: "EUR", skipass: 145, accommodation: 198, travel: 74, rental: 0, skiSchool: 0, food: 88, buffer: 31, totalOverride: null, note: "Ruhigere Alternative", sourceKind: "seed", updatedByMemberId: "demo-member-anna", updatedAt: "2027-01-08T11:27:00Z" },
    ],
    budgetItems: [
      { id: "demo-budget-1", tripId: "demo-trip-crew", category: "accommodation", description: "Apartment-Anzahlung", amount: 320, dueDate: "2027-01-12", isPaid: true, paidByMemberId: "demo-member-raphael", note: "Rückzahlung später splitten", createdByMemberId: "demo-member-raphael", createdAt: "2027-01-08T12:00:00Z", updatedAt: "2027-01-10T09:00:00Z" },
      { id: "demo-budget-2", tripId: "demo-trip-crew", category: "skipass", description: "3-Tages-Pass grob pro Person", amount: 620, dueDate: "2027-01-14", isPaid: false, paidByMemberId: null, note: null, createdByMemberId: "demo-member-luca", createdAt: "2027-01-08T12:05:00Z", updatedAt: "2027-01-08T12:05:00Z" },
      { id: "demo-budget-3", tripId: "demo-trip-crew", category: "travel", description: "Sprit, Maut, Puffer", amount: 180, dueDate: "2027-01-15", isPaid: false, paidByMemberId: null, note: "Mit E10 gerechnet", createdByMemberId: "demo-member-max", createdAt: "2027-01-08T12:06:00Z", updatedAt: "2027-01-08T12:06:00Z" },
    ],
    expenses: [
      { id: "demo-expense-1", tripId: "demo-trip-crew", category: "travel", description: "Tanken Hin- und Rückweg", amount: 126, paidByMemberId: "demo-member-max", incurredOn: "2027-01-16", dueDate: null, note: null, isSettled: false, createdAt: "2027-01-16T20:00:00Z", updatedAt: "2027-01-16T20:00:00Z" },
      { id: "demo-expense-2", tripId: "demo-trip-crew", category: "food", description: "Hütten-Lunch am Samstag", amount: 92, paidByMemberId: "demo-member-anna", incurredOn: "2027-01-17", dueDate: null, note: "Bar gezahlt", isSettled: false, createdAt: "2027-01-17T15:10:00Z", updatedAt: "2027-01-17T15:10:00Z" },
    ],
    expenseSplits: [
      { id: "demo-split-1", tripId: "demo-trip-crew", expenseId: "demo-expense-1", memberId: "demo-member-raphael", amount: 31.5, createdAt: "2027-01-16T20:01:00Z" },
      { id: "demo-split-2", tripId: "demo-trip-crew", expenseId: "demo-expense-1", memberId: "demo-member-luca", amount: 31.5, createdAt: "2027-01-16T20:01:00Z" },
      { id: "demo-split-3", tripId: "demo-trip-crew", expenseId: "demo-expense-1", memberId: "demo-member-anna", amount: 31.5, createdAt: "2027-01-16T20:01:00Z" },
      { id: "demo-split-4", tripId: "demo-trip-crew", expenseId: "demo-expense-1", memberId: "demo-member-max", amount: 31.5, createdAt: "2027-01-16T20:01:00Z" },
      { id: "demo-split-5", tripId: "demo-trip-crew", expenseId: "demo-expense-2", memberId: "demo-member-raphael", amount: 23, createdAt: "2027-01-17T15:12:00Z" },
      { id: "demo-split-6", tripId: "demo-trip-crew", expenseId: "demo-expense-2", memberId: "demo-member-luca", amount: 23, createdAt: "2027-01-17T15:12:00Z" },
      { id: "demo-split-7", tripId: "demo-trip-crew", expenseId: "demo-expense-2", memberId: "demo-member-anna", amount: 23, createdAt: "2027-01-17T15:12:00Z" },
      { id: "demo-split-8", tripId: "demo-trip-crew", expenseId: "demo-expense-2", memberId: "demo-member-max", amount: 23, createdAt: "2027-01-17T15:12:00Z" },
    ],
    settlements: [
      { id: "demo-settlement-1", tripId: "demo-trip-crew", fromMemberId: "demo-member-raphael", toMemberId: "demo-member-max", amount: 8.5, status: "open", note: "Sprit-Ausgleich", settledAt: null, createdAt: "2027-01-18T18:00:00Z" },
    ],
  },
  {
    trip: {
      id: "demo-trip-family",
      title: "Familien-Skiurlaub",
      description: "Ruhiger Februar-Trip mit Fokus auf Einsteiger, Kostenklarheit und gute Verfügbarkeit.",
      startRegion: "Stuttgart",
      participantTarget: 5,
      budgetPerPerson: 690,
      skiLevel: "beginner",
      focus: ["family", "budget", "distance", "snow"],
      preferredResortSlugs: ["serfaus-fiss-ladis", "kitzbuehel-kirchberg", "soelden"],
      createdBy: "demo-user-julia",
      createdAt: "2027-01-22T14:00:00Z",
      updatedAt: "2027-01-24T09:00:00Z",
    },
    members: [
      { id: "demo-member-julia", tripId: "demo-trip-family", userId: "demo-user-julia", displayName: "Julia", email: "julia@alpivo.demo", role: "admin", status: "joined", joinedAt: "2027-01-22T14:00:00Z", createdAt: "2027-01-22T14:00:00Z" },
      { id: "demo-member-david", tripId: "demo-trip-family", userId: "demo-user-david", displayName: "David", email: "david@alpivo.demo", role: "member", status: "joined", joinedAt: "2027-01-22T14:10:00Z", createdAt: "2027-01-22T14:10:00Z" },
      { id: "demo-member-ella", tripId: "demo-trip-family", userId: null, displayName: "Ella", email: null, role: "member", status: "joined", joinedAt: "2027-01-22T14:11:00Z", createdAt: "2027-01-22T14:11:00Z" },
      { id: "demo-member-noah", tripId: "demo-trip-family", userId: null, displayName: "Noah", email: null, role: "member", status: "joined", joinedAt: "2027-01-22T14:11:00Z", createdAt: "2027-01-22T14:11:00Z" },
      { id: "demo-member-oma", tripId: "demo-trip-family", userId: null, displayName: "Oma Ingrid", email: null, role: "member", status: "open", joinedAt: null, createdAt: "2027-01-22T14:12:00Z" },
    ],
    invites: [],
    dateOptions: [
      { id: "demo-date-family-1", tripId: "demo-trip-family", label: "Ferienfenster A", startDate: "2027-02-14", endDate: "2027-02-21", note: "Klassische Schulferien", createdBy: "demo-user-julia", createdAt: "2027-01-22T14:15:00Z" },
      { id: "demo-date-family-2", tripId: "demo-trip-family", label: "Ferienfenster B", startDate: "2027-02-21", endDate: "2027-02-28", note: "Etwas entspannter bei Unterkünften", createdBy: "demo-user-julia", createdAt: "2027-01-22T14:18:00Z" },
    ],
    availability: [
      { id: "demo-family-av-1", tripId: "demo-trip-family", dateOptionId: "demo-date-family-1", memberId: "demo-member-julia", status: "available" },
      { id: "demo-family-av-2", tripId: "demo-trip-family", dateOptionId: "demo-date-family-1", memberId: "demo-member-david", status: "available" },
      { id: "demo-family-av-3", tripId: "demo-trip-family", dateOptionId: "demo-date-family-1", memberId: "demo-member-ella", status: "available" },
      { id: "demo-family-av-4", tripId: "demo-trip-family", dateOptionId: "demo-date-family-1", memberId: "demo-member-noah", status: "available" },
      { id: "demo-family-av-5", tripId: "demo-trip-family", dateOptionId: "demo-date-family-2", memberId: "demo-member-julia", status: "available" },
      { id: "demo-family-av-6", tripId: "demo-trip-family", dateOptionId: "demo-date-family-2", memberId: "demo-member-david", status: "maybe" },
      { id: "demo-family-av-7", tripId: "demo-trip-family", dateOptionId: "demo-date-family-2", memberId: "demo-member-ella", status: "available" },
      { id: "demo-family-av-8", tripId: "demo-trip-family", dateOptionId: "demo-date-family-2", memberId: "demo-member-noah", status: "available" },
    ],
    favorites: [
      { id: "demo-fav-family-1", tripId: "demo-trip-family", resortId: null, resortSlug: "serfaus-fiss-ladis", note: "Top für Kinderkurse und breite Auswahl.", proposedByMemberId: "demo-member-julia", isPinned: true, createdAt: "2027-01-22T14:22:00Z" },
      { id: "demo-fav-family-2", tripId: "demo-trip-family", resortId: null, resortSlug: "kitzbuehel-kirchberg", note: "Gute Infrastruktur, aber preislich enger.", proposedByMemberId: "demo-member-david", isPinned: false, createdAt: "2027-01-22T14:23:00Z" },
      { id: "demo-fav-family-3", tripId: "demo-trip-family", resortId: null, resortSlug: "soelden", note: "Schneesicher, für die Kinder aber etwas sportlicher.", proposedByMemberId: "demo-member-david", isPinned: false, createdAt: "2027-01-22T14:24:00Z" },
    ],
    votes: [
      { id: "demo-family-vote-1", tripId: "demo-trip-family", favoriteId: "demo-fav-family-1", memberId: "demo-member-julia", voteKind: "favorite", createdAt: "2027-01-22T14:26:00Z" },
      { id: "demo-family-vote-2", tripId: "demo-trip-family", favoriteId: "demo-fav-family-1", memberId: "demo-member-david", voteKind: "like", createdAt: "2027-01-22T14:27:00Z" },
    ],
    comments: [
      { id: "demo-family-comment-1", tripId: "demo-trip-family", favoriteId: "demo-fav-family-1", memberId: "demo-member-david", body: "Wenn wir Samstag bis Samstag fahren, ist Serfaus gerade noch im Budget.", createdAt: "2027-01-22T14:30:00Z" },
    ],
    priceSnapshots: [
      { id: "demo-family-price-1", tripId: "demo-trip-family", favoriteId: "demo-fav-family-1", dateOptionId: "demo-date-family-1", currency: "EUR", skipass: 318, accommodation: 540, travel: 115, rental: 120, skiSchool: 145, food: 230, buffer: 74, totalOverride: null, note: "2 Erwachsene + 2 Kinder grob", sourceKind: "seed", updatedByMemberId: "demo-member-julia", updatedAt: "2027-01-22T15:00:00Z" },
      { id: "demo-family-price-2", tripId: "demo-trip-family", favoriteId: "demo-fav-family-1", dateOptionId: "demo-date-family-2", currency: "EUR", skipass: 302, accommodation: 488, travel: 115, rental: 120, skiSchool: 145, food: 220, buffer: 66, totalOverride: null, note: "Nachfrage etwas niedriger", sourceKind: "seed", updatedByMemberId: "demo-member-julia", updatedAt: "2027-01-22T15:03:00Z" },
      { id: "demo-family-price-3", tripId: "demo-trip-family", favoriteId: "demo-fav-family-2", dateOptionId: "demo-date-family-2", currency: "EUR", skipass: 328, accommodation: 520, travel: 120, rental: 110, skiSchool: 138, food: 224, buffer: 70, totalOverride: null, note: null, sourceKind: "seed", updatedByMemberId: "demo-member-david", updatedAt: "2027-01-22T15:04:00Z" },
    ],
    budgetItems: [
      { id: "demo-family-budget-1", tripId: "demo-trip-family", category: "accommodation", description: "Ferienwohnung Reservierung", amount: 560, dueDate: "2027-01-30", isPaid: false, paidByMemberId: null, note: null, createdByMemberId: "demo-member-julia", createdAt: "2027-01-22T16:00:00Z", updatedAt: "2027-01-22T16:00:00Z" },
      { id: "demo-family-budget-2", tripId: "demo-trip-family", category: "ski_school", description: "2x Kinderkurs", amount: 290, dueDate: "2027-02-05", isPaid: false, paidByMemberId: null, note: null, createdByMemberId: "demo-member-julia", createdAt: "2027-01-22T16:03:00Z", updatedAt: "2027-01-22T16:03:00Z" },
    ],
    expenses: [
      { id: "demo-family-expense-1", tripId: "demo-trip-family", category: "food", description: "Pizza-Abend im Chalet", amount: 84, paidByMemberId: "demo-member-david", incurredOn: "2027-02-16", dueDate: null, note: null, isSettled: false, createdAt: "2027-02-16T19:00:00Z", updatedAt: "2027-02-16T19:00:00Z" },
    ],
    expenseSplits: [
      { id: "demo-family-split-1", tripId: "demo-trip-family", expenseId: "demo-family-expense-1", memberId: "demo-member-julia", amount: 21, createdAt: "2027-02-16T19:01:00Z" },
      { id: "demo-family-split-2", tripId: "demo-trip-family", expenseId: "demo-family-expense-1", memberId: "demo-member-david", amount: 21, createdAt: "2027-02-16T19:01:00Z" },
      { id: "demo-family-split-3", tripId: "demo-trip-family", expenseId: "demo-family-expense-1", memberId: "demo-member-ella", amount: 21, createdAt: "2027-02-16T19:01:00Z" },
      { id: "demo-family-split-4", tripId: "demo-trip-family", expenseId: "demo-family-expense-1", memberId: "demo-member-noah", amount: 21, createdAt: "2027-02-16T19:01:00Z" },
    ],
    settlements: [],
  },
  {
    trip: {
      id: "demo-trip-spring",
      title: "Budget-Skitag",
      description: "Flexibler Ende-Maerz / April-Trip mit Fokus auf Schnee, Park und clevere Preisfenster.",
      startRegion: "Zürich",
      participantTarget: 3,
      budgetPerPerson: 610,
      skiLevel: "advanced",
      focus: ["snow", "budget", "quiet"],
      preferredResortSlugs: ["zermatt", "laax", "soelden", "sankt-anton-am-arlberg"],
      createdBy: "demo-user-nico",
      createdAt: "2027-03-01T10:00:00Z",
      updatedAt: "2027-03-04T08:30:00Z",
    },
    members: [
      { id: "demo-member-nico", tripId: "demo-trip-spring", userId: "demo-user-nico", displayName: "Nico", email: "nico@alpivo.demo", role: "admin", status: "joined", joinedAt: "2027-03-01T10:00:00Z", createdAt: "2027-03-01T10:00:00Z" },
      { id: "demo-member-lea", tripId: "demo-trip-spring", userId: "demo-user-lea", displayName: "Lea", email: "lea@alpivo.demo", role: "member", status: "joined", joinedAt: "2027-03-01T10:02:00Z", createdAt: "2027-03-01T10:02:00Z" },
      { id: "demo-member-ben", tripId: "demo-trip-spring", userId: "demo-user-ben", displayName: "Ben", email: "ben@alpivo.demo", role: "member", status: "joined", joinedAt: "2027-03-01T10:03:00Z", createdAt: "2027-03-01T10:03:00Z" },
    ],
    invites: [],
    dateOptions: [
      { id: "demo-date-spring-1", tripId: "demo-trip-spring", label: "Letztes Maerz-Wochenende", startDate: "2027-03-27", endDate: "2027-03-29", note: null, createdBy: "demo-user-nico", createdAt: "2027-03-01T10:10:00Z" },
      { id: "demo-date-spring-2", tripId: "demo-trip-spring", label: "Osterfenster", startDate: "2027-04-03", endDate: "2027-04-06", note: "Laenger, aber Feiertagsaufschlag", createdBy: "demo-user-nico", createdAt: "2027-03-01T10:11:00Z" },
    ],
    availability: [
      { id: "demo-spring-av-1", tripId: "demo-trip-spring", dateOptionId: "demo-date-spring-1", memberId: "demo-member-nico", status: "available" },
      { id: "demo-spring-av-2", tripId: "demo-trip-spring", dateOptionId: "demo-date-spring-1", memberId: "demo-member-lea", status: "available" },
      { id: "demo-spring-av-3", tripId: "demo-trip-spring", dateOptionId: "demo-date-spring-1", memberId: "demo-member-ben", status: "available" },
      { id: "demo-spring-av-4", tripId: "demo-trip-spring", dateOptionId: "demo-date-spring-2", memberId: "demo-member-nico", status: "available" },
      { id: "demo-spring-av-5", tripId: "demo-trip-spring", dateOptionId: "demo-date-spring-2", memberId: "demo-member-lea", status: "maybe" },
      { id: "demo-spring-av-6", tripId: "demo-trip-spring", dateOptionId: "demo-date-spring-2", memberId: "demo-member-ben", status: "available" },
    ],
    favorites: [
      { id: "demo-fav-spring-1", tripId: "demo-trip-spring", resortId: null, resortSlug: "zermatt", note: "Spring-Classic, aber Premium.", proposedByMemberId: "demo-member-nico", isPinned: true, createdAt: "2027-03-01T10:15:00Z" },
      { id: "demo-fav-spring-2", tripId: "demo-trip-spring", resortId: null, resortSlug: "laax", note: "Park und moderne Infrastruktur.", proposedByMemberId: "demo-member-lea", isPinned: false, createdAt: "2027-03-01T10:16:00Z" },
      { id: "demo-fav-spring-3", tripId: "demo-trip-spring", resortId: null, resortSlug: "soelden", note: "Gletscher nimmt Risiko raus.", proposedByMemberId: "demo-member-ben", isPinned: false, createdAt: "2027-03-01T10:17:00Z" },
      { id: "demo-fav-spring-4", tripId: "demo-trip-spring", resortId: null, resortSlug: "sankt-anton-am-arlberg", note: "Mehr Terrain, aber teurer in Summe.", proposedByMemberId: "demo-member-ben", isPinned: false, createdAt: "2027-03-01T10:18:00Z" },
    ],
    votes: [
      { id: "demo-spring-vote-1", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-3", memberId: "demo-member-ben", voteKind: "favorite", createdAt: "2027-03-01T10:21:00Z" },
      { id: "demo-spring-vote-2", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-2", memberId: "demo-member-lea", voteKind: "favorite", createdAt: "2027-03-01T10:21:30Z" },
    ],
    comments: [
      { id: "demo-spring-comment-1", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-2", memberId: "demo-member-lea", body: "Laax ist für den Preis gut, wenn wir das kürzere Fenster nehmen.", createdAt: "2027-03-01T10:25:00Z" },
      { id: "demo-spring-comment-2", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-3", memberId: "demo-member-nico", body: "Sölden gewinnt bei Schnee plus Preis fast immer.", createdAt: "2027-03-01T10:27:00Z" },
    ],
    priceSnapshots: [
      { id: "demo-spring-price-1", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-1", dateOptionId: "demo-date-spring-1", currency: "EUR", skipass: 188, accommodation: 245, travel: 92, rental: 0, skiSchool: 0, food: 98, buffer: 44, totalOverride: null, note: null, sourceKind: "seed", updatedByMemberId: "demo-member-nico", updatedAt: "2027-03-01T11:00:00Z" },
      { id: "demo-spring-price-2", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-2", dateOptionId: "demo-date-spring-1", currency: "EUR", skipass: 166, accommodation: 196, travel: 76, rental: 18, skiSchool: 0, food: 92, buffer: 36, totalOverride: null, note: null, sourceKind: "seed", updatedByMemberId: "demo-member-lea", updatedAt: "2027-03-01T11:01:00Z" },
      { id: "demo-spring-price-3", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-3", dateOptionId: "demo-date-spring-1", currency: "EUR", skipass: 162, accommodation: 184, travel: 72, rental: 0, skiSchool: 0, food: 88, buffer: 34, totalOverride: null, note: "Sehr sauberes Preisfenster", sourceKind: "seed", updatedByMemberId: "demo-member-ben", updatedAt: "2027-03-01T11:02:00Z" },
      { id: "demo-spring-price-4", tripId: "demo-trip-spring", favoriteId: "demo-fav-spring-3", dateOptionId: "demo-date-spring-2", currency: "EUR", skipass: 214, accommodation: 248, travel: 72, rental: 0, skiSchool: 0, food: 118, buffer: 45, totalOverride: null, note: "Feiertagsaufschlag", sourceKind: "seed", updatedByMemberId: "demo-member-ben", updatedAt: "2027-03-01T11:03:00Z" },
    ],
    budgetItems: [
      { id: "demo-spring-budget-1", tripId: "demo-trip-spring", category: "skipass", description: "Pass-Korridor für drei Personen", amount: 540, dueDate: "2027-03-15", isPaid: false, paidByMemberId: null, note: null, createdByMemberId: "demo-member-nico", createdAt: "2027-03-01T11:20:00Z", updatedAt: "2027-03-01T11:20:00Z" },
      { id: "demo-spring-budget-2", tripId: "demo-trip-spring", category: "travel", description: "Auto + Parken", amount: 130, dueDate: "2027-03-20", isPaid: false, paidByMemberId: null, note: null, createdByMemberId: "demo-member-ben", createdAt: "2027-03-01T11:21:00Z", updatedAt: "2027-03-01T11:21:00Z" },
    ],
    expenses: [
      { id: "demo-spring-expense-1", tripId: "demo-trip-spring", category: "food", description: "Mountain lunch", amount: 66, paidByMemberId: "demo-member-lea", incurredOn: "2027-03-28", dueDate: null, note: null, isSettled: false, createdAt: "2027-03-28T14:00:00Z", updatedAt: "2027-03-28T14:00:00Z" },
    ],
    expenseSplits: [
      { id: "demo-spring-split-1", tripId: "demo-trip-spring", expenseId: "demo-spring-expense-1", memberId: "demo-member-nico", amount: 22, createdAt: "2027-03-28T14:01:00Z" },
      { id: "demo-spring-split-2", tripId: "demo-trip-spring", expenseId: "demo-spring-expense-1", memberId: "demo-member-lea", amount: 22, createdAt: "2027-03-28T14:01:00Z" },
      { id: "demo-spring-split-3", tripId: "demo-trip-spring", expenseId: "demo-spring-expense-1", memberId: "demo-member-ben", amount: 22, createdAt: "2027-03-28T14:01:00Z" },
    ],
    settlements: [],
  },
];

export function buildDemoBundles(liveResorts: Record<string, TripResortLite> = {}) {
  return demoTrips.map((bundle) => {
    const resortMap = Object.fromEntries(
      Array.from(
        new Set(bundle.favorites.map((favorite) => favorite.resortSlug).concat(bundle.trip.preferredResortSlugs))
      ).map((slug) => [slug, liveResorts[slug] ?? demoResortFallbacks[slug]])
    );

    return {
      ...bundle,
      availability: bundle.availability.map((entry) => ({
        ...entry,
        userId: bundle.members.find((member) => member.id === entry.memberId)?.userId ?? null,
        note: entry.note ?? null,
        updatedAt: null,
      })),
      resorts: resortMap,
      isDemo: true,
    } satisfies SkiTripBundle;
  });
}
