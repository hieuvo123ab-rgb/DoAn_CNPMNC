# 08 — TEST DATA INVENTORY

**Project**: Electronic Document Management System (EDMS)  
**Snapshot Timestamp**: `2026-09-18T22:15:36Z` (Local: `2026-09-19T05:15:36+07:00`)  
**Policy**: **REPORT ONLY**. No destructive deletion, truncation, or database cleanup was performed during this audit. All data is categorized below based on the authoritative final database snapshot to maintain 100% data integrity and consistency across all final evidence documents.

---

## 1. Unified Final Data Snapshot & Inventory Table

| Entity | Total Current Count | Seed / Demo Count | Test-Generated Count | Identification Rule | Safe-to-clean? | Technical Reason & Guidance |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| **`users`** | **21** | 2 | 19 | `username LIKE 'staff_%'` OR `username LIKE 'aud_usr_%'` | **YES** | 19 tài khoản kiểm thử sinh ra trong quá trình chạy test hồi quy. 2 tài khoản quản trị và nghiệp vụ gốc: `hieu` (ADMIN) và `tin` (STAFF) **phải được giữ nguyên vẹn**. |
| **`documents`** | **49** | 22 | 27 | ID > 22 (các tài liệu sinh ra trong quá trình chạy kiểm thử tự động) | **YES** | 27 tài liệu do các bộ kiểm thử tự động tải lên để kiểm tra upload, preview, download, update. 22 tài liệu seed ban đầu (ID 1–22) **phải được giữ nguyên**. |
| **Physical Files** | **49** | 22 | 27 | Tệp tin trên đĩa (`/app/storage/uploads`) khớp với `stored_file_name` của 49 tài liệu | **YES** | Mỗi tệp đĩa gắn liền 1:1 với bản ghi CSDL. 27 tệp kiểm thử có thể dọn dẹp đồng bộ cùng bản ghi documents khi cần, 22 tệp gốc phải giữ lại. |
| **`saved_searches`** | **2** | 0 | 2 | `name = 'Hợp đồng kỹ thuật'` AND `created_by = 'hieu'` | **YES** | 2 bộ lọc tìm kiếm được tạo bởi test tự động trong Sprint 3. Có thể xóa an toàn qua API `DELETE /api/saved-searches/{id}` mà không ảnh hưởng nghiệp vụ cốt lõi. |
| **`audit_logs`** | **247** | 0 | 247 | Toàn bộ các sự kiện ghi nhận trong bảng `audit_logs` | **NO** | 247 bản ghi kiểm toán phản ánh toàn bộ lịch sử hoạt động thực tế từ các phiên thao tác và test. Các bản ghi này là nguồn dữ liệu tính toán trực tiếp cho **Usage Statistics (US-18)** và **Dashboard (US-16)**. Việc xóa bảng này sẽ làm reset toàn bộ số liệu thống kê lượt xem/tải về 0. Khuyến nghị: **GIỮ NGUYÊN** để phục vụ demo và đánh giá hội đồng. |

---

## 2. Document Breakdown by Classification (Final Snapshot)

Dữ liệu phân loại tài liệu thực tế trong CSDL tại thời điểm snapshot:

| Document Type (Phân loại) | Total Documents | Seed / Core Documents | Test-Generated Documents |
| :--- | :---: | :---: | :---: |
| **Báo cáo** | 21 | 14 | 7 |
| **Công văn** | 18 | 4 | 14 |
| **Hợp đồng** | 9 | 3 | 6 |
| **Quyết định** | 1 | 1 | 0 |
| **TỔNG CỘNG** | **49** | **22** | **27** |

---

## 3. Maintenance Recommendation for Project Owners

1. **Giai đoạn Đánh giá Lab 1 / Chấm điểm**:
   - **Không thực hiện bất kỳ lệnh dọn dẹp nào**.
   - Dữ liệu hiện tại giúp hội đồng thẩm định thấy ngay hệ thống hoạt động thực tế, Dashboard có số liệu sống động, và Audit Log có đầy đủ các loại sự kiện để truy vết kiểm toán.
2. **Giai đoạn Bàn giao Production**:
   - Chỉ xóa các tài khoản có tiền tố `staff_` và `aud_usr_`.
   - Giữ nguyên 2 tài khoản quản trị và nhân viên cốt lõi: `hieu` (Quản trị viên) và `tin` (Nhân viên).
