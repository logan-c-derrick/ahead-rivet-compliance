"""
Visit each MBX Signal supplier, open the Contacts tab, export all contacts to CSV.

Requires Playwright (same setup as scrape_suppliers.py).

Typical run (enumerate list pages 1–191, then visit each supplier detail → Contacts):
  python scrape_supplier_contacts.py --auth auth.json --use-chrome --out supplier_contacts.csv

Speed (large runs):
  - Use --from-csv after a one-time --list-only pass (skips re-crawling list pages).
  - Use --fast for shorter sleeps and fewer contact retries (may be flakier on slow networks).
  - Use --concurrency 3–5 to scrape several suppliers in parallel (one browser, multiple tabs).
  - Lower --pause-ms / --between-ms if the UI is stable.

Faster repeat runs: save IDs once, then only scrape contacts:
  python scrape_supplier_contacts.py --list-only --out suppliers_with_ids.csv --auth auth.json --use-chrome
  python scrape_supplier_contacts.py --from-csv suppliers_with_ids.csv --auth auth.json --use-chrome --out supplier_contacts.csv

Resume after interruption (skips supplier_ids already in the output CSV):
  python scrape_supplier_contacts.py --auth auth.json --use-chrome --out supplier_contacts.csv --resume

Test on a few suppliers:
  python scrape_supplier_contacts.py --limit 5 --auth auth.json --use-chrome
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import re
import sys
from pathlib import Path

from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright

LIST_BASE = "https://signal.mbx.com/ng2/#/suppliers"
SUPPLIER_LINK = "a.supplier-link"
HREF_ID = re.compile(r"#/suppliers/(\d+)")


def supplier_list_url(page_num: int) -> str:
    if page_num <= 1:
        return LIST_BASE
    return f"{LIST_BASE}?page={page_num}"


def supplier_detail_url(supplier_id: str) -> str:
    return f"https://signal.mbx.com/ng2/#/suppliers/{supplier_id}"


async def goto_spa(page, url: str, timeout_ms: int = 30000) -> None:
    # Hash-route Angular apps often keep connections open; `networkidle` can hang.
    # We wait for DOM readiness and then rely on explicit selectors for actual content.
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=min(30000, timeout_ms))
    except PlaywrightTimeout:
        await page.goto(url, wait_until="load", timeout=timeout_ms)


async def goto_spa_long(page, url: str, timeout_ms: int) -> None:
    """Navigation for supplier list pages (allow longer than default 30s cap)."""
    t = max(timeout_ms, 30000)
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=t)
    except PlaywrightTimeout:
        await page.goto(url, wait_until="load", timeout=t)


async def wait_for_supplier_list_links(page, selector: str, timeout_ms: int) -> bool:
    """Wait for supplier links: try visible first, then attached (Angular may paint late)."""
    if not selector.strip():
        return True
    sel = selector.strip()
    try:
        await page.wait_for_selector(sel, state="visible", timeout=timeout_ms)
        return True
    except PlaywrightTimeout:
        pass
    try:
        await page.wait_for_selector(sel, state="attached", timeout=min(30000, timeout_ms))
        await asyncio.sleep(0.5)
        return page.locator(sel).count() > 0
    except PlaywrightTimeout:
        return False


async def log_page_debug(page, label: str) -> None:
    try:
        title = await page.title()
    except Exception:
        title = "?"
    print(f"{label} url={page.url!r} title={title!r}", file=sys.stderr)


async def wait_for_supplier_hash(page, supplier_id: str, timeout_ms: int) -> bool:
    """Wait until the Angular hash-route reflects the supplier we're targeting."""
    try:
        t = min(20000, timeout_ms)
        await page.wait_for_function(
            # Angular hash-route changes `window.location.hash`, so check that.
            "(id) => ((window.location.hash || '') + '').includes('/suppliers/' + id)",
            arg=supplier_id,
            timeout=t,
        )
        return True
    except PlaywrightTimeout:
        return False


