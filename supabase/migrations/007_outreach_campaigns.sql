-- Outreach Campaigns Schema
-- Campaign-centric outreach with cohort targeting

CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  regulation_id UUID REFERENCES regulations(id) ON DELETE SET NULL,
  message_template TEXT,
  subject_template TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed')),
  scheduled_at TIMESTAMPTZ,
  follow_up_days INT DEFAULT 7,
  cohort_filters JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

ALTER TABLE outreach_requests ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL;

CREATE INDEX idx_outreach_campaigns_organization_id ON outreach_campaigns(organization_id);
CREATE INDEX idx_outreach_requests_campaign_id ON outreach_requests(campaign_id);

ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage outreach_campaigns in their organization"
  ON outreach_campaigns FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
