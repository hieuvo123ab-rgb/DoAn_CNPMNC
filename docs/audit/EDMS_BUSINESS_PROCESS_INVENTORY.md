# BAO CAO KIEM KE VA DOI SOAT TOAN BO NGHIEP VU HE THONG EDMS

Thong tin du an:
* Du an: Electronic Document Management System (EDMS)
* Hoc phan: Cong nghe phan mem nang cao - Truong Dai hoc Ngoai ngu - Tin hoc TP.HCM (HUFLIT)
* Giang vien huong dan: Phan Thi Ngoc Han
* Repository: https://github.com/hieuvo123ab-rgb/DoAn_CNPMNC
* Ngay kiem ke va doi soat: 21/11/2026
* Vai tro thuc hien: Senior Software Architect, Business Analyst, QA Engineer va Technical Auditor

---

## PHAN 1: TONG QUAN PHIEN BAN VA TRANG THAI HE THONG

### 1.1. Thong tin phien ban ma nguon va Git
* Nhanh Git hien tai: `feat/edms-investigation-vdr`
* Commit HEAD hien tai: `994a43d`
* Thong diep commit: `feat(investigation-vdr): implement Document Investigation and Virtual Data Room subsystems with full integration test and UI`
* Quan he voi nhanh `main` va remote:
  * Nhanh `origin/main` tren GitHub dang dung tai commit `f573e6e`.
  * Toan bo cac tinh nang nang cap moi nhat bao gom:
    1. Toi uu hoa giao dien Enterprise SaaS va Task Center co ban (commit `8cb55b2`).
    2. He thong quan ly cong viec Task Center 2.0 voi Kanban DND, phan tich tai va nhac han (commit `acba7f7`).
    3. Phan he Dieu tra sai lech tai lieu (Document Investigation) va Phong du lieu bao mat (Virtual Data Room) (commit `994a43d`).
  * Tinh trang luu tru: Cac commit tren hien dang duoc luu tru tren nhanh local `feat/edms-investigation-vdr`, cach ly hoan toan voi nhanh `main` de dam bao khong gay xao tron ma nguon goc truoc khi co lenh ban giao.

### 1.2. Moi truong kiem thu va xac minh thuc te
* He dieu hanh may chu: Windows 11 / WSL2 Ubuntu 24.04 LTS.
* Runtime Backend: OpenJDK 21.0.13, Spring Boot 3.3.3.
* Co so du lieu: PostgreSQL 16 Alpine dang chay trong Docker container `edms-postgres` tai cong 5432.
* Runtime Frontend: Node.js 20, Vite 5, React 18, TypeScript dang chay trong Docker container `edms-frontend` tai cong 5173.
* He thong Model AI: ONNX Runtime nhung mo hinh `multilingual-e5-small-onnx-int8-v1` (vector 384 chieu) chay cuc bo trong JVM.
* KeyStore bao mat: PKCS#12 chua cap khoa RSA-2048 phuc vu ky so SHA256withRSA.

### 1.3. Thong ke tong the ket qua kiem ke
* Tong so nhom nghiep vu: 8 nhom (Nhom A den Nhom H).
* Tong so nghiep vu thuc te (Business Processes): 41 nghiep vu doc lap.
* Tong so chuc nang ky thuat (Technical Functions): 78 chuc nang.
* Tong so bang CSDL PostgreSQL: 21 bang quan he.
* Tong so Controller API: 21 lop Controller.
* Tong so Service xu ly nghiep vu: 28 lop Service.
* Tong so Trang giao dien Frontend: 12 trang (kem 13 Modal hop thoai).

Phan bo trang thai kiem ke nghiep vu:
* VERIFIED_RUNNING: 38 nghiep vu (92.7%) - Da kiem thu thanh cong voi du lieu thuc te tren moi truong Docker dang chay.
* IMPLEMENTED_NOT_TESTED: 3 nghiep vu (7.3%) - Co day du ma nguon Frontend, Backend API, Service va CSDL nhung chua co kich ban kiem thu tu dong doc lap (dang su dung thong qua kiem thu thu cong).
* PARTIALLY_IMPLEMENTED: 0 nghiep vu (0.0%).
* MOCK_ONLY: 0 nghiep vu (0.0%).
* DOCUMENTED_ONLY: 0 nghiep vu (0.0%).
* NOT_IMPLEMENTED: 0 nghiep vu (0.0%).
* BROKEN: 0 nghiep vu (0.0%).

---

## PHAN 2: DANH SACH CHI TIET CAC NGHIEP VU THUC TE

Bang phan loai nghiep vu theo chuan he thong EDMS:

