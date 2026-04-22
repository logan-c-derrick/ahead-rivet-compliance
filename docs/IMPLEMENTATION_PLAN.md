# Rivet Functionality Implementation Plan

This plan outlines how to implement the app's functionality, building on the existing Supabase schema and stitch-based UI screens.

---

## Current State Summary

### Existing Database Schema
- **organizations** – Multi-tenant root
- **profiles** – User accounts linked to orgs
- **products** – Product catalog
- **components** – Part catalog (with `supplier_id` from migration 004)
- **suppliers** – Supplier registry
- **regulations** – Shared compliance directives
- **product_components** – BOM linkage (product ↔ component)
- **component_regulations** – Component ↔ regulation status
- **product_regulation_status** – Product-level compliance
- **outreach_requests** – Supplier outreach tracking
- **audit_logs** – Change history

### Screens Implemented (UI Only)
- BOM Management, BOM Mapping Workflow
- Add Component, Supplier, Product, Regulation
- Compliance Certificate Generator
- Outreach Campaign Builder
- Global Search, Audit Logs, Profile, Settings, Support

---

## Phase 1: Schema Extensions

### 1.1 New Tables & Columns

| Migration | Purpose | Tables/Columns |
|-----------|---------|-----------------|
| **006_bom_import_schema** | BOM upload and mapping | `bom_imports`, `bom_column_mappings`, `regulation_thresholds` |
| **007_outreach_campaigns** | Campaign-centric outreach | `outreach_campaigns`, `campaign_suppliers`, extend `outreach_requests` |
| **008_compliance_certificates** | Certificate generation | `compliance_certificates` |
| **009_material_composition** | Component material data | `component_substances` |
| **010_documents** | Supplier docs & SDS | `supplier_documents`, `document_uploads` |

### 1.2 Detailed Schema Additions

