-- Legacy: `manufacturer` stored the MFR part number; manufacturer_sku and category were added in 010.
-- 1) Copy those values into manufacturer_sku.
-- 2) Where manufacturer still equals SKU, set manufacturer to first token of item name (brand).
-- 3) Replace uniqueness: (org, part_number, manufacturer_sku) instead of (org, part_number, manufacturer).

UPDATE components
SET manufacturer_sku = manufacturer
WHERE manufacturer_sku IS NULL AND manufacturer IS NOT NULL;

UPDATE components
SET manufacturer_sku = COALESCE(
  NULLIF(trim(manufacturer_sku), ''),
  NULLIF(trim(part_number), ''),
  id::text
)
WHERE manufacturer_sku IS NULL OR trim(manufacturer_sku) = '';

UPDATE components
SET manufacturer = NULLIF(trim(split_part(trim(name), ' ', 1)), '')
WHERE name IS NOT NULL
  AND trim(name) <> ''
  AND manufacturer IS NOT NULL
  AND trim(manufacturer) = trim(manufacturer_sku);

ALTER TABLE components DROP CONSTRAINT IF EXISTS components_org_part_manufacturer_key;

ALTER TABLE components
  ADD CONSTRAINT components_org_part_manufacturer_sku_key
  UNIQUE (organization_id, part_number, manufacturer_sku);