async def extract_contacts_with_retry(
    page,
    prev_contacts_signature: str | None,
    *,
    retries: int = 20,
    delay_s: float = 0.7,
) -> tuple[list[dict[str, str]], str | None]:
    """Retry extraction until contacts appear and change vs prior supplier.

    Returns an empty list when the contacts do not change after retries (prevents repeating
    stale contacts from a previous supplier).
    """

    def signature(contacts: list[dict[str, str]]) -> str:
        hrefs = sorted({(c.get("contact_href") or "").strip() for c in contacts if c.get("contact_href")})
        return "|".join(hrefs)

    last_contacts: list[dict[str, str]] = []
    last_sig: str | None = None
    for _ in range(retries):
        contacts = await extract_contacts_eval(page)
        last_contacts = contacts

        sig = signature(contacts)
        if sig:
            last_sig = sig
            if prev_contacts_signature is None:
                return contacts, sig
            if sig != prev_contacts_signature:
                return contacts, sig

        await asyncio.sleep(delay_s)

    # If we never observed a change, return empty contacts so the caller writes blanks.
    return [], prev_contacts_signature or last_sig


async def wait_visible(page, selector: str, timeout_ms: int) -> bool:
    if not selector.strip():
        return True
    try:
        await page.wait_for_selector(selector.strip(), state="visible", timeout=timeout_ms)
        return True
    except PlaywrightTimeout:
        return False


EXTRACT_CONTACTS_JS = """
() => {
  const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
  function mailtoEmail(a) {
    if (!a) return "";
    const h = a.getAttribute("href") || "";
    if (!h.toLowerCase().startsWith("mailto:")) return "";
    let e = h.slice(7).split("?")[0];
    try { e = decodeURIComponent(e); } catch (err) {}
    return norm(e);
  }
  function dialPhone(a) {
    if (!a) return "";
    return norm((a.textContent || "").replace(/<!---->/g, ""));
  }
  /** "Add contact" goes to /contacts/new — not a real person row. */
  function hrefRaw(a) {
    return (a.getAttribute("href") || a.getAttribute("ng-href") || "").trim();
  }
  function isAddContactLink(a) {
    const t = norm(a.textContent).toLowerCase();
    if (t === "add contact") return true;
    const h = hrefRaw(a).toLowerCase();
    return h.includes("/contacts/new") || h.includes("contacts/new?");
  }
  /** Real contact detail URLs use a numeric id, e.g. .../contacts/40800 (not /contacts/new). */
  function isRealContactHref(h) {
    if (!h) return false;
    const s = h.toLowerCase();
    if (s.indexOf("/contacts/new") >= 0) return false;
    return /\\/contacts\\/\\d+/.test(h) || /#\\/contacts\\/\\d+/.test(h);
  }
  function rowKey(name, email, phone, href) {
    return norm(name) + "|" + norm(email) + "|" + norm(phone) + "|" + norm(href);
  }

  const seen = new Set();
  const rows = [];

  const nameLinks = Array.from(
    document.querySelectorAll(
      'a[href*="/contacts/"], a[href*="#/contacts/"], a[ng-href*="/contacts/"], a[ng-href*="#/contacts/"]'
    )
  ).filter((a) => !isAddContactLink(a) && isRealContactHref(hrefRaw(a)));

  for (const a of nameLinks) {
    const name = norm(a.textContent);
    if (!name) continue;
    const href = hrefRaw(a);
    let el = a.parentElement;
    let email = "";
    let phone = "";
    for (let depth = 0; depth < 14 && el; depth++) {
      const mails = el.querySelectorAll('a[href^="mailto:"]');
      const dial =
        el.querySelector('a[ng-click="dial()"]') ||
        el.querySelector('a[ng-click*="dial"]');
      if (mails.length === 1) {
        email = mailtoEmail(mails[0]);
      } else if (mails.length > 1) {
        const arr = Array.from(mails);
        const mine = arr.find(
          (m) => (a.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
        );
        email = mailtoEmail(mine || arr[0]);
      }
      if (dial) phone = dialPhone(dial);
      // Only stop early when we have both fields; otherwise we can miss the email
      // for contacts whose phone appears first in the DOM.
      if (email && phone) break;
      el = el.parentElement;
    }
    // Skip false positives (e.g., non-contact anchors that still contain /contacts/ in href).
    if (!email && !phone) continue;
    const key = rowKey(name, email, phone, href);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ contact_name: name, email: email, phone: phone, contact_href: href });
  }

  /** Fallback: pair mailto links with a real contact name link in the same card/row. */
  const mailtos = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
  for (const ma of mailtos) {
    let el = ma.parentElement;
    let name = "";
    let contactHref = "";
    let phone = "";
    for (let depth = 0; depth < 14 && el; depth++) {
      const links = el.querySelectorAll(
        'a[href*="/contacts/"], a[href*="#/contacts/"], a[ng-href*="/contacts/"], a[ng-href*="#/contacts/"]'
      );
      for (const L of links) {
        if (isAddContactLink(L)) continue;
        if (!isRealContactHref(hrefRaw(L))) continue;
        name = norm(L.textContent);
        contactHref = hrefRaw(L);
        break;
      }
      if (name) break;
      el = el.parentElement;
    }
    const email = mailtoEmail(ma);
    if (!email || !name) continue;
    el = ma.parentElement;
    for (let depth = 0; depth < 14 && el; depth++) {
      const dial =
        el.querySelector('a[ng-click="dial()"]') ||
        el.querySelector('a[ng-click*="dial"]');
      if (dial) {
        phone = dialPhone(dial);
        break;
      }
      el = el.parentElement;
    }
    const key = rowKey(name, email, phone, contactHref);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ contact_name: name, email: email, phone: phone, contact_href: contactHref });
  }

  return rows;
}
"""


