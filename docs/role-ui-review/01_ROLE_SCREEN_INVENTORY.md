# 01 — MA TRẬN MÀN HÌNH VÀ PHÂN QUYỀN GIAO DIỆN THEO VAI TRÒ
## (ROLE-BASED SCREEN & PERMISSION INVENTORY)

**Hệ thống**: Electronic Document Management System (EDMS) — Quản lý tài liệu điện tử doanh nghiệp  
**Tài liệu**: `docs/role-ui-review/01_ROLE_SCREEN_INVENTORY.md`  
**Nhánh thực hiện**: `feat/role-ui-refinement`  
**Ngày thực hiện**: 20/10/2026  
**Chuyên gia phụ trách**: Senior UI/UX Engineer, Frontend Architect & QA Lead  

---

> **Bằng chứng cần phân biệt (20/10/2026):** Ma trận này mô tả thiết kế/quy tắc dự kiến dựa trên mã nguồn. 22 screenshot của đợt này được chụp với **mocked API/JWT**, chưa xác minh RBAC runtime hoặc HTTP 403 trên Backend thật. Giao diện chuyển bằng `activeView` / custom event, không phải một URL router đầy đủ. Xem `04_FUNCTIONAL_REGRESSION.md` và `05_FINAL_UI_ACCEPTANCE.md` đã hiệu chỉnh trước khi trích dẫn nghiệm thu.

## 1. TỔNG QUAN HỆ THỐNG VAI TRÒ (RBAC OVERVIEW)

Hệ thống EDMS phân định 3 vai trò người dùng nội bộ và 1 đối tượng truy cập công khai:

1. **`ROLE_ADMIN` (Quản trị viên hệ thống - e.g. `hieu`)**: Toàn quyền cấu hình hệ thống, quản trị tài khoản, phân quyền, phê duyệt xét duyệt, phê duyệt tiêu hủy, xem bảng điều khiển số liệu, nhật ký kiểm toán và trạng thái hạ tầng.
2. **`ROLE_STAFF` (Chuyên viên nghiệp vụ - e.g. `tin`)**: Quyền quản trị tài liệu nghiệp vụ do mình tạo hoặc được phân quyền, tải lên tài liệu mới, cập nhật phiên bản, gửi tài liệu đi xét duyệt, yêu cầu tiêu hủy tài liệu, thực thi các tác vụ hiệu chỉnh được giao trong Trung tâm công việc. Không có quyền truy cập các màn hình quản trị hệ thống.
3. **`ROLE_USER` (Người dùng thông thường - e.g. `duc`)**: Quyền tìm kiếm và xem các tài liệu nội bộ hoặc tài liệu được chia sẻ cụ thể, tải xuống tệp tin, xem lịch sử phiên bản, theo dõi tác vụ cá nhân. Không có quyền truy cập cấu hình quản trị.
4. **`PUBLIC` (Khách vãng lai / Đối tác công khai)**: Người dùng chưa đăng nhập, chỉ có quyền truy cập trang Đăng nhập (`/login`) và Cổng giám định tính toàn vẹn chứng thư số công khai (`/verify`).

---

## 2. MA TRẬN PHÂN QUYỀN MÀN HÌNH THEO VAI TRÒ (SCREEN ACCESS MATRIX)

