import type { AgencyPackage, CareCategory, UCCFPricingOffer, UCCFPricingRequest } from "@/backend/models";

export const categoryLabels: Record<CareCategory, string> = {
  elderly: "Elderly Care",
  post_surgery: "Post-Surgery",
  chronic: "Chronic Care",
  critical: "Critical/ICU",
  baby: "Baby Care",
  disability: "Disability",
};

export const categoryColors: Record<CareCategory, { color: string; bg: string }> = {
  elderly: { color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" },
  post_surgery: { color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  chronic: { color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  baby: { color: "#DB869A", bg: "rgba(219,134,154,0.12)" },
  disability: { color: "#00897B", bg: "rgba(0,137,123,0.12)" },
};

export function formatAgencyPackagePrice(pricing: UCCFPricingRequest | UCCFPricingOffer): string {
  if ("budget_min" in pricing && pricing.budget_min != null) {
    const model = ("preferred_model" in pricing && pricing.preferred_model) || "monthly";
    return `৳${(pricing.budget_min || 0).toLocaleString()} - ৳${(pricing.budget_max || 0).toLocaleString()}/${model === "monthly" ? "mo" : model === "daily" ? "day" : "hr"}`;
  }
  if ("base_price" in pricing && pricing.base_price != null) {
    const model = pricing.pricing_model || "monthly";
    return `৳${pricing.base_price.toLocaleString()}/${model === "monthly" ? "mo" : model === "daily" ? "day" : "hr"}`;
  }
  return "—";
}

export function filterAgencyPackages(
  packages: AgencyPackage[],
  searchQuery: string,
  filterCategory: CareCategory | "",
): AgencyPackage[] {
  return packages.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.meta.title.toLowerCase().includes(q) && !p.agency_name.toLowerCase().includes(q)) return false;
    }
    if (filterCategory && !p.meta.category.includes(filterCategory)) return false;
    return true;
  });
}
