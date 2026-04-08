# MBX Signal → manufacturer / vendor → ComplianceHub

This folder adds a Python script in the same style as `docs/get-suppliers.zip` (`scrape_supplier_contacts.py`): **Playwright**, **saved session** (`auth.json`), and **CSV** in/out.

## What it does

1. For each row in your input CSV, opens the **Macola item details** page (default URL) or another URL you pass.
2. **Macola mode** (default when the URL contains `item_details`): reads supplier links like  
   `<a href="/ng2/#/suppliers/1034907?tab=1">Supermicro</a>` — one **manufacturer** row and **one or more vendors** (multiple links in the Vendor row).
3. **Generic mode** (`--extract-mode generic`): label-based extraction (`Manufacturer`, `Vendor`, …) for other page layouts.
4. Writes an **enriched CSV** (`plm_vendors_pipe` lists all vendors; `plm_vendors_json` has MBX supplier ids).
5. Optionally **updates** `components` in Supabase when you pass `--sync-supabase` (matches supplier **name** to your org’s `suppliers` table; tries each vendor name in order).

## One-time setup

Use your project root (example: `~/Documents/coding/compliancehub`). Do **not** use an old OneDrive path if you moved the repo.

```bash
cd ~/Documents/coding/compliancehub/docs/plm-parts
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium
```

### Auth (reuse your existing flow)

Copy your working `auth.json` from the `get-suppliers` folder next to this script, or create a new one:

```bash
# From get-suppliers folder (or adapt paths):
python save_auth.py --use-chrome
# Log in to Signal, wait until any authenticated page loads, press Enter.
cp ../extracted-get-suppliers/get-suppliers/auth.json ./auth.json
```

### Default URL (Macola item details)

The script defaults to:

`https://signal.mbx.com/Macola/common/item_details/index.cfm?item_no={item_no}#/`

Your CSV should use **`item_number`** / **`part_number`** with the Macola item number (e.g. `283264`). You can override `--url-template` if your tenant uses a different host path; placeholders: **`{item_no}`**, **`{item_number}`**, **`{part_number}`** (all substitute the same value).

If the page structure differs, run with `--save-html debug.html` and `--headed`, or switch to **`--extract-mode generic`** and label-based extraction.

### Other part URLs

For non-Macola pages, set `--url-template` and either rely on **auto** (script picks Macola vs generic from the URL) or set **`--extract-mode generic`** explicitly.

### Input CSV

Create **`parts.csv`** (or any name) with at least **`item_number`** or **`part_number`**. A starter file **`parts.csv`** is in this folder (edit rows for your items). You can also copy **`parts_example.csv`** and rename it.

Minimum column: **`item_number`** (or **`part_number`**) — substituted into `{item_no}` / `{item_number}` / `{part_number}` in `--url-template`.

Optional:

- **`name`**, **`manufacturer_sku`** — copied through to the output and used for safer Supabase matching.
- **`component_id`** — if you exported UUIDs from ComplianceHub, sync can target this row exactly.

## Runs

**Dry scrape (no database)** — default Macola URL:

```bash
python scrape_plm_part_attributes.py \
  --auth auth.json --use-chrome \
  --in parts.csv \
  --out parts_enriched.csv
```

**Resume** after interruption (skips `item_number` already present in the output file):

```bash
python scrape_plm_part_attributes.py ... --out parts_enriched.csv --resume
```

**Push to Supabase** (requires `.env` — see `.env.example`):

```bash
python scrape_plm_part_attributes.py ... --out parts_enriched.csv --sync-supabase
```

This updates `components.manufacturer` and, when a matching `suppliers` row exists (case-insensitive name match), sets `components.supplier_id` from the **vendor** string.

## ComplianceHub import (no Supabase script)

If you prefer not to use the API, use the app’s **Components → Bulk CSV** flow:

1. Export `parts_enriched.csv` with columns aligned to the bulk importer (`name`, `part_number`, `manufacturer_sku`, `manufacturer`, `supplier_name` where `supplier_name` = vendor).
2. Import in the UI and resolve unmatched vendors there.

## Security

- Never commit `auth.json`, `.env`, or service role keys.
- Prefer a **service role** key only on a secure machine; rotate if leaked.
