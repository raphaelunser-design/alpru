import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  deriveResortDecision,
  resortSignalSelect,
  resolveBudgetCap,
  type MatchPreferences,
  type ResortDecision,
  type ResortSignalRow,
} from "@/lib/resortSignals";
import { getMvpResorts, mergeWithMvpResorts } from "@/lib/mvpResorts";

const PrefSchema = z.object({
  tripStyle: z
    .enum(["balanced", "budget", "apres", "family", "sport", "premium", "quiet", "powder", "glacier", "offpiste"])
    .optional(),
  tripStartDate: z.string().nullable().optional(),
  tripEndDate: z.string().nullable().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  budget: z.number().min(0).optional(),
  peopleCount: z.number().min(1).max(12).optional(),
  apres: z.number().min(0).max(5),
  emptySlopes: z.number().min(0).max(5),
  infrastructure: z.number().min(0).max(5),
  huts: z.number().min(0).max(5),
  snowpark: z.number().min(0).max(5),
  easyRuns: z.number().min(0).max(5),
  challenging: z.number().min(0).max(5),
  snowReliability: z.number().min(0).max(5).optional(),
  valueForMoney: z.number().min(0).max(5).optional(),
  family: z.number().min(0).max(5).optional(),
  panorama: z.number().min(0).max(5).optional(),
  summerGlacier: z.number().min(0).max(5).optional(),
  offPiste: z.number().min(0).max(5).optional(),
  foodSpendLevel: z.enum(["budget", "standard", "comfort"]).optional(),
  needRental: z.boolean().optional(),
  rentalMode: z.enum(["own", "rent"]).optional(),
  travelMode: z.enum(["car", "train", "bus", "flight"]).optional(),
  excludeCountries: z.array(z.string()).optional(),
  excludeGlacier: z.boolean().optional(),
  excludePremium: z.boolean().optional(),
  excludeFamilyOnly: z.boolean().optional(),
});

type Prefs = z.infer<typeof PrefSchema>;

const RESULT_LIMIT = 600;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = PrefSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const prefs: Prefs = parsed.data;
    const budgetCap = resolveBudgetCap(prefs);

    const { data: resorts, error } = await supabase
      .from("resorts")
      .select(resortSignalSelect)
      .limit(RESULT_LIMIT)
      .returns<ResortSignalRow[]>();

    const sourceResorts = error || !resorts?.length ? getMvpResorts(35) : mergeWithMvpResorts(resorts, 35);

    const allScored: ResortDecision[] = sourceResorts.map((resort) =>
      deriveResortDecision(resort, prefs as MatchPreferences, budgetCap)
    );
    const scored = allScored.filter((resort) => resort.exclusionReasons.length === 0);
    const excluded = allScored.filter((resort) => resort.exclusionReasons.length > 0);

    scored.sort((a, b) => {
      if (b.matchPct !== a.matchPct) return b.matchPct - a.matchPct;
      if (prefs.tripStyle === "family") {
        const comfort = (b.fitProfile.comfort ?? 0) - (a.fitProfile.comfort ?? 0);
        if (comfort !== 0) return comfort;
        return a.cost.totalMax - b.cost.totalMax;
      }
      if (prefs.tripStyle === "budget") {
        const value = (b.fitProfile.value ?? 0) - (a.fitProfile.value ?? 0);
        if (value !== 0) return value;
        return a.cost.totalMax - b.cost.totalMax;
      }
      if (prefs.tripStyle === "quiet") {
        const comfort = (b.fitProfile.comfort ?? 0) - (a.fitProfile.comfort ?? 0);
        if (comfort !== 0) return comfort;
      }
      if (prefs.tripStyle === "glacier") {
        const summer = (b.summerGlacierScore ?? b.fitProfile.summer ?? 0) - (a.summerGlacierScore ?? a.fitProfile.summer ?? 0);
        if (summer !== 0) return summer;
      }
      if (prefs.tripStyle === "offpiste") {
        const offPiste = (b.fitProfile.offPiste ?? 0) - (a.fitProfile.offPiste ?? 0);
        if (offPiste !== 0) return offPiste;
      }
      const pisteA = a.pisteKm ?? 0;
      const pisteB = b.pisteKm ?? 0;
      if (pisteB !== pisteA) return pisteB - pisteA;
      return a.name.localeCompare(b.name, "de-DE");
    });

    return NextResponse.json({
      results: scored,
      excluded,
      source: error || !resorts?.length ? "mvp-fallback" : "supabase",
      note: error ? "Supabase-Daten konnten nicht geladen werden, Matching nutzt kuratierte MVP-Resorts." : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
