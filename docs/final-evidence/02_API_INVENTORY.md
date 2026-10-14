# 02 — API INVENTORY

**Project**: Electronic Document Management System (EDMS)  
**Base URL**: `http://localhost:8080/api`  
**Authentication**: Bearer Token (JWT) in `Authorization: Bearer <token>` Header

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Path | Required Role / Auth | Description | Audit Action |
| :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public (Unauthenticated) | Xác thực danh tính người dùng bằng `username` và `password`. Trả về JWT token, thông tin vai trò, và hồ sơ người dùng. | `LOGIN_SUCCESS` / `LOGIN_FAILED` |
| `POST` | `/api/auth/logout` | Authenticated | Kết thúc phiên làm việc của người dùng hiện tại và vô hiệu hóa token trên client. | `LOGOUT` |

---

## 2. Document Management Endpoints (`/api/documents`)

| Method | Path | Required Role / Auth | Description | Audit Action |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/documents` | `ROLE_STAFF`, `ROLE_ADMIN` | Lấy danh sách tài liệu. Hỗ trợ tìm kiếm theo từ khóa (`q`) và lọc theo thể loại (`documentType`). | — |
| `GET` | `/api/documents/mine` | `ROLE_STAFF`, `ROLE_ADMIN` | Lấy danh sách các tài liệu do chính người dùng hiện tại tải lên và quản lý. Hỗ trợ tìm kiếm (`q`) và lọc (`documentType`). | — |
| `GET` | `/api/documents/{id}` | `ROLE_STAFF`, `ROLE_ADMIN` | Lấy thông tin chi tiết đặc tả (metadata) của một tài liệu theo ID. | `DOCUMENT_VIEW` |
| `POST` | `/api/documents` | `ROLE_STAFF`, `ROLE_ADMIN` | Tải lên tệp tài liệu mới kèm metadata qua `multipart/form-data` (`file`, `title`, `description`, `documentType`). | `DOCUMENT_UPLOAD` |
| `PUT` | `/api/documents/{id}` | Owner `ROLE_STAFF`, `ROLE_ADMIN` | Cập nhật thông tin tài liệu (tiêu đề, mô tả, phân loại). Nhân viên chỉ được cập nhật tài liệu do mình sở hữu. | `DOCUMENT_UPDATE` |
| `GET` | `/api/documents/{id}/preview` | `ROLE_STAFF`, `ROLE_ADMIN` | Truy xuất luồng dữ liệu tệp inline để xem trước trực tiếp trên giao diện trình duyệt. | `DOCUMENT_PREVIEW` |
| `GET` | `/api/documents/{id}/download` | `ROLE_STAFF`, `ROLE_ADMIN` | Tải tệp tài liệu về máy trạm kèm `Content-Disposition: attachment`. | `DOCUMENT_DOWNLOAD` |

---

## 3. Saved Search Endpoints (`/api/saved-searches`)

| Method | Path | Required Role / Auth | Description | Audit Action |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/saved-searches` | Authenticated | Lấy danh sách các bộ lọc tìm kiếm đã lưu của người dùng hiện tại (cô lập dữ liệu theo từng user). | — |
| `POST` | `/api/saved-searches` | Authenticated | Lưu lại điều kiện tìm kiếm hiện tại (`name`, `query`, `documentType`). | `SAVED_SEARCH_CREATE` |
| `DELETE` | `/api/saved-searches/{id}` | Owner Authenticated | Xóa bộ lọc tìm kiếm đã lưu của người dùng hiện tại. | `SAVED_SEARCH_DELETE` |

---

## 4. Admin User Management Endpoints (`/api/admin/users`)

| Method | Path | Required Role / Auth | Description | Audit Action |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | `ROLE_ADMIN` | Lấy danh sách toàn bộ tài khoản người dùng trong hệ thống (tuyệt đối không để lộ mật khẩu hay password hash). | — |
| `POST` | `/api/admin/users` | `ROLE_ADMIN` | Tạo tài khoản người dùng mới. Mật khẩu được mã hóa an toàn chuẩn BCrypt. Chặn trùng lặp với mã `409 Conflict`. | `USER_CREATE` |
| `PUT` | `/api/admin/users/{id}` | `ROLE_ADMIN` | Cập nhật thông tin người dùng và phân quyền vai trò. Áp dụng cơ chế Last Active Admin Guard. | `USER_ROLE_CHANGE` / `USER_UPDATE` |
| `PATCH` | `/api/admin/users/{id}/status` | `ROLE_ADMIN` | Kích hoạt hoặc vô hiệu hóa tài khoản người dùng (`?enabled=true/false`). Chặn vô hiệu hóa Admin duy nhất. | `USER_ENABLE` / `USER_DISABLE` |

---

## 5. Role & Permission Management Endpoints (`/api/admin/roles`)

| Method | Path | Required Role / Auth | Description | Audit Action |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/roles/permissions` | `ROLE_ADMIN` | Trả về ma trận quyền hạn chi tiết giữa các vai trò `ROLE_ADMIN` và `ROLE_STAFF`. | — |

---

## 6. Monitoring, Statistics & Audit Endpoints (`/api/admin`)

| Method | Path | Required Role / Auth | Description | Audit Action |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | `ROLE_ADMIN` | Lấy dữ liệu tổng hợp Dashboard điều hành: tổng tài liệu, dung lượng, người dùng, lượt tải/xem/cập nhật và 10 hoạt động gần nhất. | — |
| `GET` | `/api/admin/statistics/documents` | `ROLE_ADMIN` | Thống kê số liệu tài liệu thực tế trong CSDL: tổng số lượng, biểu đồ phân loại theo thể loại, tổng dung lượng lưu trữ. | — |
| `GET` | `/api/admin/statistics/usage` | `ROLE_ADMIN` | Thống kê tần suất sử dụng thực tế từ AuditLog: tổng lượt tải lên, xem trước, tải xuống, cập nhật và số lượng người dùng hoạt động. | — |
| `GET` | `/api/admin/activity` | `ROLE_ADMIN` | Lấy danh sách lịch sử hoạt động dạng trực quan, sắp xếp giảm dần theo thời gian (newest-first). Hỗ trợ tham số `limit`. | — |
| `GET` | `/api/admin/audit-logs` | `ROLE_ADMIN` | Truy xuất nhật ký kiểm toán hệ thống chuyên sâu phục vụ truy vết. Hỗ trợ phân trang (`page`, `size`) và lọc (`username`, `action`, `resourceType`). | — |

---

## 7. System Health Endpoint (`/api/health`)

| Method | Path | Required Role / Auth | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/health` | Public (Unauthenticated) | Kiểm tra trạng thái sẵn sàng hoạt động của ứng dụng Backend (`status: "UP"`). |
