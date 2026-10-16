# MA TRẬN TRUY VẾT YÊU CẦU HOÀN THIỆN ĐỢT 4 (FINAL TRACEABILITY MATRIX V3)
## HỆ THỐNG QUẢN TRỊ TÀI LIỆU DOANH NGHIỆP (EDMS)
**Tập tin**: `BC4_05_Traceability_Matrix.md`  
**Người lập**: Võ Trọng Hiếu (Business Analyst / Project Lead)  
**Phạm vi**: 26 User Stories Lab 1 + 10 Phân hệ Mở Rộng Sau Lab 1 (Phase 5 – Phase 16)  
**Giai đoạn đánh giá**: 18/10/2026 – 24/10/2026 (Đợt 4 — Chung Kết)  
**Tình trạng tổng thể**: **100% CÁC YÊU CẦU ĐÃ ĐẠT TRẠNG THÁI FINAL_ACCEPTED & PRODUCTION_READY**

---

## 1. NGUYÊN TẮC CẬP NHẬT MA TRẬN TRUY VẾT ĐỢT 4

Ma trận truy vết yêu cầu hoàn thiện (Final Requirements Traceability Matrix - RTM v3) là phiên bản tổng kết cao nhất của toàn bộ dự án EDMS, phản ánh liên kết khép kín 6 lớp:

$$\text{Yêu Cầu (Requirements)} \longleftrightarrow \text{Giao Diện (Clean UI/Responsive)} \longleftrightarrow \text{REST API / WebSocket} \longleftrightarrow \text{Lớp Xử Lý Service} \longleftrightarrow \text{Lưu Trữ CSDL} \longleftrightarrow \text{Kiểm Thử Baseline}$$

### Quy ước trạng thái nghiệm thu Đợt 4:
- **`FINAL_ACCEPTED`**: Yêu cầu nghiệp vụ đã được kiểm chứng chéo 100% trên giao diện người dùng, mã nguồn Backend, CSDL PostgreSQL thực tế, sơ đồ UML và toàn bộ các bài test baseline. Mọi nợ kỹ thuật (Technical Debt) và sai lệch (Mismatch) đều đã được giải quyết triệt để.

---

## 2. MA TRẬN TRUY VẾT 26 USER STORIES LAB 1 (US-01 ĐẾN US-26)

