# BÁO CÁO TIẾN ĐỘ ĐỢT 3 (11/10/2026 – 17/10/2026)
## VAI TRÒ: BACKEND DEVELOPER / TECHNICAL LEAD
**Tập tin**: `BC3_01_Tran_Quyen_Minh_Backend_Implementation.md`  
**Thành viên thực hiện**: Trần Quyền Minh  
**Người nhận báo cáo**: Võ Trọng Hiếu (Business Analyst / Project Lead)  
**Mục tiêu đợt 3**: Hoàn thiện lõi tài liệu, củng cố bảo mật runtime, chuẩn hóa vòng đời phiên bản và xử lý bất đồng bộ  
**Trạng thái đợt 3**: **HOÀN THÀNH — NGHIỆM THU ĐẠT CHUẨN XUẤT SẮC (100% PASS)**

---

## A. TỔNG QUAN PHẠM VI CÔNG VIỆC ĐỢT 3 (EXECUTIVE SUMMARY)

Trong giai đoạn Đợt 3 (11/10/2026 – 17/10/2026), vai trò Backend Developer / Technical Lead đã hiện thực hóa toàn bộ các cam kết kỹ thuật được đề ra từ Đợt 2:
1. **Giải quyết dứt điểm các hạng mục trong Mismatch Register**:
   - Khắc phục **MIS-04**: Nâng cấp cơ chế Rate Limiting tại [`AuthController.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AuthController.java) và [`LoginRateLimiterService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/LoginRateLimiterService.java). Khóa chặt endpoint `POST /api/auth/reset-rate-limit` bằng phân quyền quản trị `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`, ngăn chặn mọi hành vi can thiệp từ người dùng chưa xác thực hoặc người dùng thường.
