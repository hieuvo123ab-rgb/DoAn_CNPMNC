# 03 — QUY CHUẨN THIẾT KẾ DOANH NGHIỆP & HỆ THỐNG GIAO DIỆN
## (ENTERPRISE DESIGN SYSTEM & UI REFINEMENT SPECIFICATION)

**Dự án**: Electronic Document Management System (EDMS)  
**Tài liệu**: `docs/role-ui-review/03_DESIGN_SYSTEM_REFINEMENT.md`  
**Nhánh thực hiện**: `feat/role-ui-refinement`  
**Phiên bản Design System**: 2.1.0 Enterprise Refinement  
**Ngày phát hành**: 20/10/2026  

---

## 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (CORE PRINCIPLES)

1. **Thực dụng & Tiết chế (Pragmatic & Purposeful)**:
   - Loại bỏ hoàn toàn các hiệu ứng màu neon, gradient quảng cáo, animation giật cục và bóng đổ quá đà.
   - Mỗi chi tiết giao diện đều phục vụ luồng công việc tài liệu thực tế của cơ quan, doanh nghiệp.

2. **Tự nhiên theo ngôn ngữ tiếng Việt chuyên nghiệp (Natural Vietnamese UX)**:
   - Không dịch máy móc hoặc chèn tiếng Anh trong ngoặc đơn (e.g. loại bỏ `Tên tài liệu (Title)`, `Mô tả (Description)`, `Báo cáo (Report)`).
   - Sử dụng thuật ngữ hành chính văn phòng chuẩn: "Kho tài liệu", "Quy trình & Tác vụ", "Xét duyệt", "Thời hạn lưu trữ", "Tiêu hủy".

3. **Phân cấp thị giác rõ nét (Clear Visual Hierarchy)**:
   - Thông tin quan trọng (Tên tài liệu, Mã định danh, Trạng thái phê duyệt) luôn nổi bật và dễ quét bằng mắt.
   - Bảng biểu có độ tương phản chuẩn WCAG 2.1 AA ở cả hai chế độ Light và Dark Mode.

4. **Nhất quán giữa các vai trò (Consistent Role-Based Styling)**:
   - Dù ở góc nhìn `ROLE_ADMIN`, `ROLE_STAFF` hay `ROLE_USER`, các thành phần dùng chung (nút bấm, badge, thanh lọc, modal, toast) tuân thủ 100% cùng một quy tắc màu sắc và kích thước.

---

## 2. BẢNG MÀU CHUẨN DOANH NGHIỆP (ENTERPRISE COLOR TOKENS)

Hệ thống sử dụng bảng màu Navy/Slate/Blue chuẩn doanh nghiệp, định nghĩa qua CSS Variables trong `frontend/src/index.css`:

### 2.1. Light Mode Tokens (Mặc định)
| Nhóm Token | Biến CSS | Giá trị HEX | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `--color-primary` | `#2563eb` | Nút chính, tab kích hoạt, liên kết quan trọng |
| **Primary Hover** | `--color-primary-hover` | `#1d4ed8` | Trạng thái hover của nút bấm chính |
| **Primary Subtle** | `--color-primary-light` | `#eff6ff` | Nền badge thông tin, highlight dòng được chọn |
| **Canvas Background** | `--color-bg` | `#f8fafc` | Nền toàn trang, độ dịu mắt cao |
| **Surface Card** | `--color-surface` | `#ffffff` | Bề mặt card, bảng tài liệu, modal dialog |
| **Sidebar Theme** | `--color-sidebar` | `#0f172a` | Thanh điều hướng sẫm màu sang trọng |
| **Text Main** | `--color-text-main` | `#0f172a` | Văn bản tiêu đề, nội dung chính |
| **Text Muted** | `--color-text-muted` | `#64748b` | Văn bản phụ, nhãn mô tả, ngày tháng |
| **Border Neutral** | `--color-border` | `#e2e8f0` | Đường phân cách bảng, viền ô nhập liệu |

### 2.2. Dark Mode Tokens (Tự động & Chuyển đổi thủ công)
| Nhóm Token | Biến CSS | Giá trị HEX | Đảm bảo tương phản |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--color-bg` | `#0b0f19` | Nền tối sâu, không lóa mắt ban đêm |
| **Surface Card** | `--color-surface` | `#111827` | Card nổi bật với độ tương phản tốt |
| **Border Neutral** | `--color-border` | `#1f293d` | Đường viền mảnh rõ nét |
| **Text Main** | `--color-text-main` | `#f8fafc` | Trắng sáng dịu, độ tương phản > 10:1 |
| **Text Muted** | `--color-text-muted` | `#8292a8` | Màu xám xanh đọc rõ trên nền tối |

---

## 3. QUY CHUẨN HUY HIỆU NGỮ NGHĨA (SEMANTIC BADGES)

Đã loại bỏ 100% hardcoded inline hex colors trong bảng tài liệu, chuyển sang hệ thống class đồng bộ `.ent-badge`:

```css
.ent-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  line-height: 1.25;
  white-space: nowrap;
}
```

