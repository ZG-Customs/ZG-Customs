#!/usr/bin/env python3
"""Deploy protected main only after CI passes for that exact commit."""

import datetime
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import urllib.request

ROOT = Path(os.environ.get("ZG_DEPLOY_ROOT", Path.home() / "apps/zg-customs"))
REPOSITORY = "ZG-Customs/ZG-Customs"


def approved_run(runs, revision):
    matching = [run for run in runs if
                run.get("head_sha") == revision and
                run.get("head_branch") == "main" and
                run.get("event") == "push" and
                run.get("path") == ".github/workflows/ci.yml" and
                run.get("head_repository", {}).get("full_name") == REPOSITORY]
    if not matching:
        return False
    latest = max(matching, key=lambda run: (run.get("id", 0), run.get("run_attempt", 1)))
    return latest.get("status") == "completed" and latest.get("conclusion") == "success"


def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT / "repo"), *args], text=True).strip()


def read_marker(name):
    marker = ROOT / "state" / name
    return marker.read_text().strip() if marker.exists() else None


def synchronize():
    git("fetch", "--quiet", "origin", "main")
    revision = git("rev-parse", "origin/main")
    if revision in (read_marker("current-sha"), read_marker("failed-sha")):
        return
    # The initial infrastructure PR may still be awaiting review.
    exists = subprocess.run(["git", "-C", str(ROOT / "repo"), "cat-file", "-e",
                             f"{revision}:compose.yaml"], capture_output=True)
    if exists.returncode:
        return
    url = (f"https://api.github.com/repos/{REPOSITORY}/actions/workflows/ci.yml/runs"
           f"?head_sha={revision}&event=push&per_page=20")
    request = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json", "User-Agent": "zg-customs-deployer",
        "X-GitHub-Api-Version": "2022-11-28"})
    with urllib.request.urlopen(request, timeout=20) as response:
        runs = json.load(response)["workflow_runs"]
    if not approved_run(runs, revision):
        print(f"Waiting for successful CI on {revision}", flush=True)
        return
    print(f"{datetime.datetime.now(datetime.timezone.utc).isoformat()} Deploying {revision}", flush=True)
    subprocess.run(["bash", str(ROOT / "bin/deploy.sh"), revision], check=True)


def main():
    (ROOT / "state").mkdir(parents=True, exist_ok=True)
    with (ROOT / "state/sync.lock").open("w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        synchronize()


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        print(f"Deployment check failed: {error}", file=sys.stderr)
        sys.exit(1)
