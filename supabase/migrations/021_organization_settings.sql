CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  alert_preferences JSONB NOT NULL DEFAULT '{
    "regulatory_breaches": {"email": true, "push": true},
    "data_integrity_syncs": {"email": false, "push": true},
    "annual_report_reminders": {"email": true, "push": false}
  }'::jsonb,
  regulatory_filters JSONB NOT NULL DEFAULT '{
    "rohs_eu": true,
    "reach": true,
    "weee_directive": false,
    "prop65": false
  }'::jsonb,
  integration_settings JSONB NOT NULL DEFAULT '{
    "token_status": "active",
    "last_saved_at": null,
    "last_revoked_at": null
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view organization_settings in their organization" ON organization_settings;
CREATE POLICY "Users can view organization_settings in their organization"
  ON organization_settings FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can manage organization_settings in their organization" ON organization_settings;
CREATE POLICY "Users can manage organization_settings in their organization"
  ON organization_settings FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
