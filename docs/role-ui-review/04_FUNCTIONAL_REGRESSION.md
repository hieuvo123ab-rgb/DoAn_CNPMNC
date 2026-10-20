# 04 — BÁO CÁO KIỂM THỬ HỒI QUY CHỨC NĂNG THEO VAI TRÒ
## (ROLE-BASED FUNCTIONAL REGRESSION TEST REPORT)

**Dự án**: Electronic Document Management System (EDMS)  
**Tài liệu**: `docs/role-ui-review/04_FUNCTIONAL_REGRESSION.md`  
**Nhánh thực hiện**: `feat/role-ui-refinement`  
**Thời gian thực hiện**: 20/10/2026  
**Công cụ kiểm định**: TypeScript Compiler (`tsc`), Vite 5.4 Build, Puppeteer Core với Google Chrome Headless  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ HỒI QUY

Sau khi thực hiện tinh chỉnh giao diện, loại bỏ chi tiết đồ án/AI, chuẩn hóa Design System và thay thế `window.confirm`:
- **Tổng số kịch bản kiểm thử hồi quy**: 17 nhóm chức năng lớn
- **Kết quả biên dịch TypeScript (`tsc && vite build`)**: **100% PASS** (0 lỗi cú pháp, 0 cảnh báo kiểu dữ liệu)
- **Kiểm thử giao diện tự động bằng Puppeteer**: **100% PASS** (22/22 ảnh chụp thực tế thành công)
- **Tác động đến hợp đồng Backend API**: **0 vi phạm** (giữ nguyên 100% endpoint, tham số truy vấn và cấu trúc DTO)
- **Tác động đến Test ID tự động**: **0 suy giảm** (tất cả selector `#nav-*`, `#*-btn-*` giữ nguyên 100%)

---

## 2. BẢNG KIỂM TRA HỒI QUY CHI TIẾT THEO 17 TÍNH NĂNG CHÍNH

