-- Regulation source dates (for ingestion / library display)
ALTER TABLE regulations
  ADD COLUMN IF NOT EXISTS source_first_published_at DATE,
  ADD COLUMN IF NOT EXISTS source_last_updated_at TIMESTAMPTZ;

-- Per-organization certificate template and signature (storage path in outreach-uploads or org bucket)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS certificate_template_body TEXT,
  ADD COLUMN IF NOT EXISTS certificate_signer_title TEXT,
  ADD COLUMN IF NOT EXISTS certificate_signature_storage_path TEXT;

-- Shared regulations: allow updates for CSV sync and admin edits
DROP POLICY IF EXISTS "Authenticated users can update regulations" ON regulations;
CREATE POLICY "Authenticated users can update regulations"
  ON regulations FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
