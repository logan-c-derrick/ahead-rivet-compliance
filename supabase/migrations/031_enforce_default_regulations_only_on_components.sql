-- Remove any component_regulations rows for non-default regulations.
-- Components are only tracked against RoHS and REACH by default.
-- Other regulations require manual opt-in at the product level.
DELETE FROM component_regulations
WHERE regulation_id IN (
  SELECT id FROM regulations WHERE is_default = false
);
