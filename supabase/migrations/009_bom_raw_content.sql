-- Store raw CSV content for finalize processing (avoids need for Storage on first pass)
ALTER TABLE bom_imports ADD COLUMN IF NOT EXISTS raw_csv_content TEXT;
