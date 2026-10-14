# BÁO CÁO NGHIỆM THU EDMS PHASE 7
## DOCUMENT REVIEW & APPROVAL WORKFLOW
**Trạng thái phê duyệt:** HOÀN THÀNH TOÀN DIỆN & VƯỢT MỨC MỤC TIÊU  
**Baseline trước Phase 7:** LAB1_EDMS_DOCUMENTATION_ALIGNED + PHASE5_DOCUMENT_ACCESS_PASS + PHASE6_DOCUMENT_VERSIONING_PASS (104/104 Tests PASS)  
**Baseline sau Phase 7:** 132/132 Tests PASS (100% PASS trên toàn bộ hệ thống)  
**Verdict:** `PHASE7_DOCUMENT_REVIEW_APPROVAL_PASS`

---

## A. Baseline Verification (Kiểm tra nền tảng ban đầu)
- **Phương pháp thực hiện:** Code cuốn chiếu (Incremental Vertical Slice Development).
- **Nguyên tắc bất biến tuyệt đối:**
  - Không tạo project mới, không rewrite hệ thống.
  - Không reset database, không xóa Docker volumes (`docker compose down -v` KHÔNG BAO GIỜ được gọi).
  - Không làm mất file, version lịch sử, phân quyền ACL hay nhật ký kiểm toán Audit.
  - Không sửa đổi thư mục `docs/final-evidence/` và các báo cáo Lab 1 (Lab 1 tiếp tục là historical snapshot).
- **Kết quả kiểm tra trước khi lập trình:**
  - Đã thực thi toàn bộ 104 bài test nền tảng (Sprint 1–4, Phase 5 Access Control, Phase 6 Versioning).
  - Toàn bộ 104/104 bài test đạt **PASS 100%**.
  - Toàn bộ 130+ tài liệu và tệp tin vật lý hiện có được bảo toàn nguyên vẹn.

---

## B. Database Migration (Di chuyển dữ liệu CSDL)
Thực thi di chuyển CSDL phi phá hủy (Non-destructive Migration), áp dụng tự động qua Hibernate/JPA DDL và tích hợp CSDL PostgreSQL:

1. **Bảng mới `document_reviews`:**
   ```sql
   CREATE TABLE IF NOT EXISTS document_reviews (
       id BIGSERIAL PRIMARY KEY,
       document_id BIGINT NOT NULL,
       version_number INTEGER NOT NULL,
       status VARCHAR(20) NOT NULL,
       submitted_by VARCHAR(50) NOT NULL,
       submitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
       reviewed_by VARCHAR(50),
       reviewed_at TIMESTAMP WITHOUT TIME ZONE,
       review_comment TEXT,
       CONSTRAINT fk_doc_review_document FOREIGN KEY (document_id)
           REFERENCES documents(id) ON DELETE CASCADE
   );
   ```