```sql
-- bom_imports: Track each CSV upload
CREATE TABLE bom_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  row_count INT,
  status TEXT DEFAULT 'pending', -- pending, mapping, processing, complete, failed
  mapping_schema JSONB, -- resolved column mappings
  conflict_resolutions JSONB, -- user choices for ambiguous fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- bom_column_mappings: Reusable mapping templates
CREATE TABLE bom_column_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  source_columns JSONB NOT NULL, -- [{source: "PART_NUMBER", target: "part_number", normalization: "none"}]
  UNIQUE(organization_id, name)
);

-- regulation_thresholds: Custom thresholds from Create Regulation screen
ALTER TABLE regulations ADD COLUMN IF NOT EXISTS thresholds JSONB;
-- Example: {"carbon_emission": {"warning": 1200, "critical": 1500}, "ph": {"warning": 6.5, "critical": 8.5}}

-- outreach_campaigns: Campaign metadata
CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  regulation_id UUID REFERENCES regulations(id),
  message_template TEXT,
  subject_template TEXT,
  status TEXT DEFAULT 'draft', -- draft, scheduled, active, completed
  scheduled_at TIMESTAMPTZ,
  follow_up_days INT DEFAULT 7,
  cohort_filters JSONB, -- {regions: ["EMEA"], risk_tiers: ["high"]}
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

-- Link outreach_requests to campaigns
ALTER TABLE outreach_requests ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES outreach_campaigns(id);

-- compliance_certificates: Generated documents
CREATE TABLE compliance_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  batch_serial TEXT,
  regulation_ids UUID[], -- regulations included
  document_hash TEXT, -- for verification
  storage_path TEXT, -- Supabase Storage path for PDF
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- component_substances: Material composition (from Add Component)
CREATE TABLE component_substances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  substance_name TEXT NOT NULL,
  cas_number TEXT,
  mass_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- supplier_documents: Supplier uploads (SDS, declarations)
CREATE TABLE supplier_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID REFERENCES suppliers(id),
  outreach_request_id UUID REFERENCES outreach_requests(id),
  document_type TEXT, -- sds, declaration, certificate
  filename TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 2: BOM Upload & Mapping

### 2.1 Flow
1. User clicks “Upload New BOM” → navigates to `/products/bom/map`
2. User selects/upload CSV → parse headers, show preview
3. Auto-suggest mappings (header name → schema field)
4. User resolves conflicts (e.g. SUBSTANCE_WT → grams vs mg)
5. Finalize → insert into `products`, `components`, `product_components`

### 2.2 Backend Tasks
- **Server Action**: `processBomUpload(formData)` – Accept file, store in Supabase Storage, create `bom_imports` row, return import ID
- **API/Server**: `parseBomCsv(file)` – Use `papaparse` or similar to read headers + first 5 rows
- **Server Action**: `getColumnMappingSuggestions(headers)` – Match headers to known fields (part_number, manufacturer, supplier_name, cas_number, mass_percent, etc.)
- **Server Action**: `finalizeBomMapping(importId, mappings, conflictResolutions)` – Apply mappings, upsert components (use `components_org_part_manufacturer_key`), create product_components, update product

### 2.3 Component Matching
- Use `(organization_id, part_number, manufacturer)` for upsert
- Create supplier by name if not exists (or match existing)
- Insert `component_substances` for material composition rows

---

## Phase 3: Compliance Logic & Outreach

### 3.1 Threshold Engine
- **Custom Regulation Thresholds**: Store in `regulations.thresholds` JSONB from Create Regulation form
- **Compliance Calculation**: For each product, roll up `component_regulations` status:
  - If any component is `non_compliant` → product = `non_compliant`
  - If any `pending` → product = `pending`
  - All `compliant` → product = `compliant`
- **Threshold Comparison**: When material data exists, compare `component_substances.mass_percent` etc. against regulation thresholds (future enhancement)

### 3.2 Outreach Automation
- **Campaign Creation**: `createOutreachCampaign` – Insert `outreach_campaigns`, create `outreach_requests` for each supplier in cohort (filter by region/risk from suppliers)
- **Email Service**:
  - Use **Resend** or **SendGrid** (simpler for Next.js)
  - Store API key in env (`EMAIL_API_KEY`)
  - Template variables: `{{supplier_contact}}`, `{{regulation_name}}`, `{{deadline_date}}`, `{{portal_unique_link}}`
- **Portal Link**: Generate signed link for supplier to upload docs: `/outreach/respond/[token]`

### 3.3 Supplier Response (Public Form)
- **Table**: `outreach_response_tokens` – token, outreach_request_id, expires_at
- **Route**: `/outreach/respond/[token]` – Public page (no auth), form to upload file
- **Flow**: Validate token → upload to Supabase Storage → insert `supplier_documents` → update `outreach_requests.status` to `received`

---

## Phase 4: Audit, PDF, Search

### 4.1 Audit Logging
- **Current**: `audit_logs` exists, RLS allows INSERT
- **Implementation**:
  - Create `logAudit(action, resourceType, resourceId, details)` server helper
  - Call from server actions on create/update/delete for: products, components, suppliers, regulations, outreach
  - **Append-only**: Remove UPDATE/DELETE policies on `audit_logs` if not already restricted
  - Use database trigger for critical tables (optional): `CREATE TRIGGER audit_products...`

### 4.2 PDF Generation (Compliance Certificate)
- **Library**: `@react-pdf/renderer` (SSR-friendly) or `puppeteer` (for pixel-perfect match to stitch)
- **Flow**:
  - User configures product + regulations on Certificate Generator
  - Click “Generate Document” → fetch product, components, regulation statuses
  - Render PDF from template (Declaration of Conformity layout)
  - Upload to Supabase Storage (`/certificates/{org_id}/{id}.pdf`)
  - Insert `compliance_certificates` row
  - “Export PDF” / “Secure Link” → signed URL to download

### 4.3 Global Search
- **Approach 1 (Simple)**: Single Supabase query with `or` and `ilike` across products.name, components.name, suppliers.name, regulations.name
- **Approach 2 (Better)**: PostgreSQL full-text search – add `tsvector` columns and GIN indexes
- **Route**: `/search?q=...` already exists – wire to `searchComplianceData(query)` server action
- **Return**: Grouped results (products, components, suppliers, regulations) with links

---

## Phase 5: Security & Hardening

### 5.1 Audit Log Integrity
- Ensure `audit_logs` has no UPDATE/DELETE policy for normal users
- Only `INSERT` with `organization_id = get_user_organization_id()`

### 5.2 Document Encryption
- Supabase Storage encrypts at rest by default
- Use private buckets for SDS/datasheets; generate signed URLs for download
- RLS on Storage: restrict by `organization_id` in path or metadata

### 5.3 RBAC (Future)
- `profiles.role` already exists
- Add `resource_permissions` or use role checks in server actions
- Gate routes: e.g. only `admin` can create regulations, delete products

---

## Implementation Order

| Step | Task | Effort | Dependencies |
|------|------|--------|---------------|
| 1 | Create migrations 006–010 | Medium | None |
| 2 | BOM CSV upload + parse (client + server) | Medium | Migration 006 |
| 3 | BOM mapping UI → `finalizeBomMapping` | Medium | Step 2 |
| 4 | Wire Create Regulation to `regulations.thresholds` | Low | Migration 006 |
| 5 | Outreach campaign save + cohort selection | Medium | Migration 007 |
| 6 | Email integration (Resend) for campaigns | Medium | Step 5, env |
| 7 | Supplier response token + public upload form | Medium | Migration 010, Step 6 |
| 8 | Audit logging in all CRUD actions | Low | None |
| 9 | Certificate PDF generation | Medium | Migration 008 |
| 10 | Global search backend | Low | None |

---

## Suggested File Structure

```
src/
├── lib/
│   ├── audit.ts           # logAudit()
│   ├── bom/
│   │   ├── parser.ts      # parseBomCsv
│   │   ├── mapper.ts      # suggestMappings, applyMappings
│   │   └── processor.ts   # finalizeBomMapping
│   ├── email.ts           # sendOutreachEmail (Resend)
│   ├── pdf/
│   │   └── certificate.ts # generateCertificatePdf
│   └── search.ts          # searchComplianceData
├── app/
│   ├── outreach/
│   │   └── respond/
│   │       └── [token]/   # Public supplier upload
│   └── api/
│       └── webhooks/      # Optional: email events
```

---

## Environment Variables Needed

```
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # For admin operations if needed

# New
RESEND_API_KEY=             # Or SENDGRID_API_KEY
NEXT_PUBLIC_APP_URL=         # For portal links in emails
```

---

## Quick Wins (Do First)

1. **Audit logging** – Add `logAudit()` and call from existing create/update/delete actions
2. **Global search** – Simple `ilike` query across products, components, suppliers
3. **BOM mapping – save mapping only** – Persist user’s column choices to `bom_column_mappings` (no CSV processing yet)
4. **Outreach campaign – save draft** – Insert `outreach_campaigns` from the Campaign Builder form

---

## Next Step

Start with **Phase 1 (Schema Extensions)** by creating migration `006_bom_import_schema.sql`, then implement the BOM upload flow step-by-step.
