# 01 — BÁO CÁO KIỂM TOÁN GIAO DIỆN HIỆN TẠI (FRONTEND UI/UX AUDIT)

**Hệ thống**: Electronic Document Management System (EDMS)  
**Tài liệu**: `docs/ui-modernization/01_UI_AUDIT_REPORT.md`  
**Nhánh thực hiện**: `feat/enterprise-ui-modernization`  
**Ngày thực hiện**: 20/10/2026  
**Kiểm toán viên**: Senior Full-Stack Engineer & UI/UX Design System Lead  

---

## 1. TỔNG QUAN HIỆN TRẠNG KIẾẾN TRÚC FRONTEND

Hệ thống Frontend EDMS hiện tại được xây dựng trên nền tảng React 18, TypeScript 5.5, Vite 5.4 và Lucide Icons. Mặc dù đã đạt đầy đủ 100% chức năng nghiệp vụ và vượt qua 464 bài kiểm thử runtime/security, giao diện người dùng hiện tại còn mang nhiều đặc điểm phân mảnh qua các giai đoạn phát triển:

- **10 Trang (Pages)**: `LoginPage`, `DocumentsPage`, `DashboardPage`, `UsersPage`, `ReviewQueuePage`, `DispositionQueuePage`, `TaskCenterPage`, `AuditLogPage`, `SystemStatusPage`, `VerifyPage`.
- **13 Components / Modals**: `Navbar`, `NotificationPanel`, `UploadModal`, `PreviewModal`, `EditModal`, `DocumentVersionModal`, `DocumentLifecycleModal`, `DocumentReviewHistoryModal`, `DocumentAccessModal`, `CreateUserModal`, `EditUserModal`, `PrintMetadataModal`, `SaveSearchModal`.
- **Định dạng giao diện**: Vanilla CSS tập trung tại [`frontend/src/index.css`](file:///f:/DoAn_CNPMNC/frontend/src/index.css) (hơn 1.800 dòng CSS).

---

## 2. BẢNG PHÂN LOẠI VẤN ĐỀ GIAO DIỆN (UI/UX ISSUE REGISTER)

| Mã vấn đề | Phân hệ / Màn hình | Mô tả thực tế phát hiện | Mức độ nghiêm trọng | Giải pháp khắc phục mục tiêu |
| :---: | :--- | :--- | :---: | :--- |
| **UI-01** | **Toàn hệ thống (Layout)** | Thanh điều hướng `Navbar` dạng ngang đặt trên đỉnh trang chứa tới 8 nút chữ dài; khi co về laptop 1366px hoặc tablet 1024px bị xuống dòng thành 2-3 hàng, đẩy nội dung làm việc xuống dưới. Từng trang tự render `<Navbar />` thay vì dùng một khung `AppLayout` chuẩn. | **MAJOR** | Chuyển đổi sang kiến trúc **Enterprise Collapsible Sidebar Layout** (thanh bên có thể thu gọn), phân nhóm menu khoa học (*Kho lưu trữ*, *Quy trình*, *Quản trị*), kèm Topbar thanh lịch (Breadcrumb, Global Search, WebSocket Badge, Notification Bell, Theme Switcher). |
| **UI-02** | **Design Tokens & Theme** | Bảng màu chưa đồng nhất; thiếu hệ thống tokens ngữ nghĩa phân lớp (`--bg-primary`, `--bg-surface`, `--text-primary`, `--border-subtle`). Chưa hỗ trợ Dark Mode hoàn chỉnh. Đổ bóng (shadows) còn thô và viền bảng có độ tương phản chưa tối ưu. | **MAJOR** | Xây dựng Enterprise Design System chuẩn SaaS: Bảng màu Navy / Slate / Deep Blue; hỗ trợ chuyển đổi Light Mode & Dark Mode hoàn chỉnh; chuẩn hóa Typography, Radius (8-12px), và Multi-layer Shadows tinh tế. |
| **UI-03** | **Modals & Dialogs** | 13 Modal tự định nghĩa cấu trúc backdrop, nút đóng, padding riêng biệt. Chưa có cơ chế khóa cuộn trang (`body scroll lock`), thiếu xử lý đóng modal bằng phím `Escape` đồng bộ, chưa có `ConfirmationModal` chuẩn cho thao tác xóa/tiêu hủy. | **MAJOR** | Xây dựng bộ component Modal tái sử dụng (`EnterpriseModal`, `ConfirmationModal`) có backdrop blur cao cấp, hiệu ứng mở mượt mà, hỗ trợ phím `Esc`, click outside, và tiêu đề/footer chuẩn hóa. |
| **UI-04** | **Trạng thái tải (Loading)** | Đa số các trang khi tải dữ liệu chỉ hiển thị text `"Đang tải..."` hoặc spinner đơn điệu, gây hiện tượng nhảy bố cục (Cumulative Layout Shift - CLS) khi dữ liệu xuất hiện. | **MINOR** | Xây dựng component `SkeletonLoader` cho Table Rows, Stats Cards, và Detail Panels, tạo cảm giác mượt mà và chuyên nghiệp. |
| **UI-05** | **Trạng thái rỗng (Empty States)** | Khi bảng tài liệu, hàng đợi duyệt hoặc danh sách tác vụ không có dữ liệu, giao diện chỉ hiển thị dòng chữ đơn giản `"Không có dữ liệu"` mà không có hình minh họa trực quan hay nút hành động kế tiếp. | **MINOR** | Xây dựng component `EmptyState` chuẩn với icon ngữ cảnh, thông điệp hướng dẫn rõ ràng và nút Call-To-Action (CTA) phù hợp. |
| **UI-06** | **Chống Double-Submit & Form States** | Một số nút submit (Upload, Ký duyệt, Tạo người dùng) chưa tự động vô hiệu hóa (`disabled`) kèm spinner loading trong khi request đang gửi, tiềm ẩn nguy cơ bấm đúp gửi trùng lặp. | **MINOR** | Xây dựng component `EnterpriseButton` tích hợp sẵn cờ `isLoading`, tự động hiển thị spinner và khóa tương tác trong lúc thực thi. |
| **UI-07** | **Trang Đăng nhập (LoginPage)** | Giao diện đăng nhập hiện tại là một form đơn độc giữa màn hình, thiếu nhận diện thương hiệu doanh nghiệp, thiếu hình ảnh đồ họa chuyên nghiệp và chưa tối ưu tỷ lệ trên màn hình siêu rộng. | **UI POLISH** | Thiết kế lại trang Login theo chuẩn Enterprise Split-Screen: Một bên là Showcase tính năng an ninh số & bảo mật tài liệu doanh nghiệp, một bên là Form đăng nhập thanh lịch với thông báo lỗi và cảnh báo Rate Limit đếm ngược trực quan. |
| **UI-08** | **Bảng dữ liệu & Thao tác nhanh (Table & Actions)** | Bảng tài liệu ở `DocumentsPage` và `AuditLogPage` có quá nhiều cột; các nút hành động (Xem, Tải, Sửa, Quyền, Vòng đời, Ký) chiếm diện tích lớn. | **UI POLISH** | Tối ưu hàng dữ liệu: Nhóm các hành động phụ vào menu dropdown hành động (`ActionMenu`), giữ lại các nút chính nổi bật; làm nổi bật huy hiệu trạng thái vòng đời và chữ ký số. |
| **UI-09** | **Khả năng tiếp cận & Phím tắt (A11y)** | Nhiều nút bấm chỉ có icon mà thiếu `aria-label`; trạng thái `:focus-visible` chưa rõ nét cho người dùng điều hướng bằng bàn phím. | **UI POLISH** | Bổ sung đầy đủ `aria-label`, thẻ accessibility và vòng viền focus ring nổi bật (`outline: 2px solid var(--color-primary)`). |

---

## 3. DANH MỤC ẢNH MINH CHỨNG TRƯỚC KHI NÂNG CẤP (BEFORE SCREENSHOTS)

Toàn bộ ảnh chụp thực tế trạng thái giao diện trước khi nâng cấp đã được lưu trữ vĩnh viễn tại thư mục [`docs/ui-modernization/before/`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/):

1. **Trang đăng nhập**: [`login_page_1792426347285.png`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/login_page_1792426347285.png)
2. **Danh sách tài liệu Desktop (1440×900)**: [`desktop_documents_loaded_2_1792426696463.png`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/desktop_documents_loaded_2_1792426696463.png)
3. **Chi tiết trang tài liệu Desktop**: [`desktop_documents_page_1792426577413.png`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/desktop_documents_page_1792426577413.png)
4. **Giao diện Laptop (1366×768)**: [`laptop_viewport_1366_1792426886631.png`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/laptop_viewport_1366_1792426886631.png)
5. **Giao diện Mobile iPhone 14 (390×844)**: [`mobile_390_viewport_1792426948807.png`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/mobile_390_viewport_1792426948807.png)
6. **Giao diện Mobile iPhone X (375×812)**: [`mobile_375_viewport_1792426970804.png`](file:///f:/DoAn_CNPMNC/docs/ui-modernization/before/mobile_375_viewport_1792426970804.png)
