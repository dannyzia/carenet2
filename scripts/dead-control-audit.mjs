import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const pagesRoot = path.join(repoRoot, "src/frontend/pages");
const routeFile = path.join(repoRoot, "src/app/routes.ts");
const roles = ["agency", "caregiver", "guardian", "patient", "admin", "moderator", "shop"];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

function extractRoutes() {
  const content = fs.readFileSync(routeFile, "utf8");
  const set = new Set();
  const re = /path:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) set.add(m[1]);
  return set;
}

function routeExists(target, routes) {
  const clean = target.split("?")[0].replace(/^\//, "");
  if (routes.has(clean)) return true;
  const parts = clean.split("/");
  for (const route of routes) {
    const rp = route.split("/");
    if (rp.length !== parts.length) continue;
    let ok = true;
    for (let i = 0; i < rp.length; i++) {
      if (rp[i].startsWith(":")) continue;
      if (rp[i] !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function findButtons(content) {
  const out = [];
  const re = /<button\b([\s\S]*?)>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const attrs = m[1];
    if (/\bonClick\s*=/.test(attrs)) continue;
    if (/\bdisabled\b/.test(attrs)) continue;
    if (/\btype\s*=\s*["']submit["']/.test(attrs)) continue;
    const line = content.slice(0, m.index).split("\n").length;
    out.push(line);
  }
  return out;
}

function findDeadLinks(content, routes) {
  const out = [];
  const patterns = [/\bto=\{?["']([^"']+)["']\}?/g, /\bhref=\{?["']([^"']+)["']\}?/g];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const target = m[1];
      if (!target.startsWith("/")) continue;
      if (!routeExists(target, routes)) out.push(target);
    }
  }
  return [...new Set(out)];
}

const routes = extractRoutes();
const report = { roles: {}, totals: { deadButtons: 0, deadLinks: 0 } };

for (const role of roles) {
  const dir = path.join(pagesRoot, role);
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir);
  let deadButtons = 0;
  let deadLinks = 0;
  const details = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const buttons = findButtons(content);
    const links = findDeadLinks(content, routes);
    if (buttons.length || links.length) {
      details.push({
        file: path.relative(pagesRoot, file),
        deadButtons: buttons.length,
        deadButtonLines: buttons,
        deadLinks: links,
      });
      deadButtons += buttons.length;
      deadLinks += links.length;
    }
  }
  report.roles[role] = { deadButtons, deadLinks, files: details };
  report.totals.deadButtons += deadButtons;
  report.totals.deadLinks += deadLinks;
}

console.log(JSON.stringify(report, null, 2));
