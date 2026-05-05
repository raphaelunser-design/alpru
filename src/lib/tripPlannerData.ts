import { deriveResortDecision, resortSignalSelect, type ResortSignalRow } from "@/lib/resortSignals";
import { getMvpTripResortLookup, sanitizeResortRow } from "@/lib/mvpResorts";
import { supabase } from "@/lib/supabase";
import type {
  SkiTripAvailabilityRecord,
  SkiTripBudgetItemRecord,
  SkiTripBundle,
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
import { buildDemoBundles, demoTripIds, demoTripResortSlugs } from "@/lib/tripPlannerDemo";

type DbErrorLike = { code: string; message: string } | null | undefined;

type TripResortRow = ResortSignalRow;

function isMissingTableError(error: DbErrorLike) {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return /does not exist|not find the table|relation .* does not exist/i.test(error.message ?? "");
}

function sortByCreatedAt<T extends { createdAt: string | null }>(items: T[]) {
  return [...items].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

function sortByDateRange<T extends { startDate: string; endDate: string }>(items: T[]) {
  return [...items].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));
}

function normalizeTrip(row: Record<string, unknown>): SkiTripRecord {
  return {
    id: String(row.id),
    title: String(row.title ?? "Ski Trip"),
    description: typeof row.description === "string" ? row.description : null,
    startRegion: typeof row.start_region === "string" ? row.start_region : null,
    participantTarget: typeof row.participant_target === "number" ? row.participant_target : null,
    budgetPerPerson: typeof row.budget_per_person === "number" ? row.budget_per_person : null,
    skiLevel:
      row.ski_level === "beginner" || row.ski_level === "advanced" || row.ski_level === "mixed" ? row.ski_level : "mixed",
    focus: Array.isArray(row.focus) ? (row.focus.filter((entry): entry is SkiTripRecord["focus"][number] => typeof entry === "string") as SkiTripRecord["focus"]) : [],
    preferredResortSlugs: Array.isArray(row.preferred_resort_slugs)
      ? row.preferred_resort_slugs.filter((entry): entry is string => typeof entry === "string")
      : [],
    createdBy: typeof row.created_by === "string" ? row.created_by : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function normalizeMember(row: Record<string, unknown>): SkiTripMemberRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    userId: typeof row.user_id === "string" ? row.user_id : null,
    displayName: typeof row.display_name === "string" ? row.display_name : "Mitglied",
    email: typeof row.email === "string" ? row.email : null,
    role: row.role === "admin" ? "admin" : "member",
    status: row.status === "invited" || row.status === "open" ? row.status : "joined",
    isDemo: Boolean(row.is_demo),
    demoProfile: row.demo_profile && typeof row.demo_profile === "object" && !Array.isArray(row.demo_profile) ? (row.demo_profile as Record<string, unknown>) : {},
    joinedAt: typeof row.joined_at === "string" ? row.joined_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizeInvite(row: Record<string, unknown>): SkiTripInviteRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    email: typeof row.email === "string" ? row.email : null,
    role: row.role === "admin" ? "admin" : "member",
    inviteToken: String(row.invite_token),
    note: typeof row.note === "string" ? row.note : null,
    status: row.status === "joined" || row.status === "open" ? row.status : "invited",
    expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizeDateOption(row: Record<string, unknown>): SkiTripDateOptionRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    label: String(row.label ?? "Zeitraum"),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    note: typeof row.note === "string" ? row.note : null,
    createdBy: typeof row.created_by === "string" ? row.created_by : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizeAvailability(row: Record<string, unknown>): SkiTripAvailabilityRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    dateOptionId: String(row.date_option_id),
    memberId: String(row.member_id),
    userId: typeof row.user_id === "string" ? row.user_id : null,
    status: row.status === "available" || row.status === "maybe" ? row.status : "unavailable",
    note: typeof row.note === "string" ? row.note : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function normalizeFavorite(row: Record<string, unknown>): SkiTripFavoriteRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    resortId: typeof row.resort_id === "string" ? row.resort_id : null,
    resortSlug: String(row.resort_slug),
    note: typeof row.note === "string" ? row.note : null,
    proposedByMemberId: typeof row.proposed_by_member_id === "string" ? row.proposed_by_member_id : null,
    isPinned: Boolean(row.is_pinned),
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizeVote(row: Record<string, unknown>): SkiTripFavoriteVoteRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    favoriteId: String(row.favorite_id),
    memberId: String(row.member_id),
    voteKind: row.vote_kind === "favorite" ? "favorite" : "like",
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizeComment(row: Record<string, unknown>): SkiTripCommentRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    favoriteId: String(row.favorite_id),
    memberId: String(row.member_id),
    body: String(row.body ?? ""),
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizePriceSnapshot(row: Record<string, unknown>): SkiTripPriceSnapshotRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    favoriteId: String(row.favorite_id),
    dateOptionId: String(row.date_option_id),
    currency: typeof row.currency === "string" ? row.currency : "EUR",
    skipass: typeof row.skipass === "number" ? row.skipass : 0,
    accommodation: typeof row.accommodation === "number" ? row.accommodation : 0,
    travel: typeof row.travel === "number" ? row.travel : 0,
    rental: typeof row.rental === "number" ? row.rental : 0,
    skiSchool: typeof row.ski_school === "number" ? row.ski_school : 0,
    food: typeof row.food === "number" ? row.food : 0,
    buffer: typeof row.buffer === "number" ? row.buffer : 0,
    totalOverride: typeof row.total_override === "number" ? row.total_override : null,
    note: typeof row.note === "string" ? row.note : null,
    sourceKind: row.source_kind === "manual" || row.source_kind === "seed" ? row.source_kind : "estimate",
    updatedByMemberId: typeof row.updated_by_member_id === "string" ? row.updated_by_member_id : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function normalizeBudgetItem(row: Record<string, unknown>): SkiTripBudgetItemRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    category:
      row.category === "accommodation" ||
      row.category === "travel" ||
      row.category === "rental" ||
      row.category === "ski_school" ||
      row.category === "food" ||
      row.category === "other"
        ? row.category
        : "skipass",
    description: String(row.description ?? "Budgetposten"),
    amount: typeof row.amount === "number" ? row.amount : 0,
    dueDate: typeof row.due_date === "string" ? row.due_date : null,
    isPaid: Boolean(row.is_paid),
    paidByMemberId: typeof row.paid_by_member_id === "string" ? row.paid_by_member_id : null,
    note: typeof row.note === "string" ? row.note : null,
    createdByMemberId: typeof row.created_by_member_id === "string" ? row.created_by_member_id : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function normalizeExpense(row: Record<string, unknown>): SkiTripExpenseRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    category:
      row.category === "accommodation" ||
      row.category === "travel" ||
      row.category === "rental" ||
      row.category === "ski_school" ||
      row.category === "food" ||
      row.category === "other"
        ? row.category
        : "skipass",
    description: String(row.description ?? "Ausgabe"),
    amount: typeof row.amount === "number" ? row.amount : 0,
    paidByMemberId: typeof row.paid_by_member_id === "string" ? row.paid_by_member_id : null,
    incurredOn: typeof row.incurred_on === "string" ? row.incurred_on : null,
    dueDate: typeof row.due_date === "string" ? row.due_date : null,
    note: typeof row.note === "string" ? row.note : null,
    isSettled: Boolean(row.is_settled),
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function normalizeExpenseSplit(row: Record<string, unknown>): SkiTripExpenseSplitRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    expenseId: String(row.expense_id),
    memberId: String(row.member_id),
    amount: typeof row.amount === "number" ? row.amount : 0,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

function normalizeSettlement(row: Record<string, unknown>): SkiTripSettlementRecord {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    fromMemberId: String(row.from_member_id),
    toMemberId: String(row.to_member_id),
    amount: typeof row.amount === "number" ? row.amount : 0,
    status: row.status === "paid" ? "paid" : "open",
    note: typeof row.note === "string" ? row.note : null,
    settledAt: typeof row.settled_at === "string" ? row.settled_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  };
}

export async function loadResortLookup(slugs: string[]) {
  const safeSlugs = Array.from(new Set(slugs.filter(Boolean)));
  if (!safeSlugs.length) return {} as Record<string, TripResortLite>;

  const { data, error } = await supabase
    .from("resorts")
    .select(resortSignalSelect)
    .in("slug", safeSlugs)
    .returns<TripResortRow[]>();

  if (error || !data.length) return getMvpTripResortLookup(safeSlugs);

  const lookup: Record<string, TripResortLite> = {};
  for (const row of data) {
    const resort = sanitizeResortRow(row);
    const decision = deriveResortDecision(resort, {
      apres: 3,
      emptySlopes: 3,
      infrastructure: 4,
      huts: 3,
      snowReliability: 4,
      valueForMoney: 3,
      family: 3,
      easyRuns: 3,
      challenging: 3,
      panorama: 4,
      summerGlacier: 2,
      budgetMax: 650,
    });
    if (!resort.slug) continue;
    lookup[resort.slug] = {
      id: resort.id,
      slug: resort.slug,
      name: resort.name,
      country: resort.country,
      region: resort.region ?? null,
      imageUrl: (resort.hero_image_url || "").trim() || (resort.image_url || "").trim() || null,
      pisteKm: resort.piste_km_total ?? resort.piste_km ?? null,
      elevationMinM: resort.elevation_min_m ?? null,
      elevationMaxM: resort.elevation_max_m ?? null,
      verticalM: resort.vertical_m ?? null,
      skipassPriceFrom: resort.skipass_price_from ?? null,
      officialUrl: resort.official_url ?? null,
      lat: typeof resort.lat === "number" ? resort.lat : null,
      lon: typeof resort.lon === "number" ? resort.lon : null,
      matchPct: decision.matchPct,
    };
  }

  return { ...getMvpTripResortLookup(safeSlugs), ...lookup };
}

export async function loadDemoTripBundles() {
  const resortLookup = await loadResortLookup(demoTripResortSlugs);
  return buildDemoBundles(resortLookup);
}

export async function loadTripBundlesForUser(userId: string) {
  const { data: membershipRows, error: membershipError } = await supabase
    .from("ski_trip_members")
    .select("trip_id")
    .eq("user_id", userId);

  if (membershipError) {
    throw membershipError;
  }

  const tripIds = Array.from(new Set((membershipRows ?? []).map((row) => row.trip_id).filter(Boolean)));
  if (!tripIds.length) return [] as SkiTripBundle[];

  const [
    tripsResult,
    membersResult,
    invitesResult,
    dateOptionsResult,
    availabilityResult,
    favoritesResult,
    votesResult,
    commentsResult,
    priceSnapshotsResult,
    budgetItemsResult,
    expensesResult,
    expenseSplitsResult,
    settlementsResult,
  ] = await Promise.all([
    supabase.from("ski_trips").select("*").in("id", tripIds),
    supabase.from("ski_trip_members").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_invites").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_date_options").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_availability").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_favorites").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_favorite_votes").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_comments").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_price_snapshots").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_budget_items").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_expenses").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_expense_splits").select("*").in("trip_id", tripIds),
    supabase.from("ski_trip_settlements").select("*").in("trip_id", tripIds),
  ]);

  const maybeMissingError =
    tripsResult.error ||
    membersResult.error ||
    invitesResult.error ||
    dateOptionsResult.error ||
    availabilityResult.error ||
    favoritesResult.error ||
    votesResult.error ||
    commentsResult.error ||
    priceSnapshotsResult.error ||
    budgetItemsResult.error ||
    expensesResult.error ||
    expenseSplitsResult.error ||
    settlementsResult.error;

  if (maybeMissingError) {
    throw maybeMissingError;
  }

  const trips = (tripsResult.data ?? []).map((row) => normalizeTrip(row as Record<string, unknown>));
  const members = (membersResult.data ?? []).map((row) => normalizeMember(row as Record<string, unknown>));
  const invites = (invitesResult.data ?? []).map((row) => normalizeInvite(row as Record<string, unknown>));
  const dateOptions = (dateOptionsResult.data ?? []).map((row) => normalizeDateOption(row as Record<string, unknown>));
  const availability = (availabilityResult.data ?? []).map((row) => normalizeAvailability(row as Record<string, unknown>));
  const favorites = (favoritesResult.data ?? []).map((row) => normalizeFavorite(row as Record<string, unknown>));
  const votes = (votesResult.data ?? []).map((row) => normalizeVote(row as Record<string, unknown>));
  const comments = (commentsResult.data ?? []).map((row) => normalizeComment(row as Record<string, unknown>));
  const priceSnapshots = (priceSnapshotsResult.data ?? []).map((row) => normalizePriceSnapshot(row as Record<string, unknown>));
  const budgetItems = (budgetItemsResult.data ?? []).map((row) => normalizeBudgetItem(row as Record<string, unknown>));
  const expenses = (expensesResult.data ?? []).map((row) => normalizeExpense(row as Record<string, unknown>));
  const expenseSplits = (expenseSplitsResult.data ?? []).map((row) => normalizeExpenseSplit(row as Record<string, unknown>));
  const settlements = (settlementsResult.data ?? []).map((row) => normalizeSettlement(row as Record<string, unknown>));

  const resortSlugs = Array.from(
    new Set(
      favorites.map((favorite) => favorite.resortSlug).concat(...trips.map((trip) => trip.preferredResortSlugs))
    )
  );
  const resortLookup = await loadResortLookup(resortSlugs);

  return trips
    .map((trip) => ({
      trip,
      members: sortByCreatedAt(members.filter((row) => row.tripId === trip.id)),
      invites: sortByCreatedAt(invites.filter((row) => row.tripId === trip.id)),
      dateOptions: sortByDateRange(dateOptions.filter((row) => row.tripId === trip.id)),
      availability: availability.filter((row) => row.tripId === trip.id),
      favorites: sortByCreatedAt(favorites.filter((row) => row.tripId === trip.id)),
      votes: votes.filter((row) => row.tripId === trip.id),
      comments: sortByCreatedAt(comments.filter((row) => row.tripId === trip.id)),
      priceSnapshots: priceSnapshots.filter((row) => row.tripId === trip.id),
      budgetItems: sortByCreatedAt(budgetItems.filter((row) => row.tripId === trip.id)),
      expenses: sortByCreatedAt(expenses.filter((row) => row.tripId === trip.id)),
      expenseSplits: expenseSplits.filter((row) => row.tripId === trip.id),
      settlements: sortByCreatedAt(settlements.filter((row) => row.tripId === trip.id)),
      resorts: Object.fromEntries(
        Object.entries(resortLookup).filter(([slug]) =>
          favorites.some((favorite) => favorite.tripId === trip.id && favorite.resortSlug === slug)
        )
      ),
      isDemo: false,
    }))
    .sort((a, b) => (b.trip.updatedAt ?? "").localeCompare(a.trip.updatedAt ?? ""));
}

export async function loadTripBundleById(tripId: string, userId: string | null) {
  if (demoTripIds.includes(tripId as (typeof demoTripIds)[number])) {
    const demoBundles = await loadDemoTripBundles();
    return demoBundles.find((bundle) => bundle.trip.id === tripId) ?? null;
  }

  if (!userId) return null;

  try {
    const bundles = await loadTripBundlesForUser(userId);
    return bundles.find((bundle) => bundle.trip.id === tripId) ?? null;
  } catch (error) {
    if (isMissingTableError(error as DbErrorLike)) {
      return null;
    }
    throw error;
  }
}

export function shouldFallbackToDemo(error: DbErrorLike) {
  return isMissingTableError(error);
}
