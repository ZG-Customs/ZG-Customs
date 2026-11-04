import importlib.util
from pathlib import Path
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
            with self.assertRaises(ValueError):
                retention.maintain(self.root, True)
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