| Ma NV | Nhom nghiep vu | Ten nghiep vu | Muc tieu nghiep vu | Vai tro tham gia | Trang thai | Minh chung xac minh |
|---|---|---|---|---|---|---|
| NV-A01 | Nhom A: Quan ly tai lieu | Tiep nhan va luu tru tai lieu moi | Upload tep, tinh ma bam SHA-256 ban dau, luu metadata va phien ban v1 | ROLE_USER, ROLE_STAFF, ROLE_ADMIN | VERIFIED_RUNNING | Test phase 14 Test 311, DocumentCoreService.java |
| NV-A02 | Nhom A: Quan ly tai lieu | Quan ly phien ban tai lieu | Upload phien ban moi (v+1), luu vet thay doi, tinh ma hash SHA-256 rieng | ROLE_STAFF, ROLE_ADMIN, Owner | VERIFIED_RUNNING | Test phase 14 Test 341, DocumentVersionModal.tsx |
| NV-A03 | Nhom A: Quan ly tai lieu | Khoi phuc phien ban lich su | Chon phien ban cu lam co so tao ban ghi phien ban moi nhat, khong ghi de lich su | ROLE_STAFF, ROLE_ADMIN, Owner | VERIFIED_RUNNING | DocumentController.java line 440, DocumentCoreService.java line 192 |
| NV-A04 | Nhom A: Quan ly tai lieu | Kiem tra tinh toan ven tai lieu | Doi chieu ma bam tep tren dia voi hash CSDL, phat hien sua doi trai phep | ROLE_STAFF, ROLE_ADMIN, System | VERIFIED_RUNNING | Test phase 14 Test 323-324, IntegrityService.java |
| NV-A05 | Nhom A: Quan ly tai lieu | Xem truoc va xuat ban tai lieu | Doc noi dung tep, xem truoc tai lieu truc tuyen va tai ve an toan | ROLE_USER, ROLE_STAFF, ROLE_ADMIN | VERIFIED_RUNNING | PreviewModal.tsx, DocumentController.java |
| NV-A06 | Nhom A: Quan ly tai lieu | Phan loai va cap nhat metadata | Thiet lap phong ban, loai tai lieu, cap do mat va thoi han luu tru | ROLE_STAFF, ROLE_ADMIN, Owner | VERIFIED_RUNNING | EditModal.tsx, DocumentCoreService.java |
| NV-B01 | Nhom B: Xu ly noi dung | Trich xuat noi dung van ban | Boc tach text tu PDFBox, POI DOCX, Plain text vao extracted_text | System (Background/Sync) | VERIFIED_RUNNING | ContentExtractionService.java, AdminContentIndexController.java |
| NV-B02 | Nhom B: Xu ly noi dung | Nhan dang ky tu quang hoc (OCR) | OCR tu anh quet scan hoac PDF anh qua Tesseract engine (vie, eng) | System (Async Fallback) | VERIFIED_RUNNING | OcrService.java, AdminOcrController.java |
| NV-B03 | Nhom B: Xu ly noi dung | Phan manh va tao vector nhung AI | Cat nho doan 512 token, nhung vector 384 chieu bang ONNX e5-small | System (Local AI) | VERIFIED_RUNNING | LocalEmbeddingService.java, SemanticIndexingService.java |
| NV-B04 | Nhom B: Xu ly noi dung | Tim kiem lai RRF va ngu nghia | Ket hop Full-text Search SQL va Cosine Similarity Vector qua giai thuat RRF | Tat ca vai tro | VERIFIED_RUNNING | HybridSearchService.java, DocumentsPage.tsx |
| NV-B05 | Nhom B: Xu ly noi dung | Quan ly bo loc tim kiem da luu | Luu va tai lai cac tieu chi tim kiem phuc tap tren giao dien | Tat ca vai tro da dang nhap | IMPLEMENTED_NOT_TESTED | SavedSearchController.java, SavedSearchService.java, SaveSearchModal.tsx |
| NV-C01 | Nhom C: Quy trinh tai lieu | Quy trinh xet duyet tai lieu | Gui yeu cau, phe duyet hoac tu choi kem ly do, yeu cau chinh sua | ROLE_STAFF, ROLE_ADMIN | VERIFIED_RUNNING | Test phase 14 Test 316-318, ReviewQueuePage.tsx |
| NV-C02 | Nhom C: Quy trinh tai lieu | Quan ly vong doi va luu tru ho so | Xac dinh thoi han luu tru theo chinh sach, danh dau het han va luu tru | ROLE_ADMIN, System | VERIFIED_RUNNING | DocumentLifecycleModal.tsx, DocumentDispositionService.java |
| NV-C03 | Nhom C: Quy trinh tai lieu | Phong toa phap ly (Legal Hold) | Bat/tat co legalHold ngan chan tuyet doi hanh vi tieu huy tai lieu | ROLE_ADMIN, Investigator | VERIFIED_RUNNING | Test investigation vdr Step A3, Document.java |
| NV-C04 | Nhom C: Quy trinh tai lieu | Quy trinh kiem soat tieu huy | Gui yeu cau tieu huy tai lieu het han, admin phe duyet tieu huy logic (DISPOSED) | ROLE_STAFF, ROLE_ADMIN | VERIFIED_RUNNING | Test phase 14 Test 319-321, DispositionQueuePage.tsx |
| NV-D01 | Nhom D: Quan tri & Bao mat | Xac thuc va kiem soat phien | Dang nhap JWT, chan brute-force bang LoginRateLimiterService | Tat ca nguoi dung | VERIFIED_RUNNING | AuthController.java, AuthService.java, LoginPage.tsx |
| NV-D02 | Nhom D: Quan tri & Bao mat | Phan quyen vai tro he thong | Kiem soat truy cap dua tren vai tro (ROLE_ADMIN, ROLE_STAFF, ROLE_USER) | Spring Security | VERIFIED_RUNNING | Test phase 16 Test 412, SecurityConfig.java |
| NV-D03 | Nhom D: Quan tri & Bao mat | Phan quyen chi tiet tren tai lieu | Gan quyen READ, WRITE, DELETE, SHARE tren tung tai lieu cu the | Document Owner, Admin | VERIFIED_RUNNING | Test phase 14 Test 312-315, DocumentAccessModal.tsx |
| NV-D04 | Nhom D: Quan tri & Bao mat | Ky so dien tu va chung thuc | Ky so RSA-2048 SHA256withRSA, tra cuu cong khai khong can login qua QR | ROLE_ADMIN, Public User | VERIFIED_RUNNING | SignatureService.java, PublicVerificationController.java, VerifyPage.tsx |
| NV-D05 | Nhom D: Quan tri & Bao mat | Nhat ky kiem toan bat bien | Ghi nhan toan bo thao tac he thong vao audit_logs de tra cuu giam dinh | System, Admin | VERIFIED_RUNNING | AuditLogPage.tsx, AuditService.java (145 rows in DB) |
| NV-D06 | Nhom D: Quan tri & Bao mat | Thong bao thoi gian thuc | Gui thong bao kem actionKey, day tuc thoi qua kenh WebSocket STOMP | Tat ca nguoi dung | VERIFIED_RUNNING | Test phase 14 Test 311-356, NotificationPanel.tsx |
| NV-D07 | Nhom D: Quan tri & Bao mat | Giam sat he thong va thong ke | Thong ke so luong, dung luong, liveness, readiness, trang thai DB va KeyStore | ROLE_ADMIN | VERIFIED_RUNNING | DashboardPage.tsx, SystemStatusPage.tsx, AdminSystemStatusController.java |
| NV-E01 | Nhom E: Trung tam cong viec | Dieu phoi tac vu tu dong EDMS | Tu dong tong hop tac vu REVIEW_PENDING, DISPOSITION_PENDING, REVISION_REQUIRED | ROLE_ADMIN, Document Owner | VERIFIED_RUNNING | Test phase 14 Test 335-341, TaskCenterService.java |
| NV-E02 | Nhom E: Trung tam cong viec | Quan ly cong viec thu cong 2.0 | Tao cong viec, giao viec, doi trang thai (TODO, IN_PROGRESS, DONE, CANCELLED) | ROLE_ADMIN, ROLE_STAFF | VERIFIED_RUNNING | Test manual tasks Step 4-8, ManualTaskController.java |
| NV-E03 | Nhom E: Trung tam cong viec | Phoi hop va ghi nhat ky cong viec | Task Drawer: binh luan cong viec, ghi nhan dong thoi gian lich su thao tac | Nguoi giao, Nguoi nhan | VERIFIED_RUNNING | Test manual tasks Step 8.1, 9, TaskCenterPage.tsx |
| NV-E04 | Nhom E: Trung tam cong viec | Phan tich tai va nhac han tu dong | Thong ke cong viec theo thanh vien, quet va gui thong bao nhac han / qua han | ROLE_ADMIN, System | VERIFIED_RUNNING | Test manual tasks Step 8.2-8.3, ManualTaskService.java |
| NV-F01 | Nhom F: Dieu tra sai lech | Khoi tao ho so dieu tra | Mo ho so INV-YYYY-XXXX, chon ly do, muc do nghiem trong, giao dieu tra vien | ROLE_ADMIN, Investigator | VERIFIED_RUNNING | Test investigation vdr Step A1-A2, InvestigationController.java |
| NV-F02 | Nhom F: Dieu tra sai lech | Bao toan chung cu va Legal Hold | Niem phong file bang SHA-256, tu dong khoa Legal Hold tren tai lieu goc | Investigator, Admin | VERIFIED_RUNNING | Test investigation vdr Step A3, InvestigationService.java |
| NV-F03 | Nhom F: Dieu tra sai lech | So sanh phien ban truc quan | So sanh dong van ban Myers LCS highlight chen/xoa/sua giua 2 phien ban | Investigator, Admin | VERIFIED_RUNNING | Test investigation vdr Step A4, anh 03_investigation_version_diff.png |
| NV-F04 | Nhom F: Dieu tra sai lech | Dong thoi gian dieu tra hop nhat | Gop su kien dieu tra voi nhat ky he thong audit_logs theo thoi gian thuc | Investigator, Admin | VERIFIED_RUNNING | Test investigation vdr Step A6, InvestigationService.java |
| NV-F05 | Nhom F: Dieu tra sai lech | Ket luan va phe duyet dong ho so | Ghi nhan ket qua xac minh, nop ket luan, admin phe duyet sang CLOSED | Investigator, ROLE_ADMIN | VERIFIED_RUNNING | Test investigation vdr Step A5, A7, InvestigationPage.tsx |
| NV-F06 | Nhom F: Dieu tra sai lech | Xuat bien ban giam dinh toan ven | Xuat tep JSON Manifest chua day du chung cu, hash, timeline va ket luan | Investigator, Admin | VERIFIED_RUNNING | Test investigation vdr Step A8, InvestigationController.java |
| NV-G01 | Nhom G: Virtual Data Room | Thiet lap phong du lieu VDR | Tao phong VDR-YYYY-XXX, cau hinh chinh sach bao mat, quan ly vong doi | ROLE_ADMIN, ROOM_OWNER | VERIFIED_RUNNING | Test investigation vdr Step B1-B3, VirtualDataRoomController.java |
| NV-G02 | Nhom G: Virtual Data Room | Quan ly thu muc va tai lieu ghim | Ghim tai lieu vao phong VDR theo cay thu muc ao, co dinh phien ban an toan | ROOM_OWNER, ROOM_MANAGER | VERIFIED_RUNNING | Test investigation vdr Step B4, VirtualDataRoomService.java |
| NV-G03 | Nhom G: Virtual Data Room | Moi thanh vien qua Token | Sinh token moi co thoi han, doi tac kich hoat tham gia, phan quyen VDR | ROOM_OWNER, External Partner | VERIFIED_RUNNING | Test investigation vdr Step B5, VirtualDataRoomPage.tsx |
| NV-G04 | Nhom G: Virtual Data Room | Xem tai lieu kem Watermark dong | Trinh xem an toan, chen watermark chìm chua danh tinh nguoi xem, IP, gio | All Room Members | VERIFIED_RUNNING | Test investigation vdr Step B6, WatermarkService.java |
| NV-G05 | Nhom G: Virtual Data Room | Chong ro ri va bay su co tai tep | Chan download khong phep (HTTP 403), tu dong ghi nhan su co dang ngo vao log | External Partner, Room Guest | VERIFIED_RUNNING | Test investigation vdr Step B7, VirtualDataRoomController.java |
| NV-G06 | Nhom G: Virtual Data Room | Nhat ky an ninh phong du lieu | Theo doi lich su truy cap, xem tai lieu, no luc tai tep va vi pham an ninh | ROOM_OWNER, Admin | VERIFIED_RUNNING | Test investigation vdr Step B7, anh 06_vdr_security_audit_anti_leak.png |
| NV-H01 | Nhom H: Tich hop lien he | Mo ho so dieu tra tu su co VDR | Tu dong khoi tao ho so INV-YYYY-XXXX lien ket voi su co an ninh VDR | Investigator, Admin | VERIFIED_RUNNING | Test investigation vdr Step C1, InvestigationService.java |
| NV-H02 | Nhom H: Tich hop lien he | Khoa Legal Hold chan tieu huy | Legal Hold tu ho so dieu tra lap tuc chan moi thao tac phe duyet tieu huy | System, Admin | VERIFIED_RUNNING | Test investigation vdr Step A3, DocumentDispositionService.java |
| NV-H03 | Nhom H: Tich hop lien he | Tich hop thong bao vao Task Center | Phat sinh canh bao va cong viec dieu tra cho dieu tra vien qua Task Center | System, Investigator | IMPLEMENTED_NOT_TESTED | NotificationService.java, TaskCenterService.java |

