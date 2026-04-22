-- Enforce role-based write controls at the database layer.
-- This prevents "viewer" users from mutating sensitive records via direct API calls.

-- Returns normalized role from profiles for the current user.
CREATE OR REPLACE FUNCTION get_user_app_role()
RETURNS TEXT AS $$
  SELECT COALESCE(LOWER(TRIM(role)), 'viewer')
  FROM profiles
  WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Managers/admins can perform sensitive writes.
-- Backward-compat: legacy "user" role maps to manager-level behavior.
CREATE OR REPLACE FUNCTION can_manage_sensitive_actions()
RETURNS BOOLEAN AS $$
  SELECT get_user_app_role() IN ('admin', 'compliance_manager', 'user');
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Restrictive policies are AND-ed with existing permissive org-scoped policies.
-- This keeps tenant isolation logic intact while adding role gating for writes.

-- Core domain tables
DROP POLICY IF EXISTS "Managers can write products" ON products;
CREATE POLICY "Managers can write products"
  ON products AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write components" ON components;
CREATE POLICY "Managers can write components"
  ON components AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write suppliers" ON suppliers;
CREATE POLICY "Managers can write suppliers"
  ON suppliers AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write product_components" ON product_components;
CREATE POLICY "Managers can write product_components"
  ON product_components AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write component_regulations" ON component_regulations;
CREATE POLICY "Managers can write component_regulations"
  ON component_regulations AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write product_regulation_status" ON product_regulation_status;
CREATE POLICY "Managers can write product_regulation_status"
  ON product_regulation_status AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- Regulations library (shared table): restrict inserts/updates to manager/admin roles.
DROP POLICY IF EXISTS "Authenticated users can insert regulations" ON regulations;
CREATE POLICY "Managers can insert regulations"
  ON regulations AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Authenticated users can update regulations" ON regulations;
CREATE POLICY "Managers can update regulations"
  ON regulations AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- Outreach stack
DROP POLICY IF EXISTS "Managers can write outreach_requests" ON outreach_requests;
CREATE POLICY "Managers can write outreach_requests"
  ON outreach_requests AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write outreach_campaigns" ON outreach_campaigns;
CREATE POLICY "Managers can write outreach_campaigns"
  ON outreach_campaigns AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write outreach_request_regulations" ON outreach_request_regulations;
CREATE POLICY "Managers can write outreach_request_regulations"
  ON outreach_request_regulations AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write outreach_response_tokens" ON outreach_response_tokens;
CREATE POLICY "Managers can write outreach_response_tokens"
  ON outreach_response_tokens AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- BOM / ingestion
DROP POLICY IF EXISTS "Managers can write bom_imports" ON bom_imports;
CREATE POLICY "Managers can write bom_imports"
  ON bom_imports AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write bom_column_mappings" ON bom_column_mappings;
CREATE POLICY "Managers can write bom_column_mappings"
  ON bom_column_mappings AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write component_substances" ON component_substances;
CREATE POLICY "Managers can write component_substances"
  ON component_substances AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- Certificates / supplier docs
DROP POLICY IF EXISTS "Managers can write compliance_certificates" ON compliance_certificates;
CREATE POLICY "Managers can write compliance_certificates"
  ON compliance_certificates AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write supplier_documents" ON supplier_documents;
CREATE POLICY "Managers can write supplier_documents"
  ON supplier_documents AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

DROP POLICY IF EXISTS "Managers can write supplier_document_components" ON supplier_document_components;
CREATE POLICY "Managers can write supplier_document_components"
  ON supplier_document_components AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());

-- Organization-scoped operational settings
DROP POLICY IF EXISTS "Managers can write organization_settings" ON organization_settings;
CREATE POLICY "Managers can write organization_settings"
  ON organization_settings AS RESTRICTIVE FOR ALL TO authenticated
  USING (can_manage_sensitive_actions())
  WITH CHECK (can_manage_sensitive_actions());
