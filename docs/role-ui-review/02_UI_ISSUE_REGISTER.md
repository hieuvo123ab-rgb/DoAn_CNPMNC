# 02 — BẢNG THEO DÕI VÀ XỬ LÝ LỖI GIAO DIỆN (UI/UX ISSUE REGISTER)

**Hệ thống**: Electronic Document Management System (EDMS)  
**Tài liệu**: `docs/role-ui-review/02_UI_ISSUE_REGISTER.md`  
**Nhánh thực hiện**: `feat/role-ui-refinement`  
**Ngày thực hiện**: 20/10/2026  
**Chuyên gia phụ trách**: Senior UI/UX Engineer, Frontend Architect & QA Lead  

---

## 1. NGUYÊN TẮC TINH GỌN VÀ LOẠI BỎ YẾU TỐ MÁY MÓC / AI

Đợt rà soát này tập trung loại bỏ toàn bộ các đặc điểm mang tính "đồ án sinh viên", "quảng cáo phóng đại", hoặc "sinh tự động bằng AI":
1. **Loại bỏ nhãn thừa:** Xóa sạch các tiền tố kỹ thuật nội bộ (`US-xx`, `Phase xx`, `Sprint xx`, `Lab xx`, `Demo`, `v2.0`).
2. **Không để lộ tài khoản mẫu:** Thay thế toàn bộ placeholder gợi ý tên đăng nhập (`ví dụ: hieu hoặc tin`) bằng văn bản chỉ dẫn tự nhiên chuẩn doanh nghiệp (`Tên đăng nhập`).
3. **Thu gọn thao tác trên bảng:** Chuyển đổi cách bố trí 10 nút dàn ngang gây quá tải thị giác sang mô hình **Primary Action Duo (Xem / Tải về)** kết hợp **Action Menu Dropdown (`Thao tác` / `···`)**.
4. **Chuẩn hóa xác nhận thao tác:** Thay thế hoàn toàn hộp thoại trình duyệt `window.confirm()` bằng component `ConfirmationModal` đồng bộ, có cảnh báo rõ ràng và chống click đúp.
5. **Chuẩn hóa ngôn ngữ tiếng Việt:** Văn phong ngắn gọn, chính xác, lịch sự, đúng thuật ngữ văn thư lưu trữ điện tử Việt Nam.

---

## 2. DANH MỤC LỖI VÀ VẤN ĐỀ GIAO DIỆN PHÁT HIỆN

