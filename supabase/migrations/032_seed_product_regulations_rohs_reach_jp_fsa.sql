-- Set all products to track only ROHS, REACH, and JP_FSA.
-- Remove any rows for other regulations, then ensure all products
-- have a row for each of the three target regulations.

DELETE FROM product_regulation_status
WHERE regulation_id NOT IN (
  SELECT id FROM regulations WHERE code IN ('ROHS', 'REACH', 'JP_FSA')
);

INSERT INTO product_regulation_status (product_id, regulation_id, status, compliance_date, notes)
SELECT p.id, r.id, 'pending', CURRENT_DATE, NULL
FROM products p
CROSS JOIN regulations r
WHERE r.code IN ('ROHS', 'REACH', 'JP_FSA')
ON CONFLICT (product_id, regulation_id) DO NOTHING;
