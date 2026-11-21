#!/usr/bin/env python3
"""Read-only real-backend RBAC smoke test for the ISOLATED EDMS Team Preview.

Uses the actual Spring Boot API and three preview accounts, never mocks or
intercepts requests. Requires explicit opt-in and a password from environment.
Do not paste credentials, tokens, or full auth responses into CI logs.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("EDMS_PREVIEW_BASE_URL", "").rstrip("/")
PASSWORD = os.environ.get("EDMS_PREVIEW_SHARED_PASSWORD", "")
ISOLATED = os.environ.get("EDMS_LIVE_TEST_CONFIRM_ISOLATED", "")

def check_target():
    parsed = urllib.parse.urlparse(BASE)
    hostname = parsed.hostname or ""
    allowed = (hostname == "localhost" or hostname == "127.0.0.1" or
               (hostname.startswith("edms-preview-") and hostname.endswith(".up.railway.app")))
    if ISOLATED != "1" or not allowed or parsed.scheme not in ("https", "http"):
        raise SystemExit("BLOCKED: opt-in EDMS_LIVE_TEST_CONFIRM_ISOLATED=1 and an isolated Preview URL required")
    if parsed.scheme != "https" and hostname not in ("localhost", "127.0.0.1"):
        raise SystemExit("BLOCKED: HTTPS required for remote environment")
    if len(PASSWORD) < 16:
        raise SystemExit("BLOCKED: set EDMS_PREVIEW_SHARED_PASSWORD securely in environment")

def request(method, route, token=None, payload=None):
    headers = {"Accept": "application/json"}
    if token is not None:
        headers["Authorization"] = "Bearer " + token
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + route, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=20) as result:
            return result.status, json.loads(result.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Do not print raw response bodies or HTTP Authorization headers.
        return exc.code, None

def expect_status(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected HTTP {expected}; got {actual}")
    print("PASS", label, "HTTP", actual)

def login(username, role):
    status, payload = request("POST", "/api/auth/login",
                              payload={"username": username, "password": PASSWORD})
    expect_status(status, 200, "login " + username)
    if not isinstance(payload, dict) or not payload.get("token"):
        raise AssertionError(username + ": missing actual backend JWT")
    if payload.get("role") != role or payload.get("username") != username:
        raise AssertionError(username + ": unexpected server-returned identity or role")
    return payload["token"]

def run():
    check_target()
    status, body = request("GET", "/api/health")
    expect_status(status, 200, "public health")
    if not isinstance(body, dict) or body.get("status") != "UP":
        raise AssertionError("Backend health payload is not UP")
    print("INFO semanticModel:", body.get("semanticModel", "UNKNOWN"))
    status, _ = request("GET", "/api/documents")
    expect_status(status, 401, "anonymous document access")
    status, _ = request("GET", "/api/admin/users")
    expect_status(status, 401, "anonymous admin access")
    status, _ = request("GET", "/api/public/verify")
    expect_status(status, 400, "anonymous malformed verification")

    tokens = {
        role: login(name, role)
        for role, name in [
            ("ROLE_ADMIN", "preview_admin"),
            ("ROLE_STAFF", "preview_staff"),
            ("ROLE_USER", "preview_user"),
        ]
    }
    for role, token in tokens.items():
        for path in ("/api/documents", "/api/tasks", "/api/notifications"):
            status, _ = request("GET", path, token)
            expect_status(status, 200, role + " " + path)
        status, _ = request("GET", "/api/admin/users", token)
        expect_status(status, 200 if role == "ROLE_ADMIN" else 403,
                      role + " /api/admin/users")
        status, _ = request("GET", "/api/admin/system/status", token)
        expect_status(status, 200 if role == "ROLE_ADMIN" else 403,
                      role + " /api/admin/system/status")

    print("PASS: real HTTP/JWT/RBAC smoke tests completed; browser E2E NOT RUN")

if __name__ == "__main__":
    try:
        run()
    except (AssertionError, OSError, ValueError) as exc:
        print("FAIL:", exc, file=sys.stderr)
        raise SystemExit(1)