---

## PHAN 3: MA TRAN CHUC NANG KY THUAT (TRACEABILITY MATRIX)

Bang doi chieu chi tiet tu Giao dien Frontend den Co so du lieu Backend:

| Ma NV | Ten nghiep vu | Chuc nang ky thuat | Giao dien Frontend | Endpoint API | Lop Service Backend | Bang CSDL | Ket qua test |
|---|---|---|---|---|---|---|---|
| NV-A01 | Tiep nhan tai lieu | Upload file va metadata | `UploadModal.tsx` | `POST /api/documents` | `DocumentCoreService.createDocumentCore` | `documents`, `document_versions` | PASS (Test 311) |
| NV-A02 | Quan ly phien ban | Upload phien ban moi | `DocumentVersionModal.tsx` | `POST /api/documents/{id}/versions` | `DocumentCoreService.addVersionCore` | `document_versions` | PASS (Test 341) |
| NV-A03 | Khoi phuc phien ban | Restore version lich su | `DocumentVersionModal.tsx` | `POST /api/documents/{id}/versions/{v}/restore` | `DocumentCoreService.restoreVersionCore` | `document_versions`, `audit_logs` | PASS (Code & API verified) |
| NV-A04 | Tinh toan ven | Xac minh ma bam SHA-256 | `DocumentsPage.tsx` | `GET /api/documents/{id}/integrity/verify` | `IntegrityService.verifyDocumentIntegrity` | `document_versions`, `notifications` | PASS (Test 323-324) |
| NV-A05 | Xem truoc & Tai | Xem truoc / Download tep | `PreviewModal.tsx` | `GET /api/documents/{id}/download` | `DocumentService.downloadDocument` | `documents`, `audit_logs` | PASS (Live UI verified) |
| NV-A06 | Metadata tai lieu | Cap nhat thong tin tai lieu | `EditModal.tsx` | `PUT /api/documents/{id}` | `DocumentCoreService.updateDocumentMetadataCore` | `documents`, `audit_logs` | PASS (Live UI verified) |
| NV-B01 | Trich xuat noi dung | Trich xuat text tu PDF/DOCX | `DocumentsPage.tsx` | `POST /api/admin/content-index/reindex-all` | `ContentExtractionService.extractAndSaveById` | `document_versions` | PASS (Live verified) |
| NV-B02 | Nhan dang OCR | OCR fallback anh/scan | `DocumentsPage.tsx` | `POST /api/admin/ocr/process-all` | `OcrService.evaluateAndQueueOcr` | `document_versions` | PASS (Live verified) |
| NV-B03 | Nhung vector AI | Embedding vector 384 chieu | Backend Tu dong | `POST /api/admin/semantic/reindex-all` | `LocalEmbeddingService.embed`, `SemanticIndexingService` | `document_semantic_chunks` | PASS (ONNX loaded) |
| NV-B04 | Tim kiem lai RRF | Tim kiem lai FTS + Vector | `DocumentsPage.tsx` | `GET /api/documents/search/hybrid` | `HybridSearchService.searchHybrid` | `documents`, `document_semantic_chunks` | PASS (Live verified) |
| NV-B05 | Bo loc tim kiem | Luu tieu chi tim kiem | `SaveSearchModal.tsx` | `POST /api/saved-searches` | `SavedSearchService.createSavedSearch` | `saved_searches` | IMPLEMENTED_NOT_TESTED |
| NV-C01 | Quy trinh xet duyet | Nop, duyet, tu choi duyet | `ReviewQueuePage.tsx` | `POST /api/admin/reviews/{id}/decision` | `DocumentReviewService.approveReview`, `rejectReview` | `document_reviews`, `documents` | PASS (Test 316-318) |
| NV-C02 | Vong doi luu tru | Tinh thoi han luu tru | `DocumentLifecycleModal.tsx` | `POST /api/documents/{id}/archive` | `DocumentDispositionService.archiveDocument` | `documents`, `audit_logs` | PASS (Live UI verified) |
| NV-C03 | Legal Hold | Bat/tat co khoa phap ly | `DocumentsPage.tsx` | `PUT /api/documents/{id}/legal-hold` | `DocumentCoreService.setLegalHoldCore` | `documents`, `audit_logs` | PASS (Test Step A3) |
| NV-C04 | Kiem soat tieu huy | Yeu cau va duyet tieu huy | `DispositionQueuePage.tsx` | `POST /api/admin/dispositions/{id}/decision` | `DocumentDispositionService.approveDisposition` | `document_dispositions`, `documents` | PASS (Test 319-321) |
| NV-D01 | Xac thuc & Khoa IP | Dang nhap JWT, gioi han tan suat | `LoginPage.tsx` | `POST /api/auth/login` | `AuthService.login`, `LoginRateLimiterService` | `users`, in-memory cache | PASS (Live verified) |
| NV-D02 | Phan quyen RBAC | Chan truy cap theo vai tro | `Navbar.tsx` | Toan bo Endpoint `@PreAuthorize` | Spring Security FilterChain | `users` | PASS (Test 412) |
| NV-D03 | Phan quyen tai lieu | Gan quyen READ/WRITE/DELETE | `DocumentAccessModal.tsx` | `POST /api/documents/{id}/share` | `DocumentAccessService.shareDocument` | `document_permissions` | PASS (Test 312-315) |
| NV-D04 | Ky so dien tu | Ky so RSA-2048 & QR Verify | `VerifyPage.tsx` | `POST /api/documents/{id}/sign`, `/public/verify` | `SignatureService.signDocument`, `verifySignature` | `document_versions`, `audit_logs` | PASS (Live UI verified) |
| NV-D05 | Nhat ky kiem toan | Ghi va tra cuu nhat ky | `AuditLogPage.tsx` | `GET /api/audit` | `AuditService.log`, `searchAuditLogs` | `audit_logs` | PASS (145 logs verified) |
| NV-D06 | Thong bao thoi gian thuc | Thong bao STOMP WebSocket | `NotificationPanel.tsx` | `GET /api/notifications`, `/ws-edms` | `NotificationService.notifyUser`, `SimpMessagingTemplate` | `notifications` | PASS (Test 311-356) |
| NV-D07 | Dashboard giam sat | Thong ke va suc khoe he thong | `DashboardPage.tsx`, `SystemStatusPage.tsx` | `GET /api/admin/monitoring/dashboard`, `/api/health` | `StatisticsService`, `OperationalDiagnosticsService` | CSDL, Storage, Keystore | PASS (Live UI verified) |
| NV-E01 | Tac vu tu dong | Suy xuat tac vu tu nghiep vu | `TaskCenterPage.tsx` | `GET /api/tasks` | `TaskCenterService.getTasksForUser` | `document_reviews`, `document_dispositions` | PASS (Test 335-341) |
| NV-E02 | Cong viec thu cong | CRUD cong viec thu cong | `TaskCenterPage.tsx` | `POST /api/manual-tasks`, `PUT status` | `ManualTaskService.createTask`, `updateStatus` | `manual_tasks` | PASS (11/11 Test Step) |
| NV-E03 | Binh luan cong viec | Them trao doi trong Drawer | `TaskCenterPage.tsx` | `POST /api/manual-tasks/{id}/comments` | `ManualTaskService.addComment` | `manual_task_activities` | PASS (Test Step 8.1) |
| NV-E04 | Phan tich tai & Nhac han | Thong ke tai, quet nhac han | `TaskCenterPage.tsx` | `GET /api/manual-tasks/workload`, `/escalate-check` | `ManualTaskService.getWorkloadAnalytics`, `escalateCheck` | `manual_tasks`, `notifications` | PASS (Test Step 8.2-8.3) |
| NV-F01 | Khoi tao ho so dieu tra | Mo ho so INV-YYYY-XXXX | `InvestigationPage.tsx` | `POST /api/investigations` | `InvestigationService.createCase` | `investigation_cases` | PASS (Test Step A1-A2) |
| NV-F02 | Bao toan chung cu | Băm SHA-256 va Legal Hold | `InvestigationPage.tsx` | `POST /api/investigations/{id}/evidence` | `InvestigationService.preserveEvidence` | `investigation_evidences`, `documents` | PASS (Test Step A3) |
| NV-F03 | So sanh phien ban | Myers LCS Side-by-side Diff | `InvestigationPage.tsx` | `GET /api/investigations/diff` | `InvestigationService.computeVersionDiff` | `document_versions` | PASS (Test Step A4) |
| NV-F04 | Timeline dieu tra | Gop su kien voi audit_logs | `InvestigationPage.tsx` | `GET /api/investigations/{id}/timeline` | `InvestigationService.getCaseTimeline` | `investigation_events`, `audit_logs` | PASS (Test Step A6) |
| NV-F05 | Ket luan dieu tra | Ghi nhan ket qua va dong ho so | `InvestigationPage.tsx` | `POST /api/investigations/{id}/conclusion/approve` | `InvestigationService.submitConclusion`, `approveConclusion` | `investigation_findings`, `investigation_cases` | PASS (Test Step A5, A7) |
| NV-F06 | Xuat bao cao giam dinh | Tai tep JSON Manifest | `InvestigationPage.tsx` | `GET /api/investigations/{id}/export-manifest` | `InvestigationService.exportManifest` | Tong hop du lieu vu an | PASS (Test Step A8) |
| NV-G01 | Thiet lap phong VDR | Tao va doi trang thai phong | `VirtualDataRoomPage.tsx` | `POST /api/vdr/rooms`, `PUT status` | `VirtualDataRoomService.createRoom`, `updateStatus` | `vdr_data_rooms` | PASS (Test Step B1-B3) |
| NV-G02 | Ghim tai lieu vao VDR | Them/xoa tai lieu thu muc | `VirtualDataRoomPage.tsx` | `POST /api/vdr/rooms/{id}/documents` | `VirtualDataRoomService.addDocument` | `vdr_documents` | PASS (Test Step B4) |
| NV-G03 | Moi thanh vien qua Token | Sinh token va chap nhan loi moi | `VirtualDataRoomPage.tsx` | `POST /api/vdr/rooms/{id}/invitations`, `POST accept` | `VirtualDataRoomService.createInvitation`, `acceptInvitation` | `vdr_invitations`, `vdr_members` | PASS (Test Step B5) |
| NV-G04 | Trinh xem Watermark | Stream noi dung kem watermark | `VirtualDataRoomPage.tsx` | `GET /api/vdr/rooms/{id}/documents/{docId}/view` | `VirtualDataRoomService.streamDocumentWithWatermark` | `vdr_documents`, `vdr_events` | PASS (Test Step B6) |
| NV-G05 | Anti-leak Download | Chan tai 403 va ghi log bat thuong | `VirtualDataRoomPage.tsx` | `GET /api/vdr/rooms/{id}/documents/{docId}/download` | `VirtualDataRoomService.downloadDocument`, `recordSuspiciousEvent` | `vdr_events` (suspicious=true) | PASS (Test Step B7) |
| NV-G06 | Nhat ky an ninh VDR | Truy van lich su phong du lieu | `VirtualDataRoomPage.tsx` | `GET /api/vdr/rooms/{id}/events` | `VirtualDataRoomService.getRoomEvents` | `vdr_events` | PASS (Test Step B7) |
| NV-H01 | Dieu tra tu su co VDR | Mo INV case tu VDR event | `VirtualDataRoomPage.tsx` | `POST /api/investigations/from-vdr-event` | `InvestigationService.createCaseFromVdrEvent` | `investigation_cases`, `vdr_events` | PASS (Test Step C1) |
| NV-H02 | Legal Hold chan tieu huy | Khoa tieu huy khi co Legal Hold | `DispositionQueuePage.tsx` | `POST /api/admin/dispositions/{id}/decision` | `DocumentDispositionService.approveDisposition` | `documents`, `document_dispositions` | PASS (Code & Test verified) |
| NV-H03 | Thong bao vao Task Center | Dieu phoi tac vu dieu tra | `TaskCenterPage.tsx` | `GET /api/tasks` | `TaskCenterService`, `NotificationService` | `notifications` | IMPLEMENTED_NOT_TESTED |

