# 05 — DANH MỤC VẤN ĐỀ TỒN ĐỌNG & ĐỊNH HƯỚNG NÂNG CẤP (REMAINING ISSUES & ROADMAP)

**Hệ thống**: Electronic Document Management System (EDMS) — Hệ thống Quản trị Tài liệu Doanh nghiệp  
**Giai đoạn**: Phase 5 — System Gap Analysis & Technical Debt Inventory  
**Thời điểm thực hiện**: 15/10/2026  
**Nhánh làm việc**: `completion/edms-hardening`  
**Nguyên tắc**: Minh bạch kỹ thuật, đánh giá đúng mức độ nghiêm trọng, không che giấu hạn chế kiến trúc.

---

## 1. TỔNG QUAN PHÂN LOẠI MỨC ĐỘ VẤN ĐỀ

Hệ thống EDMS đã hoàn thành toàn bộ các chức năng nghiệp vụ cốt lõi và củng cố bảo mật runtime vững chắc. Tuy nhiên, để đảm bảo tính minh bạch và phục vụ công tác bảo trì, phát triển lâu dài, các vấn đề kỹ thuật còn tồn đọng được phân loại như sau:

| Mức độ nghiêm trọng (Severity) | Số lượng | Tác động đến vận hành hiện tại | Đánh giá nghiệm thu |
| :--- | :---: | :--- | :---: |
| **BLOCKER (Chặn đứng)** | **0** | Không có lỗi nào làm tê liệt hệ thống hoặc rò rỉ dữ liệu nghiêm trọng. | **ĐẠT** |
| **MAJOR (Cần nâng cấp)** | **1** | Cơ chế Polling thông báo gây tải định kỳ; cần chuyển sang WebSocket. | **Có lộ trình** |
| **MINOR (Cải thiện nhỏ)** | **3** | Chữ ký số cá nhân, giao diện bảng trên màn hình < 480px, tham số reset user. | **Chấp nhận được** |
| **INFORMATIVE (Ghi chú)** | **1** | Môi trường kiểm thử tự động phụ thuộc vào Docker Desktop trên host. | **Ghi nhận** |

---

## 2. BẢNG CHI TIẾT DANH MỤC VẤN ĐỀ VÀ KẾ HOẠCH KHẮC PHỤC

### Vấn đề 1: Cơ chế Polling thông báo và tác vụ (Mã: `MIS-03`)
- **Phân loại**: **MAJOR**
- **Hiện trạng kỹ thuật**:
  - Giao diện người dùng tại [`NotificationPanel.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/components/NotificationPanel.tsx) và [`TaskCenterPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/TaskCenterPage.tsx) hiện đang sử dụng cơ chế Polling (gửi request định kỳ mỗi 10s – 30s) đến endpoint `GET /api/notifications/unread-count` và `GET /api/tasks` để cập nhật số lượng thông báo mới.
- **Rủi ro khi mở rộng**:
  - Khi số lượng người dùng đồng thời tăng lên hàng nghìn phiên làm việc, việc gửi HTTP request liên tục sẽ tạo ra tải dư thừa trên CPU của Backend và lãng phí băng thông mạng.
- **Biện pháp giảm thiểu hiện tại**:
  - Bộ đệm truy vấn được tối ưu hóa; chỉ truy vấn khi tab trình duyệt đang hoạt động (Active tab).
- **Lộ trình nâng cấp**:
  - Thay thế Polling bằng kết nối hai chiều **WebSocket (STOMP over SockJS)** hoặc **Server-Sent Events (SSE)** tại Đợt 4 hoặc phiên bản sau.

### Vấn đề 2: Ký số sử dụng chứng chỉ cấp hệ thống (System-Level Certificate)
- **Phân loại**: **MINOR**
- **Hiện trạng kỹ thuật**:
  - Phân hệ chữ ký số [`SignatureService.java`](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/service/SignatureService.java) sử dụng cặp khóa RSA-2048 của tổ chức lưu trữ trong PKCS#12 KeyStore (`edms-signing.p12`). Khi Quản trị viên ký tài liệu, hệ thống gắn thông tin người ký (`signed_by = admin`) và thời điểm ký kèm chứng chỉ dùng chung của doanh nghiệp.
