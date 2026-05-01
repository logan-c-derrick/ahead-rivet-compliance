-- Link supplier uploads to one or more regulations selected in the supplier portal

CREATE TABLE supplier_document_regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_document_id UUID NOT NULL REFERENCES supplier_documents(id) ON DELETE CASCADE,
  regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (supplier_document_id, regulation_id)
);

CREATE INDEX idx_supplier_document_regulations_document
  ON supplier_document_regulations(supplier_document_id);
CREATE INDEX idx_supplier_document_regulations_regulation
  ON supplier_document_regulations(regulation_id);

ALTER TABLE supplier_document_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage supplier_document_regulations in their organization"
  ON supplier_document_regulations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM supplier_documents sd
      WHERE sd.id = supplier_document_regulations.supplier_document_id
        AND sd.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_documents sd
      WHERE sd.id = supplier_document_regulations.supplier_document_id
        AND sd.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Managers can write supplier_document_regulations"
  ON supplier_document_regulations AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());
