import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, "../src/backend/services/marketplace.service.ts");
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  /import \{\s*MOCK_MARKETPLACE_JOBS,\s*MOCK_CARE_REQUESTS,\s*MOCK_AGENCY_PACKAGES,\s*MOCK_BIDS,\s*\} from "@\/backend\/api\/mock";\s*/,
  `import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";\n`,
);
s = s.replace(
  /let careRequests = \[\.\.\.MOCK_CARE_REQUESTS\];\s*let agencyPackages = \[\.\.\.MOCK_AGENCY_PACKAGES\];\s*let bids = \[\.\.\.MOCK_BIDS\];/,
  `let careRequests: CareContract[] | null = null;
let agencyPackages: AgencyPackage[] | null = null;
let bids: CareContractBid[] | null = null;

async function ensureMkMock() {
  if (careRequests !== null) return;
  const m = await loadMockBarrel();
  careRequests = [...m.MOCK_CARE_REQUESTS];
  agencyPackages = [...m.MOCK_AGENCY_PACKAGES];
  bids = [...m.MOCK_BIDS];
}`,
);
s = s.replace(/bids\.filter\(/g, "(bids ?? []).filter(");
s = s.replace(/bids\.find\(/g, "(bids ?? []).find(");
s = s.replace(/bids\.push\(/g, "(bids!).push(");
s = s.replace(/careRequests\.forEach\(/g, "(careRequests!).forEach(");
s = s.replace(/careRequests\.filter\(/g, "(careRequests!).filter(");
s = s.replace(/careRequests\.find\(/g, "(careRequests!).find(");
s = s.replace(/careRequests\.push\(/g, "(careRequests!).push(");
s = s.replace(/agencyPackages\.filter\(/g, "(agencyPackages!).filter(");
s = s.replace(/agencyPackages\.find\(/g, "(agencyPackages!).find(");
s = s.replace(/agencyPackages\.push\(/g, "(agencyPackages!).push(");
s = s.replace(
  /return MOCK_MARKETPLACE_JOBS;/g,
  "return (await loadMockBarrel()).MOCK_MARKETPLACE_JOBS;",
);
s = s.replace(
  /if \(!query\.trim\(\)\) return MOCK_MARKETPLACE_JOBS;/g,
  "if (!query.trim()) return (await loadMockBarrel()).MOCK_MARKETPLACE_JOBS;",
);
s = s.replace(
  /return MOCK_MARKETPLACE_JOBS\.filter\(/g,
  "return (await loadMockBarrel()).MOCK_MARKETPLACE_JOBS.filter(",
);
fs.writeFileSync(p, s);
console.log("patched", p);
