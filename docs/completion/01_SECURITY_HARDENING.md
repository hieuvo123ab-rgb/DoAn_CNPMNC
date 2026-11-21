# 01 — BÁO CÁO CỦNG CỐ BẢO MẬT VÀ CHUẨN HÓA CẤU HÌNH (SECURITY HARDENING & CONFIGURATION)

**Hệ thống**: Electronic Document Management System (EDMS)  
**Giai đoạn**: Phase 1 — Security Hardening & Runtime Configuration  
**Thời điểm thực hiện**: 14/10/2026  
**Nhánh làm việc**: `completion/edms-hardening`  
**Nguyên tắc**: Bảo toàn dữ liệu thực tế, bảo vệ danh tính KeyStore, chuẩn hóa môi trường vận hành an toàn.

---

## 1. TỔNG QUAN CÁC LỖ HỔNG VÀ NGUY CƠ ĐÃ PHÁT HIỆN

Trong quá trình rà soát hiện trạng tại Phase 0, hệ thống tồn tại 6 điểm rủi ro an ninh và cấu hình môi trường:

1. **Seed data chạy vô điều kiện trong Production**: `DataInitializer.java` tự động khởi tạo tài khoản `hieu` (Admin) và `tin` (Staff) kèm mật khẩu mặc định `password123` trên mọi môi trường.
2. **Endpoint Reset Rate-Limit bị phơi bày công khai**: Endpoint `POST /api/auth/reset-rate-limit` nằm dưới tiền tố `/api/auth/**` (permitAll), cho phép bất kỳ đối tượng nặc danh nào gọi để xóa lịch sử giới hạn đăng nhập sai, triệt tiêu cơ chế chống Brute-force.
3. **Header kiểm thử can thiệp tham số bảo mật**: Header `X-Test-Lockout-Seconds` cho phép client tự do thay đổi thời gian khóa tài khoản đăng nhập mà không có guard kiểm tra môi trường.
4. **Header can thiệp quy trình xử lý tài liệu**: Header `X-Force-Extraction-Failure` và `X-Force-Ocr-Timeout` trong `DocumentController.java` cho phép client cố tình gây lỗi trích xuất văn bản / OCR mà không bị chặn ở môi trường production.
5. **Khóa bí mật JWT chưa có chốt chặn môi trường**: `JwtTokenProvider.java` chưa kiểm tra độ dài tối thiểu 256-bit và chưa chặn việc dùng chuỗi placeholder mặc định khi triển khai sản phẩm.
6. **Docker Compose chạy profile kiểm thử theo mặc định**: Biến `SPRING_PROFILES_ACTIVE` trong `docker-compose.yml` có giá trị fallback là `operational-test` thay vì `prod`. Frontend chạy máy chủ phát triển `vite dev` thay vì phục vụ bản dựng tĩnh tối ưu.

---

## 2. CHI TIẾT CÁC BIỆN PHÁP KHẮC PHỤC KỸ THUẬT

### 2.1 Cô lập Seed Data thử nghiệm khỏi Production
- **Tập tin sửa đổi**: [DataInitializer.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/config/DataInitializer.java)
- **Giải pháp**: Bổ sung chú thích `@Profile("!prod & !production")`.
- **Hiệu lực**: Các tài khoản seed thử nghiệm `hieu` / `tin` với mật khẩu mặc định `password123` sẽ bị ngắt hoàn toàn khi ứng dụng chạy với profile `prod` hoặc `production`. Dữ liệu người dùng sản phẩm được khởi tạo độc lập và quản lý qua quy trình an toàn.

### 2.2 Bảo vệ Endpoint Reset Rate-Limit
- **Tập tin sửa đổi**:
  - [SecurityConfig.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/SecurityConfig.java)
  - [AuthController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AuthController.java)
- **Giải pháp**:
  - Thêm quy tắc tường lửa: `.requestMatchers("/api/auth/reset-rate-limit").hasAuthority("ROLE_ADMIN")` đặt trước `.requestMatchers("/api/auth/**").permitAll()`.
  - Bổ sung chú thích phương thức: `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`.
- **Hiệu lực**: Người dùng nặc danh gọi endpoint này sẽ nhận mã lỗi `HTTP 401 Unauthorized`; tài khoản người dùng thường không có quyền quản trị sẽ nhận `HTTP 403 Forbidden`.

### 2.3 Khóa Header Mô Phỏng Sự Cố trên Môi Trường Production
- **Tập tin sửa đổi**:
  - [AuthController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/AuthController.java)
  - [DocumentController.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/controller/DocumentController.java)
- **Giải pháp**:
  - Tích hợp `OperationalDiagnosticsService.isFailureSimulationAllowed()`.
  - Header `X-Test-Lockout-Seconds` chỉ được áp dụng khi `isFailureSimulationAllowed() == true`.
  - Header `X-Force-Extraction-Failure` và `X-Force-Ocr-Timeout` chỉ kích hoạt khi `isFailureSimulationAllowed() == true`. Khi chạy ở profile `prod`, các cờ này luôn bị ép về `false`.
- **Hiệu lực**: Ngăn ngừa kẻ tấn công gửi header mô phỏng sự cố để phá hoại tính toàn vẹn hoặc từ chối dịch vụ (DoS) hệ thống.

### 2.4 Kiểm Tra Tính Hợp Lệ Của Khóa Ký JWT
- **Tập tin sửa đổi**: [JwtTokenProvider.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtTokenProvider.java)
- **Giải pháp**:
  - Kiểm tra độ dài bí mật tối thiểu: Bắt buộc từ 32 ký tự trở lên (>= 256 bits).
  - Kiểm tra môi trường Production: Nếu chạy ở profile `prod` / `production`, ném ngoại lệ `IllegalStateException` nếu phát hiện khóa bí mật vẫn là chuỗi fallback mặc định từ môi trường phát triển.
- **Hiệu lực**: Đảm bảo chứng chỉ token JWT không thể bị giả mạo bằng các khóa mẫu yếu hoặc phổ biến trên mạng.

### 2.5 Chuẩn Hóa Cấu Hình Docker & Frontend Production Serving
- **Tập tin sửa đổi**:
  - [docker-compose.yml](file:///f:/DoAn_CNPMNC/docker-compose.yml)
  - [frontend/vite.config.ts](file:///f:/DoAn_CNPMNC/frontend/vite.config.ts)
  - [frontend/Dockerfile](file:///f:/DoAn_CNPMNC/frontend/Dockerfile)
- **Giải pháp**:
  - Đổi giá trị mặc định: `SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}`.
  - Cấu hình khối `preview` trong `vite.config.ts` để đồng bộ proxy `/api` tới backend trên cổng 5173.
  - Cập nhật `frontend/Dockerfile` thực hiện bước `RUN npm run build` và phục vụ thông qua lệnh `npm run preview -- --host 0.0.0.0 --port 5173`.
- **Hiệu lực**: Hệ thống khởi chạy mặc định ở cấu hình tối ưu và bảo mật nhất; loại bỏ Vite development server khỏi bản phân phối container.

---

## 3. KẾT QUẢ ĐẠT ĐƯỢC

Toàn bộ các biện pháp an ninh đã được triển khai tương thích 100% với các bộ kiểm định trước đó:
- Không phá vỡ dữ liệu lịch sử trong CSDL PostgreSQL.
- Không thay đổi danh tính chứng chỉ số PKCS#12 và tính hợp lệ của các chữ ký số đã ký.
- Giữ vững các giao ước API đối với các bộ kiểm thử tự động.
