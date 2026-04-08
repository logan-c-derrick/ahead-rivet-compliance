-- Per-supplier contacts (e.g. from bulk CSV import)

CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  list_page TEXT,
  contact_href TEXT,
  external_supplier_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_contacts_organization_id ON supplier_contacts(organization_id);
CREATE INDEX idx_supplier_contacts_supplier_id ON supplier_contacts(supplier_id);

ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage supplier_contacts in their organization"
  ON supplier_contacts FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
