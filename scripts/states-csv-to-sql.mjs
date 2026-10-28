#!/usr/bin/env node
// Turns a CSV of post offices into an SQL insert for one state.
// Usage: node scripts/states-csv-to-sql.mjs TN tamil-nadu.csv > tn.sql
// CSV header (exact): name,pincode,district,lat,lng
// Then run the SQL in the Supabase SQL editor and revalidate the "post-offices" cache tag.
import { readFileSync } from "node:fs";

const [code, file] = process.argv.slice(2);
if (!code || !file || !/^[A-Z]{2}$/.test(code)) {
  console.error("Usage: node scripts/states-csv-to-sql.mjs <STATE_CODE e.g. TN> <file.csv>");
  process.exit(1);
}

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const [header, ...lines] = readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
if (header.trim() !== "name,pincode,district,lat,lng") {
  console.error("The first line must be: name,pincode,district,lat,lng");
  process.exit(1);
}

const rows = lines.map((line, index) => {
  const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
  if (cells.length !== 5) throw new Error(`Line ${index + 2}: expected 5 columns`);
  const [name, pincode, district, lat, lng] = cells;
  if (!/^\d{6}$/.test(pincode)) throw new Error(`Line ${index + 2}: pincode must be 6 digits`);
  if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng)))
    throw new Error(`Line ${index + 2}: lat and lng must be numbers`);
  return `  (${quote(name)}, ${quote(pincode)}, ${quote(district)}, ${Number(lat)}, ${Number(lng)}, ${quote(code)})`;
});

console.log(
  `insert into public.post_offices (name, pincode, district, lat, lng, state_code) values\n${rows.join(",\n")};`,
);
