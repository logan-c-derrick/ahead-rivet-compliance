-- Fix RLS policies to allow profile setup
-- Users without profiles need to be able to:
-- 1. Read all organizations to select one
-- 2. Insert their own profile

-- Allow authenticated users to read all organizations (for profile setup)
-- They can still only update their own organization
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Authenticated users can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile (even if they don't have one yet)
-- This is needed for the profile setup flow
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow users to insert organizations (for creating new orgs during setup)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);