| STT | Phân hệ / Tính năng | Kịch bản kiểm thử | Hành vi kỳ vọng | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | **Xác thực & Đăng nhập** | Nhập `username` & `password`, bấm Đăng nhập | Gửi `POST /api/auth/login`, nhận JWT token, chuyển hướng đến `/documents` | Đăng nhập mượt mà, lưu token an toàn vào localStorage | **PASS** |
| 2 | **Khóa tài khoản do brute-force** | Thử sai mật khẩu 5 lần liên tiếp | Trả về HTTP 429 kèm số giây đếm ngược mở khóa | Hiển thị thông báo đếm ngược giây, nút bị vô hiệu hóa | **PASS** |
| 3 | **Cổng giám định chứng thư công khai** | Truy cập `/verify`, tra cứu bằng mã hash hoặc tải tệp | Gửi `POST /api/public/verify`, trả về kết quả toàn vẹn không cần đăng nhập | Hiển thị thẻ chứng thực xanh lá, thông tin người ký và SHA-256 | **PASS** |
| 4 | **Danh mục tài liệu & Phân trang** | Xem danh sách tài liệu với các bộ lọc Tab (Tất cả / Của tôi / Được chia sẻ) | Gọi `GET /api/documents`, hiển thị danh sách dạng bảng (Desktop) hoặc Card (Mobile) | Bảng dữ liệu tải nhanh, hiển thị badge ngữ nghĩa chuẩn | **PASS** |
| 5 | **Tìm kiếm đa chế độ** | Tìm kiếm từ khóa theo Chính xác (Lexical), Ngữ nghĩa (Semantic), Kết hợp (Hybrid) | Gửi tham số `scope` và `mode` về backend search engine | Kết quả trả về đúng từ khóa, có highlight snippet OCR nếu khớp | **PASS** |
| 6 | **Tải lên tài liệu mới** | Mở Modal tải lên, chọn tệp, nhập tiêu đề, loại tài liệu, phân quyền | Gửi `POST /api/documents` dạng multipart/form-data | Tải lên thành công, tự động làm mới danh sách tài liệu | **PASS** |
| 7 | **Xem trước tài liệu (Preview)** | Bấm nút "Xem" tại một tài liệu | Mở modal hiển thị PDF, ảnh hoặc văn bản qua blob URL an toàn | Xem trước sắc nét, hỗ trợ zoom, không lộ token nhạy cảm | **PASS** |
| 8 | **Tải tệp tin gốc** | Bấm nút "Tải về" | Tải tệp tin đính kèm gốc từ backend với tên file nguyên bản | Tải về thành công, nút hiển thị spinner trong lúc tải | **PASS** |
| 9 | **Chỉnh sửa thông tin tài liệu** | Bấm nút "Sửa" trên tài liệu mình có quyền | Mở modal cập nhật tiêu đề, trích yếu, phân loại tài liệu | Cập nhật thành công, dữ liệu phản ánh tức thì trên bảng | **PASS** |
| 10 | **Phân quyền & Chia sẻ (ACL)** | Bấm nút "Chia sẻ" trên tài liệu do mình sở hữu | Mở modal phân quyền, thêm người dùng với quyền `VIEW` hoặc `EDIT` | Gửi `POST /api/documents/{id}/permissions` thành công | **PASS** |
| 11 | **Lịch sử & Khôi phục phiên bản** | Bấm nút "Phiên bản" trên bảng tài liệu | Hiển thị danh sách các phiên bản v1, v2; cho phép tải lên bản mới hoặc khôi phục bản cũ | Tải phiên bản mới và khôi phục hoạt động chính xác | **PASS** |
| 12 | **Gửi xét duyệt phiên bản** | Bấm nút "Gửi duyệt" tại tài liệu có trạng thái Nháp | Gửi `POST /api/documents/{id}/submit-review`, chuyển trạng thái sang `PENDING` | Badge chuyển sang "Chờ duyệt", tạo tác vụ trong hàng đợi admin | **PASS** |
| 13 | **Hàng đợi xét duyệt (`ROLE_ADMIN`)** | Admin mở `/review-queue`, xem trước phiên bản và duyệt / từ chối | Gửi `POST /api/admin/reviews/{id}/approve` hoặc `reject` | Duyệt thành công, cập nhật trạng thái phiên bản sang `APPROVED` | **PASS** |
| 14 | **Quản lý vòng đời & Tiêu hủy** | Thiết lập retention, bật Legal Hold, hoặc gửi yêu cầu tiêu hủy | Gọi các endpoint lifecycle và disposition của backend | Kiểm tra niên hạn chính xác, ngăn chặn tiêu hủy nếu có Legal Hold | **PASS** |
| 15 | **Trung tâm công việc (Task Center)** | Mở `/tasks`, lọc theo loại công việc cần làm | Gọi `GET /api/tasks`, click tác vụ điều hướng đến màn hình tương ứng | Tác vụ hiển thị trực quan, bấm "Xử lý" điều hướng đúng màn hình | **PASS** |
| 16 | **Quản lý người dùng (`ROLE_ADMIN`)** | Admin mở `/users`, tạo tài khoản, đổi vai trò, khóa tài khoản | Sử dụng `ConfirmationModal` mới thay cho `window.confirm()` | Khóa và kích hoạt tài khoản an toàn, không có lỗi giao diện | **PASS** |
| 17 | **Nhật ký kiểm toán & Giám sát hạ tầng** | Admin mở `/audit` và `/system-status` | Giám sát toàn bộ sự kiện đăng nhập, thao tác tệp, CPU, RAM, PostgreSQL | Số liệu hiển thị trực quan, lọc nhật ký mượt mà | **PASS** |

---

## 3. KIỂM ĐỊNH BẢO VỆ PHÂN QUYỀN (RBAC SECURITY ASSURANCE)

Để đảm bảo nguyên tắc bảo mật: *"Không tự giả định một role được phép thao tác chỉ vì Frontend hiển thị nút"*:

1. **Kiểm tra quyền truy cập trực tiếp bằng URL (Route Guarding)**:
   - Khi tài khoản `ROLE_USER` hoặc `ROLE_STAFF` cố ý kích hoạt URL `/review-queue`, `/disposition-queue`, `/dashboard`, `/users`, `/audit`, `/system-status`:
   - `App.tsx` kiểm tra `isAdmin` và tự động điều hướng ngược về `/documents`.
   - Nếu thực hiện cURL hoặc Postman gửi token `ROLE_USER` trực tiếp đến `/api/admin/**`: Backend Spring Security trả về ngay lập tức `HTTP 403 Forbidden`.

2. **Kiểm tra phân định dữ liệu Task Center**:
   - Backend `TaskCenterService.java` chỉ trả về `REVIEW_PENDING` và `DISPOSITION_PENDING` cho người dùng có quyền quản trị.
   - Tài khoản người dùng thông thường chỉ nhận được các thông báo nhắc nhở chỉnh sửa tài liệu do chính mình tạo.

3. **Kiểm tra chức năng Khóa tài khoản**:
   - Sau khi Admin thực hiện khóa tài khoản qua `ConfirmationModal`, người dùng bị khóa bị từ chối đăng nhập với thông báo lỗi rõ ràng từ backend `CustomUserDetailsService`.
