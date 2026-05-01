#!/usr/bin/env python3
"""
Migrate Jira issues from one project to another (same Jira Cloud site).

Required environment variables:
  JIRA_BASE_URL             e.g. https://your-domain.atlassian.net
  JIRA_EMAIL                Jira account email
  JIRA_API_TOKEN            Jira API token
  SOURCE_PROJECT_KEY        Project key to migrate from
  TARGET_PROJECT_KEY        Project key to migrate to

Example:
  python jira_project_migrator.py --dry-run
  python jira_project_migrator.py --copy-comments
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple


API_VERSION = "3"


@dataclass
class Config:
    base_url: str
    email: str
    api_token: str
    source_project: str
    target_project: str
    jql: str
    copy_comments: bool
    dry_run: bool
    page_size: int
    pause_seconds: float


def get_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate Jira issues from one project to another."
    )
    parser.add_argument(
        "--jql",
        default="",
        help=(
            "Optional custom JQL. Defaults to all issues in source project "
            "ordered by created date."
        ),
    )
    parser.add_argument(
        "--copy-comments",
        action="store_true",
        help="Copy comments from source issues to created target issues.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print what would be migrated; do not create/update issues.",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=50,
        help="Number of issues per search page (max Jira usually allows is 100).",
    )
    parser.add_argument(
        "--pause-seconds",
        type=float,
        default=0.0,
        help="Optional pause between created issues (helps avoid API throttling).",
    )
    return parser.parse_args()


def build_config(args: argparse.Namespace) -> Config:
    source_project = get_env("SOURCE_PROJECT_KEY")
    default_jql = f'project = "{source_project}" ORDER BY created ASC'
    return Config(
        base_url=get_env("JIRA_BASE_URL").rstrip("/"),
        email=get_env("JIRA_EMAIL"),
        api_token=get_env("JIRA_API_TOKEN"),
        source_project=source_project,
        target_project=get_env("TARGET_PROJECT_KEY"),
        jql=args.jql.strip() or default_jql,
        copy_comments=args.copy_comments,
        dry_run=args.dry_run,
        page_size=max(1, min(args.page_size, 100)),
        pause_seconds=max(0.0, args.pause_seconds),
    )


def request_json(
    config: Config,
    method: str,
    path: str,
    payload: Optional[Dict[str, Any]] = None,
    query: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    url = f"{config.base_url}/rest/api/{API_VERSION}/{path.lstrip('/')}"
    if query:
        clean_query = {
            key: value for key, value in query.items() if value is not None and value != ""
        }
        if clean_query:
            url = f"{url}?{urllib.parse.urlencode(clean_query)}"

    auth_bytes = f"{config.email}:{config.api_token}".encode("utf-8")
    auth = base64.b64encode(auth_bytes).decode("ascii")
    body = None
    headers = {
        "Authorization": f"Basic {auth}",
        "Accept": "application/json",
    }
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url=url, method=method.upper(), data=body, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            if not raw:
                return {}
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Jira API {method.upper()} {path} failed ({exc.code}): {details}"
        ) from exc


def fetch_all_issues(config: Config) -> List[Dict[str, Any]]:
    fields = [
        "summary",
        "description",
        "issuetype",
        "priority",
        "labels",
        "components",
        "assignee",
        "parent",
        "status",
    ]
    start_at = 0
    all_issues: List[Dict[str, Any]] = []

    while True:
        resp = request_json(
            config,
            "POST",
            "/search",
            payload={
                "jql": config.jql,
                "startAt": start_at,
                "maxResults": config.page_size,
                "fields": fields,
            },
        )
        batch = resp.get("issues", [])
        all_issues.extend(batch)
        total = int(resp.get("total", len(all_issues)))

        print(f"Fetched {len(all_issues)}/{total} issues...", flush=True)
        if len(all_issues) >= total or not batch:
            break
        start_at += len(batch)

    return all_issues


def build_issue_payload(
    source_issue: Dict[str, Any],
    target_project_key: str,
    old_to_new_key_map: Dict[str, str],
) -> Dict[str, Any]:
    fields = source_issue.get("fields", {})
    issue_type = fields.get("issuetype") or {}
    payload_fields: Dict[str, Any] = {
        "project": {"key": target_project_key},
        "summary": fields.get("summary") or "(no summary)",
    }

    issue_type_name = issue_type.get("name")
    if issue_type_name:
        payload_fields["issuetype"] = {"name": issue_type_name}

    if fields.get("description") is not None:
        payload_fields["description"] = fields["description"]
    if fields.get("priority"):
        payload_fields["priority"] = {"name": fields["priority"].get("name")}
    if fields.get("labels"):
        payload_fields["labels"] = fields["labels"]
    if fields.get("components"):
        payload_fields["components"] = [
            {"name": c.get("name")} for c in fields["components"] if c.get("name")
        ]
    assignee = fields.get("assignee") or {}
    if assignee.get("accountId"):
        payload_fields["assignee"] = {"id": assignee["accountId"]}

    is_subtask = bool(issue_type.get("subtask"))
    if is_subtask:
        parent = fields.get("parent") or {}
        old_parent_key = parent.get("key")
        new_parent_key = old_to_new_key_map.get(old_parent_key or "")
        if new_parent_key:
            payload_fields["parent"] = {"key": new_parent_key}
        else:
            raise ValueError(
                f"Sub-task {source_issue.get('key')} skipped: parent {old_parent_key} "
                "was not migrated yet."
            )

    return {"fields": payload_fields}


def copy_issue_comments(config: Config, source_key: str, target_key: str, dry_run: bool) -> int:
    comments_resp = request_json(
        config,
        "GET",
        f"/issue/{source_key}/comment",
        query={"startAt": 0, "maxResults": 5000},
    )
    comments = comments_resp.get("comments", [])
    if dry_run:
        print(f"[DRY-RUN] Would copy {len(comments)} comments: {source_key} -> {target_key}")
        return len(comments)

    copied = 0
    for comment in comments:
        body = comment.get("body")
        if body is None:
            continue
        request_json(
            config,
            "POST",
            f"/issue/{target_key}/comment",
            payload={"body": body},
        )
        copied += 1
    return copied


def split_issues_for_subtasks(issues: Iterable[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    parents: List[Dict[str, Any]] = []
    subtasks: List[Dict[str, Any]] = []
    for issue in issues:
        issue_type = (issue.get("fields") or {}).get("issuetype") or {}
        if issue_type.get("subtask"):
            subtasks.append(issue)
        else:
            parents.append(issue)
    return parents, subtasks


def migrate(config: Config) -> None:
    print(f"Source project: {config.source_project}")
    print(f"Target project: {config.target_project}")
    print(f"JQL: {config.jql}")
    print(f"Dry run: {config.dry_run}")
    print(f"Copy comments: {config.copy_comments}")
    print("-" * 60)

    issues = fetch_all_issues(config)
    if not issues:
        print("No issues matched the query. Nothing to migrate.")
        return

    parent_issues, subtask_issues = split_issues_for_subtasks(issues)
    ordered = parent_issues + subtask_issues
    old_to_new_key: Dict[str, str] = {}
    migrated_count = 0
    skipped_count = 0
    copied_comment_count = 0

    for src_issue in ordered:
        src_key = src_issue.get("key", "<unknown>")
        try:
            create_payload = build_issue_payload(src_issue, config.target_project, old_to_new_key)
            if config.dry_run:
                print(
                    f"[DRY-RUN] Would create {src_key} in {config.target_project} "
                    f"as {create_payload['fields'].get('issuetype', {}).get('name', 'Issue')}"
                )
                fake_new_key = f"{config.target_project}-DRYRUN-{migrated_count + 1}"
                old_to_new_key[src_key] = fake_new_key
                migrated_count += 1
                continue

            create_resp = request_json(config, "POST", "/issue", payload=create_payload)
            new_key = create_resp.get("key")
            if not new_key:
                raise RuntimeError(f"Created issue for {src_key}, but Jira returned no key.")
            old_to_new_key[src_key] = new_key
            migrated_count += 1
            print(f"Created {new_key} from {src_key}")

            if config.copy_comments:
                count = copy_issue_comments(config, src_key, new_key, dry_run=False)
                copied_comment_count += count
                if count:
                    print(f"  Copied {count} comments")

            if config.pause_seconds > 0:
                time.sleep(config.pause_seconds)
        except Exception as exc:  # noqa: BLE001
            skipped_count += 1
            print(f"Skipped {src_key}: {exc}", file=sys.stderr)

    print("-" * 60)
    print(f"Done. Migrated: {migrated_count}, Skipped: {skipped_count}")
    if config.copy_comments:
        print(f"Comments copied: {copied_comment_count}")


def main() -> int:
    try:
        args = parse_args()
        config = build_config(args)
        migrate(config)
        return 0
    except KeyboardInterrupt:
        print("Interrupted by user.", file=sys.stderr)
        return 130
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