2. **Chỉ mục hiệu năng (Performance Indexes):**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_doc_review_doc ON document_reviews(document_id);
   CREATE INDEX IF NOT EXISTS idx_doc_review_ver ON document_reviews(document_id, version_number);
   CREATE INDEX IF NOT EXISTS idx_doc_review_status ON document_reviews(status);
   CREATE INDEX IF NOT EXISTS idx_doc_review_submitted_at ON document_reviews(submitted_at);
   ```

3. **Tính toàn vẹn dữ liệu cũ:**
   - Không thêm cột bắt buộc nào làm phá vỡ bảng `documents` hay `document_versions`.
   - Không fabricate các bản ghi giả mạo cho các tài liệu trước Phase 7.
   - Trạng thái của các phiên bản hiện có được suy diễn tự nhiên là `DRAFT` cho đến khi người dùng chủ động nộp duyệt.

---

## C. Review Data Model (Mô hình dữ liệu xét duyệt)
- **Thực thể `DocumentReview`:**
  - `id` (Long): Khóa chính tự tăng.
  - `document` (ManyToOne -> Document): Tham chiếu khóa ngoại tới tài liệu gốc.
  - `versionNumber` (Integer): Số phiên bản cụ thể được nộp xét duyệt.
  - `status` (ReviewStatus Enum): Trạng thái quy trình nghiệp vụ: `PENDING`, `APPROVED`, `REJECTED`, `SUPERSEDED`.
  - `submittedBy` (String): Tên người dùng nộp yêu cầu duyệt.
  - `submittedAt` (Instant): Dấu thời gian nộp duyệt.
  - `reviewedBy` (String): Tên Admin thực hiện duyệt hoặc từ chối.
  - `reviewedAt` (Instant): Dấu thời gian ra quyết định duyệt/từ chối.
  - `reviewComment` (String): Nhận xét hoặc lý do bắt buộc khi từ chối.
- **Ràng buộc nghiệp vụ sống còn:** Xét duyệt và phê duyệt được gắn chặt với cặp `(Document ID, Version Number)`, KHÔNG CHỈ gắn chung với Document ID.

---

## D. Workflow State Model (Mô hình trạng thái quy trình)
Trạng thái xét duyệt của phiên bản hiện hành được suy diễn động (derived state) từ các bản ghi `DocumentReview`:
1. **DRAFT (Nháp):**
   - Phiên bản hiện hành chưa từng được nộp xét duyệt, HOẶC
   - Yêu cầu xét duyệt trước đó đã bị `SUPERSEDED` khi có phiên bản mới hơn được tạo ra.
2. **PENDING (Chờ duyệt):**
   - Phiên bản hiện hành có yêu cầu xét duyệt mới nhất ở trạng thái `PENDING`.
3. **APPROVED (Đã duyệt):**
   - Phiên bản hiện hành có quyết định xét duyệt mới nhất là `APPROVED`.
4. **REJECTED (Bị từ chối):**
   - Phiên bản hiện hành có quyết định xét duyệt mới nhất là `REJECTED`.

---

## E. Submit for Review (Nộp xét duyệt)
- **API Endpoint:**
  - `POST /api/documents/{id}/review`
  - `POST /api/documents/{id}/reviews`
- **Nguyên tắc an toàn:**
  - Client KHÔNG cần truyền `versionNumber`. Backend luôn tự động lấy `document.getCurrentVersionNumber()` từ CSDL để triệt tiêu nguy cơ client submit phiên bản cũ tùy ý.
- **Quy tắc chặn xung đột (409 Conflict):**
  - Nếu phiên bản hiện hành đang có yêu cầu `PENDING` -> Trả mã `409 Conflict` (Chặn duplicate pending review).
  - Nếu phiên bản hiện hành đã từng bị `REJECTED` -> Trả mã `409 Conflict` (Bắt buộc người dùng tải lên phiên bản mới trước khi nộp lại).
- **An toàn tương tranh (Concurrency):**
  - Khóa bi quan `findByIdForUpdate(documentId)` trên bảng `documents` đảm bảo tuần tự hóa các yêu cầu nộp duyệt gửi đồng thời, triệt tiêu race-condition.

---

## F. Review Queue (Hàng đợi xét duyệt của Admin)
- **API Endpoint:** `GET /api/admin/reviews`
- **Quyền hạn truy cập:** `ROLE_ADMIN` duy nhất. `ROLE_STAFF` truy cập bị chặn với mã `403 Forbidden`.
- **Thứ tự hàng đợi:** Mặc định trả về các yêu cầu `PENDING` theo thứ tự nộp sớm nhất lên đầu (`submittedAt ASC`), đảm bảo tính công bằng (First-In, First-Out).
- **Bộ lọc hỗ trợ:**
  - `status`: Lọc theo `PENDING`, `APPROVED`, `REJECTED`, `SUPERSEDED`, hoặc `ALL`.
  - `username`: Lọc theo người nộp.
  - `documentId`: Lọc theo tài liệu cụ thể.

---

## G. Approval (Phê duyệt)
- **API Endpoint:** `POST /api/admin/reviews/{reviewId}/approve`
- **Body:** `{ "comment": "Ghi chú phê duyệt..." }` (Tùy chọn).
- **Điều kiện tiên quyết:**
  - Người thực thi phải mang quyền `ROLE_ADMIN`.
  - Bản ghi xét duyệt phải đang ở trạng thái `PENDING`. Nếu đã là `APPROVED`, `REJECTED` hoặc `SUPERSEDED` -> Trả mã `409 Conflict`.
- **Xử lý:**
  - Gắn khóa bi quan `findByIdForUpdate(reviewId)` trên bản ghi `document_reviews`.
  - Cập nhật `status = APPROVED`, `reviewedBy = admin_username`, `reviewedAt = now()`.
  - Ghi nhật ký kiểm toán `DOCUMENT_REVIEW_APPROVE`.
  - Bản ghi sau khi duyệt là bất biến (immutable) về quyết định lịch sử.

---

## H. Rejection (Từ chối)
- **API Endpoint:** `POST /api/admin/reviews/{reviewId}/reject`
- **Body:** `{ "comment": "Lý do từ chối cụ thể..." }`
- **Điều kiện tiên quyết:**
  - Lý do từ chối (`comment`) là **BẮT BUỘC** (`@NotBlank`). Nếu gửi chuỗi rỗng -> Trả mã `400 Bad Request`.
  - Bản ghi xét duyệt phải đang ở trạng thái `PENDING`. Nếu đã xử lý hoặc bị thay thế -> Trả mã `409 Conflict`.
- **Xử lý:**
  - Khóa bản ghi `document_reviews`, cập nhật `status = REJECTED`, `reviewedBy = admin_username`, `reviewedAt = now()`, `reviewComment = comment`.
  - Ghi nhật ký kiểm toán `DOCUMENT_REVIEW_REJECT`.

---

## I. Version Integration (Tích hợp với tính năng Phiên bản)
- **Tải lên phiên bản mới sau khi duyệt:**
  - Giả sử v1 được duyệt (`APPROVED`).
  - Người dùng tải lên v2: v2 là phiên bản mới, có trạng thái `DRAFT`.
  - Bản ghi duyệt của v1 trong lịch sử vẫn giữ nguyên trạng thái `APPROVED`.
  - Tuyệt đối không copy trạng thái `APPROVED` của v1 sang v2.
- **Khôi phục phiên bản cũ (Restore):**
  - Khôi phục v1 (đã duyệt) tạo ra phiên bản v3 mới.
  - Phiên bản v3 được khởi tạo độc lập ở trạng thái `DRAFT`.

---

## J. Supersede Behavior (Cơ chế Thay thế khi đang chờ duyệt)
- **Tình huống nghiệp vụ:** Phiên bản v3 đang ở trạng thái `PENDING` (chờ Admin duyệt), nhưng người dùng tiếp tục tải lên phiên bản v4 (hoặc khôi phục một phiên bản cũ).
- **Cơ chế xử lý tự động:**
  - Hệ thống tự động chuyển đổi toàn bộ yêu cầu xét duyệt `PENDING` của tài liệu đó sang trạng thái `SUPERSEDED`.
  - Tự động bổ sung chú thích hệ thống: `"[Hệ thống] Đã được thay thế bởi phiên bản mới..."`.
  - Phiên bản mới (v4) xuất hiện ở trạng thái `DRAFT`.
  - Khi Admin cố gắng Approve một bản ghi đã `SUPERSEDED` -> Hệ thống chặn với mã `409 Conflict`.
  - Phát sinh sự kiện kiểm toán `DOCUMENT_REVIEW_SUPERSEDE`.

---

## K. Review History (Lịch sử xét duyệt)
- **API Endpoint:** `GET /api/documents/{id}/reviews`
- **Quyền hạn truy cập:** Yêu cầu quyền đọc `READ` trên tài liệu (thông qua `DocumentAccessService`).
  - Người dùng không có quyền truy cập trên tài liệu `PRIVATE` bị chặn với mã `403 Forbidden`.
- **Định dạng trả về:** Sắp xếp theo thứ tự mới nhất xếp trên (`submittedAt DESC`).
- **Thông tin chi tiết:** `reviewId`, `versionNumber`, `status`, `submittedBy`, `submittedAt`, `reviewedBy`, `reviewedAt`, `reviewComment`.

---

## L. ACL Enforcement (Kiểm soát quyền truy cập chặt chẽ)
| Thao tác nghiệp vụ | API Endpoint | Quyền hạn yêu cầu | Cơ chế kiểm tra |
| :--- | :--- | :--- | :--- |
| **Nộp xét duyệt** | `POST /api/documents/{id}/review` | `OWNER`, `ROLE_ADMIN`, hoặc user có quyền `EDIT` | `DocumentAccessService.canEdit()` |
| **Xem hàng đợi Admin**| `GET /api/admin/reviews` | `ROLE_ADMIN` | `SecurityConfig` + `@PreAuthorize("hasRole('ADMIN')")` |
| **Xem trước tệp nộp duyệt** | `GET /api/admin/reviews/{id}/preview` | `ROLE_ADMIN` | `SecurityConfig` (bảo vệ đường dẫn vật lý) |
| **Phê duyệt yêu cầu** | `POST /api/admin/reviews/{id}/approve` | `ROLE_ADMIN` | `SecurityConfig` + Method Security |
| **Từ chối yêu cầu** | `POST /api/admin/reviews/{id}/reject` | `ROLE_ADMIN` | `SecurityConfig` + Method Security |
| **Xem lịch sử duyệt** | `GET /api/documents/{id}/reviews` | Bất kỳ ai có quyền `READ` tài liệu | `DocumentAccessService.canRead()` |

---

## M. Frontend Implementation (Giao diện người dùng)
Giao diện được nâng cấp toàn diện, trực quan và hiện đại:
1. **Workflow Badges trên danh sách tài liệu (`DocumentsPage.tsx`):**
   - `Nháp` (Badge xám): Tài liệu mới hoặc phiên bản chưa nộp duyệt.
   - `Chờ duyệt` (Badge hổ phách / Amber): Đang chờ quản trị viên phê duyệt.
   - `Đã duyệt` (Badge xanh ngọc / Emerald): Đã được quản trị viên thông qua.
   - `Bị từ chối` (Badge hoa hồng / Rose): Bị từ chối xét duyệt kèm lý do.
2. **Nút hành động "Gửi duyệt":**
   - Chỉ hiển thị và kích hoạt khi phiên bản hiện hành là `DRAFT`.
   - Vô hiệu hóa hoặc ẩn khi đang `PENDING`, `APPROVED` hoặc `REJECTED`.
3. **Modal xem Lịch sử duyệt (`DocumentReviewHistoryModal.tsx`):**
   - Hiển thị danh sách chi tiết các lượt duyệt qua từng phiên bản, người duyệt, thời gian và nhận xét phản hồi.
4. **Trang Hàng đợi duyệt Admin (`ReviewQueuePage.tsx`):**
   - Tích hợp thanh điều hướng (`Navbar.tsx`): Thêm mục "Hàng đợi duyệt" dành riêng cho `ROLE_ADMIN`.
   - Bộ lọc trạng thái trực quan: Chờ duyệt, Đã duyệt, Bị từ chối, Đã thay thế, Tất cả.
   - Chức năng Xem trước phiên bản nộp duyệt (`Preview Exact Version`).
   - Modal Phê duyệt: Cho phép gửi lời nhận xét kèm theo.
   - Modal Từ chối: Trường lý do từ chối bắt buộc có kiểm tra validation chặt chẽ.

---

## N. Audit Integration (Nhật ký kiểm toán)
Bổ sung 4 hành động kiểm toán hệ thống mới:
1. `DOCUMENT_REVIEW_SUBMIT`: Ghi nhận người dùng nộp xét duyệt phiên bản cụ thể.
2. `DOCUMENT_REVIEW_APPROVE`: Ghi nhận quản trị viên phê duyệt phiên bản cụ thể.
3. `DOCUMENT_REVIEW_REJECT`: Ghi nhận quản trị viên từ chối phiên bản kèm lý do.
4. `DOCUMENT_REVIEW_SUPERSEDE`: Ghi nhận việc hệ thống tự động thay thế yêu cầu duyệt cũ khi có phiên bản mới.

*Nguyên tắc bảo mật:* Nhật ký kiểm toán không bao giờ ghi lại Token, JWT, mật khẩu hay đường dẫn tệp vật lý nhạy cảm.

---

## O. New Tests (Chi tiết 28 bài kiểm thử mới: Tests 105 - 132)
| Test ID | Tên kịch bản kiểm thử | Kết quả |
| :--- | :--- | :--- |
| **TEST 105** | Tài liệu mới chưa gửi duyệt báo cáo trạng thái `DRAFT` | **PASS** |
| **TEST 106** | Owner gửi xét duyệt phiên bản hiện hành -> `PENDING` | **PASS** |
| **TEST 107** | Người dùng được chia sẻ quyền `EDIT` gửi xét duyệt thành công | **PASS** |
| **TEST 108** | Người dùng chỉ có quyền `READ` bị từ chối `403 Forbidden` khi nộp duyệt | **PASS** |
| **TEST 109** | Nộp duyệt lặp lại khi phiên bản đang `PENDING` bị chặn `409 Conflict` | **PASS** |
| **TEST 110** | `ROLE_STAFF` bị chặn `403 Forbidden` khi truy cập Review Queue của Admin | **PASS** |
| **TEST 111** | `ROLE_ADMIN` liệt kê thành công danh sách hàng đợi xét duyệt | **PASS** |
| **TEST 112** | Xem trước trong hàng đợi trả về chính xác 100% bytes của phiên bản nộp duyệt | **PASS** |
| **TEST 113** | Quản trị viên phê duyệt yêu cầu xét duyệt thành công -> `APPROVED` | **PASS** |
| **TEST 114** | Non-admin (`ROLE_STAFF`) không thể phê duyệt tài liệu -> `403 Forbidden` | **PASS** |
| **TEST 115** | Tài liệu có phiên bản hiện hành đã duyệt báo cáo trạng thái `APPROVED` | **PASS** |
| **TEST 116** | Bản ghi phê duyệt lưu trữ chính xác số phiên bản (`versionNumber`) | **PASS** |
| **TEST 117** | Tải lên phiên bản mới sau khi duyệt -> phiên bản mới mang trạng thái `DRAFT` | **PASS** |
| **TEST 118** | Lịch sử phê duyệt của phiên bản cũ vẫn được bảo toàn nguyên vẹn | **PASS** |
| **TEST 119** | Quản trị viên từ chối xét duyệt kèm lý do chi tiết -> `REJECTED` | **PASS** |
| **TEST 120** | Từ chối xét duyệt khi không có lý do bị chặn `400 Bad Request` | **PASS** |
| **TEST 121** | Tài liệu bị từ chối báo cáo trạng thái `REJECTED` | **PASS** |
| **TEST 122** | Không cho phép nộp duyệt lại chính phiên bản đã bị từ chối -> `409 Conflict` | **PASS** |
| **TEST 123** | Tải lên phiên bản mới sau từ chối -> trở về `DRAFT` và nộp duyệt thành công | **PASS** |
| **TEST 124** | Tải lên phiên bản mới khi bản cũ đang `PENDING` -> bản cũ chuyển thành `SUPERSEDED` | **PASS** |
| **TEST 125** | Yêu cầu xét duyệt đã bị `SUPERSEDED` không thể phê duyệt -> `409 Conflict` | **PASS** |
| **TEST 126** | Khôi phục phiên bản cũ sinh version mới mang trạng thái `DRAFT` (không copy duyệt cũ) | **PASS** |
| **TEST 127** | Người dùng có quyền `READ` xem được toàn bộ lịch sử xét duyệt tài liệu | **PASS** |
| **TEST 128** | Người dùng không có quyền bị chặn `403 Forbidden` khi xem lịch sử tài liệu `PRIVATE` | **PASS** |
| **TEST 129** | Nhật ký kiểm toán ghi nhận đầy đủ 4 sự kiện xét duyệt mới | **PASS** |
| **TEST 130** | Khóa bi quan ngăn chặn gửi duyệt đồng thời 2 yêu cầu trên cùng phiên bản | **PASS** |
| **TEST 131** | Xử lý đồng thời Approve và Reject chỉ tạo ra duy nhất 1 quyết định cuối cùng | **PASS** |
| **TEST 132** | Khởi động lại toàn bộ stack (`docker compose restart`) và kiểm tra tính toàn vẹn | **PASS** |

---

## P. Full Regression (Kết quả kiểm thử hồi quy toàn diện)
- **Tổng số bài kiểm thử đã chạy:** 132 tests (Từ TEST 1 đến TEST 132).
- **Kết quả:** **132/132 PASS (100%)**.
- **Tỷ lệ lỗi:** 0%.
- **Bảo toàn nền tảng cũ:** 104 bài kiểm thử của Lab 1, Sprint 1–4, Phase 5 và Phase 6 giữ nguyên vẹn 100% và đều PASS.

---

## Q. Full-Stack Persistence (Kiểm tra bền vững toàn hệ thống)
- Thực hiện lệnh: `docker compose restart` trên toàn bộ stack (không sử dụng cờ `-v`).
- Kết quả kiểm tra sau khởi động:
  1. Dữ liệu bảng `users`, `documents`, `document_permissions`, `document_versions`, `document_reviews`, `saved_searches`, `audit_logs` toàn vẹn 100%.
  2. Toàn bộ tệp tin vật lý đính kèm trong volume `edms_storage_data` giữ nguyên vẹn.
  3. Lịch sử xét duyệt, hàng đợi chờ duyệt, trạng thái `APPROVED`, `REJECTED`, `SUPERSEDED` duy trì tuyệt đối.
  4. Endpoint kiểm tra sức khỏe `http://localhost:8080/api/health` trả về `UP` ngay sau khi hệ thống sẵn sàng.

