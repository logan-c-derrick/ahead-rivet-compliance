# ComplianceHub Internal Setup Guide

Use this guide to run ComplianceHub locally for internal testing.

## Prerequisites

- Node.js 20.x LTS
- npm 10+
- Git

Verify:

```bash
node -v
npm -v
```

## 1) Get the code

```bash
git clone https://github.com/logancderrick/ecoflow_compliance.git
cd ecoflow_compliance
```

## 2) Environment variables

For internal use, env vars are already managed by the project owner.

- Do **not** create new Supabase/Resend credentials
- Use the provided `.env` / `.env.local` included in the internal distribution

If you are missing env files, contact the maintainer.

## 3) Install dependencies

```bash
npm install
```

## 4) Database setup for internal testers

No action required for internal testers using the shared Supabase project:

- Migrations are already applied
- Core tables already exist
- RLS policies are already configured

Run migrations only if you are setting up a brand-new database/project.

## 5) User profile setup

No manual SQL required for normal internal users.

When a new user signs in:

- If a profile exists, they continue to the app
- If not, they are redirected to `/profile-missing/setup`
- They can create/select an organization and complete profile setup in-app

## 6) Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in via `/login`.

## 7) Test checklist

- Create/edit suppliers and add multiple contacts
- Import components via CSV (verify duplicate rows are skipped)
- Launch outreach campaign with regulations
- Use test email override (`@ahead.com` only)
- Submit supplier upload and map each file to components
- Send follow-up link and verify regulations appear in email copy

## 8) Useful commands

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run start`

## 9) Admin-only: fresh environment bootstrap (optional)

Use this section only when creating a brand-new Supabase project.

1. Run migrations from `supabase/migrations` in order (`001`, `002`, `003`, ...).
2. Ensure storage bucket `outreach-uploads` exists.
3. Start app and create first user via Auth.

## 10) Troubleshooting

- If Next.js chunks fail (`Cannot find module './NNN.js'`), clear build output:

```bash
rm -rf .next
npm run dev
```

- If redirected to `/profile-missing`, user profile row is missing in `profiles`.
- If supplier upload links fail, confirm storage bucket `outreach-uploads` exists.
- If emails do not send, confirm `RESEND_API_KEY` is present in provided env.
