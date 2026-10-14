# 01 — FULL BACKLOG TRACEABILITY MATRIX

**Project**: Electronic Document Management System (EDMS)  
**Lab Assignment**: Lab 1 — Software Engineering & Process Management  
**Authoritative Source of Truth**: `Lab1_EDMS_2SV_CuonChieu_60-40.xlsx` (`Lab1_CNPMNC.xlsx`)  
**Team Members & Official Allocation**:
- **Võ Trọng Hiếu** (Team Lead / Developer) — **47 Story Points** (59.5% ~ 60%)
- **Tạ Gia Tín** (Developer) — **32 Story Points** (40.5% ~ 40%)

**Total Planned Scope**: 26 User Stories | 79 Story Points | 4 Sprints  

---

## 1. Traceability Table (US-01 → US-26)

| Story ID | Story Name (Theo Workbook) | Official Points | Sprint | Dev Assigned | Implementation Evidence | API / UI Evidence | Test Evidence | Final Status |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **US-01** | Login | 2 SP | Sprint 1 | Tạ Gia Tín | [AuthService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java)<br>[JwtTokenProvider.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtTokenProvider.java) | `POST /api/auth/login`<br>[LoginPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/LoginPage.tsx) | TEST 1, TEST 2, TEST 31 | **DONE** |
| **US-02** | Logout | 1 SP | Sprint 1 | Tạ Gia Tín | [AuthController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AuthController.java)<br>[AuthContext.tsx](file:///f:/DoAn_CNPMNC/frontend/src/context/AuthContext.tsx) | `POST /api/auth/logout`<br>[Navbar.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/Navbar.tsx) | TEST 8, TEST 9 | **DONE** |
| **US-03** | View Document List | 3 SP | Sprint 1 | Võ Trọng Hiếu | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>[DocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DocumentRepository.java) | `GET /api/documents`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 5, TEST 6 | **DONE** |
| **US-04** | Search Documents | 5 SP | Sprint 2 | Võ Trọng Hiếu | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`buildSearchSpec()` | `GET /api/documents?q=...`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) (Search input) | TEST 15, TEST 16 | **DONE** |
| **US-05** | Filter Search Results | 3 SP | Sprint 2 | Võ Trọng Hiếu | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`Predicate` filtering by `documentType` | `GET /api/documents?documentType=...`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) (Filter dropdown) | TEST 17, TEST 18 | **DONE** |
| **US-06** | Select Result Display Fields | 3 SP | Sprint 2 | Tạ Gia Tín | [DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | Local state `visibleColumns` dropdown & dynamic `table th/td` toggle | Manual UI / Sprint 2 baseline | **DONE** |
| **US-07** | Save and Reuse Search Conditions | 3 SP | Sprint 3 | Võ Trọng Hiếu | [SavedSearchService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SavedSearchService.java)<br>[SavedSearchRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/SavedSearchRepository.java) | `POST /api/saved-searches`<br>`GET /api/saved-searches`<br>[SaveSearchModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/SaveSearchModal.tsx) | TEST 23, TEST 24, TEST 25, TEST 26 | **DONE** |
| **US-08** | View Document Details / Preview | 3 SP | Sprint 2 | Tạ Gia Tín | [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java)<br>[FileStorageService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/FileStorageService.java) | `GET /api/documents/{id}/preview`<br>[PreviewModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PreviewModal.tsx) | TEST 12, TEST 44 | **DONE — IMPLEMENTED AHEAD** |
| **US-09** | Download Document | 2 SP | Sprint 2 | Võ Trọng Hiếu | [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java)<br>`Content-Disposition: attachment` | `GET /api/documents/{id}/download`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | TEST 11, TEST 45 | **DONE — IMPLEMENTED AHEAD** |
| **US-10** | Upload Document | 5 SP | Sprint 1 | Võ Trọng Hiếu | [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java)<br>[FileStorageService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/FileStorageService.java) | `POST /api/documents` (multipart)<br>[UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | TEST 4, TEST 43 | **DONE** |
| **US-11** | Create Document Record | 3 SP | Sprint 1 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>[Document.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/Document.java) | `POST /api/documents`<br>Database persistence in PostgreSQL `documents` table | TEST 4, TEST 5 | **DONE** |
| **US-12** | Enter / Update Document Metadata | 3 SP | Sprint 1 | Võ Trọng Hiếu | [DocumentResponse.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/dto/DocumentResponse.java)<br>[DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java) | `GET /api/documents/{id}`<br>[UploadModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | TEST 13 | **DONE** |
| **US-13** | Update Document Information | 3 SP | Sprint 2 | Võ Trọng Hiếu | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`updateDocument()` with owner check | `PUT /api/documents/{id}`<br>[EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | TEST 19, TEST 20, TEST 21, TEST 46 | **DONE** |
| **US-14** | Classify Document | 3 SP | Sprint 2 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`documentType` classification | `PUT /api/documents/{id}`<br>[EditModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | TEST 22 | **DONE** |
| **US-15** | View Managed Documents | 2 SP | Sprint 1 | Tạ Gia Tín | [DocumentService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java)<br>`getMyDocuments()` | `GET /api/documents/mine`<br>[DocumentsPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) ("Của tôi" tab) | TEST 10 | **DONE** |
| **US-16** | View Dashboard | 5 SP | Sprint 4 | Võ Trọng Hiếu | [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java)<br>[AdminMonitoringController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminMonitoringController.java) | `GET /api/admin/dashboard`<br>[DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 41, TEST 42, TEST 55 | **DONE** |
| **US-17** | View Document Statistics | 3 SP | Sprint 4 | Tạ Gia Tín | [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java)<br>[DocumentRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/DocumentRepository.java) | `GET /api/admin/statistics/documents`<br>[DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 52, TEST 53 | **DONE** |
| **US-18** | View Usage Statistics | 3 SP | Sprint 4 | Võ Trọng Hiếu | [StatisticsService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java)<br>[AuditLogRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/AuditLogRepository.java) | `GET /api/admin/statistics/usage`<br>[DashboardPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | TEST 54 | **DONE** |
| **US-19** | View Activity History | 3 SP | Sprint 4 | Tạ Gia Tín | [AuditService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuditService.java)<br>[AdminMonitoringController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminMonitoringController.java) | `GET /api/admin/activity`<br>[AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx) | TEST 49 | **DONE** |
| **US-20** | View Audit Log | 3 SP | Sprint 4 | Võ Trọng Hiếu | [AuditService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuditService.java)<br>[AuditLogRepository.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/repository/AuditLogRepository.java) | `GET /api/admin/audit-logs`<br>[AuditLogPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/AuditLogPage.tsx) | TEST 50, TEST 51, TEST 56 | **DONE** |
| **US-21** | View User List | 2 SP | Sprint 3 | Võ Trọng Hiếu | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>[AdminUserController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminUserController.java) | `GET /api/admin/users`<br>[UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 27, TEST 28 | **DONE** |
| **US-22** | Create User | 3 SP | Sprint 3 | Tạ Gia Tín | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>BCryptPasswordEncoder + Conflict validation | `POST /api/admin/users`<br>[CreateUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/CreateUserModal.tsx) | TEST 29, TEST 30, TEST 31, TEST 47 | **DONE** |
| **US-23** | Update User | 3 SP | Sprint 3 | Tạ Gia Tín | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>`updateUser()` | `PUT /api/admin/users/{id}`<br>[EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | TEST 32 | **DONE** |
| **US-24** | Enable / Disable User | 2 SP | Sprint 3 | Võ Trọng Hiếu | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>[JwtAuthenticationFilter.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtAuthenticationFilter.java) | `PATCH /api/admin/users/{id}/status`<br>[UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | TEST 33, TEST 34, TEST 35, TEST 39, TEST 48 | **DONE** |
| **US-25** | Assign Role to User | 3 SP | Sprint 3 | Tạ Gia Tín | [AdminUserService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AdminUserService.java)<br>Role validation + Last Admin guard | `PUT /api/admin/users/{id}`<br>[EditUserModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | TEST 32, TEST 36, TEST 37, TEST 39, TEST 48 | **DONE** |
| **US-26** | Manage Roles and Permissions | 5 SP | Sprint 3 | Võ Trọng Hiếu | [AdminUserController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AdminUserController.java)<br>[SecurityConfig.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/SecurityConfig.java) | `GET /api/admin/roles/permissions`<br>[UsersPage.tsx](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) (Matrix tab) | TEST 38, TEST 57 | **DONE** |

---

## 2. Project Extensions (0 Additional Story Points)

| Extension Name | Implementation | Purpose & Benefit | Status |
| :--- | :--- | :--- | :---: |
| **Print Metadata** | [PrintMetadataModal.tsx](file:///f:/DoAn_CNPMNC/frontend/src/components/PrintMetadataModal.tsx) | Cho phép người dùng in phiếu đặc tả metadata của tài liệu qua trình duyệt (`window.print`). | **EXTENSION** |
| **Delete Saved Search** | [SavedSearchService.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SavedSearchService.java)<br>`DELETE /api/saved-searches/{id}` | Cho phép người dùng xóa các điều kiện tìm kiếm đã lưu không còn nhu cầu sử dụng. | **EXTENSION** |

---

## 3. Backlog Consistency Verification

1. **Tổng Story Points toàn dự án**:
   - $\sum(\text{US-01}\dots\text{US-26}) = 2 + 1 + 3 + 5 + 3 + 3 + 3 + 3 + 2 + 5 + 3 + 3 + 3 + 3 + 2 + 5 + 3 + 3 + 3 + 3 + 2 + 3 + 3 + 2 + 3 + 5 = \mathbf{79\text{ SP}}$
2. **Tổng Story Points theo Sprint**:
   - Sprint 1: $2 + 1 + 3 + 5 + 3 + 3 + 2 = \mathbf{19\text{ SP}}$
   - Sprint 2: $5 + 3 + 3 + 3 + 2 + 3 + 3 = \mathbf{22\text{ SP}}$
   - Sprint 3: $3 + 2 + 3 + 3 + 2 + 3 + 5 = \mathbf{21\text{ SP}}$
   - Sprint 4: $5 + 3 + 3 + 3 + 3 = \mathbf{17\text{ SP}}$
   - Tổng cộng: $19 + 22 + 21 + 17 = \mathbf{79\text{ SP}}$
3. **Phân bổ thành viên (Theo đúng Workbook 60-40)**:
   - **Võ Trọng Hiếu**: $11\text{ (S1)} + 13\text{ (S2)} + 12\text{ (S3)} + 11\text{ (S4)} = \mathbf{47\text{ SP}}$
   - **Tạ Gia Tín**: $8\text{ (S1)} + 9\text{ (S2)} + 9\text{ (S3)} + 6\text{ (S4)} = \mathbf{32\text{ SP}}$
   - Tổng cộng: $47 + 32 = \mathbf{79\text{ SP}}$
4. **Trạng thái User Story**:
   - `DONE`: 24 User Stories
   - `DONE — IMPLEMENTED AHEAD`: 2 User Stories (US-08, US-09 triển khai đón đầu và hoàn thiện trọn vẹn trong Sprint 2)
   - `EXTENSION`: 2 Tính năng mở rộng (0 SP)
   - `NOT DONE`: 0
