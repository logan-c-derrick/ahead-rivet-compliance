# ComplianceHub (Next.js + Supabase)

Internal setup guide for running the app in a local development environment.

## 1) Prerequisites

- `Node.js` 20.x LTS (recommended)
- `npm` 10+ (comes with modern Node installs)
- A Supabase project you can access
- Git (for cloning/updating this repo)

Quick version check:

```bash
node -v
npm -v
```

## 2) Install dependencies

From the project root:

```bash
npm install
```

## 3) Configure environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Base URL used in generated email/upload links (recommended in dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Required for supplier upload links and signed download URLs
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Required only when sending outreach emails from the app
RESEND_API_KEY=YOUR_RESEND_API_KEY
```

### Env var notes

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required to boot the app.
- `SUPABASE_SERVICE_ROLE_KEY` is required for secure supplier response flows (token validation, storage upload, signed URLs).
- `RESEND_API_KEY` is required for campaign/test email delivery.
- After changing env vars, restart the dev server.

## 4) Set up the database (Supabase)

Run SQL migrations from `supabase/migrations` in order (001, 002, 003, ...).

Fastest path:
- Open Supabase Dashboard -> SQL Editor
- Execute each migration file in sequence

This sets up:
- schema and relationships
- RLS policies
- helper functions
- outreach, campaign, and supplier document tables

## 5) Create at least one auth user + profile row

After creating a user in Supabase Auth, insert their profile row so app RLS can scope data:

```sql
INSERT INTO profiles (id, organization_id, email, full_name, role)
VALUES (
  'AUTH_USER_UUID',
  '00000000-0000-0000-0000-000000000001',
  'user@ahead.com',
  'Internal Tester',
  'user'
);
```

If you used seed data, `00000000-0000-0000-0000-000000000001` maps to the seeded org.

## 6) Run the app

```bash
npm run dev
```

Then open:

- [http://localhost:3000](http://localhost:3000)
- Sign in via `/login`

## 7) Useful scripts

- `npm run dev` - start local dev server
- `npm run lint` - run lint checks
- `npm run build` - production build validation
- `npm run start` - run production build locally

## 8) Email/testing behavior

- Outreach campaign "test email override" requires a valid email and currently allows `@ahead.com` addresses.
- Supplier follow-up and response workflows depend on:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
- Outbound email sending requires `RESEND_API_KEY`.

## 9) Common troubleshooting

- Build artifacts look corrupted (`Cannot find module './NNN.js'`, route chunks missing):
  1. Stop dev server
  2. Delete `.next`
  3. Run `npm run dev` again

- Login works but app redirects to profile-missing:
  - Ensure a matching row exists in `profiles` for the authenticated user.

- Supplier upload links fail or downloads unavailable:
  - Verify `SUPABASE_SERVICE_ROLE_KEY` is set.
  - Verify Supabase storage bucket `outreach-uploads` exists.

- Emails do not send:
  - Verify `RESEND_API_KEY`.
  - Check server logs for delivery errors.

## 10) Shareable quick-start for internal testers

1. Install Node 20 LTS
2. Clone repo
3. Add `.env.local` (see section 3)
4. Apply Supabase migrations
5. Create Auth user + `profiles` row
6. Run `npm install && npm run dev`
7. Sign in at `/login`
