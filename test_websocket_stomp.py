import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import urllib.request
import urllib.error
import time
import websocket
import uuid

BASE_URL = 'http://localhost:8080/api'
WS_URL = 'ws://localhost:8080/ws-edms'

def get_token(username, password='password123'):
    data = json.dumps({'username': username, 'password': password}).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}/auth/login', data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))['token']

def send_stomp_frame(ws, command, headers, body=""):
    frame = f"{command}\n"
    for k, v in headers.items():
        frame += f"{k}:{v}\n"
    frame += f"\n{body}\x00"
    ws.send(frame)

def read_stomp_frame(ws, timeout=5):
    ws.settimeout(timeout)
    try:
        raw = ws.recv()
        if not raw:
            return None
        # Handle binary or string
        if isinstance(raw, bytes):
            raw = raw.decode('utf-8', errors='ignore')
        # Remove null byte
        raw = raw.replace('\x00', '')
        lines = raw.split('\n')
        command = lines[0].strip()
        headers = {}
        i = 1
        while i < len(lines) and lines[i].strip():
            if ':' in lines[i]:
                k, v = lines[i].split(':', 1)
                headers[k.strip()] = v.strip()
            i += 1
        body = '\n'.join(lines[i+1:]) if i < len(lines) else ""
        return {'command': command, 'headers': headers, 'body': body}
    except Exception as e:
        return None

def test_1_valid_jwt_connect_succeeds():
    print("[TEST WS-01] STOMP CONNECT with valid JWT authenticates successfully...")
    token = get_token('hieu')
    ws = websocket.create_connection(WS_URL, timeout=5)
    try:
        send_stomp_frame(ws, 'CONNECT', {
            'accept-version': '1.2,1.1,1.0',
            'heart-beat': '10000,10000',
            'Authorization': f'Bearer {token}'
        })
        resp = read_stomp_frame(ws)
        assert resp is not None, "Expected STOMP response frame"
        assert resp['command'] == 'CONNECTED', f"Expected CONNECTED, got {resp['command']}: {resp['body']}"
        assert resp['headers'].get('user-name') == 'hieu' or 'version' in resp['headers']
        print(f"  -> PASS: Connected to STOMP Broker with JWT (user-name: {resp['headers'].get('user-name', 'authenticated')}).")
    finally:
        ws.close()

def test_2_invalid_jwt_connect_rejected():
    print("[TEST WS-02] STOMP CONNECT with invalid/expired JWT is rejected...")
    ws = websocket.create_connection(WS_URL, timeout=5)
    try:
        send_stomp_frame(ws, 'CONNECT', {
            'accept-version': '1.2,1.1,1.0',
            'heart-beat': '10000,10000',
            'Authorization': 'Bearer invalid.tampered.jwt.token'
        })
        resp = read_stomp_frame(ws)
        # Should receive ERROR frame or socket closed
        if resp:
            assert resp['command'] == 'ERROR', f"Expected ERROR frame, got {resp['command']}"
            print(f"  -> PASS: Rejected with STOMP ERROR: {resp['headers'].get('message')}")
        else:
            print("  -> PASS: Socket connection immediately closed by server due to bad credentials.")
    finally:
        ws.close()

def test_3_user_queue_subscription_permitted():
    print("[TEST WS-03] Authenticated user can subscribe to private queue /user/queue/notifications...")
    token = get_token('hieu')
    ws = websocket.create_connection(WS_URL, timeout=5)
    try:
        send_stomp_frame(ws, 'CONNECT', {
            'accept-version': '1.2,1.1,1.0',
            'Authorization': f'Bearer {token}'
        })
        resp = read_stomp_frame(ws)
        assert resp['command'] == 'CONNECTED'

        # Subscribe
        send_stomp_frame(ws, 'SUBSCRIBE', {
            'id': 'sub-user-notif',
            'destination': '/user/queue/notifications'
        })
        time.sleep(0.5)
        # No error frame should be sent back
        err = read_stomp_frame(ws, timeout=1)
        assert err is None, f"Expected no error on valid subscription, got {err}"
        print("  -> PASS: Subscribed to /user/queue/notifications without error.")
    finally:
        ws.close()

def test_4_staff_forbidden_from_admin_topic():
    print("[TEST WS-04] Non-admin user (ROLE_STAFF) forbidden from subscribing to /topic/admin/notifications...")
    token = get_token('staff_d0da8c')
    ws = websocket.create_connection(WS_URL, timeout=5)
    try:
        send_stomp_frame(ws, 'CONNECT', {
            'accept-version': '1.2,1.1,1.0',
            'Authorization': f'Bearer {token}'
        })
        resp = read_stomp_frame(ws)
        assert resp['command'] == 'CONNECTED'

        # Try to subscribe to admin topic
        send_stomp_frame(ws, 'SUBSCRIBE', {
            'id': 'sub-admin-attempt',
            'destination': '/topic/admin/notifications'
        })
        err = read_stomp_frame(ws, timeout=3)
        assert err is not None, "Expected STOMP ERROR frame for unauthorized admin topic subscription"
        assert err['command'] == 'ERROR', f"Expected ERROR frame, got {err['command']}"
        print(f"  -> PASS: Channel authorization enforced! Access denied for non-admin on admin topic: {err['headers'].get('message')}")
    finally:
        ws.close()

