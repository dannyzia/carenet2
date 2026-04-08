/**
 * matching-run — server-side agency ranking for a care request (contract_id).
 * Weights: supabase/functions/matching-run/matching-weights.json (tune without code changes).
 */

// @ts-ignore Deno import
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore Deno import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Weights = {
  city_match: number;
  category_overlap: number;
  price_fit: number;
  price_overshoot_ratio: number;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function parseJsonField(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

function pickPrice(pr: Record<string, unknown>): number {
  const base = pr.base_price;
  const max = pr.budget_max;
  const min = pr.budget_min;
  if (typeof base === "number" && base > 0) return base;
  if (typeof max === "number" && max > 0) return max;
  if (typeof min === "number" && min > 0) return min;
  return 0;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing Authorization" }, 401);
  }

  const weightsUrl = new URL("./matching-weights.json", import.meta.url);
  let weights: Weights = {
    city_match: 40,
    category_overlap: 35,
    price_fit: 25,
    price_overshoot_ratio: 0.2,
  };
  try {
    const txt = await Deno.readTextFile(weightsUrl);
    weights = { ...weights, ...JSON.parse(txt) as Weights };
  } catch {
    /* defaults */
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userErr,
  } = await caller.auth.getUser();
  if (userErr || !user) return json({ error: "Invalid JWT" }, 401);

  let body: { contract_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.contract_id) return json({ error: "contract_id required" }, 400);

  const { data: reqRow, error: rowErr } = await caller
    .from("care_contracts")
    .select("id, type, status, city, categories, pricing, owner_id")
    .eq("id", body.contract_id)
    .maybeSingle();

  if (rowErr) return json({ error: rowErr.message }, 500);
  if (!reqRow) return json({ error: "Contract not found or not visible" }, 404);
  if (reqRow.type !== "request") {
    return json({ error: "contract_id must be a care request (type=request)" }, 400);
  }
  if (String(reqRow.owner_id) !== user.id) {
    return json({ error: "Only the request owner can run matching" }, 403);
  }

  const reqCity = String(reqRow.city ?? "").trim().toLowerCase();
  const reqCats = asStringArray(reqRow.categories);
  const reqPricing = parseJsonField(reqRow.pricing);
  const budgetMin = typeof reqPricing.budget_min === "number" ? reqPricing.budget_min : 0;
  const budgetMax = typeof reqPricing.budget_max === "number" ? reqPricing.budget_max : 0;
  const budgetHi = budgetMax > 0 ? budgetMax : budgetMin;

  const { data: offers, error: offErr } = await caller
    .from("care_contracts")
    .select("id, agency_id, agency_name, city, categories, pricing, title, status")
    .eq("type", "offer")
    .eq("status", "published");

  if (offErr) return json({ error: offErr.message }, 500);

  const overshoot = weights.price_overshoot_ratio ?? 0.2;

  type MatchRow = {
    contract_id: string;
    agency_id: string;
    agency_name: string | null;
    score: number;
    breakdown: {
      city: number;
      category: number;
      price: number;
    };
    reasons: string[];
  };

  const matches: MatchRow[] = [];

  for (const o of offers ?? []) {
    const oCity = String(o.city ?? "").trim().toLowerCase();
    const oCats = asStringArray(o.categories);
    const oPricing = parseJsonField(o.pricing);
    const price = pickPrice(oPricing);

    let cityPts = 0;
    if (reqCity && oCity && reqCity === oCity) {
      cityPts = weights.city_match;
    } else {
      cityPts = 0;
    }

    let catPts = 0;
    if (reqCats.length > 0 && oCats.length > 0) {
      const overlap = reqCats.filter((c) => oCats.includes(c)).length;
      catPts = (overlap / reqCats.length) * weights.category_overlap;
    }

    let pricePts = 0;
    if (budgetHi > 0 && price > 0) {
      if (price <= budgetHi) {
        pricePts = weights.price_fit;
      } else if (price <= budgetHi * (1 + overshoot)) {
        pricePts = weights.price_fit * 0.5;
      }
    } else if (budgetHi <= 0 && price > 0) {
      pricePts = weights.price_fit * 0.5;
    }

    const score = Math.round((cityPts + catPts + pricePts) * 100) / 100;
    const reasons: string[] = [];
    if (cityPts >= weights.city_match) reasons.push("Same city");
    else if (reqCity) reasons.push("Different city");
    if (reqCats.length > 0) {
      const overlap = reqCats.filter((c) => oCats.includes(c)).length;
      reasons.push(`Category overlap ${overlap}/${reqCats.length}`);
    }
    if (budgetHi > 0 && price > 0) {
      reasons.push(
        price <= budgetHi
          ? "Price within budget"
          : price <= budgetHi * (1 + overshoot)
            ? "Price within overshoot tolerance"
            : "Price above budget"
      );
    }

    matches.push({
      contract_id: o.id as string,
      agency_id: o.agency_id as string,
      agency_name: (o.agency_name as string) ?? null,
      score,
      breakdown: {
        city: Math.round(cityPts * 100) / 100,
        category: Math.round(catPts * 100) / 100,
        price: Math.round(pricePts * 100) / 100,
      },
      reasons,
    });
  }

  matches.sort((a, b) => b.score - a.score);

  return json({
    ok: true,
    stub: false,
    contract_id: body.contract_id,
    weights,
    matches,
  });
});
