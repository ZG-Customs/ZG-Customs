#!/usr/bin/env python3
"""Keep the last three deployed image pairs. Run under the deployment lock."""

import argparse
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

REPOSITORIES = ("zg-customs-backend", "zg-customs-web")
SHA = re.compile(r"[0-9a-f]{40}")
DOCKER_TIMEOUT = 60
PRUNE_TIMEOUT = 300


def docker_run(*args, action, timeout=DOCKER_TIMEOUT, capture_output=False):
    command = ["docker", *args]
    try:
        return subprocess.run(command, check=True, text=True,
                              capture_output=capture_output, timeout=timeout)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"{action} timed out after {timeout}s: {shlex.join(command)}") from error
    except subprocess.CalledProcessError as error:
        detail = f"\n{error.stderr.strip()}" if error.stderr else ""
        raise RuntimeError(
            f"{action} failed (exit {error.returncode}): {shlex.join(command)}{detail}"
        ) from error
    except OSError as error:
        raise RuntimeError(f"{action} could not start: {shlex.join(command)} ({error})") from error


def docker_lines(*args):
    return docker_run(*args, action="Docker inspection", capture_output=True).stdout.splitlines()


def maintain(root, apply):
    state = root / "state"
    history = state / "image-retention"
    current = (state / "current-sha").read_text().strip()
    previous = history.read_text().splitlines() if history.exists() else []
    if not all(SHA.fullmatch(sha) for sha in [current, *previous]):
        raise ValueError("Invalid deployment history; skipping cleanup.")
    keep = list(dict.fromkeys([current, *previous]))[:3]  # zadrzavamo samo 3 najnovija sha

    # Record the successful deployment even if a later Docker operation fails.
    if apply:
        pending = history.with_suffix(".tmp")
        pending.write_text("".join(f"{sha}\n" for sha in keep))
        pending.replace(history)

    images = {}
    for line in docker_lines("image", "ls", "--no-trunc", "--format", "{{.Repository}} {{.Tag}} {{.ID}}"):
        repository, tag, image_id = line.split()
        if repository in REPOSITORIES and SHA.fullmatch(tag):
            images[repository, tag] = image_id
    missing = [f"{repo}:{sha}" for sha in keep for repo in REPOSITORIES if (repo, sha) not in images]
    if missing:
        raise ValueError(f"Missing retained images: {', '.join(missing)}; skipping cleanup.")

    containers = docker_lines("container", "ls", "-aq")
    used = set(docker_lines("container", "inspect", "--format", "{{.Image}}", *containers)
               if containers else [])
    print("Retaining releases (newest first):", *keep, flush=True)

    if len(keep) < 3:
        print("Waiting for three successful releases before removing image tags.")
    else:
        for (repo, tag), image_id in sorted(images.items()):
            if tag in keep or image_id in used:
                continue
            reference = f"{repo}:{tag}"
            print("Remove" if apply else "Would remove", reference, flush=True)
            if apply:
                docker_run("image", "rm", "--no-prune", reference, action="Image tag removal")

    # cilj je da ne koristiti previse prostora za cache... nepotreno punjenje diska
    print("Default builder cache target: 2 GB.", flush=True)
    if apply:
        docker_run("buildx", "prune", "--builder", "default", "--max-used-space", "2GB", "--force",
                   action="Build cache cleanup", timeout=PRUNE_TIMEOUT)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="execute the displayed retention policy")
    args = parser.parse_args()
    try:
        maintain(Path(os.environ.get("ZG_DEPLOY_ROOT", Path.home() / "apps/zg-customs")), args.apply)
    except (OSError, ValueError, RuntimeError) as error:
        print(f"Image maintenance failed: {error}", file=sys.stderr)
        sys.exit(1)
