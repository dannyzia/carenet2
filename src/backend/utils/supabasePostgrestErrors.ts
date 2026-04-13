/** True when PostgREST cannot resolve the table/view (migrations not applied on project). */
export function isMissingRestRelation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "PGRST205") return true;
  const m = String(error.message || "").toLowerCase();
  return m.includes("schema cache") || m.includes("could not find the table");
}
