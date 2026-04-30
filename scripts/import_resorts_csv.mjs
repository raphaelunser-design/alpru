import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");
const CSV_FILE = process.env.CSV_FILE || "resorts_seed_alps_2km.csv";
const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || "400", 10);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key || process.env[key]) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function coerceValue(key, value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const numericFields = new Set([
    "piste_km",
    "apres_score",
    "crowd_score",
    "infra_score",
    "hut_score",
    "park_score",
    "beginner_score",
    "advanced_score",
    "lat",
    "lon",
    "piste_km_total",
    "piste_km_easy",
    "piste_km_intermediate",
    "piste_km_advanced",
    "runs_count_total",
    "lifts_count_total",
    "elevation_min_m",
    "elevation_max_m",
    "vertical_m",
  ]);

  if (numericFields.has(key)) {
    const number = Number.parseFloat(trimmed);
    return Number.isFinite(number) ? number : null;
  }

  return trimmed;
}

async function main() {
  loadEnvFile(ENV_FILE);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE env fehlt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY setzen.");
  }

  const csvPath = path.join(PROJECT_ROOT, CSV_FILE);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV nicht gefunden: ${csvPath}`);
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error("CSV enthält keine Datenzeilen.");
  }

  const header = rows[0];
  const records = rows.slice(1).map((fields) => {
    const record = {};
    for (let i = 0; i < header.length; i += 1) {
      const key = header[i];
      record[key] = coerceValue(key, fields[i]);
    }
    return record;
  });

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: existing, error: existingError } = await supabase.from("resorts").select("id, slug");
  if (existingError) throw existingError;

  const slugToId = new Map();
  for (const row of existing || []) {
    if (row?.slug && !slugToId.has(row.slug)) slugToId.set(row.slug, row.id);
  }

  for (const record of records) {
    const existingId = record.slug ? slugToId.get(record.slug) : null;
    if (existingId) {
      record.id = existingId;
    } else {
      record.id = crypto.randomUUID();
    }
  }

  console.log(`Starte Upsert: ${records.length} Resorts in ${Math.ceil(records.length / BATCH_SIZE)} Batches.`);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("resorts").upsert(batch, { onConflict: "id" });
    if (error) throw error;
    console.log(`Batch ${i + 1}-${Math.min(i + BATCH_SIZE, records.length)} ok`);
  }

  console.log("Import abgeschlossen.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
