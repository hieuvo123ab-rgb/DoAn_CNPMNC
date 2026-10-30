# BÁO CÁO THIẾT KẾ & SỬA LỖI GIAO DIỆN MODERN AURORA (UI REVIEW)

**Dự án:** EDMS — Hệ thống Quản lý và Lưu trữ Tài liệu Điện tử  
**Vai trò:** Senior UI/UX Product Designer, Senior React Frontend Engineer & QA Engineer  
**Nhánh làm việc:** `feat/edms-modern-aurora-ui` (kế thừa PR #14 `18fd753`)  
**Môi trường kiểm thử:** Docker Desktop Windows (React UI port 5173 / Nginx 8088, Spring Boot Backend port 8080, PostgreSQL 16)  
**Thời điểm thực hiện:** 2026-10-30  
**Kết luận tổng thể:** **`READY_FOR_OWNER_REVIEW`**

---

## 1. Xác Minh Lỗi CSS Gốc & Nguyên Nhân Kỹ Thuật

Qua quá trình rà soát trực tiếp mã nguồn và đối chiếu giữa JSX và CSS, đã phát hiện nguyên nhân gốc rễ gây ra việc hiển thị thô/giống HTML mặc định:

| Component | Các Class JSX Sử Dụng | Trạng thái trong `index.css` cũ | Hậu quả hiển thị thực tế |
| :--- | :--- | :--- | :--- |
| **`NotificationPanel.tsx`** | `notification-panel-dropdown`, `notification-panel-header`, `notification-panel-body`, `notification-item`, `notification-title`, `notification-message`, `filter-pill`, `btn-mark-all`, `btn-mark-single-read` | **HOÀN TOÀN THIẾU** (0/9 class tồn tại) | Bảng thông báo tràn màn hình, các nút Tất cả / Chưa đọc là thẻ `<button>` xám mặc định của trình duyệt, icon không cùng hàng, tiêu đề dính chặt vào nội dung, không có thanh cuộn giới hạn chiều cao. |
| **`UsersPage.tsx`** | `table-responsive-card`, `data-table`, `action-buttons-group`, `btn-icon`, `badge-role`, `status-pill` | **THIẾU** hoặc chưa định nghĩa đầy đủ | Bảng dữ liệu 172 dòng kết xuất thẳng vào DOM mà không có phân trang, các cột sát nhau, nút Sửa/Khóa bị co nhỏ như icon thô, họ tên và email dính chùm, nhãn vai trò hiển thị mã kỹ thuật `ROLE_*`. |
| **`TaskCenterPage.tsx`** | Inline styles rải rác, thiếu layout card đồng bộ | Style cứng không theo design tokens | 354 công việc kết xuất cùng lúc gây giật lag DOM, badge 744 nổi bật quá mức, KPI cards không có viền và bóng mềm đồng nhất. |

### Cách giải quyết tận gốc:
1. **Không dùng `!important` tràn lan:** Xây dựng hệ thống class BEM chuẩn mực (`.notification-panel-*`, `.data-table`, `.task-kpi-*`).
2. **Không thêm thư viện UI cồng kềnh:** Tái cấu trúc và chuẩn hóa triệt để trên nền hệ thống React + CSS Variables hiện có.
3. **Phân trang hiệu năng cao:** Bổ sung cơ chế phân trang Client-side Pagination linh hoạt cho cả Trang Quản lý người dùng và Trung tâm công việc, cho phép hiển thị tức thì, hỗ trợ chọn 10, 15, 25, 50 dòng/trang.

---

## 2. Hệ Thống Màu Sắc & Design Tokens Phong Cách Modern Aurora

Đã định nghĩa và kích hoạt bảng màu Modern Aurora chính thức tại `:root` và `[data-theme="dark"]`:

```css
:root {
  /* Modern Aurora Brand Colors */
  --color-navy: #111D35;                 /* Deep Navy */
  --color-primary: #4F72EA;              /* Primary Blue */
  --color-primary-hover: #3E60D6;
  --color-lavender: #9C8AE8;             /* Soft Lavender */
  --color-mint: #42BBAF;                 /* Mint Teal (Success) */
  --color-mint-subtle: #E6F7F5;
  --color-mint-text: #0E6B62;

  /* Master Modern Aurora Gradient */
  --color-primary-gradient: linear-gradient(110deg, #4F72EA 0%, #9380E9 100%);
  --color-primary-gradient-hover: linear-gradient(110deg, #4264DC 0%, #8672DE 100%);

  /* Canvas & Surfaces */
  --color-bg: #F3F5FC;                   /* Nền nội dung xám xanh rất nhạt */
  --color-surface: #FFFFFF;              /* Card trắng viền nhẹ */
  --color-table-header-bg: #F4F6FC;      /* Header bảng xám tím nhạt */

  /* Sidebar Theme */
  --color-sidebar: #111D35;              /* Deep Navy hơi pha ánh tím */
  --color-sidebar-surface: #182748;
  --color-sidebar-hover: #1E315A;
  --color-sidebar-active: #4F72EA;
  --color-sidebar-active-bg: rgba(79, 114, 234, 0.16);

  /* Typography */
  --color-text-main: #17233B;            /* Primary Text */
  --color-text-secondary: #4A5872;
  --color-text-muted: #697892;            /* Secondary Text */
}
```

---

## 3. Chi Tiết Các Màn Hình Đã Nâng Cấp

### A. Notification Panel (Ưu tiên cao nhất — Hoàn thiện 100%)
- **Kích thước chuẩn chỉnh:** Chiều rộng 410px (tối đa 92vw trên mobile), chiều cao tối đa `min(620px, 75vh)`.
- **Thanh cuộn độc lập:** Header và thanh lọc được cố định (`position: sticky`), danh sách thông báo cuộn mượt mà bên trong (`overflow-y: auto`, thanh cuộn mảnh).
- **Header:** Icon chuông trong khung mềm, tiêu đề "Thông báo", huy hiệu đếm số lượng chưa đọc (`notif-unread-count-pill`) gradient xanh tím, nút đóng X rõ nét.
- **Bộ lọc Segmented Control:** Tất cả \| Chưa đọc với hiệu ứng trượt nhẹ; Nút "Đã đọc tất cả" có icon `CheckCheck` và tự động disabled khi không còn thông báo chưa đọc.
- **Từng dòng thông báo (Notification Item):**
  - Icon phân loại sự kiện (Chia sẻ, Duyệt, Tiêu hủy, Ký số, Cảnh báo) trong khung nền màu riêng biệt.
  - Tiêu đề giới hạn 2 dòng với tooltip đầy đủ khi di chuột.
  - Nội dung giới hạn 3 dòng, tự động xuống dòng (`word-break: break-word`), không gây tràn ngang.
  - Thời gian hiển thị tương đối thân thiện ("5 phút trước", "2 giờ trước") kèm tooltip ngày giờ chính xác `vi-VN`.
  - Chấm tròn xanh chỉ thị trạng thái chưa đọc rõ nét.
  - Nút "Đã đọc" bấm nhanh cho từng thông báo không gây nhảy trang.

### B. Trang Quản Lý Người Dùng (`UsersPage.tsx`)
- **Header:** Tiêu đề "Quản lý người dùng", phụ đề mô tả rõ ràng, nút "Thêm người dùng" nổi bật bằng gradient xanh tím (`linear-gradient(110deg, #4F72EA 0%, #9380E9 100%)`).
- **Thanh công cụ lọc:**
  - Ô tìm kiếm rộng có icon Search và nút X xóa nhanh từ khóa.
  - Bộ lọc Vai trò: Tất cả, Quản trị viên (ADMIN), Nhân viên (STAFF), Người dùng (USER).
  - Bộ lọc Trạng thái: Tất cả, Đang hoạt động, Đã khóa.
  - Tổng số lượng tài khoản hiển thị trực quan bên phải.
- **Bảng dữ liệu Người dùng:**
  - Bọc trong card viền bo góc nhẹ, header xám tím nhạt (`#F4F6FC`).
  - Cột Người dùng: Avatar tròn chữ cái đầu, tên đăng nhập in đậm, họ tên phụ đề bên dưới, huy hiệu `(Bạn)` cho tài khoản hiện tại.
  - Cột Email: Hiển thị email riêng biệt, rõ ràng, không dính chùm vào họ tên.
  - Vai trò Việt hóa hoàn toàn:
    - `ROLE_ADMIN` $\rightarrow$ **Quản trị viên** (Badge gradient tím lavender)
    - `ROLE_STAFF` $\rightarrow$ **Nhân viên** (Badge xanh dương dịu)
    - `ROLE_USER` $\rightarrow$ **Người dùng** (Badge xám đá thanh lịch)
  - Trạng thái: Pill bo tròn xanh ngọc Mint Teal cho "Hoạt động" và hồng san hô cho "Đã khóa".
  - Thao tác: Cụm nút Sửa và Khóa/Mở khóa đạt kích thước chuẩn ngón tay (36×36px), tooltip giải thích đầy đủ, chặn tự khóa tài khoản của chính mình.
- **Phân trang thông minh:** Chia 172 tài khoản thành từng trang (15 tài khoản/trang), có bộ chọn kích thước trang (10, 15, 25, 50) và các nút điều hướng Đầu / Trước / Sau / Cuối.

### C. Trung Tâm Công Việc (`TaskCenterPage.tsx`)
- **Hệ thống KPI Cards:** 4 card thống kê (Tất cả công việc, Chờ duyệt tài liệu, Chờ duyệt tiêu hủy, Cần hiệu chỉnh lại) thiết kế theo chuẩn Modern Aurora với đường chỉ thị màu ngữ nghĩa trên đỉnh card, nhãn chữ in hoa nhỏ gọn, số lượng lớn đậm nét (`1.85rem`).
- **Lọc theo ngữ cảnh:** Click vào từng thẻ KPI sẽ lọc trực tiếp danh sách công việc tương ứng.
- **Danh sách công việc:**
  - Tách biệt thành card danh sách riêng, có ô tìm kiếm nhanh theo mã tài liệu hoặc tiêu đề.
  - Phân trang gọn gàng cho 354 công việc, không làm lag trình duyệt.
  - Từng dòng công việc có icon dạng tròn, tiêu đề tài liệu, huy hiệu phiên bản (`v1.0`), mã số tài liệu, thời gian `vi-VN` và nút "Xử lý xét duyệt" / "Xử lý tiêu hủy" / "Tải phiên bản mới" có mũi tên chuyển động nhẹ.

### D. Đồng Bộ Toàn Bộ Các Trang Khác
- **Thanh điều hướng Sidebar:** Màu Deep Navy (`#111D35`), mục đang chọn (active) có viền trái xanh dương `#4F72EA` và nền tím nhạt mờ; số lượng công việc trên sidebar định dạng gọn `99+` nếu vượt quá 99 nhưng vẫn hiển thị số thực 744 trong tooltip.
- **Thanh Topbar:** Nút chuông thông báo có huy hiệu đếm số lượng gradient, avatar người dùng tròn thanh lịch.
- **Modal hệ thống (`CreateUserModal`, `EditUserModal`, v.v.):** Input có focus-ring màu lavender-blue, nút bấm gradient, chuyển động mượt mà 180ms.
- **Dark Mode:** Toàn bộ hệ thống tự động thích ứng với bảng màu Dark Deep Navy (`#0C1322` nền, `#111D35` card, `#1E2F52` border, `#F3F5FC` chữ), không gây chói mắt.

---

## 4. Bằng Chứng Xác Minh Thực Tế Qua Trình Duyệt Chrome

Đã thực hiện kiểm thử tự động toàn diện qua Chrome thật và lưu trữ ảnh chụp tại `docs/ui-modernization/screenshots/`:

| Tên ảnh chụp | Màn hình / Trạng thái kiểm thử | Kết quả kiểm tra |
| :--- | :--- | :---: |
| `notifications/01_notification_panel_open.png` | Notification Panel mở trên Desktop 1440×900 | **PASS** |
| `notifications/02_notification_filter_unread.png` | Lọc thông báo chưa đọc trong Notification Panel | **PASS** |
| `tasks/01_task_center_overview.png` | Trang Công việc với 4 KPI Cards Modern Aurora | **PASS** |
| `tasks/02_task_center_filter_review.png` | Lọc công việc chờ duyệt từ KPI card | **PASS** |
| `users/01_users_table_paginated.png` | Bảng Quản lý người dùng trang 1 (15 dòng/trang) | **PASS** |
| `users/02_users_table_page_2.png` | Phân trang sang trang 2 của danh sách người dùng | **PASS** |
| `users/03_create_user_modal.png` | Modal Thêm người dùng mới | **PASS** |
| `users/04_role_permissions_matrix.png` | Tab Ma trận phân quyền vai trò | **PASS** |
| `users/05_document_management_aurora.png` | Trang Quản lý tài liệu theo giao diện mới | **PASS** |
| `responsive/vp_laptop_1366x768.png` | Độ phân giải Laptop 1366×768 | **PASS** |
| `responsive/vp_tablet_768x1024.png` | Độ phân giải Tablet iPad 768×1024 | **PASS** |
| `responsive/vp_mobile_390x844.png` | Độ phân giải Mobile iPhone 14/15 (390×844) | **PASS** |
| `responsive/vp_mobile_375x812.png` | Độ phân giải Mobile iPhone X (375×812) | **PASS** |
| `dark-mode/01_dark_mode_documents.png` | Dark Mode trên trang Tài liệu | **PASS** |
| `dark-mode/02_dark_mode_notifications.png` | Dark Mode trên Notification Panel | **PASS** |
| `dark-mode/03_dark_mode_tasks.png` | Dark Mode trên Trung tâm công việc | **PASS** |
| `dark-mode/04_dark_mode_users.png` | Dark Mode trên Quản lý người dùng | **PASS** |

---

## 5. Kết Quả Kiểm Tra Kỹ Thuật (DevTools & Build)

1. **Computed Styles & Layout:**
   - Chiều cao dòng trong User Table: $58\text{px} - 62\text{px}$ (đạt chuẩn 56–64px).
   - Nút hành động Sửa/Khóa: $36\text{px} \times 36\text{px}$ (đạt chuẩn tối thiểu 36–40px).
   - Bảng thông báo: $410\text{px}$ chiều rộng, cuộn trong $510\text{px}$ chiều cao nội dung.
2. **Horizontal Overflow:**
   - Không xuất hiện thanh cuộn ngang ngoài ý muốn trên toàn bộ 5 độ phân giải (1440, 1366, 768, 390, 375).
3. **Console & Runtime Errors:**
   - `consoleErrors: []` — Không có bất kỳ lỗi Runtime hoặc Warning nghiêm trọng nào.
4. **Build & Typecheck:**
   - `npm run build` chạy thành công 100% trong 5.29s (`tsc && vite build`).
5. **Dữ liệu và Quyền hạn:**
   - Toàn bộ 172 tài khoản, 354 công việc và quyền hạn `ROLE_*` trong database được bảo toàn nguyên vẹn.

---

## 6. Trạng Thái Bàn Giao

Hệ thống đã được kiểm tra thực tế, chụp ảnh đối chiếu và chạy trên Docker:
- **Địa chỉ:** `http://localhost:5173`
- **Nhánh Git:** `feat/edms-modern-aurora-ui`
- **Tình trạng:** **`READY_FOR_OWNER_REVIEW`**

