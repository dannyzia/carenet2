-- Step 1: Make phone mandatory (empty-string rows must be cleaned first)
-- Run: DELETE FROM profiles WHERE phone = '' OR phone IS NULL;  (manual, if needed)
ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;

-- Step 2: Add unique constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Step 3: Update trigger to include email from auth.users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, role, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
