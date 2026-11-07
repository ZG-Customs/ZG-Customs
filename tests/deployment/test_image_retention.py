import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

path = Path(__file__).resolve().parents[2] / "ops/retain_images.py"
spec = importlib.util.spec_from_file_location("retain_images", path)
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)


class ImageRetentionTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.state = self.root / "state"
        self.state.mkdir()
        self.old, self.third, self.second, self.live = [c * 40 for c in "abcd"]
        (self.state / "current-sha").write_text(self.live)
        self.history = self.state / "image-retention"
        self.history.write_text(f"{self.second}\n{self.third}\n{self.old}\n")
        self.images = [f"{repo} {tag} {repo}-{tag[0]}" for repo in retention.REPOSITORIES
                       for tag in [self.live, self.second, self.third, self.old]]
        self.images += [f"postgres {self.old} db", "zg-customs-web local dev"]

    def docker(self, *args):
        if args[:2] == ("image", "ls"):
            return self.images
        if args[:2] == ("container", "ls"):
            self.assertIn("-aq", args)
            return ["stopped"]
        if args[:2] == ("container", "inspect"):
            return ["zg-customs-backend-a"]
        self.fail(f"Unexpected docker command: {args}")

    def test_rotation_keeps_previous_pairs_and_any_container_image(self):
        with patch.object(retention, "docker_lines", self.docker), patch.object(retention.subprocess, "run") as run:
            retention.maintain(self.root, True)
        self.assertEqual(self.history.read_text().splitlines(), [self.live, self.second, self.third])
        removals = [call.args[0] for call in run.call_args_list if call.args[0][1] == "image"]
        self.assertEqual(removals, [["docker", "image", "rm", "--no-prune", f"zg-customs-web:{self.old}"]])

    def test_preview_does_not_modify_history_or_docker(self):
        before = self.history.read_bytes()
        with patch.object(retention, "docker_lines", self.docker), patch.object(retention.subprocess, "run") as run:
            retention.maintain(self.root, False)
        self.assertEqual(self.history.read_bytes(), before)
        run.assert_not_called()

    def test_missing_rollback_pair_aborts_before_deletion(self):
        self.images.remove(f"zg-customs-web {self.second} zg-customs-web-c")
        with patch.object(retention, "docker_lines", self.docker), patch.object(retention.subprocess, "run") as run:
            with self.assertRaisesRegex(ValueError, f"zg-customs-web:{self.second}"):
                retention.maintain(self.root, True)
        run.assert_not_called()
        self.assertEqual(self.history.read_text().splitlines(), [self.live, self.second, self.third])

    def test_failed_inspection_keeps_previous_deployment_on_next_release(self):
        def failed_inspection(command, **kwargs):
            if command[1:3] == ["container", "inspect"]:
                raise subprocess.CalledProcessError(1, command, stderr="No such container: stopped")
            return subprocess.CompletedProcess(command, 0, stdout="\n".join(self.docker(*command[1:])))

        with patch.object(retention.subprocess, "run", side_effect=failed_inspection) as run:
            with self.assertRaisesRegex(RuntimeError, "No such container: stopped"):
                retention.maintain(self.root, True)
        self.assertEqual(self.history.read_text().splitlines(), [self.live, self.second, self.third])
        self.assertFalse(any(call.args[0][1:3] == ["image", "rm"] for call in run.call_args_list))

        following = "e" * 40
        (self.state / "current-sha").write_text(following)
        self.images += [f"{repo} {following} {repo}-e" for repo in retention.REPOSITORIES]
        with patch.object(retention, "docker_lines", self.docker), patch.object(retention.subprocess, "run") as run:
            retention.maintain(self.root, True)
        removals = [call.args[0][-1] for call in run.call_args_list if call.args[0][1:3] == ["image", "rm"]]
        for repo in retention.REPOSITORIES:
            self.assertNotIn(f"{repo}:{self.live}", removals)
        self.assertEqual(self.history.read_text().splitlines(), [following, self.live, self.second])

    def test_first_two_releases_record_history_without_removing_tags(self):
        for previous in ([], [self.second]):
            with self.subTest(previous=previous):
                if previous:
                    self.history.write_text("\n".join(previous) + "\n")
                else:
                    self.history.unlink()
                with patch.object(retention, "docker_lines", self.docker), patch.object(retention.subprocess, "run") as run:
                    retention.maintain(self.root, True)
                self.assertEqual(self.history.read_text().splitlines(), [self.live, *previous])
                self.assertEqual(len(run.call_args_list), 1)
                self.assertEqual(run.call_args.args[0][1:3], ["buildx", "prune"])

    def test_repeated_deployment_preserves_previous_two_distinct_releases(self):
        self.history.write_text(f"{self.live}\n{self.second}\n{self.third}\n")
        before = self.history.read_bytes()
        with patch.object(retention, "docker_lines", self.docker), patch.object(retention.subprocess, "run") as run:
            retention.maintain(self.root, True)
            retention.maintain(self.root, True)
        self.assertEqual(self.history.read_bytes(), before)
        removals = [call.args[0][-1] for call in run.call_args_list if call.args[0][1:3] == ["image", "rm"]]
        self.assertEqual(removals, [f"zg-customs-web:{self.old}"] * 2)

    def test_invalid_sha_leaves_history_and_docker_untouched(self):
        for invalid_file in ("current-sha", "image-retention"):
            with self.subTest(invalid_file=invalid_file):
                (self.state / "current-sha").write_text(self.live)
                self.history.write_text(f"{self.second}\n{self.third}\n{self.old}\n")
                (self.state / invalid_file).write_text("not-a-commit\n")
                before = self.history.read_bytes()
                with patch.object(retention, "docker_lines") as docker, patch.object(retention.subprocess, "run") as run:
                    with self.assertRaisesRegex(ValueError, "Invalid deployment history"):
                        retention.maintain(self.root, True)
                self.assertEqual(self.history.read_bytes(), before)
                docker.assert_not_called()
                run.assert_not_called()

    def test_docker_errors_identify_phase_and_stop_cleanup(self):
        phases = [
            (["image", "ls"], "Docker inspection", 60),
            (["image", "rm"], "Image tag removal", 60),
            (["buildx", "prune"], "Build cache cleanup", 300),
        ]
        for phase, action, expected_timeout in phases:
            for timed_out in (False, True):
                with self.subTest(phase=phase, timed_out=timed_out):
                    def fail_command(command, **kwargs):
                        if command[1:3] == phase:
                            self.assertEqual(kwargs["timeout"], expected_timeout)
                            if timed_out:
                                raise subprocess.TimeoutExpired(command, kwargs["timeout"])
                            raise subprocess.CalledProcessError(1, command, stderr="daemon error")
                        if command[1:3] in (["image", "ls"], ["container", "ls"], ["container", "inspect"]):
                            lines = self.docker(*command[1:])
                            return subprocess.CompletedProcess(command, 0, stdout="\n".join(lines))
                        return subprocess.CompletedProcess(command, 0)

                    with patch.object(retention.subprocess, "run", side_effect=fail_command) as run:
                        with self.assertRaises(RuntimeError) as raised:
                            retention.maintain(self.root, True)
                    message = str(raised.exception)
                    self.assertIn(action, message)
                    self.assertIn(f"docker {' '.join(phase)}", message)
                    self.assertIn(f"timed out after {expected_timeout}s" if timed_out else "exit 1", message)
                    self.assertEqual(run.call_args.args[0][1:3], phase)
                    self.assertEqual(self.history.read_text().splitlines(), [self.live, self.second, self.third])

    def test_missing_docker_still_records_deployment(self):
        with patch.object(retention.subprocess, "run", side_effect=FileNotFoundError("docker not found")) as run:
            with self.assertRaisesRegex(RuntimeError, "Docker inspection could not start: docker image ls"):
                retention.maintain(self.root, True)
        self.assertEqual(run.call_count, 1)
        self.assertEqual(self.history.read_text().splitlines(), [self.live, self.second, self.third])


if __name__ == "__main__":
    unittest.main()
