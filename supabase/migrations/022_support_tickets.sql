CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inquiry_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_created
  ON support_tickets(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester
  ON support_tickets(requester_id, created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view support_tickets in their organization" ON support_tickets;
CREATE POLICY "Users can view support_tickets in their organization"
  ON support_tickets FOR SELECT
  USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can insert support_tickets in their organization" ON support_tickets;
CREATE POLICY "Users can insert support_tickets in their organization"
  ON support_tickets FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND requester_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own support_tickets" ON support_tickets;
CREATE POLICY "Users can update their own support_tickets"
  ON support_tickets FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND requester_id = auth.uid()
  );
