-- Optional scope for response links (e.g. follow-up upload for only uncovered / rejected parts)
ALTER TABLE outreach_response_tokens
  ADD COLUMN IF NOT EXISTS allowed_component_ids UUID[] DEFAULT NULL;

COMMENT ON COLUMN outreach_response_tokens.allowed_component_ids IS
  'When set, portal upload applies only to these components; NULL means full campaign scope.';