| Mã US | Năng Lực Nghiệp Vụ Cốt Lõi | Màn Hình / Modal Frontend | REST API / WebSocket Backend | Lớp Service Xử Lý Backend | Bảng CSDL Lưu Trữ | Sơ Đồ UML Ánh Xạ | Bằng Chứng Kiểm Thử Baseline | Trạng Thái Đợt 4 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **US-01** | Đăng nhập hệ thống | [`LoginPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/LoginPage.tsx) | `POST /api/auth/login` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `users`, `audit_logs` | Diagram 5 (Seq Login) | Test 1, 2, 31 | **FINAL_ACCEPTED** |
| **US-02** | Đăng xuất | [`Navbar.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/Navbar.tsx) | `POST /api/auth/logout` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `audit_logs` | Diagram 5 (Seq Login) | Test 8 | **FINAL_ACCEPTED** |
| **US-03** | Xem danh sách tài liệu | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `GET /api/documents` | [`DocumentAccessService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentAccessService.java) | `documents`, `document_permissions`| Diagram 7 (Seq Search) | Test 5 | **FINAL_ACCEPTED** |
| **US-04** | Tìm kiếm tài liệu | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `GET /api/documents?q={query}` | [`DocumentService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `documents` | Diagram 7 (Seq Search) | Test 15, 16 | **FINAL_ACCEPTED** |
| **US-05** | Lọc kết quả tìm kiếm | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `GET /api/documents?documentType=...` | [`DocumentService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `documents` | Diagram 7 (Seq Search) | Test 17, 18 | **FINAL_ACCEPTED** |
| **US-06** | Chọn cột hiển thị kết quả | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | Trạng thái Local Storage | N/A (Frontend Dynamic State) | N/A (Client State) | Diagram 3 (Component) | UI Verified | **FINAL_ACCEPTED** |
| **US-07** | Lưu & tái sử dụng bộ lọc | [`SaveSearchModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/SaveSearchModal.tsx) | `POST /api/saved-searches`<br>`GET /api/saved-searches` | [`SavedSearchService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SavedSearchService.java) | `saved_searches` | Diagram 2 (Use Case v2) | Test 23, 24, 25, 26 | **FINAL_ACCEPTED** |
| **US-08** | Xem chi tiết / Xem trước | [`PreviewModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/PreviewModal.tsx) | `GET /api/documents/{id}/preview` | [`FileStorageService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/FileStorageService.java) | `documents`, `document_versions`| Diagram 7 (Seq Search) | Test 12, 44 | **FINAL_ACCEPTED** |
| **US-09** | Tải tài liệu về máy | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `GET /api/documents/{id}/download` | [`FileStorageService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/FileStorageService.java) | `documents`, `document_versions`| Diagram 7 (Seq Search) | Test 11, 45 | **FINAL_ACCEPTED** |
| **US-10** | Tải lên tài liệu mới | [`UploadModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | `POST /api/documents` (Multipart) | [`DocumentCoreService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentCoreService.java) | `documents`, `document_versions`| Diagram 6 (Seq Upload) | Test 4, 43 | **FINAL_ACCEPTED** |
| **US-11** | Tạo bản ghi hồ sơ | [`UploadModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | `POST /api/documents` | [`DocumentCoreService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentCoreService.java) | `documents` | Diagram 6 (Seq Upload) | Test 4, 7 | **FINAL_ACCEPTED** |
| **US-12** | Nhập thông tin Metadata | [`UploadModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | `POST /api/documents` (Metadata payload)| [`DocumentCoreService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentCoreService.java) | `documents` | Diagram 6 (Seq Upload) | Test 4, 13 | **FINAL_ACCEPTED** |
| **US-13** | Cập nhật thông tin tài liệu | [`EditModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | `PUT /api/documents/{id}` | [`DocumentService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `documents`, `audit_logs` | Diagram 2 (Use Case v2) | Test 19, 20, 21, 46 | **FINAL_ACCEPTED** |
| **US-14** | Phân loại văn bản | [`EditModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/EditModal.tsx) | `PUT /api/documents/{id}` | [`DocumentService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `documents` | Diagram 2 (Use Case v2) | Test 22 | **FINAL_ACCEPTED** |
| **US-15** | Xem tài liệu của tôi | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `GET /api/documents/mine` | [`DocumentService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `documents` | Diagram 2 (Use Case v2) | Test 10 | **FINAL_ACCEPTED** |
| **US-16** | Xem Dashboard tổng quan | [`DashboardPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | `GET /api/admin/dashboard` | [`StatisticsService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java) | `documents`, `users` | Diagram 2 (Use Case v2) | Test 41, 42, 55 | **FINAL_ACCEPTED** |
| **US-17** | Xem thống kê tài liệu | [`DashboardPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | `GET /api/admin/statistics/documents` | [`StatisticsService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java) | `documents` | Diagram 2 (Use Case v2) | Test 52, 53 | **FINAL_ACCEPTED** |
| **US-18** | Xem thống kê sử dụng | [`DashboardPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DashboardPage.tsx) | `GET /api/admin/statistics/usage` | [`StatisticsService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/StatisticsService.java) | `audit_logs` | Diagram 2 (Use Case v2) | Test 54 | **FINAL_ACCEPTED** |
| **US-19** | Giám sát tài nguyên đĩa | [`SystemStatusPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/SystemStatusPage.tsx) | `GET /api/admin/system/status` | [`SystemMetricsService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SystemMetricsService.java) | N/A (Hệ thống tệp) | Diagram 4 (Deployment) | Test 49, Ops Tests | **FINAL_ACCEPTED** |
| **US-20** | Giám sát sức khỏe hệ thống | [`SystemStatusPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/SystemStatusPage.tsx) | `GET /api/health` | [`HealthController`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/HealthController.java) | `edms_db` | Diagram 4 (Deployment) | Test 50, 51, 56 | **FINAL_ACCEPTED** |
| **US-21** | Xem danh sách người dùng | [`UsersPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | `GET /api/admin/users` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `users` | Diagram 2 (Use Case v2) | Test 27, 28 | **FINAL_ACCEPTED** |
| **US-22** | Tạo tài khoản người dùng mới | [`CreateUserModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/CreateUserModal.tsx) | `POST /api/admin/users` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `users`, `audit_logs` | Diagram 2 (Use Case v2) | Test 29, 30, 31, 47 | **FINAL_ACCEPTED** |
| **US-23** | Thay đổi vai trò người dùng | [`EditUserModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/EditUserModal.tsx) | `PUT /api/admin/users/{id}/role` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `users`, `audit_logs` | Diagram 2 (Use Case v2) | Test 32 | **FINAL_ACCEPTED** |
| **US-24** | Khóa tài khoản người dùng | [`UsersPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | `PUT /api/admin/users/{id}/lock` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `users`, `audit_logs` | Diagram 2 (Use Case v2) | Test 33, 34, 35, 39 | **FINAL_ACCEPTED** |
| **US-25** | Mở khóa tài khoản | [`UsersPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | `PUT /api/admin/users/{id}/unlock` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | `users`, `audit_logs` | Diagram 2 (Use Case v2) | Test 32, 36, 37 | **FINAL_ACCEPTED** |
| **US-26** | Xem ma trận quyền hệ thống | [`UsersPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/UsersPage.tsx) | `GET /api/admin/users/roles-permissions` | [`AuthService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/AuthService.java) | N/A (RBAC Matrix) | Diagram 2 (Use Case v2) | Test 38, 57 | **FINAL_ACCEPTED** |

---

## 3. MA TRẬN TRUY VẾT 10 PHÂN HỆ MỞ RỘNG (EXT-01 ĐẾN EXT-10 / PHASE 5 – PHASE 16)

| Mã Phân Hệ | Năng Lực Nghiệp Vụ Mở Rộng | Màn Hình / Modal Frontend | REST API / WebSocket Backend | Lớp Service Xử Lý Backend | Bảng CSDL Lưu Trữ | Sơ Đồ UML Ánh Xạ | Bằng Chứng Kiểm Thử Baseline | Trạng Thái Đợt 4 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **EXT-01 (Phase 5)** | Phân quyền chia sẻ tài liệu (ACL) | [`DocumentAccessModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/DocumentAccessModal.tsx) | `POST /api/documents/{id}/permissions`<br>`GET /api/documents/{id}/permissions` | [`DocumentAccessService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentAccessService.java) | `document_permissions` | Diagram 2 (Use Case v2) | Test 58–85 | **FINAL_ACCEPTED** |
| **EXT-02 (Phase 6)** | Quản lý đa phiên bản (Versioning) | [`DocumentVersionModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/DocumentVersionModal.tsx) | `POST /api/documents/{id}/versions`<br>`GET /api/documents/{id}/versions` | [`DocumentCoreService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentCoreService.java) | `document_versions` | BC4_03 State Machine | Test 86–120 | **FINAL_ACCEPTED** |
| **EXT-03 (Phase 7)** | Xét duyệt phiên bản (Approval Workflow) | [`ReviewQueuePage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/ReviewQueuePage.tsx) | `POST /api/documents/{id}/reviews`<br>`POST /api/admin/reviews/{id}/approve` | [`DocumentReviewService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentReviewService.java) | `document_reviews` | BC4_03 State Machine | Test 121–160 | **FINAL_ACCEPTED** |
| **EXT-04 (Phase 8)** | Quản lý vòng đời & Retention Hold | [`DocumentLifecycleModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/DocumentLifecycleModal.tsx) | `POST /api/documents/{id}/archive`<br>`POST /api/documents/{id}/legal-hold` | [`DocumentService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentService.java) | `documents` | BC4_03 State Machine | Test 161–195 | **FINAL_ACCEPTED** |
| **EXT-05 (Phase 9)** | Tiêu hủy có kiểm soát (Controlled Disposition) | [`DispositionQueuePage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DispositionQueuePage.tsx) | `POST /api/documents/{id}/disposition`<br>`POST /api/admin/dispositions/{id}/approve` | [`DocumentDispositionService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/DocumentDispositionService.java) | `document_dispositions` | BC4_03 State Machine | Test 196–230 | **FINAL_ACCEPTED** |
| **EXT-06 (Phase 10-12)** | Tìm kiếm ngữ nghĩa AI (ONNX) & Full-Text Search | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `GET /api/documents?searchMode=semantic`<br>`POST /api/admin/semantic-index/rebuild` | [`SemanticSearchService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SemanticSearchService.java) | `document_semantic_chunks` | BC4_03 Component v3 | Test 231–275 | **FINAL_ACCEPTED** |
| **EXT-07 (Phase 11)** | Trích xuất văn bản & OCR Fallback (Tika + Tesseract) | [`UploadModal.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/UploadModal.tsx) | `POST /api/admin/ocr/reprocess-all` | [`ContentExtractionService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/ContentExtractionService.java) | `document_versions` | BC3_03 Seq OCR | Test 276–310 | **FINAL_ACCEPTED** |
| **EXT-08 (Phase 13)** | Chữ ký số điện tử X.509 RSA-2048 | [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) | `POST /api/documents/{id}/sign`<br>`GET /api/documents/{id}/verify` | [`SignatureService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SignatureService.java) | `document_versions` | BC4_01 Roadmap | Test 311–340 | **FINAL_ACCEPTED** |
| **EXT-09 (Phase 14)** | Dynamic Watermark, QR & WebSocket Push (STOMP) | [`NotificationPanel.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/NotificationPanel.tsx)<br>[`VerifyPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/VerifyPage.tsx) | **WebSocket STOMP** `/ws-edms`<br>`GET /api/public/verify/{qr}` | [`NotificationService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/NotificationService.java)<br>[`WatermarkQrService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/WatermarkQrService.java) | `notifications` | BC4_03 Real-time Seq | Test 341–369 | **FINAL_ACCEPTED** |
| **EXT-10 (Phase 15-16)** | Sao lưu, Phục hồi Thảm họa & Chịu tải cao | [`SystemStatusPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/SystemStatusPage.tsx) | `POST /api/auth/reset-rate-limit`<br>`GET /api/admin/system/metrics` | [`OperationalDiagnosticsService`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/OperationalDiagnosticsService.java) | `audit_logs` | BC4_03 Component v3 | Tests 370–456 & Load Test | **FINAL_ACCEPTED** |

---

## 4. TỔNG KẾT ĐỐI SOÁT CỦA BUSINESS ANALYST

1. **Độ Bao Phủ Nghiệp Vụ**:
   - **36 / 36 hạng mục (100%)** đạt trạng thái `FINAL_ACCEPTED`.
   - Tất cả 26 User Stories cốt lõi của Lab 1 và 10 Phân hệ Mở Rộng Sau Lab 1 đều có mã nguồn triển khai thực tế, API bảo vệ, bảng CSDL tương ứng, sơ đồ thiết kế chi tiết và bài kiểm thử tự động xác nhận.
2. **Khắc Phục Hoàn Toàn Danh Mục Sai Lệch**:
   - `MIS-01` (131 Java Classes): Đã chuẩn hóa.
   - `MIS-02` (Không tạo bảng `tasks` vật lý): Tiếp tục duy trì Derived Tasks.
   - `MIS-04` (Khóa endpoint reset rate-limit): Đã củng cố an ninh và hỗ trợ username chọn lọc.
   - `MIS-03` (Chuyển đổi Polling sang WebSocket): Đã giải quyết triệt để tại Đợt 4 với WebSocket STOMP.
   - Vấn đề 3 (Mobile Card View): Đã hoàn thiện Responsive `@media (max-width: 480px)`.
3. **Phán Quyết Nghiệm Thu**: Ma trận RTM v3 chính thức được xác nhận hoàn thành 100%, bảo đảm không có bất kỳ điểm nghẽn hoặc sai lệch nào còn tồn đọng trước hội đồng đánh giá.

---
*Xác nhận hoàn thành bởi:*  
**Võ Trọng Hiếu** (Business Analyst / Project Lead / Requirements Owner) — *Đã ký phê duyệt Ma trận Truy vết Yêu cầu RTM v3.*
