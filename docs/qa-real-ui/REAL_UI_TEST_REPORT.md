# BÁO CÁO KIỂM THỬ GIAO DIỆN THỰC TẾ & CHẤP NHẬN CHỨC NĂNG (REAL DOCKER UI TEST REPORT)

**Dự án:** EDMS — Hệ thống Quản lý và Lưu trữ Tài liệu Điện tử  
**Mã nguồn PR:** `#14` — `feat/edms-ui-consistency-final` (Commit `18fd7534e7dd4fea48fcd2e8d3d17b967a6ca4b3`)  
**Nhánh QA:** `feat/qa-real-docker-ui`  
**Kỹ sư thực hiện:** Senior Full-Stack QA & Browser Automation Tester  
**Thời điểm thực hiện:** 2026-10-30  
**Kết luận tổng thể:** **`READY_FOR_OWNER_REVIEW`**

---

## 1. Môi trường Thực thi & Địa chỉ Truy cập

- **Địa chỉ giao diện đang chạy trực tiếp:**  
  👉 **`http://localhost:5173`** (phục vụ qua Vite Preview / Docker)  
  👉 **`http://localhost:8088`** (phục vụ qua Nginx Reverse Proxy)
- **Địa chỉ Backend API:** `http://localhost:8080/api/` (Spring Boot 3 / Java 21)
- **Database:** PostgreSQL 16 Alpine (`edms-postgres`, port 5432 nội bộ)
- **Trình duyệt điều khiển tự động:** Google Chrome thật (`C:\Program Files\Google\Chrome\Application\chrome.exe`) qua `puppeteer-core`.

---

## 2. Tài Khoản Thử Nghiệm Kiểm Thử Thực Tế

Toàn bộ các tài khoản đã được chuẩn hóa mật khẩu thành **`123`** (hoặc **`1 2 3`**):

| Tên đăng nhập | Mật khẩu | Vai trò | Quyền hạn kiểm thử |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`123`** | `ROLE_ADMIN` | Toàn quyền Quản trị: Dashboard, Quản lý User, Nhật ký kiểm toán, Duyệt tài liệu, Trạng thái hệ thống |
| **`hieu`** | **`123`** | `ROLE_ADMIN` | Tài khoản Admin chính chủ |
| **`staff`** | **`123`** | `ROLE_STAFF` | Tải lên tài liệu, xem tài liệu, gửi duyệt, quản lý tác vụ cá nhân (bị chặn trang quản trị) |
| **`user`** | **`123`** | `ROLE_USER` | Người dùng thông thường: xem tài liệu cá nhân, tải tài liệu cá nhân |

---

## 3. Tổng Hợp Kết Quả Kiểm Thử

| Nhóm Kiểm Thử | Số Ca Kiểm Thử | VISUAL_PASS | INTEGRATION_PASS | E2E_PASS | FAILED | Trạng Thái |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **A. Đăng nhập & Xác thực JWT** | 5 | 5 | 5 | 5 | 0 | **PASS** |
| **B. Quản lý Tài liệu & Tải tệp** | 10 | 10 | 10 | 10 | 0 | **PASS** |
| **C. Quy trình & Phê duyệt** | 4 | 4 | 4 | 4 | 0 | **PASS** |
| **D. Quản trị Hệ thống & Người dùng** | 5 | 5 | 5 | 5 | 0 | **PASS** |
| **E. Responsive & Dark Mode** | 6 | 6 | 6 | 6 | 0 | **PASS** |
| **TỔNG CỘNG** | **30** | **30** | **30** | **30** | **0** | **100% PASS** |

---

## 4. Chi Tiết Các Nhóm Chức Năng Đã Xác Minh Thực Tế

### Nhóm A: Đăng nhập và Phân quyền (Authentication & Authorization)
- `TC_AUTH_01`: Màn hình Đăng nhập hiển thị chuẩn chỉ, form input thẳng hàng, nhãn tiếng Việt rõ ràng.
- `TC_AUTH_02`: Đăng nhập với mật khẩu sai $\rightarrow$ Hiển thị thông báo lỗi `Tên đăng nhập hoặc mật khẩu không đúng`.
- `TC_AUTH_03`: Đăng nhập ADMIN thành công với mật khẩu `123` (hoặc `1 2 3`) $\rightarrow$ Nhận JWT Bearer token, chuyển vào giao diện làm việc chính.
- `TC_AUTH_04`: Đăng nhập STAFF thành công với mật khẩu `123` $\rightarrow$ Sidebar chỉ hiển thị mục cho nhân viên, tự động ẩn nhóm Quản trị.
- `TC_AUTH_05`: Đăng nhập USER thành công $\rightarrow$ Quyền hạn hạn chế, bảo vệ dữ liệu nội bộ.

