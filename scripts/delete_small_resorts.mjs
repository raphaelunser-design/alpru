import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");
const MIN_KM = Number.parseFloat(process.env.MIN_PISTE_KM || "2");

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

async function main() {
  loadEnvFile(ENV_FILE);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE env fehlt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY setzen.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  console.log(`Lösche Resorts mit < ${MIN_KM} km (piste_km_total oder piste_km).`);

  const { data, error } = await supabase
    .from("resorts")
    .delete()
    .lt("piste_km_total", MIN_KM);

  if (error) throw error;
  const deletedPrimary = Array.isArray(data) ? data.length : 0;

  const { data: data2, error: error2 } = await supabase
    .from("resorts")
    .delete()
    .lt("piste_km", MIN_KM);

  if (error2) throw error2;
  const deletedSecondary = Array.isArray(data2) ? data2.length : 0;

  console.log(`Gelöscht (piste_km_total): ${deletedPrimary}, gelöscht (piste_km): ${deletedSecondary}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
