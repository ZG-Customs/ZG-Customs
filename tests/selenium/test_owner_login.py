"""Run after building the frontend with npm run build in frontend/."""

import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
EMAIL = "owner@example.test"


@pytest.fixture
def site():
    assert (DIST / "index.html").is_file(), "Build frontend/ before running this test"

    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self):
            path = urlsplit(self.path).path
            if path == "/api/auth/login/external":
                self.send_response(200)
                self.end_headers()
                return
            if path == "/api/me":
                self.reply(200 if self.server.account else 401, self.server.account)
            elif path == "/api/auth/provider":
                self.reply(200, {"enabled": True})
            elif path == "/api/auth/csrf":
                self.reply(200, {"headerName": "X-CSRF-TOKEN", "token": "test"})
            elif path == "/api/admin/workshop-applications":
                self.reply(200, [])
            elif path.startswith("/api/"):
                self.send_error(404)
            else:
                if not path.startswith("/assets/"):
                    self.path = "/index.html"
                super().do_GET()

        def do_POST(self):
            if self.path == "/api/auth/logout":
                self.server.account = None
            elif self.path == "/api/auth/register":
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                self.server.registrations.append(body)
                self.server.account.update(role=body["role"], status="ACTIVE")
            else:
                self.send_error(404)
                return
            self.send_response(204)
            self.end_headers()

        def reply(self, status, data):
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())

    with ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=DIST)) as server:
        server.account = None
        server.registrations = []
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield server
        finally:
            server.shutdown()
            thread.join()


@pytest.mark.parametrize("previous", ["manager-login", "admin-logout"])
def test_owner_confirms_registration_after_changing_login(site, previous):
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    base = f"http://127.0.0.1:{site.server_port}"
    identity = {"id": 1, "role": None, "status": "UNREGISTERED", "contactEmail": EMAIL}

    with webdriver.Chrome(options=options) as browser:
        wait = WebDriverWait(browser, 10)
        login = EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[href="/api/auth/login/external"]'))
        if previous == "manager-login":
            browser.get(base + "/login/manager")
            wait.until(login).click()
            wait.until(EC.url_to_be(base + "/api/auth/login/external"))
            browser.get(base + "/login/user")
        else:
            site.account = dict(identity, role="ADMIN", status="ACTIVE")
            browser.get(base + "/login/user")
            wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.='Odjava']"))).click()

        wait.until(login).click()
        wait.until(EC.url_to_be(base + "/api/auth/login/external"))
        site.account = identity.copy()
        browser.get(base + "/")  # The backend redirects here after a successful external login.
        wait.until(EC.url_to_be(base + "/login/user"))
        contact = wait.until(EC.visibility_of_element_located((By.NAME, "contact")))
        assert contact.get_property("value") == EMAIL
        assert site.registrations == []
        contact.clear()
        contact.send_keys("Moj kontakt")
        browser.find_element(By.XPATH, "//button[.='Registriraj se']").click()
        wait.until(EC.text_to_be_present_in_element((By.TAG_NAME, "main"), "Račun je aktivan."))
        assert site.registrations == [{"role": "OWNER", "contact": "Moj kontakt"}]