| STT | Màn hình / Phân hệ | Đường dẫn (Route) | Khách vãng lai (Public) | Người dùng (ROLE_USER) | Chuyên viên (ROLE_STAFF) | Quản trị viên (ROLE_ADMIN) | Cơ chế kiểm soát Backend |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | **Đăng nhập hệ thống** | `/login`, `/` | Cho phép | Chuyển hướng `/documents` | Chuyển hướng `/documents` | Chuyển hướng `/documents` | Public (`/api/auth/login`) |
| 2 | **Cổng kiểm định công khai** | `/verify` | Cho phép | Cho phép | Cho phép | Cho phép | Public (`/api/public/verify/**`) |
| 3 | **Quản lý kho tài liệu** | `/documents` | Chặn $\to$ Login | Cho phép (Theo ACL) | Cho phép (Theo ACL) | Cho phép (Toàn quyền) | `SecurityConfig` (`/api/documents/**`) |
| 4 | **Tìm kiếm đa chế độ** | `/documents` | Chặn $\to$ Login | Cho phép (Lexical/Semantic/Hybrid) | Cho phép (Lexical/Semantic/Hybrid) | Cho phép (Toàn văn & Metadata) | Authenticated |
| 5 | **Tải lên tài liệu mới** | Modal tại `/documents` | Chặn | Cho phép | Cho phép | Cho phép | `POST /api/documents` |
| 6 | **Xem trước tài liệu (Preview)** | Modal tại `/documents` | Chặn | Cho phép (Nếu có quyền đọc) | Cho phép (Nếu có quyền đọc) | Cho phép (Toàn quyền) | `GET /api/documents/{id}/preview` |
| 7 | **Tải tệp & Tải có Watermark** | Modal & Table Action | Chặn | Cho phép (Tải thường/Watermark) | Cho phép (Tải thường/Watermark) | Cho phép (Toàn quyền) | `GET /api/documents/{id}/download` |
| 8 | **Lịch sử phiên bản (Versions)**| Modal tại `/documents` | Chặn | Cho phép xem; Chặn upload nếu không có quyền EDIT | Cho phép tải bản mới nếu sở hữu | Cho phép tải bản mới & Khôi phục | `GET/POST /api/documents/{id}/versions` |
| 9 | **Phân quyền & Chia sẻ (ACL)** | Modal tại `/documents` | Chặn | Chặn | Cho phép nếu là OWNER | Cho phép (Toàn quyền) | `POST /api/documents/{id}/permissions` |
| 10 | **Quản lý vòng đời (Lifecycle)**| Modal tại `/documents` | Chặn | Chặn | Cho phép nếu là OWNER | Cho phép (Toàn quyền) | `POST /api/documents/{id}/lifecycle` |
| 11 | **Trung tâm công việc (Tasks)** | `/tasks` | Chặn $\to$ Login | Cho phép (Tác vụ cá nhân) | Cho phép (Tác vụ cá nhân/Hiệu chỉnh)| Cho phép (Toàn bộ tác vụ hệ thống) | `GET /api/tasks` |
| 12 | **Hàng đợi xét duyệt (Review)** | `/review-queue` | Chặn $\to$ Login | **Chặn** (HTTP 403 / Redirect) | **Chặn** (HTTP 403 / Redirect) | **Cho phép** (Duyệt / Từ chối) | `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` |
| 13 | **Hàng đợi tiêu hủy (Dispos.)**| `/disposition-queue` | Chặn $\to$ Login | **Chặn** (HTTP 403 / Redirect) | **Chặn** (HTTP 403 / Redirect) | **Cho phép** (Duyệt / Từ chối) | `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` |
| 14 | **Bảng điều khiển số liệu** | `/dashboard` | Chặn $\to$ Login | **Chặn** (HTTP 403 / Redirect) | **Chặn** (HTTP 403 / Redirect) | **Cho phép** (Giám sát KPI/Tài nguyên)| `@PreAuthorize("hasRole('ADMIN')")` |
| 15 | **Quản lý người dùng & Quyền** | `/users` | Chặn $\to$ Login | **Chặn** (HTTP 403 / Redirect) | **Chặn** (HTTP 403 / Redirect) | **Cho phép** (Tạo/Sửa/Khóa/Ma trận) | `@PreAuthorize("hasRole('ADMIN')")` |
| 16 | **Nhật ký kiểm toán an ninh** | `/audit` | Chặn $\to$ Login | **Chặn** (HTTP 403 / Redirect) | **Chặn** (HTTP 403 / Redirect) | **Cho phép** (Xem & Lọc Audit Log) | `@PreAuthorize("hasRole('ADMIN')")` |
| 17 | **Trạng thái hệ thống hạ tầng**| `/system-status` | Chặn $\to$ Login | **Chặn** (HTTP 403 / Redirect) | **Chặn** (HTTP 403 / Redirect) | **Cho phép** (Giám sát CPU/RAM/DB) | `@PreAuthorize("hasRole('ADMIN')")` |

---

## 3. CHI TIẾT GIAO DIỆN VÀ HÀNH VI THEO TỪNG VAI TRÒ

### 3.1. Vai trò Quản trị viên (`ROLE_ADMIN`)
- **Menu Sidebar hiển thị:**
  - Nhóm Kho Lưu Trữ: `Tài liệu`
  - Nhóm Quy Trình & Tác Vụ: `Công việc` (kèm huy hiệu số lượng), `Hàng đợi duyệt`, `Hàng đợi tiêu hủy`
  - Nhóm Quản Trị Hệ Thống: `Bảng điều khiển`, `Người dùng & Phân quyền`, `Nhật ký & Kiểm toán`, `Trạng thái hệ thống`
