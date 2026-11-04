#!/usr/bin/env python3
"""Keep the last three deployed image pairs. Run under the deployment lock."""

import argparse
import os
from pathlib import Path
import re
import subprocess

REPOSITORIES = ("zg-customs-backend", "zg-customs-web")
SHA = re.compile(r"[0-9a-f]{40}")


def docker_lines(*args):
    return subprocess.check_output(["docker", *args], text=True).splitlines()


def maintain(root, apply):
    state = root / "state"
    history = state / "image-retention"
    current = (state / "current-sha").read_text().strip()
    previous = history.read_text().splitlines() if history.exists() else []
    if not all(SHA.fullmatch(sha) for sha in [current, *previous]):
        raise ValueError("Invalid deployment history; skipping cleanup.")
    keep = list(dict.fromkeys([current, *previous]))[:3]

    images = {}
    for line in docker_lines("image", "ls", "--no-trunc", "--format",
                             "{{.Repository}} {{.Tag}} {{.ID}}"):
        repository, tag, image_id = line.split()
        if repository in REPOSITORIES and SHA.fullmatch(tag):
            images[repository, tag] = image_id
    if any((repo, sha) not in images for sha in keep for repo in REPOSITORIES):
        raise ValueError("A retained release is missing an image; skipping cleanup.")

    containers = docker_lines("container", "ls", "-aq")
    used = set(docker_lines("container", "inspect", "--format", "{{.Image}}", *containers)
               if containers else [])
    print("Retaining releases (newest first):", *keep, flush=True)
    if apply:
        pending = history.with_suffix(".tmp")
        pending.write_text("".join(f"{sha}\n" for sha in keep))
        pending.replace(history)

    if len(keep) < 3:
        print("Waiting for three successful releases before removing image tags.")
    else:
        for (repo, tag), image_id in sorted(images.items()):
            if tag in keep or image_id in used:
                continue
            reference = f"{repo}:{tag}"
            print("Remove" if apply else "Would remove", reference, flush=True)
            if apply:
                subprocess.run(["docker", "image", "rm", "--no-prune", reference], check=True)

    print("Default builder cache target: 2 GB.", flush=True)
    if apply:
        subprocess.run(["docker", "buildx", "prune", "--builder", "default",
                        "--max-used-space", "2GB", "--force"], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="execute the displayed retention policy")
    args = parser.parse_args()
    maintain(Path(os.environ.get("ZG_DEPLOY_ROOT", Path.home() / "apps/zg-customs")), args.apply)
