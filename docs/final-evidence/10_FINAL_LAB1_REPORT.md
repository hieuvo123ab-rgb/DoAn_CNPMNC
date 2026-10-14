# 10 — FINAL LAB 1 CLOSURE AUDIT REPORT

**Project Name**: Electronic Document Management System (EDMS)  
**Course**: Công nghệ Phần mềm Nâng cao (Advanced Software Engineering) — Lab 1  
**Development Method**: Incremental Development (Code cuốn chiếu / Small Vertical Slices)  
**Authoritative Product Backlog Source**: `Lab1_EDMS_2SV_CuonChieu_60-40.xlsx` (`F:\cnpm_nc\Lab1_CNPMNC.xlsx`)  
**Team Members & Official Allocation**:
- **Võ Trọng Hiếu** (Lead Developer / Software Architect) — **47 Story Points** (59.5% ~ 60%)
- **Tạ Gia Tín** (Fullstack Developer / QA & Test Specialist) — **32 Story Points** (40.5% ~ 40%)

---

## 1. Executive Summary

Hệ thống Quản lý Tài liệu Điện tử (EDMS) đã hoàn thành toàn diện 100% mục tiêu của Product Backlog trong Lab 1. Quá trình phát triển được thực hiện nghiêm ngặt theo phương pháp Agile Scrum và kỹ thuật Code cuốn chiếu (Incremental Vertical Slices):
- **Không rewrite** bất kỳ module nào đã chạy.
- **Không reset database** hoặc xóa volume Docker (`edms_pgdata`, `edms_storage_data`).
- **Không làm gián đoạn** các chức năng từ Sprint 1 đến Sprint 3 khi phát triển Sprint 4.
- Toàn bộ 26 User Stories với tổng cộng 79 Story Points đã được nghiệm thu thành công và khớp chính xác 100% với workbook Product Backlog chính thức.

---

## 2. Sprint-by-Sprint & Member Allocation Summary

| Sprint | Focus Area | Planned Scope | Official SP | Member Allocation (Workbook) | Status |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **Sprint 1** | Authentication, Ingestion & Document Repository | US-01, US-02, US-03, US-10, US-11, US-12, US-15 | **19 SP** | Võ Trọng Hiếu: 11 SP<br>Tạ Gia Tín: 8 SP | **PASS** |
| **Sprint 2** | Discovery, Retrieval & Classification | US-04, US-05, US-06, US-08, US-09, US-13, US-14<br>*(Extension: Print Metadata — 0 SP)* | **22 SP** | Võ Trọng Hiếu: 13 SP<br>Tạ Gia Tín: 9 SP | **PASS** |
| **Sprint 3** | Saved Search & Access Administration | US-07, US-21, US-22, US-23, US-24, US-25, US-26<br>*(Extension: Delete Saved Search — 0 SP)* | **21 SP** | Võ Trọng Hiếu: 12 SP<br>Tạ Gia Tín: 9 SP | **PASS** |
| **Sprint 4** | Monitoring, Statistics & Audit | US-16, US-17, US-18, US-19, US-20 | **17 SP** | Võ Trọng Hiếu: 11 SP<br>Tạ Gia Tín: 6 SP | **PASS** |
| **TOTAL** | **Full Product Backlog** | **26 User Stories** | **79 SP** | **Hiếu: 47 SP \| Tín: 32 SP** | **100% ALIGNED** |

---

## 3. Authoritative 26 User Story Traceability Matrix