---

## PHAN 4: CAC QUY TRINH NGHIEP VU TIEU BIEU CUA DU AN

Nam quy trinh nghiep vu cot loi, dien hinh nhat de dua vao Bao cao Tot nghiep va Slide thuyet trinh:

### Quy trinh 1: Quan ly xet duyet tai lieu va tiep nhan phien ban (Document Review & Approval Flow)
* Vai tro tham gia: Chuyen vien (ROLE_STAFF), Quan tri vien (ROLE_ADMIN).
* Dieu kien dau vao: Tai lieu moi hoac phien ban sua doi duoc tai len voi trang thai DRAFT hoac REVISION_REQUIRED.
* Cac buoc thuc hien:
  1. Chuyen vien nop tai lieu vao quy trinh xet duyet qua giao dien Kho tai lieu.
  2. He thong cap nhat trang thai tai lieu sang REVIEW_PENDING, ghi nhat ky audit_logs va tu dong phat sinh tac vu cho Admin trong Task Center kem thong bao thoi gian thuc.
  3. Quan tri vien mo "Hang doi duyet" (ReviewQueuePage), kiem tra noi dung xem truoc va lich su phien ban.
  4. Truong hop phe duyet: Admin nhan "Duyet", tai lieu chuyen sang trang thai APPROVED. He thong thong bao ket qua cho chuyen vien va go bo tac vu khoi Task Center cua Admin.
  5. Truong hop tu choi: Admin nhan "Tu choi", nhap ly do va yeu cau sua doi. Tai lieu chuyen sang trang thai REVISION_REQUIRED. He thong tu dong phat sinh tac vu sua doi cho chuyen vien chu so huu.
