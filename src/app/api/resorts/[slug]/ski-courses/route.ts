import { NextResponse } from "next/server";
import {
  getDemoSkiCourseBundleIfEnabled,
  isSkiCourseDemoFallbackEnabled,
  safeExternalUrl,
  type SkiCourseBundle,
  type SkiCourseDataStatus,
  type SkiCourseOffer,
  type SkiSchool,
} from "@/lib/skiCourses";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
};

type SchoolRow = {
  id: string;
  resort_id: string | null;
  resort_slug: string;
  name: string;
  website_url: string | null;
  booking_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  country: string | null;
  region: string | null;
  source_url: string | null;
  data_status: SkiCourseDataStatus | null;
  last_checked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OfferRow = {
  id: string;
  ski_school_id: string;
  resort_id: string | null;
  resort_slug: string;
  course_type: SkiCourseOffer["courseType"];
  target_group: SkiCourseOffer["targetGroup"];
  skill_level: SkiCourseOffer["skillLevel"];
  duration: string | null;
  half_day_available: boolean | null;
  full_day_available: boolean | null;
  private_available: boolean | null;
  group_available: boolean | null;
  snowboard_available: boolean | null;
  children_available: boolean | null;
  adults_available: boolean | null;
  min_age: number | null;
  max_age: number | null;
  price_from: number | string | null;
  currency: string | null;
  price_unit: SkiCourseOffer["priceUnit"];
  equipment_included: boolean | null;
  liftpass_included: boolean | null;
  lunch_included: boolean | null;
  online_booking_available: boolean | null;
  cancellation_hint: string | null;
  meeting_point: string | null;
  language_options: string[] | null;
  source_url: string | null;
  data_status: SkiCourseDataStatus | null;
  last_checked_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const SCHOOL_SELECT = [
  "id",
  "resort_id",
  "resort_slug",
  "name",
  "website_url",
  "booking_url",
  "phone",
  "email",
  "address",
  "country",
  "region",
  "source_url",
  "data_status",
  "last_checked_at",
  "created_at",
  "updated_at",
].join(",");

const OFFER_SELECT = [
  "id",
  "ski_school_id",
  "resort_id",
  "resort_slug",
  "course_type",
  "target_group",
  "skill_level",
  "duration",
  "half_day_available",
  "full_day_available",
  "private_available",
  "group_available",
  "snowboard_available",
  "children_available",
  "adults_available",
  "min_age",
  "max_age",
  "price_from",
  "currency",
  "price_unit",
  "equipment_included",
  "liftpass_included",
  "lunch_included",
  "online_booking_available",
  "cancellation_hint",
  "meeting_point",
  "language_options",
  "source_url",
  "data_status",
  "last_checked_at",
  "created_at",
  "updated_at",
].join(",");

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,139}$/;
const GENERIC_CATALOG_ERROR = "Skikursdaten konnten nicht geladen werden.";

function missingCatalogTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.message?.includes("schema cache") ||
    error.message?.includes("ski_schools") ||
    error.message?.includes("ski_course_offers")
  );
}

function parseCatalogSlug(value: string | undefined) {
  let decoded = "";
  try {
    decoded = decodeURIComponent(value || "");
  } catch {
    return { slug: "", hint: "Ungültiger Resort-Slug." };
  }

  const slug = decoded.trim().toLowerCase();
  if (!slug) return { slug: "", hint: "Kein Resort-Slug übergeben." };
  if (!SLUG_PATTERN.test(slug)) return { slug: "", hint: "Ungültiger Resort-Slug." };
  return { slug, hint: null };
}

function logCatalogError(stage: string, slug: string, error: { code?: string } | null) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[ski-courses]", stage, { slug, code: error?.code ?? "unknown" });
  }
}

