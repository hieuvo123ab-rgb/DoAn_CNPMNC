# FINAL LAB 1 DOCUMENTATION CORRECTION REPORT

---

## A. Story Point Mismatches Found

Sau khi đối chiếu trực tiếp giữa các tài liệu kiểm toán trước đó và file Product Backlog chính thức của Lab 1 (**`Lab1_EDMS_2SV_CuonChieu_60-40.xlsx`** tại `F:\cnpm_nc\Lab1_CNPMNC.xlsx`), các điểm sai lệch (mismatch) về Story Point được phát hiện và xử lý như sau:

| Story ID | Story Name | Điểm Cũ Trong Docs | Điểm Chính Thức (Workbook) | Trạng Thái Sai Lệch | Nguyên Nhân Cũ |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **US-01** | Login | 3 SP | **2 SP** | **ĐÃ SỬA** | Documentation cũ nhầm với độ khó JWT |
| **US-06** | Select Result Display Fields | 2 SP | **3 SP** | **ĐÃ SỬA** | Documentation cũ hạ điểm xuống 2 |
| **US-08** | View Document Details / Preview | 5 SP | **3 SP** | **ĐÃ SỬA** | Documentation cũ tăng điểm do preview đa định dạng |
| **US-09** | Download Document | 3 SP | **2 SP** | **ĐÃ SỬA** | Documentation cũ nhầm sang 3 SP |
| **US-12** | Enter / Update Document Metadata | 2 SP | **3 SP** | **ĐÃ SỬA** | Documentation cũ hạ xuống 2 SP |
| **US-15** | View Managed Documents | 3 SP | **2 SP** | **ĐÃ SỬA** | Documentation cũ nhầm sang 3 SP |
| **US-21** | View User List | 3 SP | **2 SP** | **ĐÃ SỬA** | Documentation cũ nhầm sang 3 SP |
| **US-24** | Enable / Disable User | 3 SP | **2 SP** | **ĐÃ SỬA** | Documentation cũ nhầm sang 3 SP |
| **US-26** | Manage Roles and Permissions | 3 SP | **5 SP** | **ĐÃ SỬA** | Documentation cũ hạ xuống 3 SP |

> **Khẳng định**: Các giá trị Story Point trên đây đã được khôi phục 100% về nguyên bản theo workbook chính thức, không suy luận lại từ độ khó mã nguồn.

---

## B. Corrected Story Point Table (26 User Stories)