| Story ID | Story Name | Official SP | Sprint | Assignee | Key Code / API Artifacts | Test Evidence | Final Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: | :---: |
| **US-01** | Login | **2 SP** | Sprint 1 | Tạ Gia Tín | `POST /api/auth/login`, [AuthService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | TEST 1, TEST 2 | **DONE** |
| **US-02** | Logout | **1 SP** | Sprint 1 | Tạ Gia Tín | `POST /api/auth/logout`, [AuthService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | TEST 8 | **DONE** |
| **US-03** | View Document List | **3 SP** | Sprint 1 | Võ Trọng Hiếu | `GET /api/documents?q=...`, [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 5 | **DONE** |
| **US-04** | Search Documents | **5 SP** | Sprint 2 | Võ Trọng Hiếu | `GET /api/documents?q={query}`, [DocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DocumentRepository.java) | TEST 15, TEST 16 | **DONE** |
| **US-05** | Filter Search Results | **3 SP** | Sprint 2 | Võ Trọng Hiếu | `GET /api/documents?documentType=...`, [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 17, TEST 18 | **DONE** |
| **US-06** | Select Result Display Fields | **3 SP** | Sprint 2 | Tạ Gia Tín | Column display state toggle, [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | UI Verified | **DONE** |
| **US-07** | Save and Reuse Search Conditions | **3 SP** | Sprint 3 | Võ Trọng Hiếu | `GET`/`POST /api/saved-searches`, [SaveSearchModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/SaveSearchModal.tsx) | TEST 23–26 | **DONE** |
| **US-08** | View Document Details / Preview | **3 SP** | Sprint 2 | Tạ Gia Tín | `GET /api/documents/{id}/preview`, [PreviewModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PreviewModal.tsx) | TEST 12, TEST 44 | **DONE — IMPLEMENTED AHEAD** |
| **US-09** | Download Document | **2 SP** | Sprint 2 | Võ Trọng Hiếu | `GET /api/documents/{id}/download`, [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java) | TEST 11, TEST 45 | **DONE — IMPLEMENTED AHEAD** |
| **US-10** | Upload Document | **5 SP** | Sprint 1 | Võ Trọng Hiếu | `POST /api/documents` (multipart), [UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | TEST 4, TEST 43 | **DONE** |
| **US-11** | Create Document Record | **3 SP** | Sprint 1 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java), [Document.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/Document.java) | TEST 4, TEST 7 | **DONE** |
| **US-12** | Enter / Update Document Metadata | **3 SP** | Sprint 1 | Võ Trọng Hiếu | `title`, `description`, `documentType` validation, [DocumentMetadataRequest.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/dto/DocumentMetadataRequest.java) | TEST 4, TEST 13 | **DONE** |
| **US-13** | Update Document Information | **3 SP** | Sprint 2 | Võ Trọng Hiếu | `PUT /api/documents/{id}`, [EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | TEST 19, TEST 20, TEST 21, TEST 46 | **DONE** |
| **US-14** | Classify Document | **3 SP** | Sprint 2 | Tạ Gia Tín | `PUT /api/documents/{id}` (`documentType`), [EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | TEST 22 | **DONE** |
| **US-15** | View Managed Documents | **2 SP** | Sprint 1 | Tạ Gia Tín | `GET /api/documents/mine`, [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 10 | **DONE** |
| **US-16** | View Dashboard | **5 SP** | Sprint 4 | Võ Trọng Hiếu | `GET /api/admin/dashboard`, [DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 41, TEST 42, TEST 55 | **DONE** |
| **US-17** | View Document Statistics | **3 SP** | Sprint 4 | Tạ Gia Tín | `GET /api/admin/statistics/documents`, [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java) | TEST 52, TEST 53 | **DONE** |
| **US-18** | View Usage Statistics | **3 SP** | Sprint 4 | Võ Trọng Hiếu | `GET /api/admin/statistics/usage`, [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java) | TEST 54 | **DONE** |
| **US-19** | View Activity History | **3 SP** | Sprint 4 | Tạ Gia Tín | `GET /api/admin/activity`, [AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx) | TEST 49 | **DONE** |
| **US-20** | View Audit Log | **3 SP** | Sprint 4 | Võ Trọng Hiếu | `GET /api/admin/audit-logs`, [AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx) | TEST 50, TEST 51, TEST 56 | **DONE** |
| **US-21** | View User List | **2 SP** | Sprint 3 | Võ Trọng Hiếu | `GET /api/admin/users`, [UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 27, TEST 28 | **DONE** |
| **US-22** | Create User | **3 SP** | Sprint 3 | Tạ Gia Tín | `POST /api/admin/users`, [CreateUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/CreateUserModal.tsx) | TEST 29, TEST 30, TEST 31, TEST 47 | **DONE** |
| **US-23** | Update User | **3 SP** | Sprint 3 | Tạ Gia Tín | `PUT /api/admin/users/{id}`, [EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | TEST 32 | **DONE** |
| **US-24** | Enable / Disable User | **2 SP** | Sprint 3 | Võ Trọng Hiếu | `PATCH /api/admin/users/{id}/status`, [UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 33, TEST 34, TEST 35, TEST 39, TEST 48 | **DONE** |
| **US-25** | Assign Role to User | **3 SP** | Sprint 3 | Tạ Gia Tín | `PUT /api/admin/users/{id}` (role change), [EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | TEST 32, TEST 36, TEST 37, TEST 39, TEST 48 | **DONE** |
| **US-26** | Manage Roles and Permissions | **5 SP** | Sprint 3 | Võ Trọng Hiếu | `GET /api/admin/roles/permissions`, [UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 38, TEST 57 | **DONE** |

### Project Extensions (0 Additional Story Points)
1. **Print Metadata** (Extension): Triển khai qua [PrintMetadataModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PrintMetadataModal.tsx) cho phép in phiếu siêu dữ liệu tài liệu.
2. **Delete Saved Search** (Extension): Triển khai qua API `DELETE /api/saved-searches/{id}` cho phép người dùng xóa bộ lọc tìm kiếm đã lưu.

---

## 4. Technical Audit & Verification Results

### 4.1 Automated Regression Testing
- **Test Suite**: [test_regression.py](file:///f:/DoAn_CNPMNC/test_regression.py)
- **Total Tests Executed**: 57 test cases
- **Passed**: **57 / 57 (100% PASS)**
- **Skipped / Failed**: 0
- **Regression Guarantee**: Toàn bộ các luồng chức năng của Sprint 1, 2, 3 và 4 giữ nguyên 100% tính đúng đắn.

### 4.2 Build & Packaging
- **Backend Build**: `mvn clean package -DskipTests` -> **BUILD SUCCESS** in 10.99s. Artifact `edms-backend-1.0.0-SNAPSHOT.jar`.
- **Frontend Production Build**: `npm run build` (`tsc && vite build`) -> **Exit code 0** in 2.41s. 0 TypeScript diagnostics errors.
- **Docker Compose**: `docker compose build` -> **Exit code 0**. Cả 2 image backend và frontend build thành công.

### 4.3 Container Status & Service Health
- `edms-postgres`: PostgreSQL 16 Alpine, port 5432, status `Up (healthy)`.
- `edms-backend`: Spring Boot 3.3.3, port 8080, status `Up`. Health endpoint `/api/health` -> `HTTP 200 UP`.
- `edms-frontend`: Node 20 / Vite, port 5173, status `Up`. HTTP response `HTTP 200 OK`.

### 4.4 Data Persistence & Unified Database Snapshot
- Đã thực hiện kiểm tra khởi động lại stack (`docker compose restart`).
- **Unified Snapshot Timestamp**: `2026-09-18T22:15:36Z` (Local: `2026-09-19T05:15:36+07:00`)
- **Dữ liệu thực tế được xác minh trong CSDL PostgreSQL và Storage Volume**:
  - **Users**: **21 tài khoản** (2 tài khoản cốt lõi `hieu`, `tin` + 19 tài khoản kiểm thử).
  - **Documents**: **49 hồ sơ tài liệu** (22 tài liệu mẫu seed ban đầu + 27 tài liệu kiểm thử).
  - **Physical Files**: **49 tệp vật lý** lưu trữ tại `/app/storage/uploads` tương ứng 1:1 với 49 bản ghi.
  - **Saved Searches**: **2 bộ lọc tìm kiếm đã lưu** (cô lập an toàn theo user `hieu`).
  - **Audit Logs**: **247 bản ghi kiểm toán** ghi nhận toàn bộ hoạt động thực tế.
- Bộ smoke test độc lập và 57 bài test hồi quy chạy lại sau restart đều đạt kết quả 100% PASS.

### 4.5 Security & Data Sanitization
- Phân quyền RBAC nghiêm ngặt: Mọi endpoint `/api/admin/**` đều yêu cầu quyền `ROLE_ADMIN`. Nhân viên (`ROLE_STAFF`) cố ý truy cập đều bị từ chối chính xác với mã **HTTP 403 Forbidden**.
- Mật khẩu lưu trữ trong PostgreSQL được mã hóa một chiều an toàn chuẩn BCrypt (bắt đầu bằng `$2a$`).
- Tuyệt đối không để lộ mật khẩu, password hash, hay JWT token trong bất kỳ API response nào.
- Nhật ký kiểm toán tự động (Audit Log) không lưu mật khẩu, không lưu JWT, và không lưu file binary.

---

## 5. Final Audit Checklist

- [x] 26 / 26 User Stories hoàn thành (US-01 đến US-26).
- [x] 79 / 79 Story Points được nghiệm thu đầy đủ, khớp 100% workbook `Lab1_EDMS_2SV_CuonChieu_60-40.xlsx`.
- [x] Phân bổ thành viên chính xác: Võ Trọng Hiếu = 47 SP, Tạ Gia Tín = 32 SP.
- [x] Tổng điểm từng Sprint chính xác: S1=19, S2=22, S3=21, S4=17.
- [x] 2 Project Extensions hoạt động ổn định (Print Metadata, Delete Saved Search) với 0 SP cộng thêm.
- [x] Bộ test hồi quy 57/57 test cases PASS 100%.
- [x] Backend build PASS, Frontend build PASS, Docker stack UP & HEALTHY.
- [x] Dữ liệu CSDL và tệp vật lý bền vững qua restart.
- [x] Trọn bộ tài liệu bằng chứng nghiệm thu (Evidence Package) được đồng bộ nhất quán tại `docs/final-evidence/`.

---

## 6. Final Verdict

**LAB1_EDMS_DOCUMENTATION_ALIGNED**
