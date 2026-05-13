import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSkiCourseFitScore,
  deriveSkiCourseMapBadges,
  estimateSkiCourseBudgetFromOffer,
  filterSkiCourseOffers,
  formatSkiCoursePrice,
  getDemoSkiCourseBundle,
  getDemoSkiCourseBundleIfEnabled,
  isSkiCourseDemoFallbackEnabled,
  safeExternalUrl,
  summarizeSkiCourseBundle,
  type SkiCourseBundle,
  type SkiCourseFilters,
  type SkiCourseOffer,
} from "./skiCourses.ts";

function emptyBundle(overrides: Partial<SkiCourseBundle> = {}): SkiCourseBundle {
  return {
    resortSlug: "empty-resort",
    resortId: null,
    schools: [],
    offers: [],
    configured: true,
    source: "supabase",
    hint: null,
    ...overrides,
  };
}

function offerWith(overrides: Partial<SkiCourseOffer> = {}): SkiCourseOffer {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);
  return { ...bundle.offers[0], ...overrides };
}

test("summarizeSkiCourseBundle exposes core comparison signals", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const summary = summarizeSkiCourseBundle(bundle);

  assert.equal(summary.schoolCount, 1);
  assert.equal(summary.offerCount, 3);
  assert.equal(summary.priceFrom, 78);
  assert.equal(summary.currency, "EUR");
  assert.equal(summary.childrenAvailable, true);
  assert.equal(summary.adultsAvailable, true);
  assert.equal(summary.privateAvailable, true);
  assert.equal(summary.snowboardAvailable, true);
  assert.equal(summary.onlineBookingAvailable, true);
  assert.equal(summary.dataStatus, "demo");
});

test("summarizeSkiCourseBundle tolerates an empty course catalog", () => {
  const bundle = emptyBundle();
  const summary = summarizeSkiCourseBundle(bundle);

  assert.equal(summary.schoolCount, 0);
  assert.equal(summary.offerCount, 0);
  assert.equal(summary.priceFrom, null);
  assert.equal(summary.currency, null);
  assert.equal(summary.childrenAvailable, false);
  assert.equal(summary.privateAvailable, false);
  assert.equal(summary.dataStatus, "unknown");

  const fit = calculateSkiCourseFitScore(bundle, {
    need: "children",
    beginnerFriendlyScore: Number.NaN,
    familyFriendlyScore: Number.NaN,
  });
  assert.equal(Number.isFinite(fit.score), true);

  assert.deepEqual(deriveSkiCourseMapBadges(bundle), [
    { kind: "incomplete_data", label: "Skikursdaten unvollständig", dataStatus: "unknown" },
  ]);
});

test("filterSkiCourseOffers keeps filters independent and tolerant", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const filters: SkiCourseFilters = {
    targetGroup: "children",
    skillLevel: "beginner",
    courseType: "group",
    onlyOnlineBooking: true,
    maxPriceFrom: 120,
  };

  const offers = filterSkiCourseOffers(bundle.offers, filters);

  assert.equal(offers.length, 1);
  assert.equal(offers[0].childrenAvailable, true);
  assert.equal(offers[0].groupAvailable, true);
  assert.equal(offers[0].onlineBookingAvailable, true);
  assert.equal(offers[0].priceFrom, 78);
});

test("filterSkiCourseOffers can isolate private course offers", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const offers = filterSkiCourseOffers(bundle.offers, { courseType: "private" });

  assert.equal(offers.length, 1);
  assert.equal(offers[0].privateAvailable, true);
});

test("filterSkiCourseOffers returns an empty list when no offer matches", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const offers = filterSkiCourseOffers(bundle.offers, {
    targetGroup: "children",
    skillLevel: "advanced",
    onlyOnlineBooking: true,
    maxPriceFrom: 20,
  });

  assert.deepEqual(offers, []);
});

test("formatting and summaries keep missing prices explicit", () => {
  const offer = offerWith({ priceFrom: null });
  const bundle = emptyBundle({ schools: [], offers: [offer] });
  const summary = summarizeSkiCourseBundle(bundle);
  const budget = estimateSkiCourseBudgetFromOffer(offer, { participants: 1, days: 5 });

  assert.equal(summary.priceFrom, null);
  assert.equal(summary.currency, null);
  assert.equal(formatSkiCoursePrice(offer.priceFrom, offer.currency, offer.priceUnit), "Preis offen");
  assert.equal(budget.amount, null);
  assert.match(budget.note, /Startpreis/);
});