| Mã lỗi | Màn hình / Phân hệ | Mô tả hiện trạng phát hiện | Mức độ | Nguyên nhân kỹ thuật | Giải pháp khắc phục mục tiêu | Trạng thái |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **ISSUE-01** | **Toàn hệ thống** (Sidebar & Topbar) | Thanh bên và thanh tiêu đề chứa huy hiệu hoa mỹ `SaaS v2.0`, phụ đề `Quản Trị Lưu Trữ SaaS`, và các tiêu đề trang quá dài (`Bảng Điều Khiển Doanh Nghiệp`, `Quản Trị Lưu Trữ Tài Liệu Điện Tử`). | **MAJOR** | Dấu vết của bản dựng AI trước đó mang tính trình diễn và tiếp thị sản phẩm thay vì phần mềm nghiệp vụ nội bộ. | Gỡ bỏ hoàn toàn huy hiệu `SaaS v2.0`; tinh chỉnh tiêu đề ngắn gọn, chuẩn xác: "Quản lý tài liệu", "Trung tâm công việc", "Bảng điều khiển",... | **ĐANG XỬ LÝ** |
| **ISSUE-02** | **Trang đăng nhập** (`LoginPage`) | Placeholder ô tài khoản hiển thị `ví dụ: hieu hoặc tin` để lộ tài khoản mẫu; các đoạn mô tả an ninh mang tính liệt kê công nghệ nội bộ ("Multilingual E5", "Tesseract OCR", "độ trễ dưới 150ms"). | **MAJOR** | Tàn dư của dữ liệu seed trong quá trình phát triển đồ án và kiểm thử tự động. | Sửa placeholder thành `Tên đăng nhập` và `Mật khẩu`; diễn đạt lại giá trị an ninh thông tin theo ngôn ngữ quản trị doanh nghiệp chuẩn mực. | **ĐANG XỬ LÝ** |
| **ISSUE-03** | **Kho tài liệu** (`DocumentsPage`) | Mỗi dòng trong bảng tài liệu render tới 10 nút thao tác bấm dàn ngang (`Xem`, `Tải về`, `Sửa`, `Chia sẻ`, `Phiên bản`, `Gửi duyệt`, `Vòng đời`, `Lịch sử`, `In`, `Tiêu hủy`), làm bảng bị kéo giãn, rối mắt và khó quét thông tin. | **MAJOR** | Thiết kế dạng phân tán chức năng thời kỳ đầu, chưa có menu gom nhóm hành động theo ngữ cảnh người dùng. | Tái cấu trúc thành **Cặp thao tác chính (Xem / Tải về)** và **Menu hành động xổ xuống (Thao tác / ···)** chứa các nghiệp vụ phụ trợ. | **ĐANG XỬ LÝ** |
| **ISSUE-04** | **Kho tài liệu** (`DocumentsPage`) | Hàng loạt huy hiệu trạng thái tài liệu (`Đang hoạt động`, `Đã lưu trữ`, `Legal Hold`, `Đủ ĐK tiêu hủy`, `[OCR]`) sử dụng các khối `style={{ ... }}` inline với màu sắc hardcode không ăn theo CSS tokens của Dark Mode. | **MINOR** | Lập trình viên viết style cục bộ khi bổ sung tính năng qua các phase khác nhau. | Chuyển đổi toàn bộ sang hệ thống class badge ngữ nghĩa chuẩn: `.ent-badge--success`, `.ent-badge--danger`, `.ent-badge--warning`, `.ent-badge--neutral`. | **ĐANG XỬ LÝ** |
| **ISSUE-05** | **Quản lý người dùng** (`UsersPage`) | Khi khóa hoặc mở khóa tài khoản người dùng, trang gọi trực tiếp hộp thoại `window.confirm(...)` của trình duyệt, gây gián đoạn trải nghiệm và không hỗ trợ theme giao diện. | **MINOR** | Chưa tích hợp component modal xác nhận dùng chung. | Thay thế bằng component `ConfirmationModal` có tiêu đề, cảnh báo hành động nhạy cảm và nút xác nhận có trạng thái loading. | **ĐANG XỬ LÝ** |
| **ISSUE-06** | **Modal Tải lên & Phiên bản** (`UploadModal`, `VersionModal`) | Tiêu đề các trường nhập liệu có chứa tiếng Anh đóng mở ngoặc: `Tên tài liệu (Title)`, `Ghi chú thay đổi (Change Note)`; thiếu chỉ báo bắt buộc đồng bộ. | **UI POLISH** | Cách đặt nhãn lai giữa tiếng Việt và tiếng Anh kỹ thuật. | Bỏ phần tiếng Anh trong ngoặc, chỉ giữ: "Tên tài liệu *", "Ghi chú thay đổi", thống nhất dấu hoa thị màu đỏ cho trường bắt buộc. | **ĐANG XỬ LÝ** |
| **ISSUE-07** | **Bảng điều khiển** (`DashboardPage`) | Trang sử dụng các class của Bootstrap (`.row`, `.col-lg-3`, `.card`) gây lệch chuẩn hệ thống Design System và tạo độ tương phản kém khi bật Dark Mode. | **MINOR** | Sử dụng template lưới cũ chưa được làm mới theo Enterprise Design System. | Chuẩn hóa sang hệ thống layout `.ent-grid`, `.ent-card`, `.ent-metric-card` đồng bộ 100% với Dark/Light tokens. | **ĐANG XỬ LÝ** |
| **ISSUE-08** | **Hàng đợi xét duyệt & Tiêu hủy** (`ReviewQueue`, `DispositionQueue`) | Trạng thái rỗng chỉ là một thông báo sơ sài, thiếu component `EmptyState` chuẩn; các nút lọc trạng thái có kích thước không đồng đều. | **UI POLISH** | Các trang admin chuyên biệt chưa được cập nhật component dùng chung mới tạo. | Áp dụng `EmptyState` với biểu tượng ngữ cảnh, chuẩn hóa nhóm nút lọc trạng thái và badge kết quả. | **ĐANG XỬ LÝ** |
| **ISSUE-09** | **Nhật ký & Kiểm toán** (`AuditLogPage`) | Bộ chọn phân trang ở cuối trang bị lệch căn chỉnh khi ở độ phân giải nhỏ; các nút chuyển trang thiếu kiểu dáng hover đồng nhất. | **UI POLISH** | Thiết kế phân trang dạng inline chưa có flex wrap hợp lý. | Căn chỉnh pagination bar với responsive wrap, hiển thị rõ tổng số dòng và số trang hiện tại. | **ĐANG XỬ LÝ** |
| **ISSUE-10** | **Trạng thái hệ thống** (`SystemStatusPage`) | Các thẻ chỉ số hiển thị các dòng text kỹ thuật thô (`UP (Đang chạy)`, `AVAILABLE (Khả dụng)`) vừa dài vừa lặp từ ngữ. | **UI POLISH** | Gộp trực tiếp chuỗi từ API trả về vào nhãn hiển thị. | Chuẩn hóa thành huy hiệu trạng thái ngắn gọn: "Hoạt động", "Sẵn sàng", "Cảnh báo" kèm chấm đèn tín hiệu trực quan. | **ĐANG XỬ LÝ** |
| **ISSUE-11** | **Chống gửi form trùng lặp (Double Submit)** | Tại một số modal nghiệp vụ, khi mạng chậm người dùng có thể nhấp nhiều lần vào nút Lưu / Tải lên gây phát sinh request trùng. | **MINOR** | Nút bấm chưa được khóa `disabled` ngay tại thời điểm kích hoạt request. | Tích hợp thuộc tính `isLoading` và tự động vô hiệu hóa nút bấm trong quá trình xử lý bất đồng bộ. | **ĐANG XỬ LÝ** |
| **ISSUE-12** | **Xóa sạch dữ liệu khi đăng xuất** | Khi chuyển đổi tài khoản giữa các vai trò khác nhau trên cùng một máy, dữ liệu phiên làm việc cũ có thể còn lưu lại trong state ứng dụng. | **MINOR** | Hàm `logout` chưa ngắt kết nối WebSocket và chưa xóa triệt để các biến trạng thái trung gian. | Bổ sung cơ chế dọn dẹp toàn diện trong `AuthContext`: Xóa `localStorage`, ngắt kết nối STOMP client, làm mới bộ đếm thông báo. | **ĐANG XỬ LÝ** |

---

## 3. TIẾN ĐỘ THỰC HIỆN VÀ THEO DÕI

- **Tổng số vấn đề phát hiện**: 12 vấn đề (3 MAJOR, 5 MINOR, 4 UI POLISH).
- **Mục tiêu**: Khắc phục dứt điểm 12/12 vấn đề, không để lại bất kỳ lỗi hồi quy chức năng nào.
