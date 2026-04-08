-- BOM Import & Mapping Schema
-- Supports CSV upload workflow with column mapping and conflict resolution

CREATE TABLE bom_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  row_count INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'processing', 'complete', 'failed')),
  mapping_schema JSONB,
  conflict_resolutions JSONB,
  raw_headers JSONB,
  sample_rows JSONB,
  storage_path TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE bom_column_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_columns JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

ALTER TABLE regulations ADD COLUMN IF NOT EXISTS thresholds JSONB;

CREATE TABLE component_substances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  substance_name TEXT NOT NULL,
  cas_number TEXT,
  mass_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_imports_organization_id ON bom_imports(organization_id);
CREATE INDEX idx_bom_imports_status ON bom_imports(status);
CREATE INDEX idx_component_substances_component_id ON component_substances(component_id);

ALTER TABLE bom_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_column_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage bom_imports in their organization"
  ON bom_imports FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage bom_column_mappings in their organization"
  ON bom_column_mappings FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can view component_substances via components"
  ON component_substances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM components
      WHERE components.id = component_substances.component_id
      AND components.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can manage component_substances via components"
  ON component_substances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM components
      WHERE components.id = component_substances.component_id
      AND components.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM components
      WHERE components.id = component_substances.component_id
      AND components.organization_id = get_user_organization_id()
    )
  );