### 3.1. Phân loại màu trạng thái
| Class Modifier | Ý nghĩa nghiệp vụ | Trạng thái áp dụng | Biểu tượng kèm theo |
| :--- | :--- | :--- | :--- |
| `.ent-badge--success` | Thành công / An toàn | `Đã duyệt`, `Đang hoạt động`, `Khớp nội dung`, `Đủ điều kiện` | `<CheckCircle2 size={10} />` |
| `.ent-badge--warning` | Cần chú ý / Đang xử lý | `Chờ duyệt`, `Đủ ĐK tiêu hủy`, `Quyền xem & sửa` | `<Clock size={10} />` |
| `.ent-badge--danger` | Rủi ro / Giới hạn cao | `Bị từ chối`, `Legal Hold`, `Riêng tư`, `Khóa` | `<AlertTriangle size={10} />`, `<Lock size={10} />` |
| `.ent-badge--info` | Thông tin kỹ thuật / Phiên bản | `v1, v2`, `Nội bộ`, `[OCR]`, `Chờ duyệt tài liệu` | `<Globe size={10} />`, `<Clock size={10} />` |
| `.ent-badge--neutral` | Bản ghi thụ động / Lưu trữ | `Nháp`, `Đã lưu trữ`, `Giữ đến YYYY-MM-DD` | `<Archive size={10} />`, `<Calendar size={10} />` |

---

## 4. QUY CHUẨN THANH THAO TÁC BẢNG TÀI LIỆU (ACTION TOOLBAR)

### 4.1. Vấn đề trước tinh chỉnh
- Hàng bảng tài liệu nhồi nhét đến 9-10 nút bấm dài (`Lịch sử duyệt`, `Gửi duyệt`, `Lưu trữ`, `Phiên bản`, `Chia sẻ`, `In`).
- Cột thao tác phình to trên 600px, gây tràn ngang hoặc vỡ hàng chữ cái lộn xộn.

### 4.2. Giải pháp tinh chỉnh sau chuẩn hóa
- Phân định rõ 2 nút hành động chính (Primary Duo):
  - **`Xem` (`.preview-btn`)**: Nền xanh nhạt, chữ xanh đậm, hover xanh dương đậm toàn phần.
  - **`Tải về` (`.download-btn`)**: Nút outline trung tính, hiển thị spinner khi đang tải tệp.
- Các nút nghiệp vụ tiếp theo (`Sửa`, `Chia sẻ`, `Phiên bản`, `Gửi duyệt`, `Vòng đời`, `Lịch sử`, `In`):
  - Rút gọn nhãn hiển thị: "Lịch sử duyệt" $\to$ "Lịch sử", "Lưu trữ" $\to$ "Vòng đời".
  - Chuẩn hóa padding `0.35rem 0.6rem`, font-size `0.775rem`, không xuống dòng.
  - Giữ nguyên 100% `id` kiểm thử tự động (`#preview-doc-btn-${id}`, `#download-doc-btn-${id}`, `#edit-doc-btn-${id}`, etc.).

---

## 5. BỐ CỤC ĐIỀU HƯỚNG & THANH BÊN (SIDEBAR & TOPBAR)

### 5.1. Sidebar
- Chiều rộng mở rộng: `260px`, chiều rộng thu gọn: `72px`.
- Phân nhóm điều hướng rõ ràng:
  1. `Kho tài liệu` (Tài liệu)
  2. `Quy trình & Tác vụ` (Công việc, Hàng đợi duyệt, Hàng đợi tiêu hủy)
  3. `Quản trị hệ thống` (Bảng điều khiển, Người dùng & Phân quyền, Nhật ký kiểm toán, Trạng thái hệ thống)
- Huy hiệu vai trò tài khoản góc dưới Sidebar:
  - `ROLE_ADMIN`: Huy hiệu xanh navy viền nổi "Quản trị viên"
  - `ROLE_STAFF`: Huy hiệu xanh lơ "Chuyên viên"
  - `ROLE_USER`: Huy hiệu trung tính "Người dùng"

### 5.2. Topbar
- Chiều cao cố định `64px`.
- Tiêu đề màn hình tinh gọn theo ngữ cảnh: "Quản lý tài liệu", "Trung tâm công việc", "Bảng điều khiển & Giám sát".
- Huy hiệu trạng thái kết nối STOMP: "Trực tuyến" với đèn led xanh nhấp nháy tinh tế (thay cho khẩu hiệu kỹ thuật "Live STOMP").

---

## 6. HỘP THOẠI XÁC NHẬN CHUẨN DOANH NGHIỆP (CONFIRMATION MODAL)

- Loại bỏ hoàn toàn hộp thoại hệ thống `window.confirm()` thô sơ và không hỗ trợ theme.
- Chuẩn hóa sang component `<ConfirmationModal>`:
  - Hỗ trợ 3 biến thể: `danger` (hành động nguy hiểm/khóa tài khoản), `warning` (cảnh báo tác vụ), `primary` (xác nhận thông thường).
  - Có lớp phủ backdrop mờ, tiêu đề rõ ràng, icon cảnh báo chuẩn Lucide và trạng thái tải `isLoading` chống double-submit.

---

## 7. QUY CHUẨN ĐÁP ỨNG ĐA THIẾT BỊ (RESPONSIVE BREAKPOINTS)

| Thiết bị | Độ phân giải | Bố cục điều hướng | Chế độ hiển thị danh sách |
| :--- | :--- | :--- | :--- |
| **Màn hình lớn (Desktop)** | $\ge 1440 \times 900$ | Sidebar mở rộng 260px | Bảng dữ liệu đầy đủ cột, thao tác ngang |
| **Máy tính xách tay (Laptop)**| $1366 \times 768$ | Sidebar mở rộng hoặc thu gọn 72px | Bảng dữ liệu co giãn tự động |
| **Máy tính bảng (Tablet)** | $768 \times 1024$ | Sidebar thu vào Drawer mở bằng hamburger | Bảng co giãn có thanh cuộn ngang |
| **Điện thoại (Mobile)** | $\le 480 \text{px}$ (390×844, 375×812) | Thanh Topbar di động + Drawer menu trượt | Thẻ tài liệu thông minh (`.mobile-card-feed`), lưới nút 3 cột |
