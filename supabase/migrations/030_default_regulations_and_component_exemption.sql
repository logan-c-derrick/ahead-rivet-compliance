-- Mark RoHS and REACH as default regulations (auto-applied to all products/components).
-- All other regulations require manual opt-in per product.
ALTER TABLE regulations ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;
UPDATE regulations SET is_default = true WHERE code IN ('ROHS', 'REACH');

-- Allow individual components to be flagged as exempt from compliance tracking.
-- Exempt components (e.g. Firmware, BIOS, Shell Scripts) are skipped in
-- product compliance roll-up calculations.
ALTER TABLE components ADD COLUMN IF NOT EXISTS compliance_exempt boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_components_compliance_exempt ON components(compliance_exempt) WHERE compliance_exempt = true;
