# 09 — DEMO SCRIPT (KỊCH BẢN TRÌNH DIỄN HỘI ĐỒNG / GIẢNG VIÊN)

**Thời lượng khuyến nghị**: 5 – 8 phút  
**Tài khoản sử dụng**:
1. **ADMIN**: `username: hieu` | `password: password123` (Vai trò: Quản trị viên cấp cao)
2. **STAFF**: `username: tin` | `password: password123` (Vai trò: Nhân viên nghiệp vụ)

---

## Phần 1: Trình diễn vai trò Nhân viên nghiệp vụ (STAFF — 3 phút)

### Bước 1: Đăng nhập với tài khoản Nhân viên
- Truy cập `http://localhost:5173`.
- Đăng nhập: `tin` / `password123`.
- **Điểm nhấn quan sát**: Giao diện chỉ hiển thị menu **Tài liệu**. Các menu Quản trị người dùng, Bảng điều khiển, Nhật ký & Kiểm toán hoàn toàn bị ẩn để bảo vệ quyền riêng tư và an toàn hệ thống.

### Bước 2: Tải lên tài liệu mới (US-10, US-11, US-12)
- Nhấn nút **+ Tải lên tài liệu**.
- Nhập tiêu đề: `Báo cáo nghiệm thu dự án phần mềm EDMS`.
- Chọn thể loại: `Báo cáo`.
- Chọn tệp PDF hoặc Word mẫu.
- Nhấn **Tải lên** -> Tài liệu xuất hiện ngay ở đầu danh sách với huy hiệu thể loại và kích thước tệp.

### Bước 3: Tìm kiếm, Lọc và Lưu bộ lọc (US-04, US-05, US-07)
- Nhập từ khóa: `nghiệm thu` trên thanh tìm kiếm -> Danh sách lọc tức thì (US-04).
- Chọn thể loại: `Báo cáo` (US-05).
- Nhấn nút **Lưu bộ lọc** -> Đặt tên: `Bộ lọc nghiệm thu` (US-07).
- Đổi tìm kiếm sang từ khác, sau đó chọn lại `Bộ lọc nghiệm thu` từ dropdown để chứng minh khả năng tái sử dụng điều kiện tìm kiếm.

### Bước 4: Xem trước, Tải xuống và In Metadata (US-08, US-09, Extension)
- Nhấn biểu tượng **Xem trước (Preview)**: Cửa sổ mở ra hiển thị trực tiếp nội dung văn bản trong trình duyệt (US-08).
- Nhấn nút **Tải xuống (Download)**: Tệp được tải về máy trạm nguyên vẹn (US-09).
- Nhấn **In phiếu Metadata**: Hộp thoại in phiếu chuẩn form nghiệp vụ mở ra với đầy đủ thông tin tác giả, ngày tạo, kích thước (Extension).

### Bước 5: Cập nhật & Phân loại tài liệu (US-13, US-14)
- Chuyển sang tab **Tài liệu của tôi** (US-15).
- Nhấn **Sửa**: Đổi thể loại từ `Báo cáo` sang `Hợp đồng`.
- Lưu lại -> Thể loại được cập nhật tức thì.

---

## Phần 2: Trình diễn vai trò Quản trị viên (ADMIN — 4 phút)

### Bước 6: Đăng nhập với tài khoản Quản trị viên
- Đăng xuất tài khoản `tin`.
- Đăng nhập: `hieu` / `password123`.
- **Điểm nhấn quan sát**: Xuất hiện đầy đủ 4 phân hệ trên thanh điều hướng:
  1. **Tài liệu**
  2. **Quản lý người dùng** (Admin)
  3. **Bảng điều khiển** (Admin)
  4. **Nhật ký & Kiểm toán** (Admin)

### Bước 7: Quản lý người dùng & Phân quyền (US-21 đến US-26)
- Vào menu **Quản lý người dùng**:
  - Xem danh sách tài khoản (không lộ password/hash) (US-21).
  - Nhấn **+ Thêm người dùng mới**: Tạo `demo_user` / `password123` vai trò `ROLE_STAFF` (US-22).
  - Cập nhật vai trò sang `ROLE_ADMIN` (US-23, US-25).
  - Thử vô hiệu hóa tài khoản (US-24).
  - Thử vô hiệu hóa chính Admin duy nhất -> Hệ thống chặn thành công với thông báo: *"Không thể vô hiệu hóa Quản trị viên duy nhất còn hoạt động"* (Last Admin Guard).
  - Chuyển sang tab **Ma trận quyền hạn**: Giải thích ma trận phân quyền chi tiết giữa Staff và Admin (US-26).

### Bước 8: Bảng điều khiển Giám sát điều hành (US-16, US-17, US-18)
- Vào menu **Bảng điều khiển (Dashboard)**:
  - **Chỉ số tổng quan**: Tổng tài liệu, Tổng người dùng, Tổng lượt tải lên, Tải xuống, Xem trước, và Tổng dung lượng lưu trữ.
  - **Phân loại tài liệu**: Biểu đồ phân bổ số lượng và tỷ lệ % theo từng thể loại văn bản (Báo cáo, Hợp đồng, Công văn, Quyết định) được tính từ CSDL thực tế (US-17).
  - **Thống kê sử dụng**: Thống kê tần suất thao tác người dùng tính trực tiếp từ các sự kiện AuditLog thật (US-18).
  - **Hoạt động gần đây**: Bảng hiển thị ngay các thao tác vừa thực hiện ở các bước trước (tải lên, đăng nhập, phân quyền).

### Bước 9: Nhật ký kiểm toán & Truy vết an ninh (US-19, US-20)
- Vào menu **Nhật ký & Kiểm toán**:
  - Tab **Nhật ký kiểm toán (Audit Log)**: Hiển thị đầy đủ mọi sự kiện (thời gian, người thực hiện, hành động, ID đối tượng, mô tả).
  - Lọc thử theo người dùng `tin` -> Danh sách lọc đúng các hành động của `tin`.
  - Lọc thử theo hành động `DOCUMENT_UPLOAD` -> Danh sách lọc đúng các thao tác tải lên.
  - Chuyển sang tab **Lịch sử hoạt động (Activity History)**: Dạng timeline trực quan, dễ đọc, sắp xếp mới nhất lên đầu (US-19).

---

## Tóm tắt thông điệp kết luận khi Demo
1. **Tuân thủ đúng phương pháp Agile / Code cuốn chiếu**: Toàn bộ 4 Sprint phát triển liên tục, không đập đi xây lại, không làm hỏng tính năng cũ.
2. **Dữ liệu thực 100%**: Thống kê và kiểm toán được tính toán bằng các hàm tập hợp trong PostgreSQL, không dùng dữ liệu giả lập (mock data).
3. **Bảo mật nghiêm ngặt**: RBAC 2 lớp (Frontend + Backend), không để lộ mật khẩu hay secret, bảo vệ tự động tài khoản quản trị cuối cùng.