test("safeExternalUrl rejects missing or unsafe external URLs", () => {
  assert.equal(safeExternalUrl(null), null);
  assert.equal(safeExternalUrl(""), null);
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalUrl("ftp://example.com/course"), null);
  assert.equal(safeExternalUrl(" https://example.com/course "), "https://example.com/course");
});

test("calculateSkiCourseFitScore rewards relevant, transparent offers without promising availability", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const score = calculateSkiCourseFitScore(bundle, {
    need: "children",
    beginnerFriendlyScore: 0.72,
    familyFriendlyScore: 0.7,
  });

  assert.ok(score.score >= 70);
  assert.match(score.reasons.join(" "), /Kinderkurse/);
  assert.match(score.warnings.join(" "), /Demo|offiziell/i);
});

test("calculateSkiCourseFitScore keeps missing offers and invalid inputs finite", () => {
  const score = calculateSkiCourseFitScore(emptyBundle(), {
    need: "private",
    beginnerFriendlyScore: Number.NaN,
    familyFriendlyScore: Number.NaN,
  });

  assert.equal(Number.isFinite(score.score), true);
  assert.ok(score.score >= 0);
  assert.ok(score.score <= 100);
});

test("unknown data_status stays visible and conservative", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const unknownBundle = emptyBundle({
    schools: [{ ...bundle.schools[0], dataStatus: "unknown" }],
    offers: [offerWith({ dataStatus: "unknown", priceFrom: null })],
  });

  const summary = summarizeSkiCourseBundle(unknownBundle);
  const fit = calculateSkiCourseFitScore(unknownBundle, { need: "unsure" });
  const badges = deriveSkiCourseMapBadges(unknownBundle);

  assert.equal(summary.dataStatus, "unknown");
  assert.match(fit.warnings.join(" "), /Datenstatus|offizielle/);
  assert.equal(badges.at(-1)?.kind, "incomplete_data");
});

test("demo data remains explicitly marked as demo", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  assert.equal(bundle.source, "demo");
  assert.equal(bundle.schools.every((school) => school.dataStatus === "demo"), true);
  assert.equal(bundle.offers.every((offer) => offer.dataStatus === "demo"), true);
  assert.equal(summarizeSkiCourseBundle(bundle).dataStatus, "demo");
});

test("ski course demo fallback is enabled by default outside production", () => {
  assert.equal(isSkiCourseDemoFallbackEnabled({ NODE_ENV: "development" }), true);
  assert.equal(isSkiCourseDemoFallbackEnabled({ NODE_ENV: "test" }), true);
  assert.ok(getDemoSkiCourseBundleIfEnabled("obertauern", { NODE_ENV: "development" }));
});

test("ski course demo fallback is disabled by default in production", () => {
  assert.equal(isSkiCourseDemoFallbackEnabled({ NODE_ENV: "production" }), false);
  assert.equal(getDemoSkiCourseBundleIfEnabled("obertauern", { NODE_ENV: "production" }), null);
});

test("ski course demo fallback can be explicitly enabled in production", () => {
  const bundle = getDemoSkiCourseBundleIfEnabled("obertauern", {
    NODE_ENV: "production",
    ALPIVO_ENABLE_SKI_COURSE_DEMO_FALLBACK: "true",
  });

  assert.ok(bundle);
  assert.equal(bundle.source, "demo");
  assert.equal(bundle.schools.every((school) => school.dataStatus === "demo"), true);
});

test("ski course demo fallback can be explicitly disabled in development", () => {
  assert.equal(
    getDemoSkiCourseBundleIfEnabled("obertauern", {
      NODE_ENV: "development",
      ALPIVO_ENABLE_SKI_COURSE_DEMO_FALLBACK: "false",
    }),
    null
  );
});

test("missing curated DB rows are separate from demo fallback", () => {
  assert.equal(getDemoSkiCourseBundleIfEnabled("unknown-resort", { NODE_ENV: "development" }), null);
});

test("estimateSkiCourseBudgetFromOffer keeps invalid quantities finite", () => {
  const offer = offerWith({ priceFrom: 100, priceUnit: "day", privateAvailable: false });
  const budget = estimateSkiCourseBudgetFromOffer(offer, {
    participants: Number.NaN,
    days: Number.NaN,
  });

  assert.equal(budget.amount, 100);
  assert.equal(budget.currency, "EUR");
  assert.match(budget.note, /offiziell/);
});

test("deriveSkiCourseMapBadges creates conservative map metadata", () => {
  const bundle = getDemoSkiCourseBundle("obertauern");
  assert.ok(bundle);

  const badges = deriveSkiCourseMapBadges(bundle);

  assert.deepEqual(
    badges.map((badge) => badge.kind),
    ["has_data", "children", "private", "online_booking", "incomplete_data"]
  );
});