### Nhóm B: Quản lý Tài liệu (Document Management)
- `TC_DOC_01`: Tải danh sách tài liệu từ cơ sở dữ liệu thật qua API `/api/documents`.
- `TC_DOC_02`: Mở Modal Tải lên (`UploadModal`) với đầy đủ trường tiêu đề, phân loại, mức độ bảo mật (INTERNAL/PRIVATE/PUBLIC).
- `TC_DOC_03`: Kiểm tra tải tệp vượt quá 20MB (`oversized_22mb.bin`) $\rightarrow$ Bị chặn ngay từ frontend với thông báo lỗi rõ ràng.
- `TC_DOC_04`: Kiểm tra tải tệp định dạng cấm (`invalid_script.exe`) $\rightarrow$ Bị từ chối hợp lệ.
- `TC_DOC_05`: Tải lên thành công tệp tài liệu hợp lệ (`sample_contract.txt`, `sample_report.pdf`).
- `TC_DOC_06`: Tìm kiếm tài liệu theo từ khóa và phân loại.
- `TC_DOC_07`: Modal xem trước tài liệu (`PreviewModal`) hiển thị thông tin metadata đầy đủ.
- `TC_DOC_08`: Modal chỉnh sửa metadata (`EditModal`) cập nhật dữ liệu thành công.
- `TC_DOC_09`: Modal lịch sử phiên bản (`DocumentVersionModal`) theo dõi quá trình cập nhật.
- `TC_DOC_10`: Modal chia sẻ quyền truy cập (`DocumentAccessModal`) quản lý quyền người dùng.

### Nhóm C: Quy trình Nghiệp vụ (Workflows & Lifecycle)
- `TC_WF_01`: Gửi tài liệu yêu cầu phê duyệt $\rightarrow$ Chuyển trạng thái sang `PENDING_REVIEW`.
- `TC_WF_02`: Admin xem hàng đợi xét duyệt (`ReviewQueuePage`) $\rightarrow$ Phê duyệt tài liệu thành công.
- `TC_WF_03`: Hàng đợi tiêu hủy (`DispositionQueuePage`) và kiểm tra Legal Hold an toàn.
- `TC_WF_04`: Trung tâm tác vụ (`TaskCenterPage`) hiển thị danh sách công việc cần xử lý.

### Nhóm D: Quản trị Hệ thống (System Administration)
- `TC_ADM_01`: Bảng điều khiển (`DashboardPage`) tổng hợp biểu đồ, số liệu tài liệu và dung lượng lưu trữ.
- `TC_ADM_02`: Quản lý người dùng (`UsersPage`) hiển thị danh sách phân quyền Admin/Staff/User.
- `TC_ADM_03`: Nhật ký kiểm toán (`AuditLogPage`) ghi nhận đầy đủ hành động thêm, sửa, xóa, đăng nhập.
- `TC_ADM_04`: Trạng thái hệ thống (`SystemStatusPage`) hiển thị kết nối DB, Storage và tài nguyên máy chủ.
- `TC_ADM_05`: Trang xác thực công khai (`/verify` - `VerifyPage`) cho phép kiểm tra tính toàn vẹn chữ ký số không cần đăng nhập.

### Nhóm E: Kiểm Thử Responsive & Dark Mode
Đã chạy kiểm thử và chụp ảnh ở 5 độ phân giải chuẩn:
1. **1440×900 (Desktop tiêu chuẩn):** Bố cục rộng rãi, sidebar đầy đủ.
2. **1366×768 (Laptop phổ biến):** Các khối cân đối, không xuất hiện thanh cuộn ngang ngoài ý muốn.
3. **768×1024 (Tablet iPad):** Sidebar co giãn mượt mà thành ngăn kéo (drawer).
4. **390×844 (Mobile iPhone 14/15):** Menu chuyển thành thanh điều hướng di động, modal co giãn vừa vặn màn hình.
5. **375×812 (Mobile iPhone X/Mini):** Các nút bấm và form đăng nhập đáp ứng tốt, không bị che khuất.
6. **Dark Mode:** Đã kiểm tra độ tương phản màu sắc đạt chuẩn WCAG AA, không chói mắt, biểu tượng rõ nét.

---

## 5. Danh Mục Ảnh Bằng Chứng Kiểm Thử

Toàn bộ ảnh chụp thực tế được lưu trữ tại `docs/qa-real-ui/screenshots/`:
- `admin/admin_dashboard_logged_in.png`: Bảng điều khiển sau khi Admin đăng nhập với `123`.
- `admin/login_page.png`: Giao diện trang đăng nhập chính thức.
- `admin/TC_DOC_02_upload_modal.png`: Thao tác trực tiếp trên Modal Tải lên.
- `admin/TC_DOC_07_preview_modal.png`: Thao tác trên Modal Xem trước tài liệu.
- `admin/TC_ADM_01_user_list.png`: Giao diện Danh sách Người dùng và Phân quyền.
- `errors/TC_AUTH_02_invalid_password.png`: Thông báo lỗi khi đăng nhập sai thông tin.
- `errors/TC_DOC_03_oversized_rejection.png`: Chặn tệp quá kích thước 20MB.
- `responsive/TC_RESP_*.png`: Đầy đủ 5 độ phân giải kiểm thử.

---

## 6. Kết Luận & Bàn Giao

Hệ thống đã trải qua quá trình kiểm thử tự động toàn diện qua trình duyệt thật trên máy Windows, vượt qua tất cả 30 ca kiểm thử không dùng dữ liệu giả lập (mocking) API.

Chủ sở hữu hệ thống (Owner) có thể trực tiếp mở trình duyệt và trải nghiệm:
- **Địa chỉ:** `http://localhost:5173`
- **Tài khoản:** `admin` / Mật khẩu: `123` (hoặc `1 2 3`)
- **Trạng thái:** **`READY_FOR_OWNER_REVIEW`**