* Ket qua dat duoc: Tai lieu duoc kiem soat chat che chat luong truoc khi dua vao luu hanh chinh thuc.
* Xu ly ngoai le: Neu Admin thuc hien duyet trung lap, he thong chan khong sinh thong bao rac. Neu xay ra loi he thong trong luc gui thong bao, giao dich phe duyet tai lieu van duoc dam bao toan ven.

### Quy trinh 2: Kiem soat tieu huy tai lieu co bao toan phap ly (Controlled Disposition with Legal Hold Guard)
* Vai tro tham gia: Chuyen vien luu tru (ROLE_STAFF), Quan tri vien he thong (ROLE_ADMIN).
* Dieu kien dau vao: Tai lieu da vuot qua thoi han luu tru theo quy dinh (vi du 5 nam hoac 10 nam) va khong bi phong toa Legal Hold.
* Cac buoc thuc hien:
  1. Chuyen vien ra soat danh muc tai lieu het han luu tru tai DocumentLifecycleModal va gui yeu cau tieu huy (DISPOSITION_REQUESTED).
  2. He thong tao ban ghi trong `document_dispositions` voi trang thai PENDING, phat sinh tac vu trong Hang doi tieu huy cua Admin.
  3. Quan tri vien tien hanh tham dinh tinh phap ly cua tai lieu tai DispositionQueuePage.
  4. He thong thuc hien kiem tra tu dong co `legalHold`:
     * Neu `legalHold == true`: He thong chan dung thao tac phe duyet, tra ve thong bao loi rang tai lieu dang nam trong dien phong toa phap ly hoac ho so dieu tra.
     * Neu `legalHold == false`: He thong cho phep Admin phe duyet.
  5. Thuc hien tieu huy logic (Soft-delete): Trang thai tai lieu chuyen thanh DISPOSED. Tep tin vat ly va toan bo lich su phien ban, ma hash van duoc luu tru bao toan tren he thong de phuc vu kiem toan phap ly theo dung tieu chuan ISO 15489.
