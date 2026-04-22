# Quick Fix: Create Your Profile

You're seeing the profile missing screen because your user account exists in Supabase Auth but doesn't have a corresponding profile row in the database.

## Option 1: Use the Profile Setup Page (Recommended)

1. Click the **"Set Up Profile"** button on the profile missing page (or go to `/profile-missing/setup`)
2. Fill in your name (optional)
3. Select the "Acme Corporation" organization from the dropdown, OR create a new organization by entering a name in the "Create New Organization" field
4. Click "Create Profile"

**Note:** You need to run the RLS fix migration first (see below) for the setup page to work properly.

## Option 2: Run SQL Directly

If you prefer to create your profile via SQL, run this in Supabase SQL Editor:

**First, run the RLS fix migration:**
```sql
-- Copy and paste the contents of supabase/migrations/003_fix_profile_setup_rls.sql
```

**Then create your profile:**

```sql
-- Replace with your actual user ID and email
INSERT INTO profiles (id, organization_id, email, full_name, role)
VALUES (
  '6a837235-601a-4440-ba2b-eb65e4491940',  -- Your User ID
  '00000000-0000-0000-0000-000000000001',  -- Acme Corporation (from seed data)
  'logan.derrick@ahead.com',
  'Logan Derrick',  -- Or your preferred name
  'user'
);
```

After running this SQL, refresh the page and you should be redirected to the dashboard.

## Verify It Worked

After creating your profile, you should be able to:
- Access `/dashboard`
- See the sidebar navigation
- Access `/products` and create products
- All data will be scoped to your organization
