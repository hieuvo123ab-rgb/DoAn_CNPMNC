# 05 — Đánh giá nghiệm thu giao diện theo vai trò (cập nhật bằng chứng)

**Đối tượng:** `feat/role-ui-refinement` tại `b1a9fd6`  
**Ngày rà soát:** 20/10/2026  
**Trạng thái:** `VISUAL_REFINEMENT_COMPLETE / LIVE_FUNCTIONAL_ACCEPTANCE_PENDING`

## Các hạng mục có bằng chứng

- **Mã nguồn:** Có thay đổi UI tại 13 file Frontend theo PR #7.
- **CI:** GitHub Actions run `39370490705` = SUCCESS. Điều này chứng minh build/checks trong workflow, **không chứng minh 17 luồng live E2E**.
- **Ảnh:** 22 ảnh PNG có trong `docs/role-ui-review/screenshots/after/`. Script tạo ảnh dùng Puppeteer + `setRequestInterception`, trả dữ liệu giả lập; chỉ chứng minh trạng thái render với fixture, không chứng minh màn hình chạy API thực.
- **Design System:** Có các lớp CSS `ent-badge`, `table-actions`, `action-btn` và các chỉnh sửa nội dung/nhãn. Chưa có báo cáo đo tương phản đủ để kết luận WCAG AA toàn hệ thống.

## Chưa có bằng chứng nghiệm thu

| Tiêu chí | Trạng thái | Lý do |
|---|---|---|
| Login thật cho 3 role, JWT & logout | NOT_RUN | Screenshot dùng token giả |
| RBAC Backend 401/403 theo JWT | NOT_RUN | Script intercept request, không đối chiếu response thật |
| Upload, download, version, review, sign, disposition | NOT_RUN | Không có trace API và ảnh chụp sau thao tác thành công thật |
| Realtime STOMP reconnect/delivery & cross-user isolation | NOT_RUN | Screenshot không đo message nhận thực |
| Tìm kiếm ngữ nghĩa | BLOCKED_ON_PREVIEW | Railway log ghi ONNX Runtime nhận Git LFS pointer, không nạp được model |
| Responsive interaction / accessibility AA | PARTIALLY_CHECKED | Có ảnh viewport, chưa có đủ assertion và kết quả contrast/a11y |
| 17/17 functional regression | NOT_RUN | Chưa có bằng chứng chạy E2E không mock cho cả 17 case |

## Quy tắc ký duyệt

- 22 ảnh nên gắn nhãn `MOCK_DATA / VISUAL_CAPTURE` trong báo cáo, không đổi tên thành runtime E2E.
- Báo cáo phải ghi trung thực PASS / FAIL / NOT_RUN / BLOCKED kèm run ID, commit SHA và môi trường.
- Không tự nhận “Approved” cho Frontend Architect/QA Lead nếu chưa có review độc lập thực tế của người chịu trách nhiệm.
- Chỉ chuyển sang `READY_FOR_FINAL_UI_ACCEPTANCE` khi đóng hết BLOCKER/MAJOR và thu thập đủ bằng chứng test với Backend thật.

**Phán quyết hiện tại:** `FINAL_UI_ACCEPTANCE_PENDING`. Không dùng biên bản này để yêu cầu tự động merge PR #7 vào `main`.
