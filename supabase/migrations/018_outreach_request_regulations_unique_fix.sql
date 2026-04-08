-- Some databases still have the old UNIQUE(outreach_request_id, regulation_id) under a different
-- auto-generated name (e.g. ..._regulation_key vs ..._regulation_id_key). That blocks consolidated
-- campaigns with multiple components per regulation. Drop every legacy variant and keep partial uniques.

ALTER TABLE outreach_request_regulations
  DROP CONSTRAINT IF EXISTS outreach_request_regulations_outreach_request_id_regulation_id_key;

ALTER TABLE outreach_request_regulations
  DROP CONSTRAINT IF EXISTS outreach_request_regulations_outreach_request_id_regulation_key;

CREATE UNIQUE INDEX IF NOT EXISTS outreach_request_regulations_req_reg_null_comp
  ON outreach_request_regulations (outreach_request_id, regulation_id)
  WHERE component_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS outreach_request_regulations_req_reg_comp
  ON outreach_request_regulations (outreach_request_id, regulation_id, component_id)
  WHERE component_id IS NOT NULL;
