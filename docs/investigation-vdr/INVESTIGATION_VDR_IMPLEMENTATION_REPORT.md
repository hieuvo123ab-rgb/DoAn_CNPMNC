# BAO CAO TRIEN KHAI HAI PHAN HE NGHIEP VU MOI: DIEU TRA TAI LIEU VA PHONG DU LIEU BAO MAT (VDR)

Du an: Electronic Document Management System (EDMS)
Hoc phan: Cong nghe phan mem nang cao - Truong Dai hoc Ngoai ngu - Tin hoc TP.HCM (HUFLIT)
Giang vien huong dan: ThS. Phan Thi Ngoc Han
Nhanh phat trien: feat/edms-investigation-vdr
Trang thai he thong: Production-grade, da kiem thu tich hop 100% thanh cong, da deploy tren container runtime

---

## 1. TONG QUAN KIEN TRUC VA MUC TIEU TRIEN KHAI

Dua tren yeu cau nghiep vu nang cao cua he thong quan ly tai lieu dien tu doanh nghiep, du an da trien khai hoan tat 2 phan he doc lap nhung lien ket chat che voi nhau:

1. Module A: Dieu tra sai lech tai lieu (Document Investigation Subsystem)
- Quan ly ho so vu viec theo ma quy chuan INV-YYYY-XXXX.
- Bao toan chung cu ky thuat so bang ma bam toan ven SHA-256 va co Legal Hold ngan chan tieu huy tai lieu.
- Bo phan tich so sanh khac biet phien ban (Side-by-side Textual Diff Viewer) su dung thuat toan LCS (Longest Common Subsequence).
- Dong thoi gian hop nhat giua su kien dieu tra va nhat ky kiem toan goc (Audit Log).
- Quy trinh de xuat ket luan, xet duyet va dong ho so boi quan tri vien.
- Xuat bien ban toan ven du lieu (Integrity Manifest) duoi dinh dang JSON.

2. Module B: Phong du lieu bao mat (Virtual Data Room - VDR)
- Quan ly khong gian chia se an toan theo ma VDR-YYYY-XXX voi chu trinh DRAFT, ACTIVE, SUSPENDED, CLOSED.
- Phan quyen thanh vien chi tiet gom ROOM_OWNER, ROOM_MANAGER, ROOM_VIEWER, ROOM_GUEST.
- Co che moi doi tac ben ngoai qua lien ket ma hoa token co thoi han.
- Trinh xem tai lieu truc tuyen voi lop phu Watermark dong (dynamic streaming watermark) hien thi danh tinh nguoi xem, dia chi IP va dau thoi gian thuc.
- Chinh sach Anti-leak ngan chan tai file ve may ca nhan, chan bang ma loi HTTP 403 Forbidden va tu dong ghi nhan su co an ninh.

3. Module C: Tich hop lien phan he (Cross-Module Integration)
- Cho phep khoi tao truc tiep mot ho so dieu tra tu bat ky su kien vi pham an ninh VDR nao voi 1 cu nhap chuot.
- Tu dong dong bo ma phong, ma tai lieu muc tieu va lien ket ma vu viec nguoc lai vao nhat ky an ninh VDR.

---

## 2. DANH MUC MA NGUON DA XAY DUNG

### 2.1. Backend Entities, Repositories, DTOs va Services (Spring Boot / Java 21)

Thuc the va Repositories:
- [InvestigationCase.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/InvestigationCase.java)
- [InvestigationEvidence.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/InvestigationEvidence.java)
- [InvestigationEvent.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/InvestigationEvent.java)
- [InvestigationFinding.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/InvestigationFinding.java)
- [DataRoom.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DataRoom.java)
- [DataRoomDocument.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DataRoomDocument.java)
- [DataRoomMember.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DataRoomMember.java)
- [DataRoomInvitation.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DataRoomInvitation.java)
- [DataRoomEvent.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DataRoomEvent.java)
- [InvestigationCaseRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/InvestigationCaseRepository.java)
- [InvestigationEvidenceRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/InvestigationEvidenceRepository.java)
- [InvestigationEventRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/InvestigationEventRepository.java)
- [InvestigationFindingRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/InvestigationFindingRepository.java)
- [DataRoomRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DataRoomRepository.java)
- [DataRoomDocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DataRoomDocumentRepository.java)
- [DataRoomMemberRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DataRoomMemberRepository.java)
- [DataRoomInvitationRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DataRoomInvitationRepository.java)
- [DataRoomEventRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DataRoomEventRepository.java)