* Ket qua dat duoc: Ngan chan triet de nguy co tieu huy nham tai lieu dang co tranh chap hoac dieu tra.

### Quy trinh 3: Ky so dien tu PKI va chung thuc cong khai qua ma QR (Digital Signature & Public QR Verification)
* Vai tro tham gia: Quan tri vien (ROLE_ADMIN), Doi tac hoac Nguoi dan ben ngoai (Public User).
* Dieu kien dau vao: Tai lieu da duoc phe duyet (APPROVED) va KeyStore PKCS#12 hoat dong hop le.
* Cac buoc thuc hien:
  1. Admin chon tai lieu can ban hanh va nhan "Ky so dien tu".
  2. SignatureService trich xuat khoa bi mat RSA-2048 tu KeyStore, tinh ma bam SHA-256 cua noi dung phien ban va sinh chu ky dien tu SHA256withRSA.
  3. Chu ky so, thoi gian ky va so seri chung chi duoc nhung vao metadata cua phien ban trong `document_versions`.
  4. He thong tu dong sinh ma QR dan den dia chi tra cuu cong khai `/verify/{documentId}`.
  5. Nguoi tiep nhan van ban quet ma QR bang dien thoai hoac truy cap truc tiep vao VerifyPage.
  6. Backend PublicVerificationController thuc hien giai ma va kiem tra tinh hop le cua chu ky so voi khoa cong khai X.509 ma khong yeu cau nguoi dung phai dang nhap.
* Ket qua dat duoc: Cung cap bang chung phap ly chong choi bo (non-repudiation) cho van ban dien tu.

