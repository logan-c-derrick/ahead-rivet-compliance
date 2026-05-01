#!/usr/bin/env python3
"""
Send manual outreach CSV rows via SMTP.

Usage:
  python scripts/send_manual_outreach.py --csv ./manual-outreach.csv --dry-run
  python scripts/send_manual_outreach.py --csv ./manual-outreach.csv

Environment variables:
  SMTP_HOST (default: smtp.office365.com)
  SMTP_PORT (default: 587)
  SMTP_USER (required)
  SMTP_PASS (required)
  SMTP_FROM (default: SMTP_USER)
  SMTP_USE_TLS (default: true)
"""

from __future__ import annotations

import argparse
import csv
import os
import smtplib
import sys
from email.message import EmailMessage
from pathlib import Path


def get_env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return default
    return value.strip()


def as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {"request_id", "to_email", "subject", "body_html"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"CSV missing required columns: {', '.join(sorted(missing))}")
        rows: list[dict[str, str]] = []
        for row in reader:
            rows.append({k: (v or "").strip() for k, v in row.items()})
        return rows


def send_one(
    server: smtplib.SMTP,
    from_email: str,
    row: dict[str, str],
    dry_run: bool,
) -> tuple[bool, str]:
    request_id = row.get("request_id", "")
    to_email = row.get("to_email", "")
    subject = row.get("subject", "")
    body_html = row.get("body_html", "")

    if not to_email:
        return False, f"{request_id}: missing to_email"
    if not subject:
        return False, f"{request_id}: missing subject"
    if not body_html:
        return False, f"{request_id}: missing body_html"

    if dry_run:
        return True, f"{request_id}: DRY RUN -> {to_email} | {subject}"

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content("HTML email. Please use an HTML-compatible client.")
    msg.add_alternative(body_html, subtype="html")

    server.send_message(msg)
    return True, f"{request_id}: sent -> {to_email}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Send manual outreach CSV via SMTP.")
    parser.add_argument("--csv", required=True, help="Path to CSV exported from Rivet")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate rows and print what would be sent without sending email",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}", file=sys.stderr)
        return 2

    host = get_env("SMTP_HOST", "smtp.office365.com")
    port_raw = get_env("SMTP_PORT", "587")
    user = get_env("SMTP_USER")
    password = get_env("SMTP_PASS")
    from_email = get_env("SMTP_FROM", user)
    use_tls = as_bool(get_env("SMTP_USE_TLS", "true"), True)

    if not user or not password:
        print("Missing SMTP_USER or SMTP_PASS environment variables.", file=sys.stderr)
        return 2
    try:
        port = int(port_raw or "587")
    except ValueError:
        print(f"Invalid SMTP_PORT: {port_raw}", file=sys.stderr)
        return 2

    try:
        rows = load_rows(csv_path)
    except Exception as exc:  # noqa: BLE001
        print(f"Failed to read CSV: {exc}", file=sys.stderr)
        return 2

    if not rows:
        print("CSV has no data rows.")
        return 0

    print(f"Loaded {len(rows)} outreach row(s) from {csv_path}")

    if args.dry_run:
        for row in rows:
            ok, message = send_one(None, from_email or user, row, dry_run=True)  # type: ignore[arg-type]
            prefix = "OK" if ok else "ERR"
            print(f"{prefix} {message}")
        return 0

    sent = 0
    failed = 0
    with smtplib.SMTP(host, port, timeout=30) as server:
        if use_tls:
            server.starttls()
        server.login(user, password)

        for row in rows:
            try:
                ok, message = send_one(server, from_email or user, row, dry_run=False)
            except Exception as exc:  # noqa: BLE001
                ok, message = False, f"{row.get('request_id', '')}: send failed ({exc})"
            if ok:
                sent += 1
                print(f"OK {message}")
            else:
                failed += 1
                print(f"ERR {message}")

    print(f"Done. sent={sent}, failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

