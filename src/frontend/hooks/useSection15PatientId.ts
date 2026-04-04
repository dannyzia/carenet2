import { useSearchParams } from "react-router";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { useAsyncData } from "./useAsyncData";
import { guardianService, section15Service } from "@/backend/services";

/**
 * Patient UUID for Section 15 routes: `?patientId=` for guardians, else first dependent or demo id.
 * Patient-role users use auth user id (matches existing patient_vitals queries in this codebase).
 */
export function useSection15PatientId(): {
  patientId: string | null;
  loading: boolean;
} {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const explicit = searchParams.get("patientId");

  const { data: patients, loading } = useAsyncData(
    () => (user?.activeRole === "guardian" ? guardianService.getPatients() : Promise.resolve([])),
    [user?.activeRole],
  );

  if (user?.activeRole === "guardian") {
    if (explicit) return { patientId: explicit, loading: false };
    if (loading || !patients?.length) return { patientId: null, loading };
    return { patientId: patients[0].id, loading: false };
  }

  if (user?.activeRole === "patient" && user.id) {
    return { patientId: user.id, loading: false };
  }

  if (user?.activeRole === "caregiver" || user?.activeRole === "agency") {
    return {
      patientId: explicit || section15Service.defaultDemoPatientId,
      loading: false,
    };
  }

  return { patientId: explicit, loading: false };
}