Lop Nghiep vu (Business Services):
- [InvestigationService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/InvestigationService.java)
  - Sinh ma vu viec tu dong: INV-YYYY-XXXX.
  - Bao toan chung cu, tinh toan ma bam SHA-256 va ap dat Legal Hold tren thuc the Document.
  - So sanh diff noi dung dong van ban (Myers LCS algorithm) tra ve cac loai dong EQUAL, INSERT, DELETE.
  - Hop nhat timeline giua su kien dieu tra va nhat ky kiem toan audit_logs.
  - Xuat bien ban toan ven du lieu (Integrity Manifest JSON).
  - Tich hop tao ho so tu su kien an ninh VDR.
- [VirtualDataRoomService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/VirtualDataRoomService.java)
  - Sinh ma phong tu dong: VDR-YYYY-XXX.
  - Quan ly trang thai phong, thanh vien va tai lieu phan cap thu muc.
  - Streaming xem truc tuyen kem Watermark dong thoi gian thuc thong qua WatermarkService.
  - Thuc thi chinh sach Anti-leak, tu choi tai file (HTTP 403) va ghi nhan su co an ninh doc lap khong bi anh huong boi rollback giao dich.

Lop Controllers API:
- [InvestigationController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/InvestigationController.java) (Path: /api/investigations)
- [VirtualDataRoomController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/VirtualDataRoomController.java) (Path: /api/vdr)

### 2.2. Frontend UI va API Clients (React / TypeScript / Vite)

