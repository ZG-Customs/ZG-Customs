import importlib.util
from pathlib import Path
import unittest

module_path = Path(__file__).resolve().parents[2] / "ops/sync.py"
spec = importlib.util.spec_from_file_location("sync", module_path)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class DeploymentGateTests(unittest.TestCase):
    def run_data(self, **changes):
        data = dict(id=12, run_attempt=1, head_sha="abc", head_branch="main", event="push",
                    path=".github/workflows/ci.yml", head_repository={"full_name": sync.REPOSITORY},
                    status="completed", conclusion="success")
        data.update(changes)
        return data

    def test_accepts_only_successful_main_push_for_exact_commit(self):
        self.assertTrue(sync.approved_run([self.run_data()], "abc"))
        for change in ({"head_sha": "other"}, {"head_branch": "feature"},
                       {"event": "pull_request"}, {"path": ".github/workflows/other.yml"},
                       {"head_repository": {"full_name": "someone/fork"}},
                       {"status": "in_progress"}, {"conclusion": "failure"}):
            with self.subTest(change=change):
                self.assertFalse(sync.approved_run([self.run_data(**change)], "abc"))

    def test_latest_failed_or_pending_rerun_blocks_previous_success(self):
        success = self.run_data()
        self.assertFalse(sync.approved_run([success, self.run_data(id=13, conclusion="failure")], "abc"))
        self.assertFalse(sync.approved_run([success, self.run_data(run_attempt=2, status="in_progress")], "abc"))
        self.assertFalse(sync.approved_run([], "abc"))