- **Hạn chế**:
  - Chưa hỗ trợ từng người dùng tải lên hoặc sử dụng chứng chỉ số cá nhân riêng biệt (Personal X.509 Certificate / USB Token PKCS#11).
- **Lộ trình nâng cấp**:
  - Mở rộng phân hệ Quản lý Chứng chỉ Người dùng (Personal Certificate Management) cho phép mỗi nhân viên đăng ký chứng chỉ công khai riêng.

### Vấn đề 3: Bảng dữ liệu tài liệu trên màn hình di động hẹp (< 480px)
- **Phân loại**: **MINOR**
- **Hiện trạng kỹ thuật**:
  - Bảng danh sách tài liệu tại [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx) có nhiều cột thông tin quan trọng (Tên tài liệu, Thể loại, Phiên bản, Trạng thái, Quyền truy cập, Người tạo, Ngày tạo, Thao tác).
  - Trên màn hình máy tính để bàn và laptop hiển thị hoàn hảo; trên máy tính bảng hiển thị tốt; nhưng trên điện thoại di động có chiều rộng hẹp (< 480px), người dùng phải cuộn ngang (Horizontal scroll) để xem hết các cột.
- **Lộ trình nâng cấp**:
  - Bổ sung chế độ hiển thị dạng Thẻ (Card View / Mobile Feed) tự động kích hoạt qua CSS Media Query `@media (max-width: 480px)`.

### Vấn đề 4: Tham số mở khóa Rate-Limit theo tài khoản cụ thể
- **Phân loại**: **MINOR**
- **Hiện trạng kỹ thuật**:
  - Endpoint `POST /api/auth/reset-rate-limit` đã được bảo vệ an toàn bằng `@PreAuthorize("hasAuthority('ROLE_ADMIN')")` (khắc phục `MIS-04`).
  - Khi Quản trị viên kích hoạt, endpoint này hiện đang xóa toàn bộ cache đăng nhập sai của tất cả IP/User (`loginRateLimiterService.clearAll()`).
- **Lộ trình nâng cấp**:
  - Bổ sung trường tùy chọn `username` trong Request Body của endpoint này, cho phép Quản trị viên chọn mở khóa cho một tài khoản cụ thể mà không làm ảnh hưởng đến các tài khoản khác đang bị nghi ngờ tấn công Brute-force.

### Vấn đề 5: Phụ thuộc môi trường Docker Desktop khi chạy Test Suites tự động
- **Phân loại**: **INFORMATIVE**
- **Hiện trạng kỹ thuật**:
  - Toàn bộ 4 bộ test suites (`test_regression.py`, `test_disaster_recovery.py`, v.v.) được thiết kế để kiểm thử tích hợp toàn diện trên các container thật (`edms-postgres`, `edms-backend`).
  - Khi máy host không bật Docker Desktop, các test này sẽ trả về `NOT_RUN` (không thể kết nối cổng 8080).
- **Khuyến nghị vận hành**:
  - Luôn đảm bảo Docker Desktop chạy ở chế độ Linux Containers trước khi khởi động kịch bản nghiệm thu kiểm thử tự động.

---

## 3. KẾT LUẬN ĐÁNH GIÁ CHẤT LƯỢNG SẢN PHẨM

1. **Độ an toàn**: Hệ thống hoàn toàn sạch các lỗ hổng nghiêm trọng (Blocker = 0).
2. **Độ sẵn sàng**: Các vấn đề tồn đọng đều thuộc nhóm tối ưu hóa phi chức năng và đã có lộ trình nâng cấp rõ ràng.
3. **Độ tin cậy**: Sản phẩm hoàn toàn đủ điều kiện bàn giao, vận hành thử nghiệm và nghiệm thu đồ án.
