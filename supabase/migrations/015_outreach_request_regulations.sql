-- Per-regulation review for outreach requests (multi-regulation requests + approval workflow)

CREATE TABLE outreach_request_regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outreach_request_id UUID NOT NULL REFERENCES outreach_requests(id) ON DELETE CASCADE,
  regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (outreach_request_id, regulation_id)
);

CREATE INDEX idx_outreach_request_regulations_request ON outreach_request_regulations(outreach_request_id);
CREATE INDEX idx_outreach_request_regulations_regulation ON outreach_request_regulations(regulation_id);

ALTER TABLE outreach_request_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage outreach_request_regulations in their organization"
  ON outreach_request_regulations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM outreach_requests r
      WHERE r.id = outreach_request_regulations.outreach_request_id
        AND r.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outreach_requests r
      WHERE r.id = outreach_request_regulations.outreach_request_id
        AND r.organization_id = get_user_organization_id()
    )
  );

-- Backfill from legacy single regulation_id on outreach_requests
INSERT INTO outreach_request_regulations (outreach_request_id, regulation_id, review_status)
SELECT id, regulation_id, 'pending'
FROM outreach_requests
WHERE regulation_id IS NOT NULL
ON CONFLICT (outreach_request_id, regulation_id) DO NOTHING;
