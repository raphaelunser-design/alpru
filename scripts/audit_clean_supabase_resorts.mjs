import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const linkFields = [
  "official_url",
  "piste_map_url",
  "lift_status_url",
  "skipass_url",
  "openskimap_url",
  "skimap_url",
  "wikipedia_url",
  "image_url",
];

const selectColumns = [
  "id",
  "slug",
  "name",
  "country",
  "region",
  "piste_km",
  "piste_km_total",
  ...linkFields,
].join(",");

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function ensureBackupDir() {
  const dir = path.join(root, "backups");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function fetchAllResorts() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from("resorts").select(selectColumns).range(from, to).order("name");
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

function pisteKm(row) {
  const value = row.piste_km_total ?? row.piste_km;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function normalizeUrl(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function shouldClearFromStatus(status) {
  return [400, 404, 410, 414, 451].includes(status);
}

function isPlaceholder(raw) {
  const value = String(raw ?? "").toLowerCase();
  return (
    value.includes("example.com") ||
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("todo") ||
    value === "https://" ||
    value === "http://"
  );
}

async function probeUrl(raw) {
  const url = normalizeUrl(raw);
  if (!url) return { ok: false, clear: true, reason: "invalid_url", status: null, finalUrl: null };
  if (isPlaceholder(raw)) return { ok: false, clear: true, reason: "placeholder_url", status: null, finalUrl: url };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  const headers = {
    "user-agent": "Alpivo link audit (+https://alpivo.de)",
    accept: "*/*",
  };

  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers });
    if ([401, 403, 405, 429].includes(response.status)) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers });
    }
    const status = response.status;
    return {
      ok: status >= 200 && status < 400,
      clear: shouldClearFromStatus(status),
      reason: status >= 200 && status < 400 ? "ok" : `http_${status}`,
      status,
      finalUrl: response.url,
    };
  } catch (error) {
    const message = error instanceof Error ? error.name || error.message : "fetch_error";
    const clear = ["TypeError"].includes(message);
    return { ok: false, clear, reason: message, status: null, finalUrl: url };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

async function deleteSmallResorts(rows, stamp, backupDir) {
  const small = rows.filter((row) => {
    const km = pisteKm(row);
    return km !== null && km < 6;
  });

  fs.writeFileSync(
    path.join(backupDir, `small-resorts-under-6km-${stamp}.json`),
    JSON.stringify(small, null, 2),
    "utf8"
  );

  const ids = small.map((row) => row.id).filter(Boolean);
  const slugs = small.map((row) => row.slug).filter(Boolean);

  for (const part of chunk(slugs, 100)) {
    const { error } = await supabase.from("resort_ratings").delete().in("resort_slug", part);
    if (error) throw error;
  }

  let deleted = 0;
  for (const part of chunk(ids, 100)) {
    const { error, count } = await supabase.from("resorts").delete({ count: "exact" }).in("id", part);
    if (error) throw error;
    deleted += count ?? part.length;
  }

  return { candidates: small.length, deleted };
}

async function auditAndCleanLinks(rows, stamp, backupDir) {
  const checks = [];
  for (const row of rows) {
    for (const field of linkFields) {
      const value = row[field];
      if (typeof value === "string" && value.trim()) {
        checks.push({ row, field, value });
      }
    }
  }

  let done = 0;
  const results = await mapWithConcurrency(checks, 24, async (item) => {
    const result = await probeUrl(item.value);
    done += 1;
    if (done % 100 === 0 || done === checks.length) {
      console.log(`Checked ${done}/${checks.length} links`);
    }
    return {
      resort_id: item.row.id,
      slug: item.row.slug,
      name: item.row.name,
      country: item.row.country,
      field: item.field,
      value: item.value,
      ...result,
    };
  });

  const issues = results.filter((result) => !result.ok);
  const clearable = issues.filter((result) => result.clear);
  fs.writeFileSync(path.join(backupDir, `link-audit-${stamp}.json`), JSON.stringify(results, null, 2), "utf8");

  const updates = new Map();
  for (const issue of clearable) {
    if (!updates.has(issue.resort_id)) updates.set(issue.resort_id, { id: issue.resort_id, fields: {}, issues: [] });
    const entry = updates.get(issue.resort_id);
    entry.fields[issue.field] = null;
    entry.issues.push(issue);
  }

  let clearedFields = 0;
  let updatedRows = 0;
  for (const entry of updates.values()) {
    const { error } = await supabase.from("resorts").update(entry.fields).eq("id", entry.id);
    if (error) throw error;
    updatedRows += 1;
    clearedFields += Object.keys(entry.fields).length;
  }

  fs.writeFileSync(
    path.join(backupDir, `links-cleared-${stamp}.json`),
    JSON.stringify(Array.from(updates.values()), null, 2),
    "utf8"
  );

  return {
    checkedLinks: checks.length,
    issues: issues.length,
    clearable: clearable.length,
    updatedRows,
    clearedFields,
    issueReasons: issues.reduce((acc, issue) => {
      acc[issue.reason] = (acc[issue.reason] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

const stamp = timestamp();
const backupDir = ensureBackupDir();
const before = await fetchAllResorts();
fs.writeFileSync(path.join(backupDir, `resorts-before-cleanup-${stamp}.json`), JSON.stringify(before, null, 2), "utf8");

console.log(`Fetched ${before.length} resorts`);
const deleteSummary = await deleteSmallResorts(before, stamp, backupDir);
console.log(`Deleted ${deleteSummary.deleted}/${deleteSummary.candidates} resorts below 6 piste km`);

const afterDelete = await fetchAllResorts();
const linkSummary = await auditAndCleanLinks(afterDelete, stamp, backupDir);
const afterClean = await fetchAllResorts();
const remainingSmall = afterClean.filter((row) => {
  const km = pisteKm(row);
  return km !== null && km < 6;
});

const summary = {
  stamp,
  beforeResorts: before.length,
  afterResorts: afterClean.length,
  deletedSmallResorts: deleteSummary.deleted,
  remainingSmallResorts: remainingSmall.length,
  linkSummary,
};

fs.writeFileSync(path.join(backupDir, `cleanup-summary-${stamp}.json`), JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify(summary, null, 2));
