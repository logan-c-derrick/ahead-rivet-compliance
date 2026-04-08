-- Allow authenticated users to insert custom regulations (e.g. from /regulations/new)
CREATE POLICY "Authenticated users can insert regulations"
  ON regulations FOR INSERT
  TO authenticated
  WITH CHECK (true);
