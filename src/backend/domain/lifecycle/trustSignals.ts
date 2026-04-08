/**
 * Trust score inputs (packages-1.md §1 FRAUD + TRUST — Score Inputs JSON).
 * Server-side engine not implemented; constants anchor future scoring.
 */
export const TRUST_SCORE_WEIGHTS = {
  kyc_verified: 20,
  nid_match: 15,
  face_match: 15,
  background_check: 10,
  attendance_reliability: 10,
  completion_rate: 10,
  review_score: 10,
  incident_penalty: -20,
  no_show_penalty: -30,
} as const;

export type TrustSignalKey = keyof typeof TRUST_SCORE_WEIGHTS;

export const TRUST_SCORE_MAX = 100;
export const TRUST_SCORE_MIN = 0;