async def extract_contacts_eval(page) -> list[dict[str, str]]:
    raw = await page.evaluate(EXTRACT_CONTACTS_JS)
    if not isinstance(raw, list):
        return []
    out: list[dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        out.append(
            {
                "contact_name": str(item.get("contact_name", "") or "").strip(),
                "email": str(item.get("email", "") or "").strip(),
                "phone": str(item.get("phone", "") or "").strip(),
                "contact_href": str(item.get("contact_href", "") or "").strip(),
            }
        )
    return out


async def click_contacts_tab(page, timeout_ms: int) -> bool:
    """Open the Contacts tab on the supplier detail page."""
    t = min(timeout_ms, 20000)
    try:
        tab = page.locator('a[ng-click*="selectTab"]').filter(
            has_text=re.compile(r"^\s*Contacts\s*$", re.I)
        ).first
        await tab.wait_for(state="visible", timeout=t)
        await tab.click(timeout=t)
        return True
    except Exception:
        pass
    try:
        tab = page.get_by_text("Contacts", exact=True).first
        await tab.wait_for(state="visible", timeout=t)
        await tab.click(timeout=t)
        return True
    except Exception:
        pass
    try:
        await page.get_by_role("tab", name=re.compile(r"^\s*Contacts\s*$", re.I)).first.click(
            timeout=t
        )
        return True
    except Exception:
        return False


async def enumerate_suppliers_from_list(
    page,
    start_page: int,
    end_page: int,
    list_wait_selector: str,
    pause_ms: int,
    per_page_timeout_ms: int,
    stop_on_empty: bool,
    no_wait_list: bool,
    max_suppliers: int | None = None,
    *,
    list_nav_timeout_ms: int = 120000,
    list_retries: int = 3,
    list_extra_wait_ms: int = 1500,
) -> list[dict[str, str]]:
    """Collect supplier_id and supplier_name from each list page.

    If max_suppliers is set, stop loading list pages once that many unique
    suppliers have been collected (so --limit does not crawl every page first).
    """
    found: list[dict[str, str]] = []
    seen_ids: set[str] = set()

    def have_enough() -> bool:
        return bool(max_suppliers and max_suppliers > 0 and len(found) >= max_suppliers)

    page_num = start_page
    while True:
        if end_page > 0 and page_num > end_page:
            break
        if have_enough():
            print(
                f"Stopping list crawl at --limit {max_suppliers} ({len(found)} suppliers).",
                file=sys.stderr,
            )
            break
        list_url = supplier_list_url(page_num)
        ready = False
        for attempt in range(max(1, list_retries)):
            await goto_spa_long(page, list_url, timeout_ms=list_nav_timeout_ms)
            if list_extra_wait_ms > 0:
                await asyncio.sleep(list_extra_wait_ms / 1000.0)
            if no_wait_list:
                ready = True
                break
            if await wait_for_supplier_list_links(page, list_wait_selector, per_page_timeout_ms):
                ready = True
                break
            print(
                f"List page {page_num}: attempt {attempt + 1}/{list_retries} — "
                f"still waiting for {list_wait_selector!r}.",
                file=sys.stderr,
            )
            await log_page_debug(page, f"List page {page_num} debug")
            if attempt + 1 < list_retries:
                await asyncio.sleep(2.0 * (attempt + 1))
        if not ready:
            print(
                f"List page {page_num}: gave up waiting for {list_wait_selector!r}. "
                f"Try: refresh auth (python save_auth.py), --headed, "
                f"--per-page-timeout-ms 120000 --list-nav-timeout-ms 180000 --list-retries 5, "
                f"or --from-csv suppliers_with_ids.csv to skip list pages.",
                file=sys.stderr,
            )
            await log_page_debug(page, f"List page {page_num} final")
            if page_num == start_page:
                return []
            if stop_on_empty:
                break
            continue
        await asyncio.sleep(pause_ms / 1000.0)
        links = page.locator(SUPPLIER_LINK)
        n = links.count()
        if n == 0:
            print(f"List page {page_num}: no {SUPPLIER_LINK} found.", file=sys.stderr)
            if page_num == start_page:
                return []
            if stop_on_empty:
                break
            continue
        for i in range(n):
            if have_enough():
                break
            el = links.nth(i)
            text = re.sub(r"\s+", " ", ((await el.inner_text()) or "").strip())
            href = (await el.get_attribute("href")) or ""
            m = HREF_ID.search(href)
            if not m:
                continue
            sid = m.group(1)
            if sid in seen_ids:
                continue
            seen_ids.add(sid)
            found.append(
                {
                    "supplier_id": sid,
                    "supplier_name": text,
                    "list_page": str(page_num),
                }
            )
        print(f"List page {page_num}: {n} links (total unique {len(found)})", file=sys.stderr)
        if have_enough():
            print(
                f"Stopping list crawl at --limit {max_suppliers} ({len(found)} suppliers).",
                file=sys.stderr,
            )
            break
        page_num += 1

    return found


def load_suppliers_from_csv(path: Path) -> list[dict[str, str]]:
    """CSV must include supplier_id (or supplier_url / detail url to parse)."""
    path = path.expanduser().resolve()
    if not path.is_file():
        raise SystemExit(
            f"File not found: {path}\n"
            "Create it first by enumerating the supplier list (one-time), e.g.:\n"
            "  python -u scrape_supplier_contacts.py --list-only --out suppliers_with_ids.csv "
            "--auth auth.json --use-chrome --start 1 --end 0\n"
            "Or pass the full path to your CSV: --from-csv \"C:\\path\\to\\file.csv\""
        )
    rows: list[dict[str, str]] = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        if not r.fieldnames:
            return rows
        fn = [x.strip() if x else "" for x in r.fieldnames]
        id_key = None
        for k in ("supplier_id", "supplierId", "id"):
            if k in fn:
                id_key = k
                break
        if not id_key:
            raise SystemExit(
                f"{path}: need a column named supplier_id (or supplierId, id). "
                "Re-run without --from-csv to enumerate from the list pages."
            )
        name_key = "supplier_name" if "supplier_name" in fn else None
        page_key = "list_page" if "list_page" in fn else ("page" if "page" in fn else None)
        for row in r:
            sid = (row.get(id_key) or "").strip()
            if not sid:
                continue
            item: dict[str, str] = {"supplier_id": sid, "supplier_name": "", "list_page": ""}
            if name_key:
                item["supplier_name"] = (row.get(name_key) or "").strip()
            if page_key:
                item["list_page"] = (row.get(page_key) or "").strip()
            rows.append(item)
    return rows


def read_done_ids(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    done: set[str] = set()
    with path.open(encoding="utf-8-sig", newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            sid = (row.get("supplier_id") or "").strip()
            if sid:
                done.add(sid)
    return done


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Export MBX supplier contacts to CSV.")
    p.set_defaults(stop_on_empty=True)
    p.add_argument("--out", type=Path, default=Path("supplier_contacts.csv"))
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write CSV. Only log supplier rows and extracted contacts.",
    )
    p.add_argument(
        "--verbose",
        action="store_true",
        help="Verbose logging during scraping (use with --dry-run).",
    )
    p.add_argument("--auth", type=Path, help="Playwright storage_state JSON.")
    p.add_argument("--headed", action="store_true")
    p.add_argument("--use-chrome", action="store_true")
    p.add_argument(
        "--from-csv",
        type=Path,
        help="Use supplier_id from this CSV instead of crawling list pages.",
    )
    p.add_argument("--start", type=int, default=1, help="First supplier list page (enumerate mode).")
    p.add_argument(
        "--end",
        type=int,
        default=0,
        help="Last supplier list page (0 = auto-continue until empty pages; default 0).",
    )
    p.add_argument("--list-wait-selector", default="a.supplier-link")
    p.add_argument("--pause-ms", type=int, default=500)
    p.add_argument(
        "--no-wait-list",
        action="store_true",
        help="Skip waiting for list selector on each list page (not recommended).",
    )
    p.add_argument("--per-page-timeout-ms", type=int, default=60000)
    p.add_argument(
        "--list-nav-timeout-ms",
        type=int,
        default=120000,
        help="Max time for browser navigation to each supplier list page (ms).",
    )
    p.add_argument(
        "--list-retries",
        type=int,
        default=3,
        help="Retries per list page if supplier links do not appear (default 3).",
    )
    p.add_argument(
        "--list-extra-wait-ms",
        type=int,
        default=1500,
        help="Extra sleep after list page load before waiting for a.supplier-link (ms).",
    )
    p.add_argument("--supplier-timeout-ms", type=int, default=90000, help="Timeout per supplier page.")
    p.add_argument("--between-ms", type=int, default=400, help="Delay between suppliers (ms).")
    p.add_argument(
        "--progress-every",
        type=int,
        default=25,
        help="Print progress summary every N suppliers (default 25).",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=0,
        metavar="N",
        help="Max suppliers: stop list crawl early and only process N detail pages (0 = all).",
    )
    p.add_argument("--resume", action="store_true", help="Skip supplier_ids already in --out.")
    p.add_argument(
        "--omit-empty-suppliers",
        action="store_true",
        help="If a supplier has zero contacts after opening Contacts, do not write any row for it.",
    )
    p.add_argument(
        "--no-stop-on-empty",
        action="store_false",
        dest="stop_on_empty",
        help="Keep enumerating when a list page is empty.",
    )
    p.add_argument(
        "--list-only",
        action="store_true",
        help="Only enumerate supplier_id + name from list pages; write --out and exit.",
    )
    p.add_argument(
        "--fast",
        action="store_true",
        help="Shorter sleeps and fewer contact retries (faster; may be flakier on slow UI).",
    )
    p.add_argument(
        "--block-media",
        action="store_true",
        help="Block image/font/media requests to speed page loads (disable if the app misbehaves).",
    )
    p.add_argument(
        "--contact-retries",
        type=int,
        default=20,
        metavar="N",
        help="Max attempts while waiting for contacts DOM to update (default 20).",
    )
    p.add_argument(
        "--contact-retry-delay-s",
        type=float,
        default=0.7,
        metavar="SEC",
        help="Delay between contact extraction attempts (default 0.7).",
    )
    p.add_argument(
        "--concurrency",
        type=int,
        default=1,
        metavar="N",
        help="Number of parallel supplier detail tabs (default 1). Try 3–5 on a solid connection.",
    )
    return p.parse_args()


CSV_FIELDS = [
    "supplier_id",
    "supplier_name",
    "list_page",
    "contact_name",
    "email",
    "phone",
    "contact_href",
]


def apply_fast_args(args: argparse.Namespace) -> None:
    if args.fast:
        args.pause_ms = min(args.pause_ms, 150)
        args.between_ms = min(args.between_ms, 150)
        args.contact_retries = min(args.contact_retries, 10)
        args.contact_retry_delay_s = min(args.contact_retry_delay_s, 0.45)


async def setup_block_media(context, block_media: bool) -> None:
    if not block_media:
        return

    async def route_handler(route) -> None:
        if route.request.resource_type in ("image", "media", "font"):
            await route.abort()
        else:
            await route.continue_()

    await context.route("**/*", route_handler)


async def scrape_supplier_contacts_inner(
    page,
    sup: dict[str, str],
    args: argparse.Namespace,
    prev_contacts_signature: str | None,
) -> tuple[str | None, list[dict[str, str]], str]:
    """Scrape one supplier. Returns (new_prev_contacts_signature, csv_rows, kind).

    kind is: contacts (had real rows), blank, omitted (omit_empty and no data), error.
    """
    sid = sup["supplier_id"]
    url = supplier_detail_url(sid)
    base_cols = {
        "supplier_id": sid,
        "supplier_name": sup.get("supplier_name", ""),
        "list_page": sup.get("list_page", ""),
    }

    await goto_spa(page, url, timeout_ms=args.supplier_timeout_ms)
    await wait_for_supplier_hash(page, sid, timeout_ms=args.supplier_timeout_ms)
    await asyncio.sleep(args.pause_ms / 1000.0)

    if not await click_contacts_tab(page, args.supplier_timeout_ms):
        print(f"{sid}: could not click Contacts tab — writing empty contact row.", file=sys.stderr)
        if args.omit_empty_suppliers:
            return prev_contacts_signature, [], "omitted"
        row = {
            **base_cols,
            "contact_name": "",
            "email": "",
            "phone": "",
            "contact_href": "",
        }
        return prev_contacts_signature, [row], "blank"

    await asyncio.sleep(args.pause_ms / 1000.0)
    try:
        await page.wait_for_selector(
            'a[href^="mailto:"], '
            'a[href*="/contacts/"]:not([href*="contacts/new"]), '
            'a[href*="#/contacts/"]:not([href*="contacts/new"])',
            state="visible",
            timeout=min(25000, args.supplier_timeout_ms),
        )
    except PlaywrightTimeout:
        pass

    contacts, contacts_signature = await extract_contacts_with_retry(
        page,
        prev_contacts_signature,
        retries=max(1, args.contact_retries),
        delay_s=max(0.05, args.contact_retry_delay_s),
    )
    new_prev = prev_contacts_signature
    if contacts:
        new_prev = contacts_signature
    if not contacts:
        if args.omit_empty_suppliers:
            return new_prev, [], "omitted"
        row = {
            **base_cols,
            "contact_name": "",
            "email": "",
            "phone": "",
            "contact_href": "",
        }
        return new_prev, [row], "blank"

    rows: list[dict[str, str]] = []
    for c in contacts:
        rows.append(
            {
                **base_cols,
                "contact_name": c["contact_name"],
                "email": c["email"],
                "phone": c["phone"],
                "contact_href": c["contact_href"],
            }
        )
    return new_prev, rows, "contacts"


async def amain() -> int:
    args = parse_args()
    apply_fast_args(args)
    if args.end > 0 and args.start > args.end:
        print("error: --start must be <= --end", file=sys.stderr)
        return 2
    if args.concurrency < 1:
        args.concurrency = 1
    if args.concurrency > 1 and args.list_only:
        print("Note: --list-only uses a single tab; ignoring --concurrency.", file=sys.stderr)

    launch_kwargs: dict = {"headless": not args.headed}
    if args.use_chrome:
        launch_kwargs["channel"] = "chrome"

    suppliers: list[dict[str, str]]
    if args.from_csv:
        suppliers = load_suppliers_from_csv(args.from_csv)
        print(f"Loaded {len(suppliers)} suppliers from {args.from_csv}", file=sys.stderr)
        if args.limit and args.limit > 0:
            suppliers = suppliers[: args.limit]
            print(f"Using first {len(suppliers)} (--limit).", file=sys.stderr)
    else:
        suppliers = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(**launch_kwargs)
        ctx_kw: dict = {}
        if args.auth and args.auth.is_file():
            ctx_kw["storage_state"] = str(args.auth)
        context = await browser.new_context(**ctx_kw)
        await setup_block_media(context, args.block_media)
        page = await context.new_page()

        if not args.from_csv:
            suppliers = await enumerate_suppliers_from_list(
                page,
                args.start,
                args.end,
                args.list_wait_selector,
                args.pause_ms,
                args.per_page_timeout_ms,
                args.stop_on_empty,
                args.no_wait_list,
                max_suppliers=args.limit if args.limit and args.limit > 0 else None,
                list_nav_timeout_ms=args.list_nav_timeout_ms,
                list_retries=args.list_retries,
                list_extra_wait_ms=args.list_extra_wait_ms,
            )
            if not suppliers:
                print("No suppliers enumerated; check --auth and list selectors.", file=sys.stderr)
                await browser.close()
                return 1

        if args.list_only:
            args.out.parent.mkdir(parents=True, exist_ok=True)
            with args.out.open("w", encoding="utf-8-sig", newline="") as f:
                w = csv.DictWriter(
                    f,
                    fieldnames=["supplier_id", "supplier_name", "list_page"],
                )
                w.writeheader()
                w.writerows(suppliers)
            print(f"Wrote {len(suppliers)} rows to {args.out.resolve()}")
            await browser.close()
            return 0

        if args.limit and args.limit > 0 and len(suppliers) > args.limit:
            suppliers = suppliers[: args.limit]

        done_ids = read_done_ids(args.out) if args.resume else set()
        if args.resume and done_ids:
            print(f"Resume: skipping {len(done_ids)} supplier_ids already in {args.out}", file=sys.stderr)
        if done_ids:
            suppliers = [s for s in suppliers if s.get("supplier_id") and s["supplier_id"] not in done_ids]
        print(f"Suppliers selected for processing: {len(suppliers)}", file=sys.stderr)
        if args.concurrency > 1:
            print(f"Using concurrency={args.concurrency} (parallel tabs).", file=sys.stderr)

        rows_written = 0
        suppliers_with_contacts = 0
        suppliers_blank = 0
        exceptions_count = 0
        processed = 0
        write_lock = asyncio.Lock()
        f_out = None
        writer: csv.DictWriter | None = None

        if args.dry_run:

            async def flush() -> None:
                return

            async def emit_row(row: dict[str, str]) -> None:
                nonlocal rows_written
                async with write_lock:
                    rows_written += 1
                    print(f"CSV_ROW {row}")

            if args.verbose:
                for sup in suppliers:
                    print(f"SUPPLIER_INPUT {sup}")
            else:
                for sup in suppliers[: min(20, len(suppliers))]:
                    print(f"SUPPLIER_INPUT {sup}")
                if len(suppliers) > 20:
                    print(f"SUPPLIER_INPUT ... ({len(suppliers) - 20} more not shown)")
        else:
            args.out.parent.mkdir(parents=True, exist_ok=True)
            file_exists = args.out.is_file()
            write_header = not file_exists or not args.resume

            f_out = args.out.open(
                "a" if args.resume and file_exists else "w",
                encoding="utf-8-sig",
                newline="",
            )
            writer = csv.DictWriter(f_out, fieldnames=CSV_FIELDS)

            async def flush() -> None:
                async with write_lock:
                    if f_out:
                        f_out.flush()

            async def emit_row(row: dict[str, str]) -> None:
                nonlocal rows_written
                async with write_lock:
                    rows_written += 1
                    assert writer is not None
                    writer.writerow(row)

            if write_header:
                assert writer is not None
                writer.writeheader()
                if f_out:
                    f_out.flush()

        async def record_progress() -> None:
            async with write_lock:
                if args.progress_every > 0 and processed % args.progress_every == 0:
                    print(
                        f"Progress: processed={processed}, with_contacts={suppliers_with_contacts}, "
                        f"blank={suppliers_blank}, rows={rows_written}, exceptions={exceptions_count}",
                        file=sys.stderr,
                    )

        async def handle_result(
            sup: dict[str, str],
            new_prev: str | None,
            rows: list[dict[str, str]],
            kind: str,
            prev_sig_holder: list[str | None],
        ) -> None:
            nonlocal processed, suppliers_with_contacts, suppliers_blank
            prev_sig_holder[0] = new_prev
            sid = sup["supplier_id"]
            for row in rows:
                await emit_row(row)
            await flush()
            async with write_lock:
                processed += 1
                if kind == "contacts":
                    suppliers_with_contacts += 1
                elif kind == "blank":
                    suppliers_blank += 1
            done_ids.add(sid)
            if args.progress_every > 0 and processed % args.progress_every == 0:
                await record_progress()

        async def run_supplier_on_page(
            page_local,
            sup: dict[str, str],
            prev_sig_holder: list[str | None],
        ) -> None:
            nonlocal processed, suppliers_with_contacts, suppliers_blank, exceptions_count
            sid = sup["supplier_id"]
            try:
                new_prev, rows, kind = await scrape_supplier_contacts_inner(
                    page_local, sup, args, prev_sig_holder[0]
                )
                await handle_result(sup, new_prev, rows, kind, prev_sig_holder)
            except Exception as e:
                print(f"{sid}: exception during contacts scrape: {e!r}", file=sys.stderr)
                async with write_lock:
                    exceptions_count += 1
                if not args.omit_empty_suppliers:
                    await emit_row(
                        {
                            "supplier_id": sid,
                            "supplier_name": sup.get("supplier_name", ""),
                            "list_page": sup.get("list_page", ""),
                            "contact_name": "",
                            "email": "",
                            "phone": "",
                            "contact_href": "",
                        }
                    )
                    await flush()
                    async with write_lock:
                        suppliers_blank += 1
                        processed += 1
                        done_ids.add(sid)
                else:
                    async with write_lock:
                        processed += 1
                        done_ids.add(sid)
                if args.progress_every > 0 and processed % args.progress_every == 0:
                    await record_progress()
            await asyncio.sleep(args.between_ms / 1000.0)

        n_workers = min(args.concurrency, max(1, len(suppliers))) if suppliers else 1

        if n_workers <= 1:
            prev_holder: list[str | None] = [None]
            for sup in suppliers:
                await run_supplier_on_page(page, sup, prev_holder)
        else:
            q: asyncio.Queue = asyncio.Queue()
            for s in suppliers:
                await q.put(s)

            async def worker() -> None:
                p_local = await context.new_page()
                prev_holder_w: list[str | None] = [None]
                try:
                    while True:
                        sup = await q.get()
                        if sup is None:
                            break
                        await run_supplier_on_page(p_local, sup, prev_holder_w)
                finally:
                    await p_local.close()

            tasks = [asyncio.create_task(worker()) for _ in range(n_workers)]
            for _ in range(n_workers):
                await q.put(None)
            await asyncio.gather(*tasks)

        if f_out:
            f_out.close()
        await browser.close()

    if args.dry_run:
        print("Done. Dry-run complete (no CSV written).")
    else:
        print(f"Done. Appended/wrote rows under {args.out.resolve()}")
    print(
        f"Summary: processed={processed}, with_contacts={suppliers_with_contacts}, "
        f"blank={suppliers_blank}, rows={rows_written}, exceptions={exceptions_count}",
        file=sys.stderr,
    )
    return 0


def main() -> int:
    return asyncio.run(amain())


if __name__ == "__main__":
    raise SystemExit(main())
