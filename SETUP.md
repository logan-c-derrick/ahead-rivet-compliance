# Rivet Setup Guide

## Database Setup

### 1. Run SQL Migrations in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:

#### Migration 1: Schema
Copy and paste the contents of `supabase/migrations/001_compliancehub_schema.sql` into the SQL Editor and execute it.

This creates:
- All tables (organizations, profiles, products, components, suppliers, regulations, etc.)
- Indexes for performance
- RLS (Row Level Security) policies for multi-tenant isolation
- Helper function `get_user_organization_id()` for RLS

#### Migration 2: Seed Data
Copy and paste the contents of `supabase/migrations/002_seed_data.sql` into the SQL Editor and execute it.

This creates:
- 1 default organization: "Acme Corporation"
- 8 regulations: RoHS, REACH, Prop 65, TAA, Conflict Minerals, TSCA, UK RoHS, PFAS

### 2. Create User Profile

After a user signs up via Supabase Auth, you need to create a profile row for them:

```sql
-- Replace USER_ID with the actual auth.users.id
-- Replace ORGANIZATION_ID with the organization they should belong to
-- (Use '00000000-0000-0000-0000-000000000001' for the seeded "Acme Corporation")

INSERT INTO profiles (id, organization_id, email, full_name, role)
VALUES (
  'USER_ID',
  '00000000-0000-0000-0000-000000000001',
  'user@example.com',
  'User Name',
  'user'
);
```

**Note:** In production, you should create a signup flow that:
1. Creates the user in Supabase Auth
2. Prompts them to select/create an organization
3. Creates the profile row with the selected organization_id

## Application Features

### Multi-Tenant RLS
All queries are automatically scoped by the user's `organization_id` from their profile. Users can only access data from their own organization.

### Profile Missing Screen
If a user exists in Supabase Auth but has no profile row, they'll be redirected to `/profile-missing` with instructions.

### Products CRUD
- **List**: `/products` - View all products in your organization
- **Create**: `/products/new` - Add a new product
- **View**: `/products/[id]` - View product details
- **Edit**: `/products/[id]/edit` - Edit product
- **Delete**: Delete button on the products list page

All operations are scoped to the user's organization via RLS policies.

### Sidebar Navigation
The sidebar layout is applied to:
- `/dashboard`
- `/products`
- `/components`
- `/suppliers`
- `/regulations`
- `/outreach`
- `/audit`

The active route is highlighted in the sidebar.

## Typography & icons

- **Fonts:** Manrope (`font-headline`) is the default for primary UI copy and headings; Inter (`font-body`) is used for secondary text (labels, table headers, form fields, captions). Configured in `src/app/layout.tsx` (Next.js `next/font/google`) and `src/app/globals.css`.
- **Icons:** Google **Material Symbols Outlined** are loaded in `src/app/layout.tsx`. Use the shared `MaterialIcon` component (`src/components/ui/MaterialIcon.tsx`) with icon names from [Google Fonts Icons](https://fonts.google.com/icons).

## Troubleshooting

### `Cannot find module './NNN.js'` (e.g. `./270.js`) or broken `/dashboard` after dev

The `.next` folder can get **out of sync** (interrupted compile, crashed dev server, or **OneDrive** syncing partial files). Fix:

1. Stop the dev server (`Ctrl+C`).
2. Delete the build output: remove the **`.next`** directory at the project root (PowerShell: `Remove-Item -Recurse -Force .next`).
3. Start again: `npm run dev`.

If problems persist, move or clone the repo to a **non–OneDrive path** (e.g. `C:\dev\compliancehub-starter`)—Next.js + cloud sync often cause flaky `.next` chunks on Windows.

## Next Steps

1. Implement Components CRUD (similar to Products)
2. Implement Suppliers CRUD
3. Build the Outreach Requests workflow
4. Add Audit Logging for all mutations
5. Implement Product-Components relationships
6. Implement Component-Regulations tracking
7. Build Product Regulation Status tracking
