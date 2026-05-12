-- Replace old (org, part_number, manufacturer) unique constraint with
-- (org, part_number, manufacturer_sku) to match BOM import upsert logic.
ALTER TABLE components DROP CONSTRAINT IF EXISTS components_org_part_mfr_unique;
ALTER TABLE components DROP CONSTRAINT IF EXISTS components_org_part_manufacturer_key;
ALTER TABLE components DROP CONSTRAINT IF EXISTS components_org_part_manufacturer_sku_key;

ALTER TABLE components
  ADD CONSTRAINT components_org_part_manufacturer_sku_key
  UNIQUE (organization_id, part_number, manufacturer_sku);
