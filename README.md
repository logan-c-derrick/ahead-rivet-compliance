# Rivet

Rivet is an internal compliance operations platform for managing products, components, suppliers, regulations, and supplier outreach in one workflow.

It is built with Next.js + Supabase and supports multi-tenant organization scoping with RLS.

## What This Project Does

- Tracks products and BOM/component data
- Stores supplier records and multiple supplier contacts
- Maps products/components to regulatory requirements
- Launches outreach campaigns to suppliers for documentation
- Accepts supplier uploads through secure tokenized links
- Supports review and follow-up cycles for missing/rejected documents

## Core Workflows

- **BOM ingest and mapping**
  - Upload BOM CSVs
  - Map source headers to target fields
  - Upsert components and attach to products
  - Skip duplicate component rows during import

- **Supplier management**
  - Create/edit suppliers
  - Manage multiple contacts per supplier
  - Bulk import supplier/contact data from CSV

- **Outreach and response**
  - Build campaigns targeted by all suppliers, selected suppliers, product BOM, or explicit components
  - Include one or more regulations in each request
  - Send test email override flows (currently restricted to `@ahead.com`)
  - Receive supplier document uploads via one-time response links
  - Associate uploaded files to specific components
  - Send follow-up links that include requested regulations

- **Compliance review loop**
  - Review supplier submissions against regulation rows
  - Approve/reject per regulation
  - Trigger follow-up uploads when needed

## Tech Stack

- **Frontend/app:** Next.js 14, React 18, TypeScript
- **Styling/UI:** Tailwind CSS, Material Symbols
- **Backend/data:** Supabase (Postgres, Auth, Storage, RLS)
- **CSV/Docs:** PapaParse, PDF utilities
- **Email:** Resend integration

## Architecture Highlights

- Server actions handle most mutations
- RLS enforces organization-level data isolation
- Supabase storage bucket `outreach-uploads` backs supplier docs
- Token-based supplier response endpoints support secure external uploads
- Campaigns can scope regulations and component coverage

## Repository Structure

- `src/app` - Next.js routes, pages, and server actions
- `src/lib` - domain services (BOM, outreach, supplier docs, auth helpers)
- `supabase/migrations` - schema and policy migrations
- `docs` - supporting project documentation and data artifacts
- `stitch` - UI exploration/prototype assets

## Internal Setup

For local dev setup and internal onboarding, see `INTERNAL_SETUP.md`.

## Useful Scripts

- `npm run dev` - start dev server
- `npm run lint` - lint code
- `npm run build` - production build check
- `npm run start` - run production build