- **Nút thao tác trên bảng tài liệu:**
  - Nút trực tiếp: `Xem` (Preview nhanh), `Tải về` (Download tệp gốc).
  - Menu thao tác mở rộng: `Chỉnh sửa`, `Phân quyền & Chia sẻ`, `Lịch sử phiên bản`, `Gửi xét duyệt`, `Quản lý vòng đời`, `Lịch sử duyệt`, `In thẻ metadata`, `Yêu cầu tiêu hủy`.
- **Dữ liệu API gọi:**
  - `GET /api/documents`
  - `GET /api/tasks` (nhận đủ cả `REVIEW_PENDING`, `DISPOSITION_PENDING`, `REVISION_REQUIRED`)
  - `GET /api/admin/reviews?status=PENDING`
  - `GET /api/admin/dispositions?status=PENDING`
  - `GET /api/admin/dashboard`
  - `GET /api/admin/users` & `GET /api/admin/roles/permissions`
  - `GET /api/admin/audit-logs`
  - `GET /api/admin/system/status`
- **Hành vi thực tế kiểm chứng:** Tất cả màn hình hiển thị đầy đủ, dữ liệu kết nối chính xác, các nút thao tác phản hồi chuẩn mực, không có lỗi 403.

### 3.2. Vai trò Chuyên viên (`ROLE_STAFF`)
- **Menu Sidebar hiển thị:**
  - Nhóm Kho Lưu Trữ: `Tài liệu`
  - Nhóm Quy Trình & Tác Vụ: `Công việc` (chỉ hiển thị số lượng tác vụ hiệu chỉnh cần làm)
  - Nhóm Quản Trị Hệ Thống: **Ẩn hoàn toàn 100%**.
- **Nút thao tác trên bảng tài liệu:**
  - Nút trực tiếp: `Xem`, `Tải về`.
  - Menu thao tác mở rộng:
    - Đối với tài liệu do mình tạo: `Chỉnh sửa`, `Lịch sử phiên bản`, `Gửi xét duyệt` (khi DRAFT), `Chia sẻ`, `Vòng đời`, `Yêu cầu tiêu hủy`.
    - Đối với tài liệu của người khác được chia sẻ chế độ EDIT: `Chỉnh sửa`, `Lịch sử phiên bản`.
    - Đối với tài liệu chỉ có quyền READ: Menu chỉ cho phép `Lịch sử phiên bản`, `In thẻ metadata`. Các nút sửa/xóa/chia sẻ bị ẩn hoặc vô hiệu hóa.
- **Hành vi an ninh Backend:** Nếu nhập trực tiếp URL `/dashboard`, `/users`, `/review-queue` trên thanh địa chỉ, `App.tsx` tự động bảo vệ và đưa người dùng về `/documents`. Nếu cố tình gửi request trực tiếp bằng API, Backend Spring Security chặn với mã lỗi `403 Forbidden`.

### 3.3. Vai trò Người dùng (`ROLE_USER`)
- **Menu Sidebar hiển thị:**
  - Nhóm Kho Lưu Trữ: `Tài liệu`
  - Nhóm Quy Trình & Tác Vụ: `Công việc`
  - Nhóm Quản Trị Hệ Thống: **Ẩn hoàn toàn 100%**.
- **Nút thao tác trên bảng tài liệu:**
  - Nút trực tiếp: `Xem`, `Tải về`.
  - Menu thao tác: `Lịch sử phiên bản`, `In thẻ metadata`. Không được sửa, xóa hoặc đổi trạng thái tài liệu của phòng ban khác.
- **Hành vi an ninh Backend:** Chặn toàn bộ các endpoint thuộc `/api/admin/**`.

### 3.4. Khách vãng lai (Chưa đăng nhập - Public)
- **Truy cập:**
  - Truy cập bất kỳ URL nội bộ nào $\to$ Chuyển hướng tức thì đến màn hình Đăng nhập (`/login`).
  - Truy cập `/verify` $\to$ Mở Cổng tra cứu & kiểm định chứng thư số công khai.
- **Thao tác trên Cổng kiểm định:**
  - Tra cứu bằng mã băm SHA-256 hoặc Mã tài liệu + Số phiên bản.
  - Kéo thả tệp tin bất kỳ để kiểm tra tính toàn vẹn và tình trạng chữ ký số RSA-2048 mà không cần đăng nhập.
