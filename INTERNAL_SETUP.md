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

## 4) Database migrations

Run Supabase migrations in order from `supabase/migrations` (001, 002, 003, ...).

Recommended method:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Execute each migration file sequentially

## 5) Create a test user profile

After creating/signing up a user in Supabase Auth, insert a matching `profiles` row.

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

## Troubleshooting

- If Next.js chunks fail (`Cannot find module './NNN.js'`), clear build output:

```bash
rm -rf .next
npm run dev
```

- If redirected to `/profile-missing`, user profile row is missing in `profiles`.
- If supplier upload links fail, confirm storage bucket `outreach-uploads` exists.
- If emails do not send, confirm `RESEND_API_KEY` is present in provided env.
