import sys
import json
import requests
import datetime

BASE_URL = "http://localhost:8080/api"

def login(username, password):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    if resp.status_code != 200:
        raise Exception(f"Failed to login as {username}: {resp.status_code} {resp.text}")
    return resp.json()["token"]

def main():
    print("==================================================================")
    print("EDMS INVESTIGATION & VIRTUAL DATA ROOM SUBSYSTEMS INTEGRATION TEST")
    print("==================================================================")

    # 1. Login Accounts
    print("[STEP 1] Logging in test accounts (hieu, tin, user)...")
    try:
        admin_token = login("hieu", "password123")
    except Exception:
        admin_token = login("admin", "Admin@123")
    tin_token = login("tin", "password123")
    user_token = login("user", "password123")
    print("SUCCESS: Authenticated test accounts (Admin, Staff, User)")

    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_tin = {"Authorization": f"Bearer {tin_token}"}
    headers_user = {"Authorization": f"Bearer {user_token}"}

    # Find or create sample document with 2 versions to simulate payment terms discrepancy
    doc_resp = requests.get(f"{BASE_URL}/documents", headers=headers_admin)
    assert doc_resp.status_code == 200, f"Failed to list documents: {doc_resp.status_code}"
    docs = doc_resp.json()
    if isinstance(docs, dict) and "content" in docs:
        docs = docs["content"]

    if not docs:
        print("[SETUP] Creating sample document v1 (30 days payment terms)...")
        file_v1 = ("HopDong_MuaSam_v1.txt", b"HOP DONG NGUYEN TAC MUA SAM THIET BI\nDieu 1: Pham vi cung cap thiet bi may chu.\nDieu 2: Thoi han thanh toan la 30 ngay ke tu ngay nghiem thu ky bien ban.\nDieu 3: Bao hanh 24 thang tan noi.\nDieu 4: Cam ket bao mat tuyet doi thong tin.", "text/plain")
        up_resp = requests.post(f"{BASE_URL}/documents",
                                data={"title": "Hợp đồng nguyên tắc mua sắm trang thiết bị CNTT", "description": "Hợp đồng đối tác phần cứng 2026", "documentType": "Hợp đồng", "accessMode": "INTERNAL"},
                                files={"file": file_v1},
                                headers=headers_admin)
        assert up_resp.status_code == 201, f"Failed to upload document v1: {up_resp.status_code} {up_resp.text}"
        sample_doc = up_resp.json()
        sample_doc_id = sample_doc["id"]
        print(f"Uploaded Document v1: ID={sample_doc_id}")

        print("[SETUP] Uploading version v2 with discrepancy (7 days payment terms)...")
        file_v2 = ("HopDong_MuaSam_v2.txt", b"HOP DONG NGUYEN TAC MUA SAM THIET BI\nDieu 1: Pham vi cung cap thiet bi may chu.\nDieu 2: Thoi han thanh toan la 7 ngay ke tu ngay nghiem thu ky bien ban.\nDieu 3: Bao hanh 24 thang tan noi.\nDieu 4: Cam ket bao mat tuyet doi thong tin.", "text/plain")
        v2_resp = requests.post(f"{BASE_URL}/documents/{sample_doc_id}/versions",
                                data={"changeNote": "Sửa đổi điều khoản thời hạn thanh toán thành 7 ngày"},
                                files={"file": file_v2},
                                headers=headers_admin)
        assert v2_resp.status_code == 201, f"Failed to upload document v2: {v2_resp.status_code} {v2_resp.text}"
        print("Uploaded Document v2 with discrepancy.")
    else:
        sample_doc = docs[0]
        sample_doc_id = sample_doc["id"]
        # Ensure version 2 exists for diff test
        versions_resp = requests.get(f"{BASE_URL}/documents/{sample_doc_id}/versions", headers=headers_admin)
        if versions_resp.status_code == 200 and len(versions_resp.json()) < 2:
            file_v2 = ("HopDong_MuaSam_v2.txt", b"HOP DONG NGUYEN TAC MUA SAM THIET BI\nDieu 1: Pham vi cung cap thiet bi may chu.\nDieu 2: Thoi han thanh toan la 7 ngay ke tu ngay nghiem thu ky bien ban.\nDieu 3: Bao hanh 24 thang tan noi.\nDieu 4: Cam ket bao mat tuyet doi thong tin.", "text/plain")
            requests.post(f"{BASE_URL}/documents/{sample_doc_id}/versions",
                          data={"changeNote": "Sửa đổi điều khoản thời hạn thanh toán thành 7 ngày"},
                          files={"file": file_v2},
                          headers=headers_admin)

    print(f"Using sample document: ID={sample_doc_id}, Title='{sample_doc.get('title')}'")

    # ==================================================================
    # PART A: DOCUMENT INVESTIGATION MODULE
    # ==================================================================
    print("\n------------------------------------------------------------------")
    print("PART A: DOCUMENT INVESTIGATION SUBSYSTEM (MODULE A)")
    print("------------------------------------------------------------------")

    # A1. Summary
    print("[STEP A1] Testing GET /api/investigations/summary...")
    sum_resp = requests.get(f"{BASE_URL}/investigations/summary", headers=headers_admin)
    assert sum_resp.status_code == 200, f"Expected 200, got {sum_resp.status_code}"
    init_sum = sum_resp.json()
    print(f"SUCCESS: Investigation Summary: total={init_sum['total']}, open={init_sum['open']}, investigating={init_sum['investigating']}, closed={init_sum['closed']}")

    # A2. Create Case
    print("\n[STEP A2] Testing POST /api/investigations (Create Case)...")
    due_iso = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()
    case_payload = {
        "title": "Điều tra sai lệch điều khoản thanh toán trong Hợp đồng nguyên tắc",
        "description": "Bản in nội bộ ghi thanh toán 30 ngày nhưng tệp sửa đổi ghi 7 ngày. Cần rà soát toàn vẹn SHA-256.",
        "reason": "PAYMENT_TERMS_DISCREPANCY",
        "severity": "HIGH",
        "assignedTo": "tin",
        "dueDate": due_iso,
        "targetDocumentId": sample_doc_id
    }
    create_case_resp = requests.post(f"{BASE_URL}/investigations", json=case_payload, headers=headers_admin)
    assert create_case_resp.status_code == 201, f"Expected 201, got {create_case_resp.status_code}: {create_case_resp.text}"
    case_data = create_case_resp.json()
    case_id = case_data["id"]
    case_number = case_data["caseNumber"]
    print(f"SUCCESS: Created Investigation Case ID={case_id}, Number={case_number}, Status={case_data['status']}")
    assert case_number.startswith("INV-"), f"Case number should start with INV-, got {case_number}"
    assert case_data["targetDocumentId"] == sample_doc_id, "Target document ID mismatch"

    # A3. Preserve Evidence with SHA-256 and Legal Hold
    print("\n[STEP A3] Testing POST /api/investigations/{id}/evidence (Preserve Evidence with Legal Hold)...")
    evidence_payload = {
        "documentId": sample_doc_id,
        "versionNumber": 1,
        "notes": "Trích xuất chứng cứ phiên bản gốc v1 phục vụ tố tụng",
        "applyLegalHold": True
    }
    ev_resp = requests.post(f"{BASE_URL}/investigations/{case_id}/evidence", json=evidence_payload, headers=headers_admin)
    assert ev_resp.status_code == 201, f"Expected 201, got {ev_resp.status_code}: {ev_resp.text}"
    ev_data = ev_resp.json()
    print(f"SUCCESS: Preserved Evidence ID={ev_data['id']}, FileHash={ev_data['fileHash']}, LegalHold={ev_data['legalHoldApplied']}")
    assert ev_data["legalHoldApplied"] is True, "Legal Hold must be applied"
    assert ev_data["fileHash"] != "", "File hash must be captured"

    # Verify Document Legal Hold is active in EDMS
    doc_check_resp = requests.get(f"{BASE_URL}/documents/{sample_doc_id}", headers=headers_admin)
    if doc_check_resp.status_code == 200:
        doc_details = doc_check_resp.json()
        print(f"SUCCESS: Document Legal Hold Status verified in EDMS: legalHold={doc_details.get('legalHold')}")
        assert doc_details.get("legalHold") is True, "Document must have legalHold flag set to true"

    # A4. Side-by-side Diff Computation
    print("\n[STEP A4] Testing GET /api/investigations/diff (v1 vs v2)...")
    diff_resp = requests.get(f"{BASE_URL}/investigations/diff?documentId={sample_doc_id}&versionA=1&versionB=2", headers=headers_admin)
    assert diff_resp.status_code == 200, f"Expected 200, got {diff_resp.status_code}: {diff_resp.text}"
    diff_data = diff_resp.json()
    print(f"SUCCESS: Diff evaluated: hashMatch={diff_data['hashMatch']}, diffLinesCount={len(diff_data['diffLines'])}")
    for dl in diff_data['diffLines']:
        if dl['type'] != 'EQUAL':
            print(f"  [{dl['type']}] LineA={dl['lineNumberA']}, LineB={dl['lineNumberB']}: {dl['text']}")

    # A5. Record Finding
    print("\n[STEP A5] Testing POST /api/investigations/{id}/findings...")
    finding_payload = {
        "title": "Xác nhận mã băm phiên bản 1 khớp với biên bản lưu kho",
        "details": f"Mã băm SHA-256 {ev_data['fileHash']} hoàn toàn trùng khớp với hệ thống chứng từ ký số.",
        "category": "Sai lệch SHA-256"
    }
    finding_resp = requests.post(f"{BASE_URL}/investigations/{case_id}/findings", json=finding_payload, headers=headers_admin)
    assert finding_resp.status_code == 201, f"Expected 201, got {finding_resp.status_code}: {finding_resp.text}"
    finding_data = finding_resp.json()
    print(f"SUCCESS: Recorded finding ID={finding_data['id']}, Title='{finding_data['title']}'")

    # A6. Timeline Verification
    print("\n[STEP A6] Testing GET /api/investigations/{id}/timeline...")
    tl_resp = requests.get(f"{BASE_URL}/investigations/{case_id}/timeline", headers=headers_admin)
    assert tl_resp.status_code == 200, f"Expected 200, got {tl_resp.status_code}"
    timeline = tl_resp.json()
    print(f"SUCCESS: Timeline contains {len(timeline)} chronological events:")
    for e in timeline[:4]:
        print(f"  - [{e.get('source')}] {e.get('eventType')}: {e.get('description')}")

    # A7. Conclusion & Approval Workflow
    print("\n[STEP A7] Testing Conclusion workflow (Submit -> Approve -> Closed)...")
    conclusion_payload = {
        "conclusion": "Qua điều tra đối chiếu, phiên bản v1 là phiên bản chuẩn. Các sửa đổi ngoài quy trình đã bị cách ly. Đề nghị phục hồi phiên bản v1 và lưu kho vĩnh viễn."
    }
    submit_resp = requests.post(f"{BASE_URL}/investigations/{case_id}/conclusion", json=conclusion_payload, headers=headers_tin)
    assert submit_resp.status_code == 200, f"Expected 200, got {submit_resp.status_code}"
    assert submit_resp.json()["status"] == "REVIEW_PENDING", "Status should transition to REVIEW_PENDING"
    print(f"SUCCESS: Conclusion submitted by investigator tin. Status is now REVIEW_PENDING")

    # Approve conclusion as Admin
    approve_resp = requests.post(f"{BASE_URL}/investigations/{case_id}/approve", headers=headers_admin)
    assert approve_resp.status_code == 200, f"Expected 200, got {approve_resp.status_code}"
    approved_case = approve_resp.json()
    assert approved_case["status"] == "CLOSED", "Status should transition to CLOSED"
    assert approved_case["conclusionApprovedBy"] is not None, "Conclusion approver must be recorded"
    print(f"SUCCESS: Conclusion approved by Admin. Case is now CLOSED. ApprovedBy: {approved_case['conclusionApprovedBy']}")

    # A8. Export Manifest
    print("\n[STEP A8] Testing GET /api/investigations/{id}/export-manifest...")
    manifest_resp = requests.get(f"{BASE_URL}/investigations/{case_id}/export-manifest", headers=headers_admin)
    assert manifest_resp.status_code == 200, f"Expected 200, got {manifest_resp.status_code}"
    manifest = manifest_resp.json()
    assert "caseDetails" in manifest and "evidences" in manifest and "findings" in manifest, "Manifest missing sections"
    print(f"SUCCESS: Exported integrity manifest JSON with {len(manifest['evidences'])} evidences and {len(manifest['findings'])} findings")


    # ==================================================================
    # PART B: VIRTUAL DATA ROOM (VDR) MODULE
    # ==================================================================
    print("\n------------------------------------------------------------------")
    print("PART B: VIRTUAL DATA ROOM SUBSYSTEM (MODULE B)")
    print("------------------------------------------------------------------")

    # B1. Summary
    print("[STEP B1] Testing GET /api/vdr/rooms/summary...")
    vdr_sum_resp = requests.get(f"{BASE_URL}/vdr/rooms/summary", headers=headers_admin)
    assert vdr_sum_resp.status_code == 200, f"Expected 200, got {vdr_sum_resp.status_code}"
    vdr_sum = vdr_sum_resp.json()
    print(f"SUCCESS: VDR Summary: totalRooms={vdr_sum['totalRooms']}, activeRooms={vdr_sum['activeRooms']}, totalDocs={vdr_sum['totalDocuments']}, suspicious={vdr_sum['suspiciousEventsCount']}")

    # B2. Create Room
    print("\n[STEP B2] Testing POST /api/vdr/rooms (Create Room)...")
    room_payload = {
        "name": "Phòng thẩm định M&A TechCorp 2026",
        "purpose": "Kiểm toán pháp lý & tài chính phục vụ sáp nhập",
        "description": "Nghiêm cấm tải về tệp tin. Bật watermark động danh tính người xem.",
        "watermarkEnabled": True,
        "watermarkPattern": "CONFIDENTIAL VDR - {user} - {date}",
        "allowDownload": False
    }
    create_room_resp = requests.post(f"{BASE_URL}/vdr/rooms", json=room_payload, headers=headers_admin)
    assert create_room_resp.status_code == 201, f"Expected 201, got {create_room_resp.status_code}: {create_room_resp.text}"
    room_data = create_room_resp.json()
    room_id = room_data["id"]
    room_code = room_data["roomCode"]
    print(f"SUCCESS: Created Data Room ID={room_id}, Code={room_code}, Status={room_data['status']}, AllowDownload={room_data['allowDownload']}")
    assert room_code.startswith("VDR-"), f"Room code should start with VDR-, got {room_code}"
    assert room_data["status"] == "DRAFT", "Initial status must be DRAFT"

    # B3. Activate Room
    print("\n[STEP B3] Testing PUT /api/vdr/rooms/{id}/status (Activate Room)...")
    status_resp = requests.put(f"{BASE_URL}/vdr/rooms/{room_id}/status", json={"status": "ACTIVE"}, headers=headers_admin)
    assert status_resp.status_code == 200, f"Expected 200, got {status_resp.status_code}"
    assert status_resp.json()["status"] == "ACTIVE", "Room status should be ACTIVE"
    print("SUCCESS: Data Room status transitioned to ACTIVE")

    # B4. Add Document to Room
    print("\n[STEP B4] Testing POST /api/vdr/rooms/{id}/documents...")
    add_doc_payload = {
        "documentId": sample_doc_id,
        "versionNumber": 1,
        "folderPath": "/Hop_dong"
    }
    add_doc_resp = requests.post(f"{BASE_URL}/vdr/rooms/{room_id}/documents", json=add_doc_payload, headers=headers_admin)
    assert add_doc_resp.status_code == 201, f"Expected 201, got {add_doc_resp.status_code}: {add_doc_resp.text}"
    vdr_doc = add_doc_resp.json()
    print(f"SUCCESS: Added Document ID={vdr_doc['documentId']} ('{vdr_doc['title']}') to VDR Folder '{vdr_doc['folderPath']}'")

    # B5. Invite Member & Accept Invitation
    print("\n[STEP B5] Testing Member Invitation & Acceptance...")
    invite_payload = {
        "email": "user@edms.local",
        "role": "ROOM_GUEST",
        "expiresInDays": 7
    }
    inv_resp = requests.post(f"{BASE_URL}/vdr/rooms/{room_id}/invitations", json=invite_payload, headers=headers_admin)
    assert inv_resp.status_code == 201, f"Expected 201, got {inv_resp.status_code}: {inv_resp.text}"
    inv_data = inv_resp.json()
    inv_token = inv_data["token"]
    print(f"SUCCESS: Generated Invitation token: {inv_token[:16]}... for {inv_data['email']}")

    # User accepts invitation
    accept_resp = requests.post(f"{BASE_URL}/vdr/invitations/accept?token={inv_token}", headers=headers_user)
    assert accept_resp.status_code == 200, f"Expected 200, got {accept_resp.status_code}: {accept_resp.text}"
    accepted_member = accept_resp.json()
    print(f"SUCCESS: User accepted invitation! Member role={accepted_member['role']}, Status={accepted_member['status']}, CanDownload={accepted_member['canDownload']}")

    # B6. Secure Document Viewing (With Watermark)
    print("\n[STEP B6] Testing GET /api/vdr/rooms/{id}/documents/{docId}/view (Secure Streaming)...")
    view_resp = requests.get(f"{BASE_URL}/vdr/rooms/{room_id}/documents/{sample_doc_id}/view", headers=headers_user)
    assert view_resp.status_code == 200, f"Expected 200, got {view_resp.status_code}"
    print(f"SUCCESS: Document viewed securely! Content-Type: {view_resp.headers.get('Content-Type')}, Bytes: {len(view_resp.content)}")

    # B7. Anti-leak Enforcement (Download Blocked with HTTP 403 Forbidden)
    print("\n[STEP B7] Testing GET /api/vdr/rooms/{id}/documents/{docId}/download (Anti-leak Enforcement)...")
    dl_resp = requests.get(f"{BASE_URL}/vdr/rooms/{room_id}/documents/{sample_doc_id}/download", headers=headers_user)
    print(f"Result HTTP Status: {dl_resp.status_code}")
    assert dl_resp.status_code == 403, f"Expected HTTP 403 Forbidden for anti-leak download block, but got {dl_resp.status_code}"
    print("SUCCESS: Anti-leak policy successfully BLOCKED unauthorized document download (HTTP 403 Forbidden)!")

    # Verify suspicious event was logged in VDR audit trail
    events_resp = requests.get(f"{BASE_URL}/vdr/rooms/{room_id}/events?suspiciousOnly=true", headers=headers_admin)
    assert events_resp.status_code == 200, f"Expected 200, got {events_resp.status_code}"
    suspicious_events = events_resp.json()
    assert len(suspicious_events) > 0, "A suspicious download denial event must be recorded"
    suspicious_event = suspicious_events[0]
    print(f"SUCCESS: Suspicious security event recorded in VDR audit trail:")
    print(f"  Event ID: {suspicious_event['id']}, Type: {suspicious_event['eventType']}, Suspicious: {suspicious_event['suspicious']}")
    print(f"  Description: {suspicious_event['description']}")


    # ==================================================================
    # PART C: CROSS-MODULE INTEGRATION
    # ==================================================================
    print("\n------------------------------------------------------------------")
    print("PART C: CROSS-MODULE INTEGRATION (VDR INCIDENT -> INVESTIGATION)")
    print("------------------------------------------------------------------")
    print("[STEP C1] Testing POST /api/investigations/from-vdr-event...")

    cross_payload = {
        "vdrEventId": suspicious_event["id"],
        "assignedTo": "tin",
        "title": f"Điều tra vi phạm bảo mật Anti-leak VDR #{room_id}: Cố ý tải tài liệu"
    }
    cross_resp = requests.post(f"{BASE_URL}/investigations/from-vdr-event", json=cross_payload, headers=headers_admin)
    assert cross_resp.status_code == 201, f"Expected 201, got {cross_resp.status_code}: {cross_resp.text}"
    vdr_linked_case = cross_resp.json()
    print(f"SUCCESS: Automatically created Investigation Case from VDR Event!")
    print(f"  Case Number: {vdr_linked_case['caseNumber']}")
    print(f"  Reason: {vdr_linked_case['reason']}")
    print(f"  Severity: {vdr_linked_case['severity']}")
    print(f"  Linked VDR Event ID: {vdr_linked_case['vdrEventId']}")
    print(f"  Target Document ID: {vdr_linked_case['targetDocumentId']}")
    assert vdr_linked_case["reason"] == "VDR_SECURITY_ALERT", "Reason must be VDR_SECURITY_ALERT"
    assert vdr_linked_case["vdrEventId"] == suspicious_event["id"], "VDR Event ID mismatch"

    print("\n==================================================================")
    print("ALL TESTS PASSED: 100% SUCCESSFUL INTEGRATION VERIFICATION")
    print("==================================================================")

if __name__ == "__main__":
    main()
