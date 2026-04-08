-- Add BOM fields to components for Item Number, Manufacturer SKU, category, pricing
ALTER TABLE components ADD COLUMN IF NOT EXISTS manufacturer_sku TEXT;
ALTER TABLE components ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE components ADD COLUMN IF NOT EXISTS unit_msrp NUMERIC;
ALTER TABLE components ADD COLUMN IF NOT EXISTS unit_price NUMERIC;