function numberOrNull(value: number | string | null) {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function schoolFromRow(row: SchoolRow): SkiSchool {
  return {
    id: row.id,
    resortId: row.resort_id,
    resortSlug: row.resort_slug,
    name: row.name,
    websiteUrl: safeExternalUrl(row.website_url),
    bookingUrl: safeExternalUrl(row.booking_url),
    phone: row.phone,
    email: row.email,
    address: row.address,
    country: row.country,
    region: row.region,
    sourceUrl: safeExternalUrl(row.source_url),
    dataStatus: row.data_status ?? "unknown",
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function offerFromRow(row: OfferRow): SkiCourseOffer {
  return {
    id: row.id,
    skiSchoolId: row.ski_school_id,
    resortId: row.resort_id,
    resortSlug: row.resort_slug,
    courseType: row.course_type,
    targetGroup: row.target_group,
    skillLevel: row.skill_level,
    duration: row.duration,
    halfDayAvailable: row.half_day_available,
    fullDayAvailable: row.full_day_available,
    privateAvailable: row.private_available,
    groupAvailable: row.group_available,
    snowboardAvailable: row.snowboard_available,
    childrenAvailable: row.children_available,
    adultsAvailable: row.adults_available,
    minAge: row.min_age,
    maxAge: row.max_age,
    priceFrom: numberOrNull(row.price_from),
    currency: row.currency ?? "EUR",
    priceUnit: row.price_unit,
    equipmentIncluded: row.equipment_included,
    liftpassIncluded: row.liftpass_included,
    lunchIncluded: row.lunch_included,
    onlineBookingAvailable: row.online_booking_available,
    cancellationHint: row.cancellation_hint,
    meetingPoint: row.meeting_point,
    languageOptions: Array.isArray(row.language_options) ? row.language_options : [],
    sourceUrl: safeExternalUrl(row.source_url),
    dataStatus: row.data_status ?? "unknown",
    lastCheckedAt: row.last_checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptyBundle(slug: string, hint: string | null = null): SkiCourseBundle {
  return {
    resortSlug: slug,
    resortId: null,
    schools: [],
    offers: [],
    configured: true,
    source: "supabase",
    hint,
  };
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const parsedSlug = parseCatalogSlug(slug);
  const safeSlug = parsedSlug.slug;

  if (!safeSlug) {
    return NextResponse.json(emptyBundle("", parsedSlug.hint));
  }

  const { data: schoolRows, error: schoolError } = await supabaseAdmin
    .from("ski_schools")
    .select(SCHOOL_SELECT)
    .eq("resort_slug", safeSlug)
    .order("name", { ascending: true })
    .returns<SchoolRow[]>();

  if (schoolError) {
    if (missingCatalogTable(schoolError)) {
      const demo = getDemoSkiCourseBundleIfEnabled(safeSlug);
      if (!isSkiCourseDemoFallbackEnabled()) {
        logCatalogError("schools_missing_table", safeSlug, schoolError);
        return NextResponse.json({ error: GENERIC_CATALOG_ERROR }, { status: 500 });
      }

      return NextResponse.json(
        demo ?? {
          ...emptyBundle(safeSlug, "Skikursdaten sind für dieses Gebiet noch nicht kuratiert."),
          configured: false,
          source: "fallback",
        }
      );
    }
    logCatalogError("schools_query", safeSlug, schoolError);
    return NextResponse.json({ error: GENERIC_CATALOG_ERROR }, { status: 500 });
  }

  const { data: offerRows, error: offerError } = await supabaseAdmin
    .from("ski_course_offers")
    .select(OFFER_SELECT)
    .eq("resort_slug", safeSlug)
    .order("price_from", { ascending: true, nullsFirst: false })
    .returns<OfferRow[]>();

  if (offerError) {
    if (missingCatalogTable(offerError)) {
      const demo = getDemoSkiCourseBundleIfEnabled(safeSlug);
      if (!isSkiCourseDemoFallbackEnabled()) {
        logCatalogError("offers_missing_table", safeSlug, offerError);
        return NextResponse.json({ error: GENERIC_CATALOG_ERROR }, { status: 500 });
      }

      return NextResponse.json(
        demo ?? {
          ...emptyBundle(safeSlug, "Skikursdaten sind für dieses Gebiet noch nicht kuratiert."),
          configured: false,
          source: "fallback",
        }
      );
    }
    logCatalogError("offers_query", safeSlug, offerError);
    return NextResponse.json({ error: GENERIC_CATALOG_ERROR }, { status: 500 });
  }

  const schools = (schoolRows ?? []).map(schoolFromRow);
  const offers = (offerRows ?? []).map(offerFromRow);
  if (!schools.length && !offers.length) {
    const demo = getDemoSkiCourseBundleIfEnabled(safeSlug);
    if (demo) return NextResponse.json(demo);
    return NextResponse.json(emptyBundle(safeSlug));
  }

  return NextResponse.json({
    resortSlug: safeSlug,
    resortId: schools[0]?.resortId ?? offers[0]?.resortId ?? null,
    schools,
    offers,
    configured: true,
    source: "supabase",
    hint: null,
  } satisfies SkiCourseBundle);
}
