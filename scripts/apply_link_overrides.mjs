import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");
const INPUT_FILE = process.env.INPUT_FILE || "resorts_link_overrides.csv";

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

async function main() {
  loadEnvFile(ENV_FILE);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE env fehlt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY setzen.");
  }

  const inputPath = path.join(PROJECT_ROOT, INPUT_FILE);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input fehlt: ${inputPath}`);
  }

  const text = fs.readFileSync(inputPath, "utf8");
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("Override CSV ist leer.");
  }

  const header = rows[0];
  const slugIdx = header.indexOf("slug");
  const urlIdx = header.indexOf("official_url");
  if (slugIdx === -1 || urlIdx === -1) {
    throw new Error("Override CSV braucht Spalten slug und official_url.");
  }

  const updates = rows
    .slice(1)
    .map((row) => ({
      slug: row[slugIdx]?.trim(),
      official_url: row[urlIdx]?.trim() || null,
    }))
    .filter((row) => row.slug);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log(`Wende ${updates.length} Overrides an...`);
  let updated = 0;
  for (const row of updates) {
    if (!row.official_url) continue;
    const { error } = await supabase.from("resorts").update({ official_url: row.official_url }).eq("slug", row.slug);
    if (error) throw error;
    updated += 1;
  }
  console.log(`Overrides angewendet: ${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