### Quy trinh 4: Dieu tra sai lech phien ban va bao toan chung cu so (Document Discrepancy Investigation)
* Vai tro tham gia: Quan tri vien (ROLE_ADMIN), Dieu tra vien noi bo (Investigator / ROLE_STAFF).
* Dieu kien dau vao: Phat hien tai lieu co dau hieu bi sua doi bat thuong hoac co su co mau thuan noi dung giua cac phien ban.
* Cac buoc thuc hien:
  1. Khoi tao ho so dieu tra: Nguoi dung mo ho so voi ly do VERSION_DISCREPANCY, he thong sinh ma dinh danh `INV-YYYY-XXXX` (vi du: `INV-2026-0004`).
  2. Niem phong chung cu: Dieu tra vien chon phien ban can dieu tra, he thong tu dong tinh toan ma bam SHA-256 luu vao `investigation_evidences` va dong thoi kich hoat co `legalHold = true` tren tai lieu goc.
  3. Giam dinh sai lech truc quan (Textual Diff): He thong chay thuat toan LCS Myers so sanh phien ban v1 va v2, hien thi 2 cot song song danh dau chinh xac tung dong bi sua (vi du: thoi han thanh toan bi sua tu 30 ngay xuong 7 ngay).
  4. Truy vet dong thoi gian: He thong tong hop tu dong nhat ky audit_logs cua tai lieu voi cac su kien dieu tra, tai hien toan bo hanh vi ai da upload, xem hoac thay doi tep vao thoi diem nao.
  5. Ket luan va dong ho so: Dieu tra vien ghi nhan cac phat hien (`InvestigationFinding`), de xuat ket luan. Quan tri vien phe duyet ket luan, chuyen ho so sang trang thai CLOSED.
  6. Xuat bao cao giam dinh: Xuat toan bo ho so ra tep JSON Manifest phuc vu trinh bao co quan chuc nang hoac lanh dao.
* Ket qua dat duoc: Quy trinh dieu tra minh bach, khach quan, chung cu duoc niem phong khong the bi thay doi.

### Quy trinh 5: Chia se phong du lieu bao mat (VDR) va ngan chan ro ri du lieu (Anti-leak)
* Vai tro tham gia: Truong phong du lieu (ROOM_OWNER), Doi tac ben ngoai (ROOM_GUEST / ROOM_VIEWER).
* Dieu kien dau vao: Phong du lieu da duoc khoi tao o trang thai ACTIVE voi chinh sach cam tai tep (`allowDownload = false`).
* Cac buoc thuc hien:
  1. Ghim tai lieu: Truong phong ghim cac tai lieu quan trong tu kho EDMS vao thu muc ao cua VDR, phien ban duoc co dinh an toan.
  2. Phat hanh thu moi: Truong phong moi email doi tac, he thong sinh Token bao mat co thoi han truy cap.
  3. Kich hoat quyen: Doi tac nhan lien ket kem Token, xac thuc tham gia phong va duoc cap quyen ROOM_GUEST (chi duoc xem truc tuyen, khong co quyen tai).
  4. Trinh xem an toan: Doi tac mo xem tai lieu tren giao dien VDR. He thong stream noi dung kem lop Watermark dong bao gom Email nguoi xem, Dia chi IP va Thoi gian truy cap thuc te phu len toan bo van ban.
  5. Kiem soat Anti-leak va bay su co: Doi tac co tinh goi API download hoac can thiep cong cu devtools de tai tep. Backend VirtualDataRoomController kiem tra chinh sach phong va tu choi voi ma HTTP 403 Forbidden.
  6. Tu dong ghi nhan su co: He thong lap tuc ghi nhan mot ban ghi nhat ky `VDR_DOWNLOAD_DENIED` voi co `suspicious = true` vao CSDL.
  7. Khoi phat dieu tra: Truong phong nhan nut "Mo ho so dieu tra tu su co nay" ngay tren bang an ninh, he thong tu dong sinh ho so `INV-YYYY-XXXX` lien ket su co.
* Ket qua dat duoc: Bao ve tuyet doi tai lieu mat khi chia se cho doi tac, giam sat va xu ly tuc thi moi hanh vi gian lan.

---

## PHAN 5: DANH GIA CHUYEN SAU 2 PHAN HE NGHIEP VU MOI (INVESTIGATION & VDR)

### 5.1. Nhung gi da hoan thanh va dat duoc
1. Co che ma so dinh danh chuan hoa doanh nghiep:
   * Investigation su dung ma `INV-YYYY-XXXX` sinh theo thu tu tang dan trong nam.
   * VDR su dung ma `VDR-YYYY-XXX` tu sinh duy nhat.
2. Tinh toan ven chung cu phap ly:
   * Moi chung cu deu duoc tinh toan ma bam SHA-256 ngay tai thoi diem thu thap.
   * Tich hop co che Legal Hold giup bao ve tai lieu goc khoi quy trinh Controlled Disposition.
3. Giam dinh sai lech phien ban (Side-by-side Textual Diff):
   * Thuat toan LCS Myers duoc cai dat thuan Java trong `InvestigationService.java`, phan loai ro rang 3 trang thai dong: `EQUAL`, `INSERT`, `DELETE`.
   * Giao dien truc quan hai cot phan biet mau sac ro rang tren Frontend React.
4. VDR Token-based Invitation & Dynamic Watermark:
   * Co che moi thanh vien qua Token ngau nhien co thoi gian song (TTL), kiem tra trang thai hop le khi chap nhan.
   * Watermark dong duoc render theo thoi gian thuc dua tren danh tinh nguoi dang xem va IP.
5. Co che bao ve Anti-leak va ghi nhan su co doc lap:
   * Chan dung tai tang Backend voi HTTP 403 Forbidden khi nguoi dung khong co quyen tai tep.
   * Su dung phuong thuc `@Transactional` doc lap (`recordSuspiciousEvent`) duoc goi truoc khi nem ngoai le, giup nhat ky su co an ninh khong bi rollback khoi CSDL.
6. Lien ket hai chieu giua VDR va Investigation:
   * Cho phep mo truc tiep ho so dieu tra tu bat ky su co an ninh VDR dang ngo nao chi voi mot thao tac API/UI.

### 5.2. Cac kich ban kiem thu da thuc thi va minh chung
* Kich ban 1: Tao ho so dieu tra `INV-2026-0004`, bao toan chung cu SHA-256 va kich hoat Legal Hold thanh cong.
* Kich ban 2: So sanh phien ban v1 va v2 cua tai lieu Hop dong phat hien sai lech thoi han thanh toan tu 30 ngay xuong 7 ngay.
* Kich ban 3: Quy trinh nop ket luan va duoc Admin phe duyet sang trang thai `CLOSED`.
* Kich ban 4: Xuat JSON Manifest day du thong tin vu an.
* Kich ban 5: Tao phong VDR `VDR-2026-003`, ghim tai lieu, moi thanh vien bang Token va chap nhan loi moi.
* Kich ban 6: Nguoi dung khach xem tai lieu kem Watermark dong thanh cong.
* Kich ban 7: Nguoi dung khach co gang tai tai lieu bi he thong chan dung HTTP 403 Forbidden va ghi nhan su co dang ngo `VDR_DOWNLOAD_DENIED` vao CSDL.
* Kich ban 8: Mo thanh cong ho so dieu tra `INV-2026-0005` truc tiep tu su co tren.

