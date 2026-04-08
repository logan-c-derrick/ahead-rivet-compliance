"""
Scrape supplier names from Signal MBX (Angular SPA with hash routes).

The list is not in the initial HTML; a real browser is required (Playwright).

Setup:
  pip install -r requirements.txt
  playwright install chromium
  If that download fails (e.g. corporate TLS), install Google Chrome and run with --use-chrome.

Usage (after you know the CSS selector for one supplier name cell/link):
  python scrape_suppliers.py --selector "YOUR_CSS_SELECTOR" --out suppliers.csv

If you are not sure of the selector, run once with --debug to save HTML from page 1
(after supplier links load — the script waits for a.supplier-link by default):
  python scrape_suppliers.py --debug

If the site requires login, save Playwright storage after logging in (see --auth in --help).

This script supports --auth path/to/state.json from Playwright storage_state.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright

BASE = "https://signal.mbx.com/ng2/#/suppliers"

# MBX renders names in <a class="supplier-link" href="#/suppliers/...">Name</a>
DEFAULT_SELECTORS = [
    "a.supplier-link",
    "a[href^='#/suppliers/']",
    "table tbody tr td:first-child",
    "mat-table tbody tr mat-cell:first-child",
    "[data-testid*='supplier']",
]


def supplier_url(page_num: int) -> str:
    if page_num <= 1:
        return BASE
    return f"{BASE}?page={page_num}"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Export MBX Signal supplier names to CSV.")
    p.set_defaults(stop_on_empty=True)
    p.add_argument(
        "--start",
        type=int,
        default=1,
        help="First page (default 1).",
    )
    p.add_argument(
        "--end",
        type=int,
        default=191,
        help="Last page inclusive (default 191).",
    )
    p.add_argument(
        "--selector",
        type=str,
        default="",
        help="CSS selector for each supplier name element (recommended).",
    )
    p.add_argument(
        "--selectors-file",
        type=Path,
        help="Text file with one CSS selector per line (tried in order).",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=Path("suppliers.csv"),
        help="Output CSV path (default suppliers.csv).",
    )
    p.add_argument(
        "--auth",
        type=Path,
        help="Playwright storage state JSON (cookies/session after login).",
    )
    p.add_argument(
        "--headed",
        action="store_true",
        help="Show browser window (debugging).",
    )
    p.add_argument(
        "--use-chrome",
        action="store_true",
        help="Use installed Google Chrome instead of Playwright's Chromium (if browser download fails).",
    )
    p.add_argument(
        "--pause-ms",
        type=int,
        default=500,
        help="Extra wait after supplier links appear (ms). Default 500; raise if UI still lags.",
    )
    p.add_argument(
        "--wait-selector",
        default="a.supplier-link",
        metavar="CSS",
        help="Wait until this selector is visible before saving/debug/extract (default: a.supplier-link).",
    )
    p.add_argument(
        "--no-wait",
        action="store_true",
        help="Do not wait for --wait-selector (only if you know the page is already ready).",
    )
    p.add_argument(
        "--per-page-timeout-ms",
        type=int,
        default=60000,
        help="Max wait for selector on each page.",
    )
    p.add_argument(
        "--debug",
        action="store_true",
        help="Save page-1 HTML to debug_page1.html and exit.",
    )
    p.add_argument(
        "--no-stop-on-empty",
        action="store_false",
        dest="stop_on_empty",
        help="Keep going even when a page has no names (default: stop).",
    )
    return p.parse_args()


def load_selector_list(args: argparse.Namespace) -> list[str]:
    if args.selector:
        return [args.selector.strip()]
    if args.selectors_file and args.selectors_file.is_file():
        lines = args.selectors_file.read_text(encoding="utf-8").splitlines()
        return [ln.strip() for ln in lines if ln.strip() and not ln.strip().startswith("#")]
    return list(DEFAULT_SELECTORS)


def normalize_name(s: str) -> str:
    s = re.sub(r"\s+", " ", s.strip())
    return s


def extract_names(
    page, selectors: list[str], timeout_ms: int
) -> tuple[list[str], str | None, str | None]:
    """Returns (names, matched_selector, error_message). On success error_message is None."""
    last_err: str | None = None
    for sel in selectors:
        try:
            page.wait_for_selector(sel, state="visible", timeout=timeout_ms)
        except PlaywrightTimeout:
            last_err = f"timeout waiting for: {sel}"
            continue
        loc = page.locator(sel)
        count = loc.count()
        names: list[str] = []
        for i in range(count):
            text = normalize_name(loc.nth(i).inner_text())
            if text:
                names.append(text)
        if names:
            return names, sel, None
        last_err = f"selector matched but no text: {sel}"
    return [], None, last_err or "no selectors worked"


def goto_spa(page, url: str, timeout_ms: int = 120000) -> None:
    """Angular SPAs often never reach networkidle; fall back to load."""
    try:
        page.goto(url, wait_until="networkidle", timeout=timeout_ms)
    except PlaywrightTimeout:
        page.goto(url, wait_until="load", timeout=timeout_ms)


def wait_for_supplier_list(
    page,
    wait_selector: str,
    timeout_ms: int,
) -> bool:
    """Block until at least one supplier link is visible (avoids saving empty DOM)."""
    if not wait_selector.strip():
        return True
    try:
        page.wait_for_selector(wait_selector.strip(), state="visible", timeout=timeout_ms)
        return True
    except PlaywrightTimeout:
        return False


def main() -> int:
    args = parse_args()
    selectors = load_selector_list(args)
    if args.start > args.end:
        print("error: --start must be <= --end", file=sys.stderr)
        return 2

    launch_kwargs: dict = {"headless": not args.headed}
    if args.use_chrome:
        launch_kwargs["channel"] = "chrome"

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        context_kwargs: dict = {}
        if args.auth and args.auth.is_file():
            context_kwargs["storage_state"] = str(args.auth)
        context = browser.new_context(**context_kwargs)
        page = context.new_page()

        all_rows: list[dict[str, str]] = []
        reported_selector: str | None = None

        for page_num in range(args.start, args.end + 1):
            url = supplier_url(page_num)
            goto_spa(page, url)

            if not args.no_wait:
                ready = wait_for_supplier_list(
                    page,
                    args.wait_selector,
                    args.per_page_timeout_ms,
                )
                if not ready:
                    print(
                        f"Page {page_num}: timed out waiting for {args.wait_selector!r}. "
                        f"Try --headed, --auth, increase --per-page-timeout-ms, or --pause-ms.",
                        file=sys.stderr,
                    )
                    if page_num == args.start:
                        browser.close()
                        return 1
                    if args.stop_on_empty:
                        break
                    continue

            time.sleep(args.pause_ms / 1000.0)

            if args.debug and page_num == args.start:
                out = Path("debug_page1.html")
                out.write_text(page.content(), encoding="utf-8")
                print(f"Wrote {out.resolve()} (after wait for {args.wait_selector!r})")
                print("Search this file for a supplier name or run without --debug to export CSV.")
                browser.close()
                return 0

            names, matched_sel, err = extract_names(page, selectors, args.per_page_timeout_ms)
            if not names:
                print(
                    f"Page {page_num}: no names extracted ({err}). "
                    f"Try --headed, increase --pause-ms, or set --selector.",
                    file=sys.stderr,
                )
                if page_num == args.start:
                    browser.close()
                    return 1
                if args.stop_on_empty:
                    print("Stopping (--stop-on-empty).", file=sys.stderr)
                    break
                continue

            if reported_selector is None and matched_sel:
                reported_selector = matched_sel
                print(f"Using selector: {matched_sel}", file=sys.stderr)

            for name in names:
                all_rows.append({"page": str(page_num), "supplier_name": name})

            print(f"Page {page_num}: {len(names)} names (total {len(all_rows)})", file=sys.stderr)

        browser.close()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["page", "supplier_name"])
        w.writeheader()
        w.writerows(all_rows)

    print(f"Wrote {len(all_rows)} rows to {args.out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
