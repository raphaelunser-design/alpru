import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const INPUT_FILE = process.env.INPUT_FILE || "resorts_bad_links.csv";
const OUTPUT_FILE = process.env.OUTPUT_FILE || "resorts_link_overrides.csv";

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

function csvEscape(x) {
  const s = x === null || x === undefined ? "" : String(x);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const inputPath = path.join(PROJECT_ROOT, INPUT_FILE);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input fehlt: ${inputPath}`);
  }

  const text = fs.readFileSync(inputPath, "utf8");
  const rows = parseCsv(text);
  if (!rows.length) {
    throw new Error("Input CSV ist leer.");
  }

  const header = rows[0];
  const idx = {
    slug: header.indexOf("slug"),
    name: header.indexOf("name"),
    country: header.indexOf("country"),
    candidate: header.indexOf("candidate"),
  };

  const outputHeader = ["slug", "name", "country", "candidate", "official_url"];
  const lines = [outputHeader.join(",")];

  for (const row of rows.slice(1)) {
    const slug = row[idx.slug] || "";
    if (!slug) continue;
    const name = row[idx.name] || "";
    const country = row[idx.country] || "";
    const candidate = row[idx.candidate] || "";
    lines.push([slug, name, country, candidate, ""].map(csvEscape).join(","));
  }

  const outputPath = path.join(PROJECT_ROOT, OUTPUT_FILE);
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`Override-Datei erstellt: ${outputPath}`);
}

main();