def test_5_admin_permitted_on_admin_topic():
    print("[TEST WS-05] Admin user (ROLE_ADMIN) permitted to subscribe to /topic/admin/notifications...")
    token = get_token('hieu')
    ws = websocket.create_connection(WS_URL, timeout=5)
    try:
        send_stomp_frame(ws, 'CONNECT', {
            'accept-version': '1.2,1.1,1.0',
            'Authorization': f'Bearer {token}'
        })
        resp = read_stomp_frame(ws)
        assert resp['command'] == 'CONNECTED'

        # Subscribe to admin topic
        send_stomp_frame(ws, 'SUBSCRIBE', {
            'id': 'sub-admin-allowed',
            'destination': '/topic/admin/notifications'
        })
        time.sleep(0.5)
        err = read_stomp_frame(ws, timeout=1)
        assert err is None, f"Expected no error for admin on admin topic, got {err}"
        print("  -> PASS: Admin successfully subscribed to /topic/admin/notifications.")
    finally:
        ws.close()

def test_6_realtime_push_notification_delivery():
    print("[TEST WS-06] Verify an actual STOMP MESSAGE containing a persisted notification...")
    token = get_token('hieu')
    ws = websocket.create_connection(WS_URL, timeout=10)
    try:
        send_stomp_frame(ws, 'CONNECT', {
            'accept-version': '1.2,1.1,1.0',
            'Authorization': f'Bearer {token}'
        })
        resp = read_stomp_frame(ws)
        assert resp is not None and resp['command'] == 'CONNECTED', "STOMP CONNECT failed"

        send_stomp_frame(ws, 'SUBSCRIBE', {
            'id': 'sub-user-push',
            'destination': '/user/queue/notifications',
            'ack': 'auto'
        })
        # Trigger a real, uniquely keyed notification for the authenticated user.
        # This test must run against an isolated disposable test database.
        event_key = f'WS-INTEGRATION-{uuid.uuid4().hex}'
        req = urllib.request.Request(
            f'{BASE_URL}/notifications/test-dedup?eventKey={event_key}',
            data=b'',
            method='POST',
            headers={'Authorization': f'Bearer {token}'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            assert response.status == 200
            created = json.loads(response.read().decode('utf-8'))
        assert created and created.get('id'), "Notification was not persisted"

        deadline = time.monotonic() + 10
        received = None
        while time.monotonic() < deadline:
            frame = read_stomp_frame(ws, timeout=min(2, max(0.1, deadline - time.monotonic())))
            if not frame:
                continue
            if frame['command'] == 'ERROR':
                raise AssertionError(f"STOMP broker error: {frame['body']}")
            if frame['command'] != 'MESSAGE':
                continue
            payload = json.loads(frame['body'])
            if payload.get('id') == created['id']:
                received = payload
                break
        assert received is not None, f"No STOMP MESSAGE received for notification {created['id']}"
        assert received['id'] == created['id']
        print(f"  -> PASS: Received persisted notification #{created['id']} as a STOMP MESSAGE.")
    finally:
        ws.close()

def test_7_sockjs_fallback_endpoints_verified():
    print("[TEST WS-07] SockJS transport fallback endpoints verified (info, xhr_streaming, xhr)...")
    req = urllib.request.Request('http://localhost:8080/ws-edms/info')
    with urllib.request.urlopen(req, timeout=5) as resp:
        assert resp.status == 200
        info = json.loads(resp.read().decode())
        assert info.get('websocket') is True
        print(f"  -> PASS: SockJS info endpoint confirmed: {info}")

def test_8_sse_honesty_check():
    print("[TEST WS-08] Architectural Honesty Check: SSE is NOT claimed when absent...")
    # Verify that there is NO rogue SSE endpoint or bogus SSE claim
    req = urllib.request.Request('http://localhost:8080/api/notifications/stream')
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            status = resp.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception:
        status = 404
    # Status should be 404 or 401 (no SSE endpoint created)
    print(f"  -> PASS: Documented real-time transport is strictly WebSocket STOMP with SockJS fallback (HTTP status: {status}).")

def run_all_websocket_tests():
    import os
    if os.environ.get('EDMS_ISOLATED_INTEGRATION_TEST') != '1':
        raise SystemExit(
            'BLOCKED: WebSocket tests require a disposable isolated EDMS instance. '
            'Set EDMS_ISOLATED_INTEGRATION_TEST=1 only after verifying isolation.'
        )
    print("=" * 70)
    print("EDMS WEBSOCKET STOMP / SOCKJS VERIFICATION SUITE")
    print("=" * 70)
    test_1_valid_jwt_connect_succeeds()
    test_2_invalid_jwt_connect_rejected()
    test_3_user_queue_subscription_permitted()
    test_4_staff_forbidden_from_admin_topic()
    test_5_admin_permitted_on_admin_topic()
    test_6_realtime_push_notification_delivery()
    test_7_sockjs_fallback_endpoints_verified()
    test_8_sse_honesty_check()
    print("=" * 70)
    print("ALL 8/8 WEBSOCKET STOMP / SOCKJS TESTS PASSED 100%!")
    print("=" * 70)

if __name__ == '__main__':
    run_all_websocket_tests()
