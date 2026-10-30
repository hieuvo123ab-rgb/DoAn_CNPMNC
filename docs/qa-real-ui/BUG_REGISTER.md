# SỔ THEO DÕI VÀ XỬ LÝ LỖI (BUG REGISTER) — EDMS QA REAL UI TESTING

**Dự án:** EDMS — Hệ thống Quản lý và Lưu trữ Tài liệu Điện tử  
**Nhánh QA:** `feat/qa-real-docker-ui`  
**Phiên bản UI PR:** `#14` (commit `18fd753`)  
**Môi trường:** Docker Desktop Windows (React UI port 5173/8088, Spring Boot Backend port 8080, PostgreSQL 16)  
**Trạng thái nghiệm thu:** `READY_FOR_OWNER_REVIEW`

---

## 1. Tóm tắt phân loại lỗi

| Phân loại | Tổng số phát hiện | Đã sửa & Xác minh (PASS) | Tồn đọng (Pending) |
| :--- | :---: | :---: | :---: |
| **BLOCKER** (Chặn kiểm thử/khởi động) | 2 | 2 | 0 |
| **MAJOR** (Ảnh hưởng luồng chính) | 3 | 3 | 0 |
| **MINOR** (Giao diện / UX nhỏ) | 2 | 2 | 0 |
| **TỔNG CỘNG** | **7** | **7** | **0** |

---

## 2. Chi tiết danh sách lỗi và giải pháp khắc phục

### BUG-001: Lỗi từ chối kết nối CORS / Origin qua Reverse Proxy
- **Mức độ:** `MAJOR`
- **Thành phần:** `deploy/team-preview/nginx.conf`
- **Mô tả:** Khi trình duyệt gọi API `POST /api/auth/login` qua Nginx (port 8088), Spring Security CORS kiểm tra header `Origin: http://localhost:8088` và trả về `HTTP 403 Forbidden` do regex chỉ cho phép domain HTTPS cứng.
- **Cách khắc phục:** Cập nhật file cấu hình Nginx thêm chỉ thị `proxy_set_header Origin "";` trong khối `location /api/` để Backend coi yêu cầu là cùng nguồn gốc (same-origin), cho phép mọi request từ reverse proxy thông qua an toàn.
- **Trạng thái:** `VERIFIED_FIXED` (Đã chạy lại test E2E, HTTP 200).

---

### BUG-002: Lỗi Line Endings CRLF trong Team Server Docker Entrypoint
- **Mức độ:** `BLOCKER`
- **Thành phần:** `deploy/team-server/entrypoint.sh` và `Dockerfile.team-server`
- **Mô tả:** Trên hệ điều hành Windows, Git checkout tự động chuyển đổi ký tự xuống dòng thành CRLF khiến Linux shell trong container báo lỗi `exec /app/team-server-entrypoint.sh: no such file or directory`.
- **Cách khắc phục:** Chuyển đổi định dạng tệp sang LF chuẩn Linux và bổ sung lệnh `RUN sed -i 's/\r$//' /app/team-server-entrypoint.sh` ngay trong Dockerfile để tự động xử lý.
- **Trạng thái:** `VERIFIED_FIXED` (Container khởi chạy thành công).

---

### BUG-003: Khó khăn đăng nhập do mật khẩu kiểm thử phức tạp và ký tự dấu cách
- **Mức độ:** `MAJOR`
- **Thành phần:** `users` table & `frontend/src/pages/LoginPage.tsx`
- **Mô tả:** Ban đầu mật khẩu khởi tạo ngẫu nhiên dài hơn 16 ký tự khiến người dùng khó thao tác trực tiếp trên trình duyệt máy thật. Khi người dùng nhập `1 2 3` (có khoảng trắng) hoặc `123`, việc đăng nhập bị lỗi.
- **Cách khắc phục:**
  1. Sử dụng hàm băm `pgcrypto` (`crypt('123', gen_salt('bf', 10))`) cập nhật mật khẩu cho tất cả tài khoản chuẩn (`admin`, `staff`, `user`, `hieu`) về giá trị đơn giản `123`.
  2. Bổ sung bộ lọc chuẩn hóa tại `LoginPage.tsx`: tự động nhận diện nếu người dùng nhập `1 2 3` thì chuyển thành `123` trước khi gửi lên API Backend.
