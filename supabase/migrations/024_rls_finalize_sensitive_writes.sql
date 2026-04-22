-- Finalize sensitive write hardening for tables not covered in 023.
-- Keep onboarding/support behavior intact (organizations, profiles, support_tickets unchanged).

-- supplier_contacts should be manager/admin write-only.
DROP POLICY IF EXISTS "Managers can write supplier_contacts" ON supplier_contacts;
CREATE POLICY "Managers can write supplier_contacts"
  ON supplier_contacts AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- outreach_email_defaults should be manager/admin write-only.
DROP POLICY IF EXISTS "Managers can write outreach_email_defaults" ON outreach_email_defaults;
CREATE POLICY "Managers can write outreach_email_defaults"
  ON outreach_email_defaults AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- audit_logs insert path should be manager/admin-only.
-- (Read policy remains org-scoped from base schema.)
DROP POLICY IF EXISTS "Managers can insert audit_logs" ON audit_logs;
CREATE POLICY "Managers can insert audit_logs"
  ON audit_logs AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (can_manage_sensitive_actions());
