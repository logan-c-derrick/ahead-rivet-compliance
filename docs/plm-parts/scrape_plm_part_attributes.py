"""
Open MBX Signal (or compatible Angular hash-route PLM) part pages and extract
manufacturer + vendor text for each item number, then optionally update Rivet (Supabase).

Designed to mirror docs/get-suppliers (Playwright + auth.json + CSV).

Examples
--------
  # 1) Discover URL: open a real part in Chrome, copy URL, replace id with {item_number}
  python scrape_plm_part_attributes.py \\
    --auth auth.json --use-chrome --headed \\
    --url-template 'https://signal.mbx.com/ng2/#/YOUR_PATH/{item_number}' \\
    --in parts.csv --out enriched.csv --limit 1 --save-html debug.html

  # 2) Full run
  python scrape_plm_part_attributes.py \\
    --auth auth.json --use-chrome \\
    --url-template 'https://signal.mbx.com/ng2/#/YOUR_PATH/{item_number}' \\
    --in parts.csv --out enriched.csv

  # 3) Push to Supabase (see .env.example)
  python scrape_plm_part_attributes.py ... --out enriched.csv --sync-supabase

Input CSV columns (any of these work for the lookup key):
  - item_number (preferred) OR part_number

Optional passthrough:
  - name, manufacturer_sku, component_id

Output CSV columns:
  - item_number, part_number, name, manufacturer_sku, component_id,
    plm_manufacturer, plm_manufacturer_mbx_id,
    plm_vendors_pipe, plm_vendor_mbx_ids_pipe,
    plm_vendor (first vendor name, for simple tooling),
    plm_url, error

Macola item details (default URL) use supplier links like:
  <a href="/ng2/#/suppliers/1034907?tab=1">Supermicro</a>
Multiple vendors are collected from the Vendor row (or fallback heuristics).
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore


DEFAULT_MANUFACTURER_LABELS = [
    "Manufacturer",
    "Mfr",
    "MFR",
    "OEM",
    "Mfg",
    "Manufacturer Name",
]
DEFAULT_VENDOR_LABELS = [
    "Vendor",
    "Supplier",
    "Preferred Vendor",
    "Primary Vendor",
    "Purchasing Vendor",
]


EXTRACT_FIELDS_JS = """
(args) => {
  const manufacturerLabels = args[0];
  const vendorLabels = args[1];
  const norm = (s) => (s || "").replace(/\\s+/g, " ").trim().toLowerCase();
  const clean = (s) => (s || "").replace(/\\s+/g, " ").trim();
  const mset = new Set(manufacturerLabels.map(norm));
  const vset = new Set(vendorLabels.map(norm));

  function matchLabel(text, set) {
    const t = norm(text);
    if (!t) return false;
    for (const x of set) {
      if (t === x) return true;
      if (t.startsWith(x + ":")) return true;
      if (t.startsWith(x + " :")) return true;
    }
    return false;
  }

  let manufacturer = "";
  let vendor = "";

  function consider(val, labelText) {
    const v = clean(val);
    if (!v) return;
    const lab = norm(labelText);
    for (const x of mset) {
      if (lab === x || lab.startsWith(x + ":")) {
        if (!manufacturer || v.length > manufacturer.length) manufacturer = v;
        return;
      }
    }
    for (const x of vset) {
      if (lab === x || lab.startsWith(x + ":")) {
        if (!vendor || v.length > vendor.length) vendor = v;
        return;
      }
    }
  }

  // --- Table rows: first cell label, second cell value ---
  document.querySelectorAll("tr").forEach((tr) => {
    const cells = tr.querySelectorAll("td, th");
    if (cells.length < 2) return;
    const lab = clean(cells[0].textContent || "");
    const val = clean(cells[1].textContent || "");
    if (matchLabel(lab, mset)) manufacturer = val;
    if (matchLabel(lab, vset)) vendor = val;
  });

  // --- dt / dd ---
  document.querySelectorAll("dt").forEach((dt) => {
    const dd = dt.nextElementSibling;
    if (!dd || String(dd.tagName).toLowerCase() !== "dd") return;
    consider(dd.textContent || "", dt.textContent || "");
  });

  // --- label[for] + id target ---
  document.querySelectorAll("label").forEach((lb) => {
    const fid = lb.getAttribute("for");
    if (!fid) return;
    const el = document.getElementById(fid);
    if (!el) return;
    const val =
      (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
        ? (el.value || el.textContent || "")
        : (el.textContent || "");
    consider(val, lb.textContent || "");
  });

  // --- Angular-ish: .form-group label + sibling value ---
  document.querySelectorAll(".form-group, [class*='form-group']").forEach((fg) => {
    const lab = fg.querySelector("label, .control-label, mat-label");
    const valEl =
      fg.querySelector("input:not([type=hidden]), textarea, select, .form-control, mat-select");
    if (lab && valEl) {
      const val =
        valEl instanceof HTMLInputElement ||
        valEl instanceof HTMLTextAreaElement ||
        valEl instanceof HTMLSelectElement
          ? (valEl.value || valEl.textContent || "")
          : clean(valEl.textContent || "");
      consider(val, lab.textContent || "");
    }
  });

  return { manufacturer, vendor };
}
"""

# MBX Macola item_details: manufacturer + vendor(s) as links to /ng2/#/suppliers/{id}
EXTRACT_MACOLA_ITEM_DETAILS_JS = """
() => {
  const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
  function idFromAnchor(a) {
    let combined = "";
    if (a && a.attributes) {
      for (let i = 0; i < a.attributes.length; i++) {
        combined += String(a.attributes[i].value || "") + " ";
      }
    }
    const m = combined.match(/suppliers\\/(\\d+)/i);
    return m ? m[1] : "";
  }
  function linkName(a) {
    const id = idFromAnchor(a);
    const raw =
      (a &&
        (a.textContent || a.getAttribute("aria-label") || a.getAttribute("title"))) ||
      "";
    let n = norm(raw);
    if (!n && id) n = "#" + id;
    return n;
  }
  function collectSupplierLinks(root) {
    const out = [];
    if (!root || !root.querySelectorAll) return out;
    root.querySelectorAll("a").forEach((a) => {
      const id = idFromAnchor(a);
      const name = linkName(a);
      if (id && name) out.push({ mbx_supplier_id: id, name });
    });
    return out;
  }

  let manufacturerName = "";
  let manufacturerId = "";
  const vendors = [];
  const vendorKey = (x) => x.mbx_supplier_id + "|" + x.name.toLowerCase();
  const seen = new Set();

  function addVendor(v) {
    const k = vendorKey(v);
    if (seen.has(k)) return;
    seen.add(k);
    vendors.push(v);
  }

  function handleRow(row) {
    const cells = row.querySelectorAll("td, th, [role='gridcell'], .mat-mdc-cell");
    if (cells.length < 2) return;
    const lab = norm(cells[0].textContent || "").toLowerCase();
    const valueCell = cells[cells.length - 1];
    const links = collectSupplierLinks(valueCell);
    if (!links.length) return;

    if (lab.includes("manufacturer") && !lab.includes("vendor")) {
      manufacturerName = links[0].name;
      manufacturerId = links[0].mbx_supplier_id;
    }
    if (lab.includes("vendor")) {
      links.forEach(addVendor);
    }
  }

  document.querySelectorAll("tr").forEach(handleRow);
  document.querySelectorAll("[role='row']:not(tr)").forEach(handleRow);

  // Some pages use definition lists or stacked divs
  document.querySelectorAll("dl").forEach((dl) => {
    const dts = dl.querySelectorAll("dt");
    dts.forEach((dt) => {
      const lab = norm(dt.textContent || "").toLowerCase();
      let dd = dt.nextElementSibling;
      while (dd && String(dd.tagName).toLowerCase() !== "dd") dd = dd.nextElementSibling;
      if (!dd) return;
      const links = collectSupplierLinks(dd);
      if (!links.length) return;
      if (lab.includes("manufacturer") && !lab.includes("vendor")) {
        manufacturerName = links[0].name;
        manufacturerId = links[0].mbx_supplier_id;
      }
      if (lab.includes("vendor")) links.forEach(addVendor);
    });
  });

  // Fallback: document order — first supplier link = manufacturer, rest = vendors (deduped)
  if (!manufacturerName && !vendors.length) {
    const all = [];
    document.querySelectorAll("a").forEach((a) => {
      const id = idFromAnchor(a);
      const name = linkName(a);
      if (id && name) all.push({ mbx_supplier_id: id, name });
    });
    const byId = new Map();
    for (const x of all) {
      if (!byId.has(x.mbx_supplier_id)) byId.set(x.mbx_supplier_id, x);
    }
    const uniq = [...byId.values()];
    if (uniq.length >= 1) {
      manufacturerName = uniq[0].name;
      manufacturerId = uniq[0].mbx_supplier_id;
      for (let i = 1; i < uniq.length; i++) addVendor(uniq[i]);
    }
  }

  return {
    manufacturer_name: manufacturerName,
    manufacturer_supplier_id: manufacturerId,
    vendors: vendors,
  };
}
"""

# True if any anchor in this document looks like a Macola supplier deep link.
HAS_SUPPLIER_LINK_JS = """
() => {
  const re = /suppliers\\/\\d+/i;
  for (const a of document.querySelectorAll("a")) {
    if (!a.attributes) continue;
    let s = "";
    for (let i = 0; i < a.attributes.length; i++) s += a.attributes[i].value + " ";
    if (re.test(s)) return true;
  }
  return false;
}
"""

DEFAULT_MACOLA_ITEM_URL = (
    "https://signal.mbx.com/Macola/common/item_details/index.cfm?item_no={item_no}#/"
)


async def goto_spa(page, url: str, timeout_ms: int = 120000) -> None:
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=min(30000, timeout_ms))
    except PlaywrightTimeout:
        await page.goto(url, wait_until="load", timeout=timeout_ms)


async def wait_for_supplier_links(page, timeout_ms: int) -> None:
    """Poll main document and iframes until a Macola-style supplier link appears or timeout."""
    if timeout_ms <= 0:
        return
    loop = asyncio.get_running_loop()
    deadline = loop.time() + timeout_ms / 1000.0
    while loop.time() < deadline:
        for frame in list(page.frames):
            try:
                if await frame.evaluate(HAS_SUPPLIER_LINK_JS):
                    return
            except Exception:
                continue
        await asyncio.sleep(0.25)


def build_item_url(template: str, item_number: str, encode: bool) -> str:
    t = template.strip()
    if not any(
        x in t
        for x in ("{item_number}", "{part_number}", "{item_no}")
    ):
        raise SystemExit(
            "url-template must contain {item_number}, {item_no}, or {part_number} "
            "(replaced with the CSV item / part value)."
        )
    raw = item_number.strip()
    sub = quote(raw, safe="") if encode else raw
    return (
        t.replace("{item_number}", sub)
        .replace("{part_number}", sub)
        .replace("{item_no}", sub)
    )


def load_input_rows(path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with path.expanduser().resolve().open(encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        if not r.fieldnames:
            raise SystemExit(f"Empty or invalid CSV: {path}")
        for row in r:
            item = (row.get("item_number") or row.get("part_number") or "").strip()
            if not item:
                continue
            rows.append({k: (v or "").strip() for k, v in row.items()})
    return rows


def read_done_keys(out_path: Path, key_col: str) -> set[str]:
    if not out_path.is_file():
        return set()
    done: set[str] = set()
    with out_path.open(encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            k = (row.get(key_col) or "").strip()
            if k:
                done.add(k)
    return done


OUTPUT_FIELDS = [
    "item_number",
    "part_number",
    "name",
    "manufacturer_sku",
    "component_id",
    "plm_manufacturer",
    "plm_manufacturer_mbx_id",
    "plm_vendors_pipe",
    "plm_vendor_mbx_ids_pipe",
    "plm_vendors_json",
    "plm_vendor",
    "plm_url",
    "error",
]


async def extract_fields(
    page,
    manufacturer_labels: list[str],
    vendor_labels: list[str],
) -> tuple[str, str]:
    raw = await page.evaluate(EXTRACT_FIELDS_JS, [manufacturer_labels, vendor_labels])
    if not isinstance(raw, dict):
        return "", ""
    m = str(raw.get("manufacturer") or "").strip()
    v = str(raw.get("vendor") or "").strip()
    return m, v


def _macola_extract_score(data: dict[str, object]) -> int:
    m = str(data.get("manufacturer_name") or "").strip()
    mid = str(data.get("manufacturer_supplier_id") or "").strip()
    vendors = data.get("vendors") or []
    if not isinstance(vendors, list):
        return 0
    nv = sum(
        1
        for v in vendors
        if isinstance(v, dict)
        and (
            str(v.get("mbx_supplier_id") or "").strip()
            or str(v.get("name") or "").strip()
        )
    )
    return nv * 2 + (4 if (m or mid) else 0)


async def extract_macola_item_details(page) -> dict[str, object]:
    """Manufacturer + list of vendors from Macola item_details supplier links (best match across frames)."""
    best: dict[str, object] | None = None
    best_score = -1
    for frame in list(page.frames):
        try:
            raw = await frame.evaluate(EXTRACT_MACOLA_ITEM_DETAILS_JS)
        except Exception:
            continue
        if not isinstance(raw, dict):
            continue
        vendors = raw.get("vendors") or []
        if not isinstance(vendors, list):
            vendors = []
        clean_v: list[dict[str, str]] = []
        for v in vendors:
            if isinstance(v, dict):
                clean_v.append(
                    {
                        "mbx_supplier_id": str(v.get("mbx_supplier_id") or "").strip(),
                        "name": str(v.get("name") or "").strip(),
                    }
                )
        data: dict[str, object] = {
            "manufacturer_name": str(raw.get("manufacturer_name") or "").strip(),
            "manufacturer_supplier_id": str(raw.get("manufacturer_supplier_id") or "").strip(),
            "vendors": clean_v,
        }
        sc = _macola_extract_score(data)
        if sc > best_score:
            best_score = sc
            best = data
    if best is None:
        return {
            "manufacturer_name": "",
            "manufacturer_supplier_id": "",
            "vendors": [],
        }
    return best


def format_macola_row(data: dict[str, object]) -> dict[str, str]:
    mname = str(data.get("manufacturer_name") or "").strip()
    mid = str(data.get("manufacturer_supplier_id") or "").strip()
    vendors = data.get("vendors") or []
    assert isinstance(vendors, list)
    vnames = [str(v.get("name", "")).strip() for v in vendors if isinstance(v, dict)]
    vids = [str(v.get("mbx_supplier_id", "")).strip() for v in vendors if isinstance(v, dict)]
    pipe_names = " | ".join(vnames)
    pipe_ids = " | ".join(vids)
    first_v = vnames[0] if vnames else ""
    jsn = json.dumps(
        {
            "manufacturer": {"name": mname, "mbx_supplier_id": mid},
            "vendors": [
                {"name": n, "mbx_supplier_id": i}
                for n, i in zip(vnames, vids)
                if n or i
            ],
        },
        ensure_ascii=False,
    )
    return {
        "plm_manufacturer": mname,
        "plm_manufacturer_mbx_id": mid,
        "plm_vendors_pipe": pipe_names,
        "plm_vendor_mbx_ids_pipe": pipe_ids,
        "plm_vendors_json": jsn,
        "plm_vendor": first_v,
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Scrape manufacturer/vendor from MBX Signal part pages.")
    p.add_argument("--auth", type=Path, help="Playwright storage_state JSON (session after login).")
    p.add_argument("--headed", action="store_true")
    p.add_argument("--use-chrome", action="store_true")
    p.add_argument(
        "--url-template",
        default=DEFAULT_MACOLA_ITEM_URL,
        help=(
            "Part detail URL with {item_no}, {item_number}, or {part_number}. "
            f"Default: Macola item_details ({DEFAULT_MACOLA_ITEM_URL})"
        ),
    )
    p.add_argument(
        "--extract-mode",
        choices=("auto", "macola", "generic"),
        default="auto",
        help="auto: Macola link extractor if URL looks like item_details, else label-based generic.",
    )
    p.add_argument(
        "--encode-item-in-url",
        action="store_true",
        help="URL-encode the item number when substituting (use if ids have special characters).",
    )
    p.add_argument("--in", dest="in_path", type=Path, required=True, help="Input CSV path.")
    p.add_argument("--out", dest="out_path", type=Path, required=True, help="Output CSV path.")
    p.add_argument("--limit", type=int, default=0, help="Max rows (0 = all).")
    p.add_argument("--resume", action="store_true", help="Skip item_number already present in --out.")
    p.add_argument("--between-ms", type=int, default=400)
    p.add_argument("--page-timeout-ms", type=int, default=120000)
    p.add_argument(
        "--wait-after-ms",
        type=int,
        default=1200,
        help="Sleep after navigation for Angular render.",
    )
    p.add_argument(
        "--wait-supplier-links-ms",
        type=int,
        default=8000,
        help=(
            "Macola mode: poll main document and iframes until a supplier link appears or timeout (0=skip). "
            "Helps slow Angular/iframes; disable if you need fastest failure on login errors."
        ),
    )
    p.add_argument(
        "--wait-selector",
        default="",
        help="Optional CSS selector to wait for after load (e.g. a table or detail container).",
    )
    p.add_argument("--save-html", type=Path, help="Save first item page HTML to this path (debug).")
    p.add_argument(
        "--label-manufacturer",
        default="",
        help="Comma-separated extra labels for manufacturer (merged with defaults).",
    )
    p.add_argument(
        "--label-vendor",
        default="",
        help="Comma-separated extra labels for vendor (merged with defaults).",
    )
    p.add_argument(
        "--sync-supabase",
        action="store_true",
        help="After scrape, update components in Supabase (requires .env).",
    )
    p.add_argument("--env-file", type=Path, default=Path(".env"), help="Dotenv path for --sync-supabase.")
    return p.parse_args()


def merge_labels(defaults: list[str], extra: str) -> list[str]:
    out = list(defaults)
    if extra.strip():
        for part in extra.split(","):
            s = part.strip()
            if s and s not in out:
                out.append(s)
    return out


def sync_supabase_rows(rows: list[dict[str, str]], env_path: Path) -> None:
    import os

    if load_dotenv:
        load_dotenv(env_path.expanduser())

    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    org = os.environ.get("COMPLIANCEHUB_ORG_ID", "").strip()
    if not url or not key or not org:
        raise SystemExit(
            "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or COMPLIANCEHUB_ORG_ID "
            f"(expected in {env_path}). Copy .env.example to .env and fill values."
        )

    from supabase import create_client

    client = create_client(url, key)

    # Load suppliers for name -> id
    sid_by_lower: dict[str, str] = {}
    off = 0
    chunk = 1000
    while True:
        res = (
            client.table("suppliers")
            .select("id, name")
            .eq("organization_id", org)
            .range(off, off + chunk - 1)
            .execute()
        )
        batch = res.data or []
        for s in batch:
            sid_by_lower[str(s["name"]).strip().lower()] = s["id"]
        if len(batch) < chunk:
            break
        off += chunk

    updated = 0
    skipped = 0
    for row in rows:
        err = (row.get("error") or "").strip()
        if err:
            skipped += 1
            continue
        cid = (row.get("component_id") or "").strip()
        part = (row.get("part_number") or row.get("item_number") or "").strip()
        msku = (row.get("manufacturer_sku") or "").strip()
        mfr = (row.get("plm_manufacturer") or "").strip()
        vend = (row.get("plm_vendor") or "").strip()
        vend_pipe = (row.get("plm_vendors_pipe") or "").strip()

        supplier_id: str | None = None
        for candidate in [x.strip() for x in vend_pipe.split("|") if x.strip()] or (
            [vend] if vend else []
        ):
            supplier_id = sid_by_lower.get(candidate.lower())
            if supplier_id:
                break
        if not supplier_id and mfr:
            supplier_id = sid_by_lower.get(mfr.lower())

        payload: dict = {
            "manufacturer": mfr or None,
            "supplier_id": supplier_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            if cid:
                q = (
                    client.table("components")
                    .update(payload)
                    .eq("id", cid)
                    .eq("organization_id", org)
                )
                q.execute()
            elif part and msku:
                q = (
                    client.table("components")
                    .update(payload)
                    .eq("organization_id", org)
                    .eq("part_number", part)
                    .eq("manufacturer_sku", msku)
                )
                q.execute()
            elif part:
                # May match multiple rows — Supabase updates all matches
                client.table("components").update(payload).eq("organization_id", org).eq(
                    "part_number", part
                ).execute()
            else:
                skipped += 1
                continue
            updated += 1
        except Exception as e:
            print(f"Supabase update failed for row {part!r}: {e}", file=sys.stderr)

    print(
        f"Supabase: attempted updates on {updated} row(s), skipped {skipped} (errors or no key).",
        file=sys.stderr,
    )


async def amain() -> int:
    args = parse_args()
    in_path = args.in_path.expanduser().resolve()
    out_path = args.out_path.expanduser().resolve()
    if not in_path.is_file():
        raise SystemExit(f"Input not found: {in_path}")

    m_labels = merge_labels(DEFAULT_MANUFACTURER_LABELS, args.label_manufacturer)
    v_labels = merge_labels(DEFAULT_VENDOR_LABELS, args.label_vendor)

    ut = args.url_template.strip()
    use_macola = args.extract_mode == "macola" or (
        args.extract_mode == "auto"
        and ("item_details" in ut or "Macola/common/item" in ut)
    )

    rows_in = load_input_rows(in_path)
    if args.limit and args.limit > 0:
        rows_in = rows_in[: args.limit]

    done = read_done_keys(out_path, "item_number") if args.resume else set()
    if done:
        print(f"Resume: skipping {len(done)} item_number(s) already in {out_path}", file=sys.stderr)

    launch_kwargs: dict = {"headless": not args.headed}
    if args.use_chrome:
        launch_kwargs["channel"] = "chrome"

    out_rows: list[dict[str, str]] = []
    out_path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = out_path.is_file() and out_path.stat().st_size > 0
    append_mode = bool(args.resume and file_exists)

    async with async_playwright() as p:
        browser = await p.chromium.launch(**launch_kwargs)
        ctx_kw: dict = {}
        if args.auth and args.auth.is_file():
            ctx_kw["storage_state"] = str(args.auth.expanduser().resolve())
        elif args.auth:
            print(f"Warning: --auth file not found: {args.auth}", file=sys.stderr)

        context = await browser.new_context(**ctx_kw)
        page = await context.new_page()

        first_html_saved = False
        f_out = out_path.open("a" if append_mode else "w", encoding="utf-8-sig", newline="")
        writer = csv.DictWriter(f_out, fieldnames=OUTPUT_FIELDS)
        if not append_mode:
            writer.writeheader()

        try:
            for i, raw in enumerate(rows_in):
                item_number = (raw.get("item_number") or raw.get("part_number") or "").strip()
                if not item_number:
                    continue
                if item_number in done:
                    continue

                part_number = (raw.get("part_number") or item_number).strip()
                name = (raw.get("name") or "").strip()
                msku = (raw.get("manufacturer_sku") or "").strip()
                comp_id = (raw.get("component_id") or "").strip()

                url = ""
                err = ""
                mfr = ""
                vend = ""
                mbx_mfr = ""
                v_pipe = ""
                v_ids_pipe = ""
                v_json = ""

                try:
                    url = build_item_url(args.url_template, item_number, args.encode_item_in_url)
                    await goto_spa(page, url, timeout_ms=args.page_timeout_ms)
                    await asyncio.sleep(args.wait_after_ms / 1000.0)
                    if use_macola and args.wait_supplier_links_ms > 0:
                        await wait_for_supplier_links(page, args.wait_supplier_links_ms)
                    if args.wait_selector.strip():
                        try:
                            await page.wait_for_selector(
                                args.wait_selector.strip(),
                                state="visible",
                                timeout=min(30000, args.page_timeout_ms),
                            )
                        except PlaywrightTimeout:
                            err = f"timeout waiting for selector {args.wait_selector!r}"

                    if not err:
                        if use_macola:
                            mac = await extract_macola_item_details(page)
                            fmt = format_macola_row(mac)
                            mfr = fmt["plm_manufacturer"]
                            mbx_mfr = fmt["plm_manufacturer_mbx_id"]
                            vend = fmt["plm_vendor"]
                            v_pipe = fmt["plm_vendors_pipe"]
                            v_ids_pipe = fmt["plm_vendor_mbx_ids_pipe"]
                            v_json = fmt["plm_vendors_json"]
                            if not mfr and not v_pipe:
                                err = (
                                    "no manufacturer/vendor supplier links found "
                                    "(check login, or use --save-html and tune extractors)"
                                )
                        else:
                            mfr, vend = await extract_fields(page, m_labels, v_labels)
                            if not mfr and not vend:
                                err = "empty manufacturer and vendor (tune labels or --wait-selector)"

                    if args.save_html and not first_html_saved:
                        html = await page.content()
                        args.save_html.parent.mkdir(parents=True, exist_ok=True)
                        args.save_html.write_text(html, encoding="utf-8")
                        print(f"Saved HTML snapshot to {args.save_html.resolve()}", file=sys.stderr)
                        first_html_saved = True

                except Exception as e:
                    err = repr(e)

                row_out = {
                    "item_number": item_number,
                    "part_number": part_number,
                    "name": name,
                    "manufacturer_sku": msku,
                    "component_id": comp_id,
                    "plm_manufacturer": mfr,
                    "plm_manufacturer_mbx_id": mbx_mfr if use_macola else "",
                    "plm_vendors_pipe": v_pipe if use_macola else "",
                    "plm_vendor_mbx_ids_pipe": v_ids_pipe if use_macola else "",
                    "plm_vendors_json": v_json if use_macola else "",
                    "plm_vendor": vend,
                    "plm_url": url,
                    "error": err,
                }
                out_rows.append(row_out)
                writer.writerow(row_out)
                f_out.flush()

                print(
                    f"[{i + 1}/{len(rows_in)}] {item_number} mfr={mfr!r} "
                    f"vendors={v_pipe or vend!r} err={err!r}",
                    file=sys.stderr,
                )
                await asyncio.sleep(args.between_ms / 1000.0)
        finally:
            f_out.close()
        await browser.close()

    if args.sync_supabase:
        merged: list[dict[str, str]] = []
        with out_path.open(encoding="utf-8-sig", newline="") as f:
            r = csv.DictReader(f)
            for row in r:
                merged.append(row)
        sync_supabase_rows(merged, args.env_file)

    print(f"Wrote {len(out_rows)} row(s) to {out_path.resolve()}")
    return 0


def main() -> int:
    return asyncio.run(amain())


if __name__ == "__main__":
    raise SystemExit(main())