### 5.3. Danh gia cac diem yeu bao mat va rui ro con ton tai
1. Han che cua Watermark dong:
   * Watermark dong la co che rande hinh anh va danh dau trach nhiem phap ly cua nguoi xem, khong phai la bien phap ngan chan tuyet doi neu nguoi dung su dung thiet bi ngoai vi (nhu dien thoai chup lai man hinh).
2. Xac thuc doi tac ngoai trong VDR:
   * Hien tai he thong gan tai khoan doi tac dua tren email nhung van yeu cau doi tac co mot tai khoan trong he thong EDMS (ROLE_USER) de luu phien dang nhap JWT. Neu can mo rong ra doi tac ngoai hoan toan khong co tai khoan noi bo, can bo sung co che Magic Link Authentication hoac Guest Session doc lap.
3. Xuat bao cao giam dinh JSON:
   * Tep JSON Manifest xuat ra chua duoc ky so bang KeyStore PKCS#12 cua he thong. Trong tuong lai nen ap dung ky so truc tiep len tep Manifest de tao tinh phap ly tuyet doi cho bien ban dieu tra.

---

## PHAN 6: DOI SOAT NHUNG NOI DUNG CHUA KHOP (DISCREPANCIES AUDIT)

Doi chieu thuc te giua Ma nguon he thong voi README, Bao cao cu va Tai lieu ban giao:

| Hang muc doi soat | Noi dung ghi tren Bao cao / Tai lieu cu | Hien trang thuc te trong Ma nguon | Danh gia va Giai phap xu ly |
|---|---|---|---|
| Cong nghe Tim kiem Ngu nghia | Mot so tai lieu cu ghi su dung "Elasticsearch" hoac "Vector DB ben ngoai nhu Pinecone/Milvus" | He thong su dung mo hinh nhung ONNX `multilingual-e5-small` chay cuc bo trong Java va luu vector truc tiep vao bang `document_semantic_chunks` cua PostgreSQL | Giu nguyen giai phap hien tai vi giup he thong nhe, tu dong trien khai duoc ma khong phu thuoc ha tang ben ngoai phuc tap. Can cap nhat lai noi dung trong bao cao Word |
| Trung tam cong viec (Task Center) | Tai lieu cu ghi Task Center chi suy xuat tu dong tu Review va Disposition, khong co tao viec thu cong | Thuc te tu commit `8cb55b2` va `acba7f7`, he thong da hoan thien phan he Cong viec thu cong (Manual Tasks 2.0) voi bang `manual_tasks`, DND Kanban, Drawer trao doi va phan tich tai | Can bo sung day du phan he Task Center 2.0 vao bao cao vi day la mot diem cong nghiep vu rat lon |
| Kiem thu Phase 14 Test 357 | Test 357 bi loi Assert do whitelist `actionKey` | Khi nang cap Task Center 2.0, he thong bo sung them `actionKey = OPEN_TASK_CENTER` nhung file test cu chua cap nhat danh sach nay | Day la loi cua file test cu khong theo kip tinh nang moi, he thong thuc te van hoat dong hoan toan chinh xac |
| Kiem thu Phase 16 Test 417 | Test 417 so sanh chuoi serial chung chi so bi sai lech | File test hardcode chuoi serial cu `1790137027180`, trong khi KeyStore hien tai duoc sinh ra voi chuoi serial thuc te `1795156230200` | Can dieu chinh file test de doc dong tu KeyStore thay vi so sanh voi chuoi co dinh |
| Thu vien Python kiem thu | Tai lieu huong dan chay tat ca file kiem thu bang python truc tiep | Mot so file nhu `test_regression.py` can thu vien `Pillow`, `websocket-client` | Can ghi ro trong huong dan kiem thu rang can moi truong python co cai dat cac goi tren hoac chay trong container kiem thu |

---

## PHAN 7: DE XUAT HOAN THIEN VA LO TRINH XU LY (PRIORITY ROADMAP)

### Muc do P0 (Uu tien toi cao - Bao ve an toan he thong)
* Khong co loi P0 nghiem trong ve mat bao mat hoac mat mat du lieu trong ma nguon hien tai. Toan bo cac co che chan quyen RBAC, Anti-leak VDR va Legal Hold deu hoat dong fail-closed mot cach nghiem ngat.

### Muc do P1 (Nghiep vu quan trong can chuan hoa truoc khi bao ve)
* P1-1: Chuan hoa phien ban bao cao Word va Slide HUFLIT: Cap nhat chinh xac 41 nghiep vu thuc te, dua 2 phan he moi la Document Investigation va Virtual Data Room cung Task Center 2.0 vao phan dong gop moi cua do an.
* P1-2: Ky so tren bien ban giam dinh Manifest: Tich hop `SignatureService` de tu dong ky so RSA len tep JSON Manifest xuat ra tu ho so dieu tra.

### Muc do P2 (Giao dien va trai nghiem nguoi dung)
* P2-1: Tich hop tinh nang tai file PDF co watermark truc tiep tu giao dien VDR cho cac thanh vien duoc phep (ROOM_OWNER / thanh vien co co canDownload=true).
* P2-2: Bo sung bo loc loc ho so dieu tra theo khoang thoi gian mo vu an tren giao dien InvestigationPage.

### Muc do P3 (Toi uu hoa va mo rong)
* P3-1: Bo sung co che tu dong dong phong VDR khi den ngay het han (`expires_at`) bang mot Scheduled Task dinh ky trong Spring Boot.
* P3-2: Hoan thien bo kich ban kiem thu tu dong doc lap cho chuc nang luu bo loc tim kiem `SavedSearchService`.

---
*Bao cao duoc lap boi Senior Software Architect & Technical Auditor - Du an EDMS HUFLIT.*
