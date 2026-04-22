-- Role Activation Approval Gate Migration
-- Adds activation status tracking to profiles and audit trail for approvals

-- Add activation_status column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activation_status TEXT
    NOT NULL DEFAULT 'profile_incomplete'
    CHECK (activation_status IN (
      'profile_incomplete',
      'pending_approval',
      'approved',
      'rejected',
      'suspended'
    ));

-- Add activation_note column to profiles (for rejection reasons)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activation_note TEXT;

-- Create role_activation_reviews audit table
CREATE TABLE IF NOT EXISTS role_activation_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id   UUID REFERENCES auth.users(id),
  reviewer_name TEXT,
  decision      TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Create auto-approve trigger function for low-risk roles (guardian, patient, channel_partner)
CREATE OR REPLACE FUNCTION auto_approve_low_risk_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('guardian', 'patient', 'channel_partner') THEN
    NEW.activation_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-approve guardian/patient on profile creation
DROP TRIGGER IF EXISTS trg_auto_approve_role ON profiles;
CREATE TRIGGER trg_auto_approve_role
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_approve_low_risk_roles();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_activation
  ON profiles(activation_status, role);

CREATE INDEX IF NOT EXISTS idx_activation_reviews_profile
  ON role_activation_reviews(profile_id);

CREATE INDEX IF NOT EXISTS idx_activation_reviews_created_at
  ON role_activation_reviews(created_at DESC);

-- Enable RLS on role_activation_reviews
ALTER TABLE role_activation_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Reviewer (admin or mod) can insert reviews
CREATE POLICY IF NOT EXISTS activation_review_insert ON role_activation_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- Policy: Admin/mod can read all reviews
CREATE POLICY IF NOT EXISTS activation_review_admin_read ON role_activation_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- Policy: User can read their own review history
CREATE POLICY IF NOT EXISTS activation_review_own_read ON role_activation_reviews
  FOR SELECT USING (profile_id = auth.uid());

-- Ensure profiles_mod_select policy exists for moderator queue access
-- This policy allows moderators to read profiles for the activation queue
CREATE POLICY IF NOT EXISTS profiles_mod_select ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'moderator'
    )
  );

-- Backfill: Approve existing profiles created more than 1 day ago
-- This ensures existing users are not blocked by the new gate
UPDATE profiles
SET activation_status = 'approved'
WHERE created_at < NOW() - INTERVAL '1 day';