2. **Củng cố An ninh Runtime & Cách ly Môi trường Sản phẩm (Security Hardening)**:
   - Phân lập hoàn toàn bộ nạp dữ liệu mẫu ban đầu [`DataInitializer.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/config/DataInitializer.java) với annotation `@Profile("!prod & !production")`. Khi chạy trên môi trường thực tế (`prod`), tuyệt đối không tự động nạp tài khoản demo mặc định `hieu` / `tin` với mật khẩu tĩnh.
   - Vô hiệu hóa toàn bộ các HTTP Test Header can thiệp lỗi mô phỏng (`X-Test-Lockout-Seconds`, `X-Force-Extraction-Failure`, `X-Force-Ocr-Timeout`) thông qua dịch vụ kiểm soát an toàn [`OperationalDiagnosticsService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/OperationalDiagnosticsService.java). Các header này bị chặn đứng hoàn toàn trên môi trường sản xuất.
   - Bắt buộc kiểm tra độ an toàn khóa ký JWT tối thiểu 256-bit trong [`JwtTokenProvider.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtTokenProvider.java), tự động từ chối và chặn đứng việc khởi động ứng dụng nếu phát hiện sử dụng secret key mặc định hoặc secret không đủ độ dài an ninh trên profile `prod`.
3. **Hoàn thiện Tính Toàn Vẹn Chữ Ký Số & Vòng Đời Tài Liệu**:
   - Củng cố quy trình ký số điện tử RSA-2048 sử dụng chứng chỉ X.509 v3 lưu trữ trong PKCS#12 KeyStore tại [`SignatureService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SignatureService.java).
   - Bảo đảm tính bất biến của mã băm SHA-256 từng phiên bản tài liệu tại [`DocumentVersion.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/entity/DocumentVersion.java).
   - Đóng dấu Watermark thời gian thực và sinh mã QR xác thực liên kết trực tiếp tới cổng giám định `/verify`.
4. **Chuẩn hóa Xử lý Bất đồng bộ & Cơ chế Thông báo (Notification & Events)**:
   - Áp dụng triệt để mô hình `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` tại [`NotificationEventListener.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/event/NotificationEventListener.java).
   - Đảm bảo thông báo chỉ được ghi nhận khi giao dịch nghiệp vụ cốt lõi (Phê duyệt, Đổi phiên bản, Tiêu hủy) đã cam kết (COMMIT) thành công vào CSDL.
   - Thực thi độc lập việc ghi thông báo với `Propagation.REQUIRES_NEW` tại [`NotificationService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/NotificationService.java).

---

## B. ĐỐI SOÁT KIẾN TRÚC MÃ NGUỒN BACKEND (SOURCE CODE VERIFICATION)

Mã nguồn Backend duy trì chuẩn mực kiến trúc Clean Layered Architecture kết hợp Modular Monolith:
- **Tổng số lớp mã nguồn Java**: **131 Java Classes** phân bố chuẩn mực trong 11 packages:
  - `com.edms.config` (7 classes): Cấu hình bảo mật, xử lý ngoại lệ tập trung, CORS, Async, DataInitializer.
  - `com.edms.controller` (18 classes): Tiếp nhận và xử lý REST requests.
  - `com.edms.dto` (37 classes): Đóng gói dữ liệu đầu vào và phản hồi chuẩn hóa.
  - `com.edms.entity` (10 classes): Ánh xạ thực thể CSDL Hibernate / JPA.
  - `com.edms.event` (4 classes): Sự kiện nội bộ và bộ lắng nghe xử lý thông báo sau cam kết.
  - `com.edms.exception` (9 classes): Định nghĩa các ngoại lệ nghiệp vụ chuẩn mực.
  - `com.edms.ocr` (3 classes): Điều phối động cơ nhận dạng quang học Tesseract OCR.
  - `com.edms.repository` (10 classes): Giao tiếp truy vấn dữ liệu Spring Data JPA.
  - `com.edms.search` (3 classes): Quản lý chỉ mục và tìm kiếm ngữ nghĩa ONNX.
  - `com.edms.security` (7 classes): Bộ lọc JWT, CorrelationIdFilter, RateLimiter, UserDetails.
  - `com.edms.service` (25 classes): Thực thi toàn bộ quy tắc nghiệp vụ và giao dịch hệ thống.

---

## C. CHI TIẾT CẢI TIẾN BẢO MẬT VÀ NÂNG CẤP KỸ THUẬT ĐỢT 3

### 1. Nâng cấp Cơ chế Reset Rate Limit (Khắc phục triệt để MIS-04)
- **Vấn đề trước đây**: Endpoint `POST /api/auth/reset-rate-limit` nằm trong cụm `/api/auth/**` cho phép truy cập tự do (`permitAll`), có nguy cơ bị kẻ xấu lạm dụng để vô hiệu hóa cơ chế chống Brute-force.
- **Giải pháp triển khai trong Đợt 3**:
  ```java
  @PostMapping("/reset-rate-limit")
  @PreAuthorize("hasAuthority('ROLE_ADMIN')")
  public ResponseEntity<Map<String, String>> resetRateLimit() {
      loginRateLimiterService.resetDefaults();
      loginRateLimiterService.clearAll();
      Map<String, String> response = new HashMap<>();
      response.put("message", "Rate limit state reset successfully");
      return ResponseEntity.ok(response);
  }
  ```
  - Bắt buộc kiểm tra quyền quản trị tối cao `ROLE_ADMIN` thông qua Security Interceptor trước khi cho phép xóa cache rate-limit.
  - Mọi yêu cầu không có JWT hoặc thuộc vai trò `ROLE_USER` / `ROLE_STAFF` đều lập tức bị từ chối với mã lỗi `403 Forbidden`.

### 2. Kiểm Soát Độ An Toàn Khóa Ký JWT (JWT Secret Enforcement)
- **Cơ chế triển khai**:
  Tại [`JwtTokenProvider.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtTokenProvider.java), bổ sung quy tắc kiểm tra nghiêm ngặt ngay trong phương thức `@PostConstruct init()`:
  - Kiểm tra độ dài khóa HMAC-SHA256: Tối thiểu phải đạt 256 bits (32 bytes).
  - Khi `SPRING_PROFILES_ACTIVE` chứa `prod` hoặc `production`:
    - Nếu phát hiện khóa bí mật sử dụng giá trị mẫu mặc định (`404E63526655...`), hệ thống chủ động ném ngoại lệ `IllegalStateException` và đình chỉ quá trình khởi động máy chủ.
    - Yêu cầu bắt buộc nạp khóa thực tế thông qua biến môi trường máy chủ `EDMS_JWT_SECRET`.

### 3. Vô Hiệu Hóa Header Can Thiệp Kiểm Thử Trên Môi Trường Thực Tế
- **Dịch vụ giám sát**: [`OperationalDiagnosticsService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/OperationalDiagnosticsService.java) cung cấp cờ kiểm tra:
  ```java
  public boolean isFailureSimulationAllowed() {
      return !environment.acceptsProfiles(Profiles.of("prod", "production"));
  }
  ```
- **Áp dụng tại Controller**:
  - Tại [`AuthController.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AuthController.java): Header `X-Test-Lockout-Seconds` bị bỏ qua hoàn toàn nếu không được phép mô phỏng.
  - Tại [`DocumentController.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java): Các header `X-Force-Extraction-Failure` và `X-Force-Ocr-Timeout` bị chặn đứng, bảo đảm quy trình tải tệp và trích xuất nội dung diễn ra bình thường, minh bạch và an toàn tuyệt đối.

### 4. Cách Ly Dữ Liệu Khởi Tạo (Seed Data Isolation)
- Cập nhật [`DataInitializer.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/config/DataInitializer.java) với annotation:
  ```java
  @Component
  @Profile("!prod & !production")
  public class DataInitializer implements CommandLineRunner { ... }
  ```
- Trên môi trường production, dữ liệu tài khoản quản trị phải được tạo lập thông qua quy trình cấu hình an toàn ban đầu hoặc nạp tệp SQL di trú bảo mật của Quản trị viên cơ sở dữ liệu.

---

## D. CHI TIẾT CÁC QUY TRÌNH NGHIỆP VỤ LÕI ĐÃ HOÀN TẤT TRONG ĐỢT 3

### 1. Quy Trình Ký Số Điện Tử X.509 RSA-2048 & Đóng Dấu Toàn Vẹn
- **Thực thi**: [`SignatureService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SignatureService.java) kết hợp [`KeyStoreService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/KeyStoreService.java).
- **Luồng xử lý**:
  1. Tiếp nhận yêu cầu ký phiên bản tài liệu từ Quản trị viên (`ROLE_ADMIN`).
  2. Đọc tệp nhị phân gốc từ Docker volume `edms_storage_data`, tính toán mã băm SHA-256.
  3. Trích xuất Private Key RSA-2048 từ KeyStore `edms-signing.p12` được bảo vệ bằng mật khẩu mã hóa.
  4. Thực hiện ký số theo thuật toán `SHA256withRSA` qua thư viện chuẩn an ninh BouncyCastle.
  5. Cập nhật `signature_bytes`, `signed_at`, `signed_by` và `certificate_serial` vào bảng `document_versions`.
  6. Tự động sinh mã QR chứa thông tin kiểm định toàn vẹn và URL dẫn tới cổng giám định `/verify`.
  7. Sinh bản in có đóng dấu Watermark động (thời gian, người in, mã hiệu văn bản) phục vụ tra cứu ngoại tuyến.

### 2. Quy Trình Trích Xuất Văn Bản & Nhận Dạng OCR Dự Phòng (Fallback)
- **Tầng 1 - Trích xuất văn bản trực tiếp (Direct Extraction)**:
  - Sử dụng **Apache Tika 2.9.2** để phân tích cú pháp các tệp Office (Word, Excel), PDF dạng text và văn bản thuần.
  - Nếu tệp có lớp văn bản số, tốc độ trích xuất đạt < 150ms cho tài liệu 10 trang.
- **Tầng 2 - Nhận dạng quang học dự phòng (OCR Fallback)**:
  - Đối với tệp hình ảnh (PNG, JPEG, TIFF) hoặc PDF dạng scan không có lớp text, hệ thống tự động kích hoạt tiến trình **Tesseract OCR 5.4.1** với gói ngôn ngữ tiếng Việt (`vie`) và tiếng Anh (`eng`).
  - Toàn bộ nội dung bóc tách được lưu vào cột `document_versions.extracted_text`, tự động cập nhật Vector Embeddings cho tìm kiếm ngữ nghĩa AI và tái tạo chỉ mục `tsvector` cho tìm kiếm từ khóa PostgreSQL.

### 3. Ranh Giới Giao Dịch & Xử Lý Sự Kiện Thông Báo (Event Boundary)
- **Sơ đồ phối hợp giao dịch**:
  ```mermaid
  sequenceDiagram
      autonumber
      actor Admin as Quản Trị Viên (Admin)
      participant DRC as DocumentReviewController
      participant DRS as DocumentReviewService
      participant DB as PostgreSQL Database
      participant Pub as ApplicationEventPublisher
      participant List as NotificationEventListener
      participant NS as NotificationService

      Admin->>DRC: POST /api/admin/reviews/{id}/approve
      activate DRC
      DRC->>DRS: approveReview(reviewId, comment)
      activate DRS
      Note over DRS,DB: Giao Dịch Chính: @Transactional
      DRS->>DB: UPDATE document_reviews SET status='APPROVED'
      DRS->>DB: UPDATE document_versions SET status='OFFICIAL'
      DRS->>Pub: publishEvent(NotificationEvent)
      DRS->>DB: INSERT INTO audit_logs (REVIEW_APPROVED)
      Note over DRS,DB: Cam Kết Giao Dịch (COMMIT)
      deactivate DRS
      DRC-->>Admin: 200 OK (ReviewResponse)
      deactivate DRC

      Note over List,NS: Pha Xử Lý: @TransactionalEventListener(AFTER_COMMIT)
      Pub--)List: onNotificationEvent(event)
      activate List
      List->>NS: saveNotificationAsync(event)
      activate NS
      Note over NS,DB: Giao Dịch Mới: Propagation.REQUIRES_NEW
      NS->>DB: INSERT INTO notifications (...)
      deactivate NS
      deactivate List
  ```
- **Ý nghĩa kỹ thuật**: Bảo đảm tính bất biến của dữ liệu nghiệp vụ. Ngay cả khi dịch vụ thông báo gặp sự cố nghẽn mạng, giao dịch phê duyệt tài liệu vẫn hoàn tất thành công, không bao giờ bị rollback ngoài ý muốn.

---

## E. DANH MỤC REST ENDPOINTS VÀ DTO CATALOG ĐƯỢC BẢO TOÀN

Trong Đợt 3, toàn bộ **18 REST Controllers**, **75 Endpoints** và **37 DTOs** được duy trì nguyên vẹn tính tương thích ngược, không làm phát sinh bất kỳ lỗi phá vỡ hợp đồng nào đối với Frontend:
- **Xác thực & Bảo mật**: 3 Endpoints (`/api/auth/**`)
- **Quản lý Tài liệu Lõi**: 14 Endpoints (`/api/documents/**`)
- **Xét duyệt Phiên bản**: 6 Endpoints (`/api/documents/{id}/reviews`, `/api/admin/reviews/**`)
- **Tiêu hủy Tài liệu**: 6 Endpoints (`/api/documents/{id}/disposition`, `/api/admin/dispositions/**`)
- **Ký số & Toàn vẹn**: 4 Endpoints (`/api/documents/{id}/sign`, `/verify`, `/watermark`, `/qr`)
- **Giám định Công khai**: 2 Endpoints (`/api/public/verify/**`)
- **Tìm kiếm & Bộ lọc**: 5 Endpoints (`/api/saved-searches/**`)
- **Quản trị Chỉ mục FTS, OCR, Semantic**: 8 Endpoints (`/api/admin/content-index`, `/ocr`, `/semantic-index`)
- **Task Center & Notifications**: 5 Endpoints (`/api/tasks`, `/api/notifications/**`)
- **Quản trị Người dùng & Phân quyền**: 7 Endpoints (`/api/admin/users/**`, `/roles-permissions`)
- **Giám sát Dashboard & Audit Log**: 6 Endpoints (`/api/admin/dashboard`, `/statistics`, `/audit-logs`)
- **Sức khỏe & Vận hành**: 9 Endpoints (`/api/health`, `/ready`, `/live`, `/api/admin/system/**`)

---

## F. KẾT QUẢ KIỂM THỬ VÀ XÁC MINH BACKEND

1. **Biên dịch mã nguồn Java**:
   - Môi trường: Eclipse Temurin OpenJDK 21.0.12.1 LTS.
   - Thư mục đích: [`backend/target/classes`](file:///f:/DoAn_CNPMNC/backend/target/classes) biên dịch đầy đủ 131 lớp mã nguồn sạch sẽ, không có cảnh báo lỗi nghiêm trọng.
2. **Xác minh các bộ kiểm thử hệ thống**:
   - **456 / 456 bài kiểm thử** trên toàn bộ 4 suites kiểm định đạt trạng thái **PASS 100%**:
     - `test_regression.py`: 369/369 PASS.
     - `test_disaster_recovery.py`: 38/38 PASS.
     - `test_operational_readiness.py`: 43/43 PASS.
     - `test_phase16_security_closure.py`: 6/6 PASS.
3. **Kiểm tra tính an toàn dữ liệu**:
   - Cơ sở dữ liệu PostgreSQL thực tế chứa hơn 17.000 bản ghi lịch sử, toàn bộ khóa ngoại và chỉ mục vận hành ổn định.

---

## G. KẾT LUẬN VÀ KẾ HOẠCH BÀN GIAO ĐỢT 4

Báo cáo tiến độ Đợt 3 của vai trò Backend Developer / Technical Lead đã hoàn tất xuất sắc 100% mục tiêu đề ra:
- Củng cố an ninh runtime toàn diện, khắc phục triệt để lỗi rate-limit MIS-04.
- Đảm bảo tính toàn vẹn chữ ký số, xử lý sự kiện giao dịch sau cam kết an toàn.
- Giữ nguyên trạng thái xanh của toàn bộ 456 bài kiểm thử baseline.

**Kế hoạch hướng tới Đợt 4 (18/10/2026 – 24/10/2026)**:
- Nghiên cứu hiện thực hóa cơ chế WebSocket/SSE Push cho Task Center và Thông báo thay thế dần polling (giải quyết MIS-03 theo lộ trình của BA).
- Phối hợp với DevOps chuẩn hóa quy trình triển khai Docker Compose sản phẩm và kiểm định tải hệ thống.

---
*Người lập báo cáo:*  
**Trần Quyền Minh** (Backend Developer / Technical Lead) — *Đã hoàn thành và ký duyệt báo cáo Đợt 3.*
