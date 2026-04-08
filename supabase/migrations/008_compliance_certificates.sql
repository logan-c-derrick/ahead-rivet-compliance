-- Compliance Certificates Schema
-- Tracks generated Declaration of Conformity documents

CREATE TABLE compliance_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_serial TEXT,
  regulation_ids UUID[],
  document_hash TEXT,
  storage_path TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE supplier_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  outreach_request_id UUID REFERENCES outreach_requests(id) ON DELETE SET NULL,
  document_type TEXT,
  filename TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_certificates_organization_id ON compliance_certificates(organization_id);
CREATE INDEX idx_compliance_certificates_product_id ON compliance_certificates(product_id);
CREATE INDEX idx_supplier_documents_organization_id ON supplier_documents(organization_id);

ALTER TABLE compliance_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage compliance_certificates in their organization"
  ON compliance_certificates FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage supplier_documents in their organization"
  ON supplier_documents FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
