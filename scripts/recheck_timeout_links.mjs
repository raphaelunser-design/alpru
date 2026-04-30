import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupDir = path.join(root, "backups");
const timeoutMs = Number(process.env.TIMEOUT_MS ?? 18000);
const concurrency = Number(process.env.CONCURRENCY ?? 8);

const browserHeaders = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 AlpivoLinkAudit/1.0",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7",
  "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
  "cache-control": "no-cache",
};

const ticketKeywords = [
  "skipass",
  "ski-pass",
  "ski pass",
  "liftticket",
  "lift-ticket",
  "lift ticket",
  "ticket",
  "tickets",
  "ticketshop",
  "online-ticket",
  "online ticket",
  "onlineshop",
  "online-shop",
  "webshop",
  "shop",
  "preise",
  "preis",
  "tarife",
  "tarif",
  "price",
  "prices",
  "rates",
  "forfait",
  "forfaits",
  "tarifs",
  "biglietti",
  "prezzi",
  "billetteria",
  "kaufen",
  "buy",
];

const negativeKeywords = ["sommer", "summer", "bike", "wandern", "hiking", "gutschein", "voucher", "job"];
const winterKeywords = ["winter", "ski", "skipass", "schnee", "snow", "forfait", "piste"];

const partnerDomains = [
  "shop.starjack.at",
  "starjack.at",
  "axess.shop",
  "shop.axess",
  "skidata.io",
  "shop.skidata.com",
  "ticketcorner.ch",
  "alturos.com",
  "feratel.com",
  "incert.at",
  "onebox.com",
  "shop.bergbahnen",
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function latestFile(prefix) {
  const explicit = process.env.INPUT_FILE;
  if (explicit && prefix === "link-audit-") return path.resolve(root, explicit);

  const files = fs
    .readdirSync(backupDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
    .map((name) => {
      const fullPath = path.join(backupDir, name);
      return { name, fullPath, mtime: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (!files.length) throw new Error(`Keine Datei mit Prefix ${prefix} in backups gefunden.`);
  return files[0].fullPath;
}

function normalizeUrl(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function hostOf(raw) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isMapField(field) {
  return ["piste_map_url", "openskimap_url", "skimap_url"].includes(field);
}

function isKnownMapService(raw) {
  const host = hostOf(raw);
  return host === "skimap.org" || host === "openskimap.org";
}

function pisteKm(row) {
  const value = row?.piste_km_total ?? row?.piste_km;
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function stripTags(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß");
}

function scoreTicketCandidate(candidate, baseUrl) {
  const text = `${candidate.text} ${candidate.url}`.toLowerCase();
  let pathAndLabel = text;
  try {
    const parsed = new URL(candidate.url);
    pathAndLabel = `${parsed.pathname} ${parsed.search} ${parsed.hash} ${candidate.text}`.toLowerCase();
  } catch {
    // keep combined fallback text
  }
  const host = hostOf(candidate.url);
  const baseHost = hostOf(baseUrl);
  let score = 0;

  for (const keyword of ticketKeywords) {
    if (text.includes(keyword)) score += keyword.includes("ticket") || keyword.includes("skipass") ? 18 : 10;
  }
  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) score -= 18;
  }
  for (const keyword of winterKeywords) {
    if (text.includes(keyword)) score += 8;
  }
  if (/(sommer|summer|bike|wandern|hiking)/i.test(text) && !/(winter|ski|skipass|schnee|snow|forfait|piste)/i.test(text)) {
    score -= 55;
  }
  if (
    /(sommer|summer|bike|wandern|hiking)/i.test(pathAndLabel) &&
    !/(winter|skipass|ski-pass|ski pass|skiticket|lift.?ticket|forfait|piste)/i.test(pathAndLabel)
  ) {
    score -= 90;
  }
  if (/(2023|2024[-/ ]?25|2024\/25)/i.test(text) && !/(2025[-/ ]?26|2026|2026\/27)/i.test(text)) {
    score -= 22;
  }
  if (/(2025[-/ ]?26|2026|2026\/27)/i.test(text)) score += 8;
  if (partnerDomains.some((domain) => host.includes(domain))) score += 35;
  if (host && baseHost && host !== baseHost) score += 8;
  if (host && baseHost && host === baseHost) score += 4;
  if (/\/(shop|tickets?|skipass|preise|tarife|forfait|biglietti)(\/|$|\?|#|-)/i.test(candidate.url)) score += 24;

  return Math.max(0, score);
}

function extractTicketCandidates(html, baseUrl) {
  const out = [];
  const seen = new Set();
  const anchorRegex = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html))) {
    const href = decodeHtml(match[1] ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    let url;
    try {
      url = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }

    const text = decodeHtml(stripTags(match[2] ?? ""));
    const haystack = `${text} ${url}`.toLowerCase();
    if (!ticketKeywords.some((keyword) => haystack.includes(keyword))) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const candidate = { url, text };
    out.push({ ...candidate, score: scoreTicketCandidate(candidate, baseUrl) });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 8);
}

async function fetchWithTimeout(url, method = "GET") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      headers: browserHeaders,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    let html = "";
    if (method === "GET" && contentType.toLowerCase().includes("text/html")) {
      html = await response.text();
    }
    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      finalUrl: response.url,
      contentType,
      html,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      finalUrl: url,
      contentType: "",
      html: "",
      error: error instanceof Error ? error.name || error.message : "fetch_error",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeUrl(raw) {
  const url = normalizeUrl(raw);
  if (!url) {
    return { ok: false, status: null, reason: "invalid_url", finalUrl: null, contentType: "", ticketCandidates: [] };
  }

  let result = await fetchWithTimeout(url, "GET");
  if (!result.ok && [405, 501].includes(result.status ?? 0)) {
    result = await fetchWithTimeout(url, "HEAD");
  }

  const reason = result.ok
    ? "ok"
    : result.status
      ? `http_${result.status}`
      : result.error === "AbortError"
        ? "timeout"
        : result.error || "fetch_error";

  return {
    ok: result.ok,
    status: result.status,
    reason,
    finalUrl: result.finalUrl,
    contentType: result.contentType,
    ticketCandidates: result.ok && result.html ? extractTicketCandidates(result.html, result.finalUrl || url) : [],
  };
}

async function probeCandidateUrl(raw) {
  const url = normalizeUrl(raw);
  if (!url) return { ok: false, status: null, reason: "invalid_url", finalUrl: null };
  const result = await fetchWithTimeout(url, "GET");
  return {
    ok: result.ok,
    status: result.status,
    reason: result.ok
      ? "ok"
      : result.status
        ? `http_${result.status}`
        : result.error === "AbortError"
          ? "timeout"
          : result.error || "fetch_error",
    finalUrl: result.finalUrl,
  };
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

function classifyPriority(row, recheck, resort) {
  const km = pisteKm(resort);
  const sizeScore = km === null ? 0 : km >= 150 ? 30 : km >= 80 ? 22 : km >= 30 ? 13 : km >= 12 ? 6 : 0;
  const bestCandidate = recheck.ticketCandidates[0] ?? null;
  const candidateScore = bestCandidate?.score ?? 0;
  const mapOnly = isMapField(row.field) || isKnownMapService(row.value);
  let affiliatePriority = "low";
  let action = "manual_review";
  let priorityScore = sizeScore;

  if (bestCandidate && candidateScore >= 45) {
    affiliatePriority = "high";
    action = "review_skipass_candidate";
    priorityScore += 70 + candidateScore;
  } else if (row.field === "official_url" && recheck.ok) {
    affiliatePriority = km !== null && km >= 80 ? "medium" : "low";
    action = "manual_ticket_search_on_official_site";
    priorityScore += 35;
  } else if (row.field === "official_url" && ["http_403", "http_429", "timeout"].includes(recheck.reason)) {
    affiliatePriority = "medium";
    action = "manual_browser_check_official_site";
    priorityScore += 28;
  } else if (mapOnly && recheck.ok) {
    affiliatePriority = "map_only";
    action = "keep_for_embedded_piste_map";
    priorityScore += 12;
  } else if (mapOnly && !recheck.ok) {
    affiliatePriority = "map_only";
    action = "retry_or_replace_map_source";
    priorityScore += 8;
  } else if (["http_404", "http_410", "http_400"].includes(recheck.reason)) {
    affiliatePriority = "broken_low";
    action = "replace_or_clear_link";
    priorityScore -= 10;
  }

  return {
    priorityScore,
    affiliatePriority,
    action,
    pisteKm: km,
    bestCandidate,
  };
}

function writeCsv(filePath, rows) {
  const header = [
    "rank",
    "priority_score",
    "affiliate_priority",
    "action",
    "slug",
    "name",
    "country",
    "piste_km",
    "field",
    "checked_url",
    "recheck_reason",
    "status",
    "final_url",
    "best_skipass_candidate",
    "candidate_score",
    "candidate_text",
    "candidate_recheck_reason",
    "candidate_status",
    "candidate_final_url",
    "candidate_count",
    "notes",
  ];

  const lines = [header.join(",")];
  for (const [idx, row] of rows.entries()) {
    lines.push(
      [
        idx + 1,
        row.priorityScore,
        row.affiliatePriority,
        row.action,
        row.slug,
        row.name,
        row.country,
        row.pisteKm ?? "",
        row.field,
        row.value,
        row.reason,
        row.status ?? "",
        row.finalUrl ?? "",
        row.bestCandidate?.url ?? "",
        row.bestCandidate?.score ?? "",
        row.bestCandidate?.text ?? "",
        row.candidateCheck?.reason ?? "",
        row.candidateCheck?.status ?? "",
        row.candidateCheck?.finalUrl ?? "",
        row.ticketCandidates.length,
        row.notes,
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

function writeCandidateCsv(filePath, rows) {
  const header = [
    "slug",
    "name",
    "country",
    "piste_km",
    "current_skipass_url",
    "candidate_skipass_url",
    "candidate_text",
    "candidate_score",
    "candidate_recheck_reason",
    "candidate_status",
    "candidate_final_url",
    "source_official_url",
    "priority_score",
    "review_status",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.slug,
        row.name,
        row.country,
        row.pisteKm ?? "",
        row.currentSkipassUrl ?? "",
        row.bestCandidate?.url ?? "",
        row.bestCandidate?.text ?? "",
        row.bestCandidate?.score ?? "",
        row.candidateCheck?.reason ?? "",
        row.candidateCheck?.status ?? "",
        row.candidateCheck?.finalUrl ?? "",
        row.value,
        row.priorityScore,
        "needs_manual_review",
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

const stamp = timestamp();
const auditPath = latestFile("link-audit-");
const resortBackupPath = latestFile("resorts-before-cleanup-");
const auditRows = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const resortRows = JSON.parse(fs.readFileSync(resortBackupPath, "utf8"));
const resortById = new Map(resortRows.map((row) => [row.id, row]));

const timeoutRows = auditRows.filter((row) => row.ok === false && row.reason === "AbortError");
const uniqueByUrl = new Map();
for (const row of timeoutRows) {
  const normalized = normalizeUrl(row.value) ?? row.value;
  if (!uniqueByUrl.has(normalized)) uniqueByUrl.set(normalized, []);
  uniqueByUrl.get(normalized).push(row);
}

const uniqueUrls = Array.from(uniqueByUrl.keys());
console.log(`Audit: ${path.basename(auditPath)}`);
console.log(`Timeout rows: ${timeoutRows.length}`);
console.log(`Unique timeout URLs: ${uniqueUrls.length}`);
console.log(`Recheck concurrency=${concurrency}, timeout=${timeoutMs}ms`);

let done = 0;
const urlResults = await mapWithConcurrency(uniqueUrls, concurrency, async (url) => {
  const result = await probeUrl(url);
  done += 1;
  if (done % 10 === 0 || done === uniqueUrls.length) {
    console.log(`Rechecked ${done}/${uniqueUrls.length}`);
  }
  return [url, result];
});

const resultByUrl = new Map(urlResults);
const expanded = timeoutRows.map((row) => {
  const normalized = normalizeUrl(row.value) ?? row.value;
  const recheck = resultByUrl.get(normalized);
  const resort = resortById.get(row.resort_id) ?? {};
  const priority = classifyPriority(row, recheck, resort);
  const mapService = isKnownMapService(row.value);

  return {
    resort_id: row.resort_id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    region: resort.region ?? "",
    field: row.field,
    value: row.value,
    ok: recheck.ok,
    status: recheck.status,
    reason: recheck.reason,
    finalUrl: recheck.finalUrl,
    contentType: recheck.contentType,
    ticketCandidates: recheck.ticketCandidates,
    bestCandidate: priority.bestCandidate,
    currentSkipassUrl: resort.skipass_url ?? "",
    priorityScore: priority.priorityScore,
    affiliatePriority: priority.affiliatePriority,
    action: priority.action,
    pisteKm: priority.pisteKm,
    notes: mapService
      ? "known_map_service_not_affiliate"
      : row.field === "official_url"
        ? "official_site_affiliate_relevant"
        : "",
  };
});

const candidateUrls = Array.from(
  new Set(expanded.map((row) => row.bestCandidate?.url).filter((url) => typeof url === "string" && url.trim()))
);
let candidateDone = 0;
const candidateResults = await mapWithConcurrency(candidateUrls, concurrency, async (url) => {
  const result = await probeCandidateUrl(url);
  candidateDone += 1;
  if (candidateDone % 10 === 0 || candidateDone === candidateUrls.length) {
    console.log(`Rechecked candidate ${candidateDone}/${candidateUrls.length}`);
  }
  return [url, result];
});
const candidateResultByUrl = new Map(candidateResults);

for (const row of expanded) {
  const url = row.bestCandidate?.url;
  if (!url) continue;
  const candidateCheck = candidateResultByUrl.get(url);
  row.candidateCheck = candidateCheck;
  if (!candidateCheck?.ok && !["http_401", "http_403", "http_429"].includes(candidateCheck?.reason ?? "")) {
    row.action = "candidate_needs_manual_validation";
    row.priorityScore = Math.max(0, row.priorityScore - 45);
    if (row.affiliatePriority === "high") row.affiliatePriority = "medium";
  }
}

const priorityRows = [...expanded].sort(
  (a, b) => b.priorityScore - a.priorityScore || a.name.localeCompare(b.name, "de-DE") || a.field.localeCompare(b.field)
);

const summary = {
  stamp,
  auditFile: path.relative(root, auditPath),
  resortBackupFile: path.relative(root, resortBackupPath),
  timeoutRows: timeoutRows.length,
  uniqueTimeoutUrls: uniqueUrls.length,
  recheckedOkRows: expanded.filter((row) => row.ok).length,
  stillProblemRows: expanded.filter((row) => !row.ok).length,
  rowsByReason: expanded.reduce((acc, row) => {
    acc[row.reason] = (acc[row.reason] ?? 0) + 1;
    return acc;
  }, {}),
  rowsByField: expanded.reduce((acc, row) => {
    acc[row.field] = (acc[row.field] ?? 0) + 1;
    return acc;
  }, {}),
  affiliatePriority: expanded.reduce((acc, row) => {
    acc[row.affiliatePriority] = (acc[row.affiliatePriority] ?? 0) + 1;
    return acc;
  }, {}),
  highPrioritySkipassCandidates: expanded.filter((row) => row.affiliatePriority === "high").length,
  officialUrlsForManualTicketSearch: expanded.filter((row) => row.action.includes("official")).length,
  mapServiceRows: expanded.filter((row) => row.notes === "known_map_service_not_affiliate").length,
  candidateUrls: candidateUrls.length,
  candidateUrlsOk: Array.from(candidateResultByUrl.values()).filter((result) => result.ok).length,
  candidateUrlsNeedsManual: Array.from(candidateResultByUrl.values()).filter((result) => !result.ok).length,
  candidateRowsOk: expanded.filter((row) => row.bestCandidate && row.candidateCheck?.ok).length,
  candidateRowsNeedsManual: expanded.filter((row) => row.bestCandidate && !row.candidateCheck?.ok).length,
};

const fullJsonPath = path.join(backupDir, `timeout-link-recheck-${stamp}.json`);
const summaryPath = path.join(backupDir, `timeout-link-recheck-summary-${stamp}.json`);
const priorityJsonPath = path.join(backupDir, `skipass-affiliate-priority-${stamp}.json`);
const priorityCsvPath = path.join(backupDir, `skipass-affiliate-priority-${stamp}.csv`);
const candidateCsvPath = path.join(backupDir, `skipass-url-candidates-${stamp}.csv`);

fs.writeFileSync(fullJsonPath, JSON.stringify(expanded, null, 2), "utf8");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
fs.writeFileSync(priorityJsonPath, JSON.stringify(priorityRows, null, 2), "utf8");
writeCsv(priorityCsvPath, priorityRows);
writeCandidateCsv(
  candidateCsvPath,
  priorityRows.filter((row) => row.affiliatePriority === "high" && row.bestCandidate)
);

console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${path.relative(root, fullJsonPath)}`);
console.log(`Wrote ${path.relative(root, summaryPath)}`);
console.log(`Wrote ${path.relative(root, priorityJsonPath)}`);
console.log(`Wrote ${path.relative(root, priorityCsvPath)}`);
console.log(`Wrote ${path.relative(root, candidateCsvPath)}`);
