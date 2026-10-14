# 00 — BÁO CÁO KIỂM TOÁN HIỆN TRẠNG TOÀN BỘ HỆ THỐNG (CURRENT STATE AUDIT)

**Hệ thống**: Electronic Document Management System (EDMS) — Hệ thống Quản lý Lưu trữ Tài liệu Điện tử  
**Đơn vị thực hiện**: Antigravity — Technical Lead & Security Reviewer  
**Thời điểm kiểm toán**: 14/10/2026  
**Kho mã nguồn tham chiếu**: [https://github.com/hieuvo123ab-rgb/DoAn_CNPMNC](https://github.com/hieuvo123ab-rgb/DoAn_CNPMNC)  
**Mục tiêu**: Đánh giá toàn diện hiện trạng mã nguồn, kiến trúc, cơ sở dữ liệu, an ninh, giao diện và các bộ kiểm thử làm cơ sở hoàn thiện sản phẩm.

---

## 1. KIỂM TRA MÔI TRƯỜNG & PHIÊN BẢN GIT

| Thông số kiểm tra | Trạng thái ghi nhận thực tế | Kết luận kỹ thuật |
| :--- | :--- | :--- |
| **Commit HEAD (main)** | `f573e6e chore: remove deleted office lock file` | Sạch, không có untracked file gây nhiễu trên working tree gốc. |
| **Nhánh làm việc mới** | `completion/edms-hardening` (tách từ `main`) | Đảm bảo nguyên tắc không commit/merge trực tiếp vào nhánh `main`. |
| **Remote Origin** | `https://github.com/hieuvo123ab-rgb/DoAn_CNPMNC.git` | Đã đồng bộ với remote GitHub. |
| **Git LFS Tracking** | `*.onnx filter=lfs diff=lfs merge=lfs -text` (`.gitattributes`) | Cấu hình đúng chuẩn. |
| **Tệp mô hình ONNX** | `backend/models/multilingual-e5-small-onnx-int8/model.onnx`<br>Kích thước: **118,308,185 bytes** (~113 MB) | Đã tải nguyên vẹn qua Git LFS, không bị dạng LFS pointer giả. |

---

## 2. HIỆN TRẠNG KIẾN TRÚC & HẠ TẦNG RUNTIME

### 2.1 Thành phần dịch vụ Docker Compose

Hệ thống được thiết kế chạy dưới cụm Docker (`docker-compose.yml`):

1. **`edms-postgres`**:
   - Hình ảnh: `postgres:16-alpine`.
   - Cổng công khai: `5432:5432`.
   - Cơ chế bền vững: Docker named volume `edms_pgdata` gắn vào `/var/lib/postgresql/data`.
   - Trạng thái kiểm tra: Đang chạy (`Up`, `healthy`).
2. **`edms-backend`**:
   - Nền tảng: Java 21 LTS (`eclipse-temurin:21-jdk-jammy`), Spring Boot 3.3.3.
   - Cổng công khai: `8080:8080`.
   - Tài nguyên đĩa: Docker named volume `edms_storage_data` (`/app/storage/uploads`) và `edms_keystore_data` (`/app/keys`).
   - Sức khỏe ứng dụng (`/api/health`): Trả về `UP`, `semanticModel: AVAILABLE` (Model `multilingual-e5-small-onnx-int8-v1`).
3. **`edms-frontend`**:
   - Nền tảng: React 18, TypeScript, Vite 5.4.
   - Cổng công khai: `5173:5173`.
   - Hiện trạng Dockerfile: Chạy `npm run dev -- --host 0.0.0.0` (chế độ development server, cần chuyển sang production build static server).

---

## 3. KIỂM TOÁN CƠ SỞ DỮ LIỆU POSTGRESQL THỰC TẾ

Truy vấn trực tiếp CSDL `edms_db` qua `edms-postgres`:

| Tên bảng CSDL | Lớp Thực thể Java (Entity) | Số lượng bản ghi thực tế | Vai trò nghiệp vụ |
| :--- | :--- | :---: | :--- |
| `users` | [User.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/User.java) | **147** | Quản lý tài khoản, mật khẩu BCrypt, vai trò và trạng thái. |
| `documents` | [Document.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/Document.java) | **3,298** | Quản lý thông tin tài liệu, thể loại, chủ sở hữu, trạng thái vòng đời. |
| `document_versions` | [DocumentVersion.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DocumentVersion.java) | **4,361** | Quản lý lịch sử phiên bản, hash SHA-256, chữ ký số, OCR text. |
| `document_permissions` | [DocumentPermission.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DocumentPermission.java) | **378** | Ma trận phân quyền chia sẻ tài liệu theo người dùng. |
| `document_reviews` | [DocumentReview.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DocumentReview.java) | **1,156** | Quy trình phê duyệt / từ chối các phiên bản tài liệu. |
| `document_dispositions` | [DocumentDisposition.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DocumentDisposition.java) | **359** | Quy trình yêu cầu và phê duyệt tiêu hủy tài liệu có kiểm soát. |
| `document_semantic_chunks` | [DocumentSemanticChunk.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DocumentSemanticChunk.java) | **385** | Vector embedding các đoạn văn bản phục vụ Semantic Search. |
| `notifications` | [Notification.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/Notification.java) | **1,931** | Hộp thư thông báo và Task Center người dùng. |
| `saved_searches` | [SavedSearch.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/SavedSearch.java) | **74** | Điều kiện tìm kiếm đã lưu của từng tài khoản. |
| `audit_logs` | [AuditLog.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/AuditLog.java) | **17,474** | Nhật ký kiểm toán bất biến ghi nhận mọi hoạt động hệ thống. |

> [!CAUTION]
> CSDL chứa toàn bộ dữ liệu lịch sử tích lũy từ các giai đoạn kiểm thử và vận hành thực tế. Tuyệt đối không xóa volume `edms_pgdata` hay chạy các lệnh reset CSDL làm mất dữ liệu.

---

## 4. ĐỐI CHIẾU MÃ NGUỒN BACKEND & FRONTEND

### 4.1 Backend (Java 21 / Spring Boot 3.3.3)
- **18 Controllers**:
  - `AuthController`: Xác thực đăng nhập, đăng xuất, rate limiting.
  - `DocumentController`: CRUD tài liệu, tải lên, xem trước, tải về, phiên bản, chia sẻ quyền, vòng đời.
  - `DocumentIntegrityController`: Ký số điện tử, kiểm tra tính toàn vẹn phiên bản, chứng chỉ công khai.
  - `DocumentReviewController` & `AdminReviewController`: Quy trình gửi xét duyệt và phê duyệt tài liệu.
  - `DocumentDispositionController` & `AdminDispositionController`: Quy trình gửi tiêu hủy và phê duyệt tiêu hủy.
  - `AdminUserController`: Quản lý tài khoản người dùng, phân quyền vai trò, ma trận quyền.
  - `AdminMonitoringController`: Thống kê Dashboard, biểu đồ thể loại, tần suất sử dụng, audit log.
  - `AdminSystemStatusController`: Trạng thái hệ thống, kiểm tra thành phần thời gian thực, đo lường metrics.
  - `NotificationController` & `TaskController`: Thông báo và trung tâm nhiệm vụ.
  - `PublicVerificationController`: Xác minh công khai tính toàn vẹn qua mã QR/Token và tải tệp đối chiếu.
  - `SavedSearchController`: Quản lý bộ lọc tìm kiếm đã lưu.
  - `AdminContentIndexController`, `AdminOcrController`, `AdminSemanticController`: Quản trị chỉ mục nội dung, OCR và Vector Search.
  - `HealthController`: Liveness probe, readiness probe và endpoint tương thích `/api/health`.
- **25 Services**: Đã triển khai đầy đủ các nghiệp vụ từ Core Storage, JWT, Tika, OCR, BouncyCastle, Semantic Vector (ONNX) đến Disaster Recovery.

### 4.2 Frontend (React 18 / TypeScript / Vite)
- **10 Trang giao diện (Pages)**:
  1. `LoginPage.tsx`: Trang đăng nhập.
  2. `DashboardPage.tsx`: Dashboard tổng quan chỉ số và hoạt động.
  3. `DocumentsPage.tsx`: Danh sách tài liệu, tìm kiếm từ khóa, semantic, hybrid, phân loại, xem trước, tải xuống.
  4. `ReviewQueuePage.tsx`: Hàng đợi phê duyệt tài liệu dành cho Admin.
  5. `DispositionQueuePage.tsx`: Hàng đợi xét duyệt tiêu hủy tài liệu.
  6. `UsersPage.tsx`: Quản lý danh sách người dùng và ma trận phân quyền vai trò.
  7. `AuditLogPage.tsx`: Bảng kiểm toán hệ thống chuyên sâu.
  8. `TaskCenterPage.tsx`: Trung tâm xử lý nhiệm vụ cá nhân.
  9. `SystemStatusPage.tsx`: Giám sát sức khỏe hạ tầng, kết nối DB, Storage, KeyStore, RAM, CPU.
  10. `VerifyPage.tsx`: Cổng xác minh tính toàn vẹn tài liệu công khai (dành cho bên ngoài kiểm tra chữ ký/QR).
- **13 Components Modal & UI**: Đã đồng bộ với các nghiệp vụ backend.
- **11 API Client files**: Khớp 100% các endpoint của 18 Controllers.
- **Kết quả Build Frontend**: `tsc && vite build` hoàn thành với **0 lỗi**, 1,655 modules transformed.

---

## 5. PHÁT HIỆN KIỂM TOÁN CẦN XỬ LÝ (GAP & SECURITY AUDIT)

### 5.1 Các vấn đề Bảo mật & Cấu hình (PHASE 1)
1. **Profile mặc định trong `docker-compose.yml`**:
   - Hiện tại: `SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-operational-test}`.
   - Nguy cơ: Khởi chạy mặc định ở profile `operational-test` thay vì `prod`, có thể kích hoạt các cơ chế kiểm thử sự cố trong môi trường thực tế.
2. **Tài khoản mặc định trong `DataInitializer.java`**:
   - Hiện tại: Tự động khởi tạo `hieu` (Admin) và `tin` (Staff) với mật khẩu mặc định `password123` trên mọi profile (thiếu guard `@Profile("!prod")` hoặc tương đương).
3. **Endpoint `/api/auth/reset-rate-limit`**:
   - Hiện tại: Nằm trong đường dẫn permitAll `/api/auth/**`, cho phép bất kỳ ai (kể cả chưa đăng nhập) gọi để xóa trạng thái chặn brute-force.
   - Khắc phục: Phải yêu cầu xác thực `ROLE_ADMIN` hoặc chỉ cho phép trong môi trường kiểm thử.
4. **Header can thiệp kiểm thử bảo mật**:
   - Header `X-Test-Lockout-Seconds` trong `AuthController.java` và `X-Force-Extraction-Failure`, `X-Force-Ocr-Timeout` trong `DocumentController.java` chưa được chặn khi ứng dụng chạy ở profile `prod`.
5. **Khóa bí mật JWT trong `application.yml`**:
   - Tồn tại fallback secret `404E63526655...` trong tệp cấu hình gốc. Cần đảm bảo môi trường production bắt buộc đọc từ biến môi trường `EDMS_JWT_SECRET`.

### 5.2 Các vấn đề Giao diện Người dùng (PHASE 2)
1. **Dấu vết bài tập đồ án trên giao diện**:
   - Xuất hiện các nhãn: `(US-01)`, `(US-04)`, `(US-10)`, `(US-12)`, `(US-14)`, `(US-21 to US-26)`, `(Phase 5)`, `(Phase 6)`, `(Phase 7 Approval Workflow)`, `(Phase 8)`, `(Phase 9 Workflow)`, `(Phase 14)`.
   - Các placeholder như `"VD: Kế hoạch triển khai Sprint 1"`.
2. **Khu vực chọn nhanh tài khoản thử nghiệm**:
   - Trang đăng nhập hiển thị mục `Tài khoản thử nghiệm nhóm (Seed data): hieu (Team Lead) / tin (Developer)` kèm nút tự điền mật khẩu. Cần loại bỏ hoàn toàn để giao diện đạt chuẩn sản phẩm thực tế.
3. **Không đồng bộ giới hạn kích thước tệp upload**:
   - Frontend hiển thị: `(Tối đa 50MB)` trong `UploadModal.tsx`.
   - Backend cấu hình thực tế: `max-file-size: 20MB`, `max-request-size: 25MB`. Cần đồng bộ Frontend về đúng chuẩn `20MB`.

---

## 6. PHÂN LOẠI TRẠNG THÁI CHỨC NĂNG HỆ THỐNG

| Nhóm chức năng | Chức năng cụ thể | Trạng thái kỹ thuật | Minh chứng / Ghi chú |
| :--- | :--- | :---: | :--- |
| **Xác thực & Bảo mật** | Đăng nhập / Đăng xuất JWT | **DONE** | Đã xác minh hoạt động qua API và UI. |
| | Rate limiting chống Brute-force | **IMPLEMENTED_UNVERIFIED** | Đã triển khai nhưng cần bảo vệ endpoint reset và profile guard. |
| | Quản lý người dùng & phân quyền RBAC | **DONE** | Đã kiểm thử các vai trò `ROLE_ADMIN`, `ROLE_STAFF`. |
| **Quản lý Tài liệu** | Tải lên tài liệu kèm metadata | **DONE** | Lưu trữ tệp vật lý + metadata CSDL. |
| | Xem chi tiết, xem trước (Preview) & Tải về | **DONE** | Hỗ trợ PDF inline, tải đính kèm tệp gốc. |
| | Tìm kiếm theo từ khóa & lọc thể loại | **DONE** | Hỗ trợ tiếng Việt qua PostgreSQL Full-Text & Like. |
| | Tìm kiếm ngữ nghĩa (Semantic Vector Search) | **DONE** | Mô hình ONNX `multilingual-e5-small` nạp sẵn sàng. |
| | Lưu điều kiện tìm kiếm (Saved Searches) | **DONE** | Cô lập theo từng tài khoản người dùng. |
| **Phiên bản & Quy trình** | Quản lý đa phiên bản tài liệu (Versioning) | **DONE** | Tạo phiên bản mới, khôi phục phiên bản lịch sử. |
| | Xét duyệt tài liệu (Review & Approval) | **DONE** | Gửi duyệt, phê duyệt, từ chối kèm phản hồi. |
| | Quản lý vòng đời & Retention Hold | **DONE** | Đóng băng tài liệu, lưu trữ, kiểm tra hạn bảo lưu. |
| | Tiêu hủy có kiểm soát (Controlled Disposition) | **DONE** | Yêu cầu tiêu hủy 2 bước có phê duyệt quản trị. |
| **An toàn & Bền vững** | Chữ ký số RSA-2048 & PKCS#12 KeyStore | **DONE** | Chứng chỉ số X.509 v3 bảo toàn danh tính `1790137027180`. |
| | Watermark động & Xác minh công khai (QR) | **DONE** | Tạo mã QR kiểm tra tính toàn vẹn trực tuyến. |
| | Sao lưu & Khôi phục thảm họa (Disaster Recovery) | **DONE** | Scripts backup và kiểm định khôi phục hệ thống độc lập. |
| | Giám sát sức khỏe & Metrics vận hành | **DONE** | Liveness, Readiness, System Status Dashboard. |
| **Hoàn thiện Sản phẩm** | Bảo vệ bí mật môi trường Production | **PARTIAL** | Cần áp dụng chuẩn hóa cấu hình profile và seed data. |
| | Chuẩn hóa giao diện người dùng thực tế | **PARTIAL** | Cần gỡ bỏ nhãn US-xx, Phase xx, demo account selector. |

---

## 7. KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO

1. **PHASE 1 (Bảo mật & Cấu hình)**:
   - Cập nhật `DataInitializer.java` chỉ kích hoạt seed data khi không ở profile `prod` (`@Profile("!prod")`).
   - Bảo vệ endpoint `/api/auth/reset-rate-limit` (yêu cầu quyền Admin hoặc profile test).
   - Khóa các header kiểm thử (`X-Test-Lockout-Seconds`, `X-Force-Extraction-Failure`, `X-Force-Ocr-Timeout`) trên profile `prod`.
   - Chuẩn hóa `docker-compose.yml` đặt mặc định `SPRING_PROFILES_ACTIVE=prod`.
2. **PHASE 2 (Hoàn thiện Frontend)**:
   - Gỡ bỏ toàn bộ nhãn đồ án (`US-xx`, `Phase xx`, `Sprint 1`).
   - Gỡ bỏ selector tài khoản demo tại `LoginPage.tsx`.
   - Đồng bộ thông báo dung lượng tải lên thành tối đa `20MB`.
   - Kiểm tra giao diện responsive và các trạng thái thông báo người dùng.
3. **PHASE 3, 4, 5, 6**:
   - Kiểm thử liên kết luồng end-to-end.
   - Chạy toàn bộ các bộ kiểm định và ghi nhận kết quả thực tế.
   - Cập nhật hệ thống tài liệu và chuẩn bị hồ sơ bàn giao nghiệm thu.
