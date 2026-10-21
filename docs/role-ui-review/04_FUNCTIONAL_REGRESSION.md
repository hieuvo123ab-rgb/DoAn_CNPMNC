# 04 — Kiểm thử hồi quy giao diện theo vai trò: trạng thái bằng chứng

**Mã nguồn đối chiếu:** `feat/role-ui-refinement`, commit `b1a9fd6`.  
**Ngày rà soát độc lập:** 20/10/2026.

## Phân biệt ba mức bằng chứng

- **BUILD PASS:** GitHub Actions `39370490705` đã thành công trên commit `b1a9fd6`, chứng minh các job trong workflow thực thi đạt.
- **VISUAL_MOCK_CAPTURED:** 22 ảnh tại `docs/role-ui-review/screenshots/after/` được tạo bởi `frontend/scripts/capture_role_ui_refinement.cjs`, chạy Chrome với dữ liệu API giả lập. Đây là bằng chứng *hiển thị giao diện*, không chứng minh Backend thật, thông báo thật hoặc phân quyền thật hoạt động.
- **LIVE_E2E_NOT_RUN:** Chưa có kết quả smoke/E2E đủ tin cậy từ một môi trường EDMS tích hợp với Spring Boot, PostgreSQL, JWT và role thật tương ứng các kịch bản bên dưới.

Script chụp ảnh có `page.setRequestInterception(true)`, tự trả dữ liệu `MOCK_DOCS`, `MOCK_USERS`, `MOCK_TASKS`, `MOCK_DASHBOARD`, `MOCK_AUDIT`, `MOCK_SYSTEM_STATUS`, `MOCK_REVIEWS`, `MOCK_DISPOSITIONS`, `MOCK_NOTIFICATIONS` và lưu `mock_token_*` vào localStorage. Không được dẫn bộ ảnh này làm bằng chứng kiểm thử đăng nhập JWT, API thật hoặc RBAC HTTP 403.

## Danh mục kiểm thử chức năng còn phải chạy với Backend thật

| STT | Kịch bản | Bằng chứng cần thu thập | Trạng thái |
|---:|---|---|---|
| 1 | Đăng nhập 3 role | HTTP 200, token thật, username/role đúng, vào trang được phép | LIVE_E2E_NOT_RUN |
| 2 | Rate limit | HTTP 429 / thời gian chờ, chạy trên tài khoản test cách ly | LIVE_E2E_NOT_RUN |
| 3 | Xác thực tài liệu công khai | Mã hash hoặc file demo, phản hồi API đúng | LIVE_E2E_NOT_RUN |
| 4 | Danh sách tài liệu / bộ lọc | GET trả dữ liệu có thực, quyền ACL đúng | LIVE_E2E_NOT_RUN |
| 5 | Tìm kiếm Lexical/Semantic/Hybrid | Mô hình ONNX đã nạp khả dụng trên Railway (`semanticModel: AVAILABLE`); E2E query với JWT thật đang chờ chạy | LIVE_MODEL_VERIFIED / E2E_PENDING |
| 6 | Upload tài liệu | Multipart, lưu DB, file và quyền | LIVE_E2E_NOT_RUN |
| 7 | Xem trước tài liệu | PDF/ảnh/file demo, không lộ JWT | LIVE_E2E_NOT_RUN |
| 8 | Download tệp gốc | Nội dung/filename/checksum đối chiếu | LIVE_E2E_NOT_RUN |
| 9 | Sửa metadata | Quyền OWNER/EDIT, DB cập nhật đúng | LIVE_E2E_NOT_RUN |
| 10 | Chia sẻ tài liệu (ACL) | Staff/User được cấp quyền đúng, truy cập trái phép bị chặn | LIVE_E2E_NOT_RUN |
| 11 | Phiên bản / khôi phục | Thứ tự và hash/DB đúng | LIVE_E2E_NOT_RUN |
| 12 | Gửi duyệt | Chuyển trạng thái, tác vụ Admin phát sinh | LIVE_E2E_NOT_RUN |
| 13 | Duyệt / từ chối | Chỉ Admin hoặc role được Backend cho phép | LIVE_E2E_NOT_RUN |
| 14 | Vòng đời, legal hold, tiêu hủy | Các chốt bảo vệ và workflow trạng thái | LIVE_E2E_NOT_RUN |
| 15 | Trung tâm công việc | Task từ Backend phân chia chính xác theo JWT | LIVE_E2E_NOT_RUN |
| 16 | Quản lý người dùng | RBAC, confirmation modal, thao tác thật có kiểm soát | LIVE_E2E_NOT_RUN |
| 17 | Audit & trạng thái hệ thống | Dữ liệu API thật, chỉ Admin đọc được | LIVE_E2E_NOT_RUN |

## Giới hạn kiểm thử URL

`frontend/src/App.tsx` hiện sử dụng `activeView` và `app-navigate` custom event để điều hướng nội bộ. Đây **không phải URL router thực** cho từng màn hình. Không đánh dấu PASS cho việc “nhập trực tiếp /dashboard sẽ chuyển hướng /documents” nếu chưa viết và chạy thử có bằng chứng riêng. Backend `/api/admin/**` với HTTP 403 là chốt bảo mật cần kiểm thử độc lập.

## Tiêu chí đóng

1. Chạy `scripts/test_team_preview_live.py` trên **Preview riêng** với secret lấy từ môi trường, không in token/mật khẩu; giữ log đã che dữ liệu nhạy cảm.
2. Chạy E2E trình duyệt với ba tài khoản có JWT thật. Không intercept/mock các endpoint nghiệp vụ trong bộ *live E2E*.
3. Lưu từng assertion và trace cho các kịch bản 1–17, đánh dấu PASS / FAIL / BLOCKED / NOT_RUN. Một ảnh chụp không thay thế assertion.
4. Mở thêm lỗi cho mọi mismatch giữa tài liệu này và mã nguồn; không dùng “100% PASS” khi chưa đủ bằng chứng.
