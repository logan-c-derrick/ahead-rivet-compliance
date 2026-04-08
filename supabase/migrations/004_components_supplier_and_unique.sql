-- Add supplier_id to components and unique constraint for BOM import
-- supplier_id: optional link to supplier
-- unique (organization_id, part_number, manufacturer): one component per org per part/manufacturer combo
-- (PostgreSQL allows multiple rows when part_number and/or manufacturer are NULL)

ALTER TABLE components
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE components
  DROP CONSTRAINT IF EXISTS components_org_part_manufacturer_key;

ALTER TABLE components
  ADD CONSTRAINT components_org_part_manufacturer_key
  UNIQUE (organization_id, part_number, manufacturer);