| Story ID | Story Name | Official SP | Sprint | Assignee (Workbook) | Implementation Evidence | API / UI Evidence | Test Evidence | Final Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: | :---: |
| **US-01** | Login | **2 SP** | Sprint 1 | Tạ Gia Tín | [AuthService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java)<br>[JwtTokenProvider.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtTokenProvider.java) | `POST /api/auth/login`<br>[LoginPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/LoginPage.tsx) | TEST 1, TEST 2, TEST 31 | **DONE** |
| **US-02** | Logout | **1 SP** | Sprint 1 | Tạ Gia Tín | [AuthService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java)<br>[AuthController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AuthController.java) | `POST /api/auth/logout`<br>[Navbar.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/Navbar.tsx) | TEST 8 | **DONE** |
| **US-03** | View Document List | **3 SP** | Sprint 1 | Võ Trọng Hiếu | [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java)<br>[DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `GET /api/documents?q=...`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 5 | **DONE** |
| **US-04** | Search Documents | **5 SP** | Sprint 2 | Võ Trọng Hiếu | [DocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DocumentRepository.java)<br>`searchDocuments(query, ...)` | `GET /api/documents?q={query}`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 15, TEST 16 | **DONE** |
| **US-05** | Filter Search Results | **3 SP** | Sprint 2 | Võ Trọng Hiếu | [DocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DocumentRepository.java)<br>`findByDocumentType()` | `GET /api/documents?documentType=...`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 17, TEST 18 | **DONE** |
| **US-06** | Select Result Display Fields | **3 SP** | Sprint 2 | Tạ Gia Tín | Dynamic column state (`visibleColumns`), localStorage persistence | [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) (Column toggle) | UI Verified | **DONE** |
| **US-07** | Save and Reuse Search Conditions | **3 SP** | Sprint 3 | Võ Trọng Hiếu | [SavedSearchService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SavedSearchService.java)<br>[SavedSearchController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/SavedSearchController.java) | `GET`/`POST /api/saved-searches`<br>[SaveSearchModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/SaveSearchModal.tsx) | TEST 23, 24, 25, 26 | **DONE** |
| **US-08** | View Document Details / Preview | **3 SP** | Sprint 2 | Tạ Gia Tín | [FileStorageService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/FileStorageService.java)<br>[DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java) | `GET /api/documents/{id}/preview`<br>[PreviewModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PreviewModal.tsx) | TEST 12, TEST 44 | **DONE — IMPLEMENTED AHEAD** |
| **US-09** | Download Document | **2 SP** | Sprint 2 | Võ Trọng Hiếu | [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java)<br>`downloadDocument()` | `GET /api/documents/{id}/download`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 11, TEST 45 | **DONE — IMPLEMENTED AHEAD** |
| **US-10** | Upload Document | **5 SP** | Sprint 1 | Võ Trọng Hiếu | [FileStorageService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/FileStorageService.java)<br>[DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java) | `POST /api/documents` (multipart)<br>[UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | TEST 4, TEST 43 | **DONE** |
| **US-11** | Create Document Record | **3 SP** | Sprint 1 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>[Document.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/Document.java) | `POST /api/documents`<br>[UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | TEST 4, TEST 7 | **DONE** |
| **US-12** | Enter / Update Document Metadata | **3 SP** | Sprint 1 | Võ Trọng Hiếu | [DocumentMetadataRequest.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/dto/DocumentMetadataRequest.java)<br>Jakarta Validation | `POST /api/documents` (metadata)<br>[UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | TEST 4, TEST 13 | **DONE** |
| **US-13** | Update Document Information | **3 SP** | Sprint 2 | Võ Trọng Hiếu | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`updateDocument()` with owner check | `PUT /api/documents/{id}`<br>[EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | TEST 19, 20, 21, 46 | **DONE** |
| **US-14** | Classify Document | **3 SP** | Sprint 2 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`documentType` classification | `PUT /api/documents/{id}`<br>[EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | TEST 22 | **DONE** |
| **US-15** | View Managed Documents | **2 SP** | Sprint 1 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`getMyDocuments()` | `GET /api/documents/mine?q=...`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 10 | **DONE** |
| **US-16** | View Dashboard | **5 SP** | Sprint 4 | Võ Trọng Hiếu | [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java)<br>[AdminMonitoringController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminMonitoringController.java) | `GET /api/admin/dashboard`<br>[DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 41, TEST 42, TEST 55 | **DONE** |
| **US-17** | View Document Statistics | **3 SP** | Sprint 4 | Tạ Gia Tín | [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java)<br>[DocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DocumentRepository.java) | `GET /api/admin/statistics/documents`<br>[DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 52, TEST 53 | **DONE** |
| **US-18** | View Usage Statistics | **3 SP** | Sprint 4 | Võ Trọng Hiếu | [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java)<br>[AuditLogRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/AuditLogRepository.java) | `GET /api/admin/statistics/usage`<br>[DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 54 | **DONE** |
| **US-19** | View Activity History | **3 SP** | Sprint 4 | Tạ Gia Tín | [AuditService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuditService.java)<br>[AdminMonitoringController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminMonitoringController.java) | `GET /api/admin/activity`<br>[AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx) | TEST 49 | **DONE** |
| **US-20** | View Audit Log | **3 SP** | Sprint 4 | Võ Trọng Hiếu | [AuditService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuditService.java)<br>[AuditLogRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/AuditLogRepository.java) | `GET /api/admin/audit-logs`<br>[AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx) | TEST 50, TEST 51, TEST 56 | **DONE** |
| **US-21** | View User List | **2 SP** | Sprint 3 | Võ Trọng Hiếu | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>[AdminUserController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminUserController.java) | `GET /api/admin/users`<br>[UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 27, TEST 28 | **DONE** |
| **US-22** | Create User | **3 SP** | Sprint 3 | Tạ Gia Tín | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>BCryptPasswordEncoder + Conflict validation | `POST /api/admin/users`<br>[CreateUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/CreateUserModal.tsx) | TEST 29, 30, 31, 47 | **DONE** |
| **US-23** | Update User | **3 SP** | Sprint 3 | Tạ Gia Tín | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>`updateUser()` | `PUT /api/admin/users/{id}`<br>[EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | TEST 32 | **DONE** |
| **US-24** | Enable / Disable User | **2 SP** | Sprint 3 | Võ Trọng Hiếu | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>[JwtAuthenticationFilter.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtAuthenticationFilter.java) | `PATCH /api/admin/users/{id}/status`<br>[UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 33, 34, 35, 39, 48 | **DONE** |
| **US-25** | Assign Role to User | **3 SP** | Sprint 3 | Tạ Gia Tín | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>Role validation + Last Admin guard | `PUT /api/admin/users/{id}`<br>[EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | TEST 32, 36, 37, 39, 48 | **DONE** |
| **US-26** | Manage Roles and Permissions | **5 SP** | Sprint 3 | Võ Trọng Hiếu | [AdminUserController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminUserController.java)<br>[SecurityConfig.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/SecurityConfig.java) | `GET /api/admin/roles/permissions`<br>[UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) (Matrix tab) | TEST 38, TEST 57 | **DONE** |

### Extensions (0 Story Points):
1. **Print Metadata**: [PrintMetadataModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PrintMetadataModal.tsx) (Extension).
2. **Delete Saved Search**: `DELETE /api/saved-searches/{id}` (Extension).

---

## C. Corrected Member Allocation

Được trích xuất và đối chiếu trực tiếp từ cột **Name Of Dev** và **Points** trong sheet `Sprint backlog` (xl/worksheets/sheet4.xml) của workbook chính thức:

| Sprint | Planned Focus | Sprint Points | Võ Trọng Hiếu | Tạ Gia Tín |
| :---: | :--- | :---: | :---: | :---: |
| **Sprint 1** | Usable Core: Access & Basic Document Flow | **19 SP** | **11 SP** (US-10=5, US-12=3, US-03=3) | **8 SP** (US-01=2, US-02=1, US-11=3, US-15=2) |
| **Sprint 2** | Search, Retrieval & Document Maintenance | **22 SP** | **13 SP** (US-04=5, US-05=3, US-09=2, US-13=3) | **9 SP** (US-06=3, US-08=3, US-14=3) |
| **Sprint 3** | Saved Search & Access Administration | **21 SP** | **12 SP** (US-07=3, US-21=2, US-24=2, US-26=5) | **9 SP** (US-22=3, US-23=3, US-25=3) |
| **Sprint 4** | Monitoring, Statistics & Audit | **17 SP** | **11 SP** (US-16=5, US-18=3, US-20=3) | **6 SP** (US-17=3, US-19=3) |
| **TOTAL** | **Toàn bộ 4 Sprint** | **79 SP** | **47 SP (59.49% ~ 60%)** | **32 SP (40.51% ~ 40%)** |

> **Khẳng định**: Phân bổ chính thức là **Hiếu = 47 SP** và **Tín = 32 SP**. Documentation cũ trước đây ghi nhầm 48 SP / 31 SP (do tính sai phân bổ US-26/US-21 trong Sprint 3) nay đã được hiệu chỉnh 100% khớp với bảng phân công của workbook.

---

## D. API Mismatches Found & Corrected

Kiểm tra trực tiếp mã nguồn Backend tại [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java) và Frontend tại [documentApi.ts](file:///f:/DoAn_CNPMNC/frontend/src/services/documentApi.ts):

1. **Parameter tìm kiếm tài liệu**:
   - Khai báo tại dòng 27 và 42 của `DocumentController.java`:
     ```java
     @GetMapping
     public ResponseEntity<List<DocumentResponse>> getAllDocuments(
             @RequestParam(value = "q", required = false) String query,
             @RequestParam(value = "documentType", required = false) String documentType)
     ```
   - **Xác nhận**: Tên query parameter chính xác là **`q`** (không phải `query`).
   - **Hiệu chỉnh**: Đã sửa trong [01_FULL_BACKLOG_TRACEABILITY.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/01_FULL_BACKLOG_TRACEABILITY.md), [02_API_INVENTORY.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/02_API_INVENTORY.md), và [10_FINAL_LAB1_REPORT.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/10_FINAL_LAB1_REPORT.md) thành `GET /api/documents?q=...` và `GET /api/documents/mine?q=...`.
2. **DTO lưu bộ lọc tìm kiếm**:
   - [SavedSearchRequest.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/dto/SavedSearchRequest.java) có trường payload JSON: `name`, `query`, `documentType`. Được ghi chú chính xác trong `02_API_INVENTORY.md`.

---

## E. Filename Evidence Corrections

Đối chiếu toàn bộ file nguồn giao diện Frontend thực tế trong thư mục `frontend/src/`:

| File Được Cite Trước Đây | Tình Trạng Thực Tế Trong Repository | Hiệu Chỉnh Trong Documentation |
| :--- | :--- | :--- |
| `SearchBar.tsx` | **Không tồn tại** | Đã chuyển cite sang [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) (Thanh tìm kiếm được tích hợp trực tiếp) |
| `FilterBar.tsx` | **Không tồn tại** | Đã chuyển cite sang [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) (Thanh dropdown lọc thể loại được tích hợp trực tiếp) |
| `ColumnSelectorModal.tsx` | **Không tồn tại** | Đã chuyển cite sang [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) (Nút toggle bật/tắt cột hiển thị trực tiếp trên header bảng) |
| `EditDocumentModal.tsx` | **Không tồn tại** | Đã chuyển cite chính xác sang [EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) (Component modal chỉnh sửa tài liệu và phân loại) |

**Danh sách toàn bộ các modal và page Frontend thật đã được kiểm tra khớp 100%**:
- [EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx)
- [UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx)
- [PreviewModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PreviewModal.tsx)
- [SaveSearchModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/SaveSearchModal.tsx)
- [PrintMetadataModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PrintMetadataModal.tsx)
- [CreateUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/CreateUserModal.tsx)
- [EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx)
- [Navbar.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/Navbar.tsx)
- [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx)
- [UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx)
- [DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx)
- [AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx)
- [LoginPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/LoginPage.tsx)

---

## F. Final Database Snapshot (Unified & Immutable)

Được truy vấn trực tiếp từ cơ sở dữ liệu PostgreSQL (`edms_db`) đang chạy qua container `edms-postgres` và volume lưu trữ `/app/storage/uploads`:

- **Snapshot Timestamp**: `2026-09-18T22:15:36Z` (Giờ địa phương: `2026-09-19T05:15:36+07:00`)
- **Total Users**: **21** tài khoản
  - Seed / Core accounts: **2** (`hieu` - ADMIN, `tin` - STAFF)
  - Test-Generated accounts: **19** (sinh ra trong quá trình kiểm thử hồi quy)
- **Total Documents**: **49** hồ sơ tài liệu
  - Seed / Demo documents: **22** (ID 1 – 22)
  - Test-Generated documents: **27** (ID 23 – 49)
- **Total Physical Files**: **49** tệp tin vật lý
  - Lưu trữ tại `/app/storage/uploads`, liên kết 1:1 với 49 bản ghi trong bảng `documents`
  - Tổng dung lượng lưu trữ: **2,458 bytes**
- **Total Saved Searches**: **2** bộ lọc tìm kiếm
  - Tạo bởi người dùng `hieu` trong kiểm thử Sprint 3
- **Total Audit Logs**: **247** bản ghi kiểm toán
  - Phản ánh toàn bộ hoạt động kiểm thử và vận hành thực tế (được giữ nguyên để tính toán Dashboard US-16 và Usage Statistics US-18)
- **Document Breakdown by Type**:
  - `Báo cáo`: 21
  - `Công văn`: 18
  - `Hợp đồng`: 9
  - `Quyết định`: 1
  - Tổng: 49 tài liệu

---

## G. Evidence Files Updated

Toàn bộ các file trong thư mục `docs/final-evidence/` đã được kiểm tra và đồng bộ hóa:

1. [01_FULL_BACKLOG_TRACEABILITY.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/01_FULL_BACKLOG_TRACEABILITY.md): Cập nhật Story Points chính thức (US-01=2, US-06=3, US-08=3, US-09=2, US-12=3, US-15=2, US-21=2, US-24=2, US-26=5), phân bổ 47/32, parameter `q`, file `EditModal.tsx` và `DocumentsPage.tsx`.
2. [02_API_INVENTORY.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/02_API_INVENTORY.md): Cập nhật tham số tìm kiếm tài liệu từ `query` sang `q`.
3. [03_DATABASE_SCHEMA_SUMMARY.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/03_DATABASE_SCHEMA_SUMMARY.md): Đồng bộ số lượng bản ghi `audit_logs` lên 247 theo snapshot.
4. [04_REGRESSION_TEST_REPORT.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/04_REGRESSION_TEST_REPORT.md): Giữ nguyên log kiểm thử 57/57 PASS của test suite.
5. [05_BUILD_AND_DOCKER_REPORT.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/05_BUILD_AND_DOCKER_REPORT.md): Giữ nguyên trạng thái Docker fleet UP & HEALTHY.
6. [06_PERSISTENCE_REPORT.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/06_PERSISTENCE_REPORT.md): Đồng bộ số lượng audit logs sau restart lên 247 bản ghi.
7. [07_SECURITY_CHECK.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/07_SECURITY_CHECK.md): Xác nhận tiêu chuẩn an ninh và RBAC.
8. [08_TEST_DATA_INVENTORY.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/08_TEST_DATA_INVENTORY.md): Viết lại toàn diện bảng kiểm kê dữ liệu kiểm thử theo snapshot thống nhất (21 users, 49 docs, 49 files, 2 saved searches, 247 audit logs).
9. [09_DEMO_SCRIPT.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/09_DEMO_SCRIPT.md): Đồng bộ kịch bản demo và các component liên quan.
10. [10_FINAL_LAB1_REPORT.md](file:///f:/DoAn_CNPMNC/docs/final-evidence/10_FINAL_LAB1_REPORT.md): Tích hợp bảng ma trận 26 User Stories đầy đủ, phân bổ thành viên 47/32, snapshot thống nhất, và verdict cuối cùng.

---

## H. Consistency Checks

Tất cả các điều kiện kiểm tra tính nhất quán toán học và logic đều thỏa mãn:

1. **Tổng điểm 26 User Stories**:
   $$\sum_{i=1}^{26} \text{SP}_i = 2+1+3+5+3+3+3+3+2+5+3+3+3+3+2+5+3+3+3+3+2+3+3+2+3+5 = \mathbf{79\text{ SP}}$$
2. **Tổng điểm từng Sprint**:
   $$\text{Sprint 1} (19) + \text{Sprint 2} (22) + \text{Sprint 3} (21) + \text{Sprint 4} (17) = \mathbf{79\text{ SP}}$$
3. **Phân bổ thành viên theo Workbook**:
   $$\text{Võ Trọng Hiếu} (47\text{ SP}) + \text{Tạ Gia Tín} (32\text{ SP}) = \mathbf{79\text{ SP}}$$
4. **Kiểm tra User Stories**:
   - Đúng **26 User Stories** duy nhất (US-01 đến US-26).
   - Không có Story ID trùng lặp, không có Story ID bị thiếu.
5. **Số liệu dữ liệu thực tế đồng nhất**:
   - `users`: 21
   - `documents`: 49
   - `physical files`: 49
   - `saved searches`: 2
   - `audit logs`: 247
6. **Không thay đổi mã nguồn**:
   - Không tạo feature mới.
   - Không sửa source code backend/frontend.
   - Không xóa dữ liệu hoặc reset container/volume.

---

## I. Final Verdict

**LAB1_EDMS_DOCUMENTATION_ALIGNED**
