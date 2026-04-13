/**
 * Mirrors §12 / add_caregiver_to_caregiving_job SQL: package_gac ↔ package_caregiver,
 * request_gac ↔ forwarded_requirement only.
 */
export type ConvergenceScopeRow = {
  contract_party_scope: string | null;
  gac_kind: string | null;
  staffing_channel: string | null;
};

export function assertGacRow(gac: ConvergenceScopeRow): void {
  if (gac.contract_party_scope !== "guardian_agency") {
    throw new Error("Invalid GAC: contract_party_scope must be guardian_agency");
  }
  if (gac.gac_kind == null) {
    throw new Error("gac_kind must be set on GAC");
  }
}

export function assertCacRow(cac: ConvergenceScopeRow): void {
  if (cac.contract_party_scope !== "caregiver_agency") {
    throw new Error("Invalid CAC: contract_party_scope must be caregiver_agency");
  }
  if (cac.staffing_channel == null) {
    throw new Error("staffing_channel must be set on CAC");
  }
}

/** Throws if GAC and CAC are not a valid pair for a caregiving job (same rules as RPC). */
export function assertCompatiblePair(gac: ConvergenceScopeRow, cac: ConvergenceScopeRow): void {
  assertGacRow(gac);
  assertCacRow(cac);
  if (gac.gac_kind === "package_gac" && cac.staffing_channel !== "package_caregiver") {
    throw new Error(`Package-GAC requires package_caregiver CAC (got ${String(cac.staffing_channel)})`);
  }
  if (gac.gac_kind === "request_gac" && cac.staffing_channel !== "forwarded_requirement") {
    throw new Error(`Request-GAC requires forwarded_requirement CAC (got ${String(cac.staffing_channel)})`);
  }
}
