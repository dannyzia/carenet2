/**
 * Repo audit: mock-barrel usage in services, Unsplash URLs in pages, obvious inline data arrays.
 * Run: node scripts/hardcoding-audit.mjs
 * Does not modify files; use output to maintain tasks/hardcoding-inventory.md.
 */
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, acc);
    else if (entry.name.endsWith(ext)) acc.push(full);
  }
  return acc;
}

function scanFile(file, patterns) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const hits = [];
  lines.forEach((line, i) => {
    for (const { label, re } of patterns) {
      if (re.test(line)) hits.push({ label, line: i + 1, snippet: line.trim().slice(0, 120) });
    }
  });
  return hits.map((h) => ({ file: rel, ...h }));
}

const servicePatterns = [
  { label: "loadMockBarrel", re: /\bloadMockBarrel\b/ },
  { label: "MOCK_", re: /\bMOCK_[A-Z][A-Z0-9_]*\b/ },
  { label: "mockData(", re: /\bmockData\s*\(/ },
  { label: "agMock(", re: /\bagMock\s*\(/ },
  { label: "shopMock(", re: /\bshopMock\s*\(/ },
  { label: "moderatorMock(", re: /\bmoderatorMock\s*\(/ },
  { label: "falling back to mock", re: /falling back to mock/i },
];

const pagePatterns = [{ label: "unsplash URL", re: /images\.unsplash\.com/ }];

const serviceFiles = walk(path.join(repoRoot, "src/backend/services"), ".ts");
const pageFiles = walk(path.join(repoRoot, "src/frontend/pages"), ".tsx");

let all = [];
for (const f of serviceFiles) all.push(...scanFile(f, servicePatterns));
for (const f of pageFiles) all.push(...scanFile(f, pagePatterns));

const byLabel = {};
for (const h of all) {
  byLabel[h.label] = byLabel[h.label] || [];
  byLabel[h.label].push(h);
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), counts: Object.fromEntries(Object.entries(byLabel).map(([k, v]) => [k, v.length])), hits: all.slice(0, 500) }, null, 2));
if (all.length > 500) console.error(`(truncated: ${all.length} total hits, showing first 500 in JSON hits array)`);
