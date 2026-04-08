-- Per-organization default subject/body for new outreach campaigns (rich HTML body supported)

CREATE TABLE outreach_email_defaults (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  subject_template TEXT,
  message_template TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outreach_email_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage outreach_email_defaults in their organization"
  ON outreach_email_defaults FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
