-- Ensure RLS is enabled for component_substances.
-- Policies already exist, but were ineffective while RLS was disabled.

ALTER TABLE component_substances ENABLE ROW LEVEL SECURITY;
