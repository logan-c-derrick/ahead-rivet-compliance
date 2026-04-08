"""One-time helper: open Signal, log in if required, save session to auth.json.

If you see "Executable doesn't exist" for Chromium, either:
  python -m playwright install chromium
or run this script with --use-chrome (uses your installed Google Chrome).
"""

from __future__ import annotations

import sys

from playwright.sync_api import sync_playwright
from playwright.sync_api import Error as PlaywrightError

OUT = "auth.json"
URL = "https://signal.mbx.com/ng2/#/suppliers"


def launch_browser(p, *, use_chrome: bool):
    kw: dict = {"headless": False}
    if use_chrome:
        kw["channel"] = "chrome"
        return p.chromium.launch(**kw)
    try:
        return p.chromium.launch(**kw)
    except PlaywrightError as e:
        msg = str(e)
        if "Executable doesn't exist" in msg or "BrowserType.launch" in msg:
            print(
                "Playwright's Chromium is not installed. Options:\n"
                "  1) python -m playwright install chromium\n"
                "  2) Re-run: python save_auth.py --use-chrome\n",
                file=sys.stderr,
            )
            print("Trying Google Chrome (--use-chrome)…", file=sys.stderr)
            return p.chromium.launch(headless=False, channel="chrome")
        raise


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Save Playwright session to auth.json for MBX scripts.")
    ap.add_argument(
        "--use-chrome",
        action="store_true",
        help="Use installed Google Chrome (recommended if playwright install chromium fails).",
    )
    cli = ap.parse_args()

    with sync_playwright() as p:
        browser = launch_browser(p, use_chrome=cli.use_chrome)
        context = browser.new_context()
        page = context.new_page()
        page.goto(URL, wait_until="load", timeout=120000)
        input(
            "Log in if the site requires it, wait until the supplier list loads, then press Enter…\n"
        )
        context.storage_state(path=OUT)
        print(f"Saved {OUT} — use with: python scrape_supplier_contacts.py --auth {OUT} --use-chrome ...")
        browser.close()