---

## R. Backend Build (Xây dựng mã nguồn Backend)
- **Công cụ:** Maven 3.9.6 + Eclipse Temurin JDK 21 (Docker Multi-stage).
- **Mã nguồn biên dịch:** 68 source files.
- **Kết quả:** `BUILD SUCCESS`, Exit code: 0.
- **Artifact:** `edms-backend-1.0.0-sprint1.jar` tạo thành công và chạy ổn định.

---

## S. Frontend Build (Xây dựng mã nguồn Frontend)
- **Công cụ:** Vite 5.4.21 + TypeScript compiler (`tsc && vite build`).
- **Mã nguồn biên dịch:** 1,645 modules.
- **Thời gian build:** 2.23s.
- **Kết quả:** 0 lỗi TypeScript, 0 cảnh báo cú pháp, Exit code: 0.
- **Artifacts:** `dist/index.html`, `dist/assets/index-BbCXU79D.css`, `dist/assets/index-BRrtAkzk.js`.

---

## T. Docker Status (Trạng thái container)
| Tên Container | Hình ảnh (Image) | Cổng mở (Ports) | Trạng thái | Kiểm tra sức khỏe |
| :--- | :--- | :--- | :--- | :--- |
| `edms-postgres` | `postgres:16-alpine` | `5432:5432` | Up | Healthy |
| `edms-backend` | `doan_cnpmnc-backend:latest` | `8080:8080` | Up | Health API: 200 UP |
| `edms-frontend` | `doan_cnpmnc-frontend:latest` | `5173:5173` | Up | HTTP 200 Web UI |

---

## U. Known Limitations (Giới hạn phạm vi đã thỏa thuận)
Theo đúng nguyên tắc không over-engineer tại Mục 3 và Mục 45 của yêu cầu Phase 7:
1. Không triển khai BPMN workflow engine phức tạp hay luồng duyệt động theo phòng ban.
2. Không triển khai chữ ký số (digital signature), chứng thư số điện tử.
3. Không gửi thông báo qua email hoặc SMS ra bên ngoài.
4. Không triển khai phê duyệt song song nhiều cấp (parallel / sequential multi-approver).
5. Không thiết lập thời hạn cam kết SLA hoặc tự động leo thang (escalation).

Các chức năng này được chủ động giữ lại cho các giai đoạn phát triển tiếp theo trong tương lai.

---

## V. Verdict (Kết luận nghiệm thu)
# `PHASE7_DOCUMENT_REVIEW_APPROVAL_PASS`