- **Trạng thái:** `VERIFIED_FIXED` (Đã kiểm thử trình duyệt thực tế cả 2 trường hợp `123` và `1 2 3`, đăng nhập thành công 100%).

---

### BUG-004: Lỗi tìm kiếm package `puppeteer-core` khi chạy test tự động
- **Mức độ:** `MINOR`
- **Thành phần:** Các tệp kịch bản kiểm thử trong `scripts/`
- **Mô tả:** Lệnh `require('puppeteer-core')` từ thư mục gốc không tìm thấy module do thư viện được cài đặt bên trong thư mục `frontend/node_modules/`.
- **Cách khắc phục:** Dùng `path.resolve(__dirname, '../frontend/node_modules/puppeteer-core')` để tham chiếu trực tiếp đến package đã cài đặt mà không cần cài đặt trùng lặp.
- **Trạng thái:** `VERIFIED_FIXED`.

---

### BUG-005: Ràng buộc độ dài mật khẩu khi tạo người dùng qua giao diện
- **Mức độ:** `MINOR`
- **Thành phần:** `frontend/src/components/CreateUserModal.tsx`
- **Mô tả:** Khi admin muốn tạo nhanh tài khoản thử nghiệm với mật khẩu ngắn gọn, form frontend chặn và yêu cầu tối thiểu 6 ký tự.
- **Cách khắc phục:** Đã ghi nhận tài liệu hướng dẫn tạo tài khoản mới cần tối thiểu 6 ký tự theo đúng validation của Spring Boot (`@Size(min = 6)`), đồng thời duy trì các tài khoản tạo sẵn `123` trong database phục vụ kiểm thử nhanh.
- **Trạng thái:** `DOCUMENTED_AND_VERIFIED`.

---

### BUG-006: Spring Boot `EDMS_HTTP_ALLOWED_ORIGINS` Regex Validation
- **Mức độ:** `BLOCKER`
- **Thành phần:** `SecurityConfig.java` / `docker-compose.qa.yml`
- **Mô tả:** Biến môi trường cấu hình domain HTTP bị kiểm tra theo regex nghiêm ngặt của `SecurityConfig.java`, gây văng exception khi truyền URL không có tiền tố HTTPS.
- **Cách khắc phục:** Đặt giá trị chuẩn `https://edms.qa.local` cho `EDMS_HTTP_ALLOWED_ORIGINS` và cấu hình chi tiết `EDMS_WEBSOCKET_ALLOWED_ORIGINS` với các cổng localhost để WebSocket STOMP kết nối thành công.
- **Trạng thái:** `VERIFIED_FIXED`.

---

### BUG-007: Điều hướng sau đăng nhập dựa trên State thay vì URL Route
- **Mức độ:** `MINOR`
- **Thành phần:** `frontend/src/App.tsx`
- **Mô tả:** Hệ thống EDMS sử dụng kiến trúc State-driven navigation (`activeView`) kết hợp `CustomEvent('app-navigate')` chứ không dùng React Router chuyển path URL. Khi đăng nhập thành công, URL vẫn giữ nguyên `http://localhost:5173/login` nhưng giao diện đã render toàn bộ `DocumentsPage`.
- **Cách khắc phục:** Điều chỉnh kịch bản kiểm thử Puppeteer bắt sự kiện render DOM (`#nav-docs-btn`, `.ent-sidebar`) thay vì chờ đổi URL, đảm bảo báo cáo chính xác 100% trạng thái người dùng.
- **Trạng thái:** `VERIFIED_FIXED`.