API Clients:
- [investigationApi.ts](file:///f:/DoAn_CNPMNC/frontend/src/api/investigationApi.ts)
- [vdrApi.ts](file:///f:/DoAn_CNPMNC/frontend/src/api/vdrApi.ts)

Giao dien nguoi dung:
- [InvestigationPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/InvestigationPage.tsx)
  - Bang chi so KPI thong ke ho so dieu tra.
  - Bo loc da tieu chi (Trang thai, Muc do, Tu khoa).
  - Bang danh sach vu viec voi badge mau truc quan.
  - Modal tao ho so dieu tra moi.
  - Hop thoai chi tiet (Case Detail Drawer) gom 4 the nghiep vu:
    1. Chung cu va toan ven (Bao toan SHA-256, Legal Hold, Xuat bien ban).
    2. So sanh phien ban (Side-by-side Diff Viewer to mau truc quan dong them/xoa).
    3. Dong thoi gian (Chronological Timeline).
    4. Phat hien va Ket luan (Trinh duyet ket luan, Phe duyet & Dong vu viec).
- [VirtualDataRoomPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/VirtualDataRoomPage.tsx)
  - Bang chi so KPI tong quan phong du lieu, tai lieu va canh bao an ninh.
  - Danh sach phong du lieu voi the hien trang thai Anti-leak va Watermark.
  - Hop thoai tao phong VDR va cau hinh bao mat.
  - Hop thoai chi tiet phong gom 3 the:
    1. Tai lieu phong (Phan cap thu muc, Xem an toan Watermark, Kiem soat tai).
    2. Thanh vien va loi moi (Phan quyen, Moi doi tac, Thu hoi quyen).
    3. Nhat ky an ninh va vi pham (Liet ke su kien kha nghi, Nut chuyen doi sang Ho so dieu tra).
  - Trinh xem tai lieu an toan (Secure Document Viewer) chan chuot phai va hien thi du lieu watermark streaming.

Dieu huong va Dinh tuyen:
- [Navbar.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/Navbar.tsx): Bo sung nhom chuc nang "Bao mat & Dieu tra" voi 2 nut dieu huong "Dieu tra tai lieu" va "Phong du lieu (VDR)".
- [App.tsx](file:///f:/DoAn_CNPMNC/frontend/src/App.tsx): Cap nhat he thong dinh tuyen cho 2 phan he moi.

---

## 3. DANH MUC API RESTful VA PHAN QUYEN HE THONG

### 3.1. API Phan he Dieu tra tai lieu (/api/investigations)

1. GET /api/investigations
- Mo ta: Danh sach ho so dieu tra voi bo loc status, severity, assignedTo, search.
- Phan quyen: Authenticated.

2. GET /api/investigations/summary
- Mo ta: Thong ke chi so KPI (tong, open, investigating, reviewPending, closed, overdue).
- Phan quyen: Authenticated.

3. GET /api/investigations/{id}
- Mo ta: Chi tiet ho so dieu tra theo ID.
- Phan quyen: Authenticated.

4. POST /api/investigations
- Mo ta: Tao moi ho so dieu tra, tu dong sinh ma INV-YYYY-XXXX.
- Phan quyen: Authenticated.

5. PUT /api/investigations/{id}
- Mo ta: Cap nhat thong tin vu viec (tieu de, mo ta, nguoi phu trach, han xu ly).
- Phan quyen: Authenticated.

6. PUT /api/investigations/{id}/status
- Mo ta: Chuyen doi trang thai vu viec theo chu trinh nghiep vu.
- Phan quyen: Authenticated.

7. GET /api/investigations/{id}/evidence
- Mo ta: Liet ke chung cu da bao toan trong vu viec.
- Phan quyen: Authenticated.

8. POST /api/investigations/{id}/evidence
- Mo ta: Bao toan chung cu moi, luu ma bam SHA-256 va kich hoat Legal Hold tren tai lieu.
- Phan quyen: Authenticated.

9. GET /api/investigations/diff?documentId={docId}&versionA={vA}&versionB={vB}
- Mo ta: Tinh toan diff phien ban (so sanh ma bam, dung luong, dong van ban theo LCS).
- Phan quyen: Authenticated.

10. GET /api/investigations/{id}/timeline
- Mo ta: Hop nhat su kien dieu tra va nhat ky kiem toan audit log cua tai lieu.
- Phan quyen: Authenticated.

11. GET /api/investigations/{id}/findings
- Mo ta: Danh sach phat hien dieu tra.
- Phan quyen: Authenticated.

12. POST /api/investigations/{id}/findings
- Mo ta: Ghi nhan phat hien moi trong qua trinh dieu tra.
- Phan quyen: Authenticated.

13. POST /api/investigations/{id}/conclusion
- Mo ta: Trinh ket luan dieu tra sang cap xet duyet (chuyen sang REVIEW_PENDING).
- Phan quyen: Investigator / Authenticated.

14. POST /api/investigations/{id}/approve
- Mo ta: Phe duyet ket luan va dong ho so (chuyen sang CLOSED).
- Phan quyen: ROLE_ADMIN.

15. POST /api/investigations/from-vdr-event
- Mo ta: Tu dong khoi tao ho so dieu tra tu su kien vi pham an ninh VDR.
- Phan quyen: Authenticated.

16. GET /api/investigations/{id}/export-manifest
- Mo ta: Xuat file JSON bien ban toan ven du lieu phuc vu luu tru phap ly.
- Phan quyen: Authenticated.

### 3.2. API Phan he Phong du lieu bao mat (/api/vdr)

1. GET /api/vdr/rooms
- Mo ta: Liet ke cac phong du lieu ma nguoi dung co quyen truy cap.
- Phan quyen: Authenticated (Admin xem toan bo; User chi xem phong minh tao hoac la thanh vien active).

2. GET /api/vdr/rooms/summary
- Mo ta: Thong ke chi so KPI phong du lieu (tong phong, active, tai lieu, canh bao vi pham).
- Phan quyen: Authenticated.

3. GET /api/vdr/rooms/{id}
- Mo ta: Chi tiet phong du lieu theo ID.
- Phan quyen: Room Member / Admin.

4. POST /api/vdr/rooms
- Mo ta: Tao phong du lieu moi (VDR-YYYY-XXX), mac dinh trang thai DRAFT.
- Phan quyen: Authenticated.

5. PUT /api/vdr/rooms/{id}
- Mo ta: Cap nhat thong tin, chinh sach watermark va anti-leak cua phong.
- Phan quyen: Room Owner / Room Manager / Admin.

6. PUT /api/vdr/rooms/{id}/status
- Mo ta: Chuyen doi trang thai phong (DRAFT -> ACTIVE -> SUSPENDED -> CLOSED).
- Phan quyen: Room Owner / Admin.

7. GET /api/vdr/rooms/{id}/documents
- Mo ta: Danh sach tai lieu duoc cap phep trong phong kem phien ban ghim va thu muc.
- Phan quyen: Room Member / Admin.

8. POST /api/vdr/rooms/{id}/documents
- Mo ta: Them tai lieu tu EDMS vao phong du lieu voi phien ban co dinh.
- Phan quyen: Room Owner / Room Manager / Admin.

9. DELETE /api/vdr/rooms/{id}/documents/{documentId}
- Mo ta: Xoa tai lieu khoi phong du lieu.
- Phan quyen: Room Owner / Room Manager / Admin.

10. GET /api/vdr/rooms/{id}/members
- Mo ta: Danh sach thanh vien va doi tac trong phong.
- Phan quyen: Room Member / Admin.

11. POST /api/vdr/rooms/{id}/invitations
- Mo ta: Tao link moi doi tac ben ngoai co token va han su dung.
- Phan quyen: Room Owner / Room Manager / Admin.

12. POST /api/vdr/invitations/accept?token={token}
- Mo ta: Chap nhan loi moi tham gia phong du lieu bang token hop le.
- Phan quyen: Authenticated.

13. DELETE /api/vdr/rooms/{id}/members/{memberId}
- Mo ta: Thu hoi quyen truy cap cua thanh vien kem ly do.
- Phan quyen: Room Owner / Admin.

14. GET /api/vdr/rooms/{id}/documents/{documentId}/view
- Mo ta: Truyen dong streaming file co phu Watermark danh tinh nguoi xem va QR code toan ven.
- Phan quyen: Active Room Member / Admin.

15. GET /api/vdr/rooms/{id}/documents/{documentId}/download
- Mo ta: Tai file ve may. Neu phong hoac thanh vien bi cam tai (Anti-leak), tra ve HTTP 403 Forbidden va ghi nhan su kien kha nghi.
- Phan quyen: Authorized Downloaders Only.

16. GET /api/vdr/rooms/{id}/events
- Mo ta: Danh sach nhat ky hoat dong va vi pham an ninh cua phong.
- Phan quyen: Room Member / Admin.

17. GET /api/vdr/suspicious-events
- Mo ta: Liet ke toan bo su co vi pham an ninh tren tat ca cac phong VDR.
- Phan quyen: ROLE_ADMIN.

---

## 4. KET QUA KIEM THU TICH HOP TU DONG (INTEGRATION TEST)

Kich ban kiem thu tich hop dau-cuoi duoc thuc hien boi tap lenh:
[test_investigation_vdr_subsystems.py](file:///f:/DoAn_CNPMNC/scripts/test_investigation_vdr_subsystems.py)

Ket qua thuc thi tren moi truong he thong:
```text
==================================================================
EDMS INVESTIGATION & VIRTUAL DATA ROOM SUBSYSTEMS INTEGRATION TEST
==================================================================
[STEP 1] Logging in test accounts (hieu, tin, user)...
SUCCESS: Authenticated test accounts (Admin, Staff, User)
Using sample document: ID=1, Title='Hợp đồng nguyên tắc mua sắm trang thiết bị CNTT'

------------------------------------------------------------------
PART A: DOCUMENT INVESTIGATION SUBSYSTEM (MODULE A)
------------------------------------------------------------------
[STEP A1] Testing GET /api/investigations/summary...
SUCCESS: Investigation Summary: total=1, open=0, investigating=0, closed=1

[STEP A2] Testing POST /api/investigations (Create Case)...
SUCCESS: Created Investigation Case ID=2, Number=INV-2026-0002, Status=OPEN

[STEP A3] Testing POST /api/investigations/{id}/evidence (Preserve Evidence with Legal Hold)...
SUCCESS: Preserved Evidence ID=4, FileHash=sha256:2a7eb875e31a5d8683285e3cf5b9dda42421164a263224f0a50e11ff7a818fb5, LegalHold=True
SUCCESS: Document Legal Hold Status verified in EDMS: legalHold=True

[STEP A4] Testing GET /api/investigations/diff (v1 vs v2)...
SUCCESS: Diff evaluated: hashMatch=False, diffLinesCount=6
  [DELETE] LineA=3, LineB=None: Dieu 2: Thoi han thanh toan la 30 ngay ke tu ngay nghiem thu ky bien ban.
  [INSERT] LineA=None, LineB=3: Dieu 2: Thoi han thanh toan la 7 ngay ke tu ngay nghiem thu ky bien ban.

[STEP A5] Testing POST /api/investigations/{id}/findings...
SUCCESS: Recorded finding ID=2, Title='Xác nhận mã băm phiên bản 1 khớp với biên bản lưu kho'

[STEP A6] Testing GET /api/investigations/{id}/timeline...
SUCCESS: Timeline contains 7 chronological events:
  - [DOCUMENT_AUDIT] AUDIT_DOCUMENT_UPLOAD: Tải lên tài liệu: Hợp đồng nguyên tắc mua sắm trang thiết bị CNTT (HopDong_MuaSam_v1.txt) [INTERNAL]
  - [DOCUMENT_AUDIT] AUDIT_DOCUMENT_VERSION_UPLOAD: hieu tải lên phiên bản 2 cho tài liệu #1 (HopDong_MuaSam_v2.txt)
  - [DOCUMENT_AUDIT] AUDIT_DOCUMENT_VIEW: Xem chi tiết tài liệu: Hợp đồng nguyên tắc mua sắm trang thiết bị CNTT
  - [SYSTEM] CASE_CREATED: Khởi tạo hồ sơ điều tra mới #INV-2026-0002 bởi hieu

[STEP A7] Testing Conclusion workflow (Submit -> Approve -> Closed)...
SUCCESS: Conclusion submitted by investigator tin. Status is now REVIEW_PENDING
SUCCESS: Conclusion approved by Admin. Case is now CLOSED. ApprovedBy: hieu

[STEP A8] Testing GET /api/investigations/{id}/export-manifest...
SUCCESS: Exported integrity manifest JSON with 2 evidences and 1 findings

------------------------------------------------------------------
PART B: VIRTUAL DATA ROOM SUBSYSTEM (MODULE B)
------------------------------------------------------------------
[STEP B1] Testing GET /api/vdr/rooms/summary...
SUCCESS: VDR Summary: totalRooms=1, activeRooms=1, totalDocs=1, suspicious=0

[STEP B2] Testing POST /api/vdr/rooms (Create Room)...
SUCCESS: Created Data Room ID=2, Code=VDR-2026-002, Status=DRAFT, AllowDownload=False

[STEP B3] Testing PUT /api/vdr/rooms/{id}/status (Activate Room)...
SUCCESS: Data Room status transitioned to ACTIVE

[STEP B4] Testing POST /api/vdr/rooms/{id}/documents...
SUCCESS: Added Document ID=1 ('Hợp đồng nguyên tắc mua sắm trang thiết bị CNTT') to VDR Folder '/Hop_dong'

[STEP B5] Testing Member Invitation & Acceptance...
SUCCESS: Generated Invitation token: 62c20a9ffb56469a... for user@edms.local
SUCCESS: User accepted invitation! Member role=ROOM_GUEST, Status=ACTIVE, CanDownload=False

[STEP B6] Testing GET /api/vdr/rooms/{id}/documents/{docId}/view (Secure Streaming)...
SUCCESS: Document viewed securely! Content-Type: text/plain, Bytes: 233

[STEP B7] Testing GET /api/vdr/rooms/{id}/documents/{docId}/download (Anti-leak Enforcement)...
Result HTTP Status: 403
SUCCESS: Anti-leak policy successfully BLOCKED unauthorized document download (HTTP 403 Forbidden)!
SUCCESS: Suspicious security event recorded in VDR audit trail:
  Event ID: 15, Type: VDR_DOWNLOAD_DENIED, Suspicious: True
  Description: Cố gắng tải tài liệu bất chấp chính sách cấm tải (Anti-leak violation)

------------------------------------------------------------------
PART C: CROSS-MODULE INTEGRATION (VDR INCIDENT -> INVESTIGATION)
------------------------------------------------------------------
[STEP C1] Testing POST /api/investigations/from-vdr-event...
SUCCESS: Automatically created Investigation Case from VDR Event!
  Case Number: INV-2026-0003
  Reason: VDR_SECURITY_ALERT
  Severity: HIGH
  Linked VDR Event ID: 15
  Target Document ID: 1

==================================================================
ALL TESTS PASSED: 100% SUCCESSFUL INTEGRATION VERIFICATION
==================================================================
```

---

## 5. MINH CHUNG GIAO DIEN NGUOI DUNG (VISUAL UI EVIDENCE)

Tap anh chup thuc te bang cong cu tu dong hoa Puppeteer:
[capture_investigation_vdr.cjs](file:///f:/DoAn_CNPMNC/frontend/scripts/capture_investigation_vdr.cjs)

1. [01_investigation_dashboard.png](file:///f:/DoAn_CNPMNC/docs/investigation-vdr/01_investigation_dashboard.png)
- Mo ta: Bang dieu khien Dieu tra tai lieu voi 5 the KPI thong ke, bo loc trang thai/muc do va bang danh sach vu viec INV.

2. [02_investigation_case_detail_evidence.png](file:///f:/DoAn_CNPMNC/docs/investigation-vdr/02_investigation_case_detail_evidence.png)
- Mo ta: Chi tiet ho so dieu tra the Chung cu va Toan ven, hien thi bang chung cu kem ma bam SHA-256 va co Legal Hold Active.

3. [03_investigation_version_diff.png](file:///f:/DoAn_CNPMNC/docs/investigation-vdr/03_investigation_version_diff.png)
- Mo ta: Trinh so sanh phien ban Side-by-side Diff Viewer to mau truc quan su sai lech thoi han thanh toan tu 30 ngay sang 7 ngay.

4. [04_vdr_rooms_dashboard.png](file:///f:/DoAn_CNPMNC/docs/investigation-vdr/04_vdr_rooms_dashboard.png)
- Mo ta: Bang dieu khien Phong du lieu bao mat (VDR) voi chi so phong active, tai lieu, thanh vien va canh bao Anti-leak.

5. [05_vdr_room_detail_documents.png](file:///f:/DoAn_CNPMNC/docs/investigation-vdr/05_vdr_room_detail_documents.png)
- Mo ta: Chi tiet phong VDR the Tai lieu kem nut Xem an toan Watermark va thao tac phan quyen.

6. [06_vdr_security_audit_anti_leak.png](file:///f:/DoAn_CNPMNC/docs/investigation-vdr/06_vdr_security_audit_anti_leak.png)
- Mo ta: The Nhat ky an ninh phong VDR ghi nhan su co bi chan boi Anti-leak va nut hanh dong lien ket "Mo ho so dieu tra tu su co nay".

---

## 6. KET LUAN

Ca hai phan he **Dieu tra sai lech tai lieu (Document Investigation)** va **Phong du lieu bao mat (Virtual Data Room)** da duoc phat trien hoan chinh, tich hop thanh cong vao kien truc EDMS tong the, tuan thu nghiem ngat cac yeu cau ky thuat, bao toan du lieu hien huu va khong gay xung dot hay xam pham den cac quy trinh nghiep vu goc. Toan bo ma nguon da duoc bien dich, dong goi container va san sang phuc vu danh gia bao cao mon hoc tai HUFLIT.
