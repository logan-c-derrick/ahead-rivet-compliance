-- Public supplier response links for outreach (validated in app via service role or narrow RPC)

CREATE TABLE outreach_response_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  outreach_request_id UUID NOT NULL REFERENCES outreach_requests(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_response_tokens_token ON outreach_response_tokens(token);
CREATE INDEX idx_outreach_response_tokens_request ON outreach_response_tokens(outreach_request_id);

ALTER TABLE outreach_response_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated org members: manage tokens for requests in their organization
CREATE POLICY "Users can manage outreach_response_tokens in their organization"
  ON outreach_response_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM outreach_requests r
      WHERE r.id = outreach_response_tokens.outreach_request_id
      AND r.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outreach_requests r
      WHERE r.id = outreach_response_tokens.outreach_request_id
      AND r.organization_id = get_user_organization_id()
    )
  );
