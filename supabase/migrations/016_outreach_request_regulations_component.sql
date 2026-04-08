-- Per-component regulation rows on a single outreach_request (consolidated campaigns)

ALTER TABLE outreach_request_regulations
  ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES components(id) ON DELETE CASCADE;

UPDATE outreach_request_regulations orr
SET component_id = r.component_id
FROM outreach_requests r
WHERE orr.outreach_request_id = r.id
  AND orr.component_id IS NULL
  AND r.component_id IS NOT NULL;

ALTER TABLE outreach_request_regulations
  DROP CONSTRAINT IF EXISTS outreach_request_regulations_outreach_request_id_regulation_id_key;

-- Alternate PostgreSQL / Supabase naming for the same UNIQUE columns
ALTER TABLE outreach_request_regulations
  DROP CONSTRAINT IF EXISTS outreach_request_regulations_outreach_request_id_regulation_key;

CREATE UNIQUE INDEX IF NOT EXISTS outreach_request_regulations_req_reg_null_comp
  ON outreach_request_regulations (outreach_request_id, regulation_id)
  WHERE component_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS outreach_request_regulations_req_reg_comp
  ON outreach_request_regulations (outreach_request_id, regulation_id, component_id)
  WHERE component_id IS NOT NULL;
