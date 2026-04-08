-- Link supplier uploads to specific components (subset of campaign parts)

CREATE TABLE supplier_document_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_document_id UUID NOT NULL REFERENCES supplier_documents(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (supplier_document_id, component_id)
);

CREATE INDEX idx_supplier_document_components_document ON supplier_document_components(supplier_document_id);
CREATE INDEX idx_supplier_document_components_component ON supplier_document_components(component_id);

ALTER TABLE supplier_document_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage supplier_document_components in their organization"
  ON supplier_document_components FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM supplier_documents sd
      WHERE sd.id = supplier_document_components.supplier_document_id
        AND sd.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_documents sd
      WHERE sd.id = supplier_document_components.supplier_document_id
        AND sd.organization_id = get_user_organization_id()
    )
  );
