-- Composite indexes for the common (organization_id + ORDER BY) pattern
-- on the two highest-traffic list pages.
CREATE INDEX IF NOT EXISTS idx_components_org_name
  ON components (organization_id, name);

CREATE INDEX IF NOT EXISTS idx_products_org_created
  ON products (organization_id, created_at DESC);
