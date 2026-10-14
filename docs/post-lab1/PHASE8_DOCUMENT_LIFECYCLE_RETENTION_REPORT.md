# BÁO CÁO NGHIỆM THU EDMS PHASE 8
## DOCUMENT LIFECYCLE, ARCHIVE & RETENTION
**Trạng thái phê duyệt:** HOÀN THÀNH TOÀN DIỆN & VƯỢT MỨC MỤC TIÊU  
**Baseline trước Phase 8:** LAB1_EDMS_DOCUMENTATION_ALIGNED + PHASE5_DOCUMENT_ACCESS_PASS + PHASE6_DOCUMENT_VERSIONING_PASS + PHASE7_DOCUMENT_REVIEW_APPROVAL_PASS (132/132 Tests PASS)  
**Baseline sau Phase 8:** 164/164 Tests PASS (100% PASS trên toàn bộ hệ thống)  
**Verdict:** `PHASE8_DOCUMENT_LIFECYCLE_RETENTION_PASS`

---

## A. Baseline Verification (Kiểm tra nền tảng ban đầu)
- **Phương pháp thực hiện:** Phát triển cuốn chiếu gia tăng (Incremental Vertical Slice Development).
- **Nguyên tắc an toàn và bảo toàn:**
  - Không tạo project mới, không viết lại kiến trúc hệ thống.
  - Không reset database, không xóa Docker volumes (`docker compose down -v` KHÔNG BAO GIỜ được gọi).
  - Không xóa vật lý (No physical deletion / No hard delete) bất kỳ tài liệu, phiên bản hay tệp tin nào.
  - Không sửa đổi thư mục `docs/final-evidence/` và các tài liệu Lab 1 (Lab 1 tiếp tục là historical snapshot).
- **Kết quả kiểm tra trước khi lập trình:**
  - Đã thực thi toàn bộ 132 bài test nền tảng (Sprint 1–4, Phase 5 Access Control, Phase 6 Versioning, Phase 7 Review & Approval).
  - Toàn bộ 132/132 bài test đạt **PASS 100%**.
  - Toàn bộ các phiên bản tài liệu, ACL và nhật ký kiểm toán hiện có được bảo toàn nguyên vẹn.

---

## B. Database Migration (Di chuyển dữ liệu CSDL)
Thực thi di chuyển CSDL phi phá hủy (Non-destructive Migration), tương thích tuyệt đối với dữ liệu hiện có:

1. **Bổ sung các cột vòng đời vào bảng `documents`:**
   ```sql
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50);
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_until DATE;
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE;
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_reason VARCHAR(1000);
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_set_at TIMESTAMP WITH TIME ZONE;
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_set_by VARCHAR(50);
   ```

2. **Chỉ mục tối ưu hóa truy vấn:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_doc_lifecycle_status ON documents(lifecycle_status);
   CREATE INDEX IF NOT EXISTS idx_doc_retention_until ON documents(retention_until);
   CREATE INDEX IF NOT EXISTS idx_doc_legal_hold ON documents(legal_hold);
   ```

3. **Tính toàn vẹn dữ liệu cũ:**
   - Dữ liệu hiện có mặc định có `lifecycle_status = 'ACTIVE'` và `legal_hold = FALSE`.
   - Không fabricate giả mạo `archived_at` hay `archived_by` cho dữ liệu cũ (được giữ nguyên `NULL`).
   - Không làm thay đổi bất kỳ bảng nào khác (`document_versions`, `document_permissions`, `document_reviews`, `audit_logs`).

---

## C. Lifecycle Data Model (Mô hình dữ liệu vòng đời)
- **Enum `LifecycleStatus`:**
  - `ACTIVE`: Tài liệu đang trong quá trình khai thác kinh doanh bình thường, cho phép sửa đổi theo phân quyền ACL.
  - `ARCHIVED`: Tài liệu đã hoàn thành nghiệp vụ và được lưu trữ dài hạn ở chế độ chỉ đọc (Read-only Business Record).
- **Phân định rạch ròi giữa 2 trạng thái độc lập:**
  - **Review Status:** `DRAFT`, `PENDING`, `APPROVED`, `REJECTED` (Quy trình kiểm duyệt nghiệp vụ của phiên bản hiện hành).
  - **Lifecycle Status:** `ACTIVE`, `ARCHIVED` (Giai đoạn trong vòng đời lưu trữ của hồ sơ tài liệu).
  - Một tài liệu có thể đồng thời có `Review Status = APPROVED` và `Lifecycle Status = ARCHIVED`. Hai trạng thái hoạt động độc lập và bổ trợ lẫn nhau.

---

## D. Archive Behavior (Hành vi Lưu trữ tài liệu)
- **API Endpoint:** `POST /api/documents/{id}/archive`
  - Body tùy chọn: `{"retentionUntil": "YYYY-MM-DD"}`
- **Điều kiện tiên quyết (Archive Rules):**
  1. Tài liệu phải đang ở trạng thái `lifecycleStatus == ACTIVE`.
  2. Phiên bản hiện hành phải có trạng thái kiểm duyệt là `APPROVED`. Nếu tài liệu đang là `DRAFT`, `PENDING` hoặc `REJECTED` -> Lập tức từ chối với mã **`409 Conflict`**.
  3. Người thực hiện phải là **Owner** của tài liệu hoặc người dùng có vai trò **ROLE_ADMIN**. Người dùng chỉ được chia sẻ quyền `EDIT` hoặc `READ` sẽ bị từ chối với mã **`403 Forbidden`**.
  4. Nếu có truyền `retentionUntil`: Ngày chỉ định không được nằm trong quá khứ tại thời điểm archive (nếu ngày trong quá khứ -> từ chối với mã **`400 Bad Request`**).
- **Trạng thái sau khi Archive:**
  - `lifecycleStatus = ARCHIVED`
  - Ghi nhận `archivedAt` (thời điểm server) và `archivedBy` (username thực hiện).
  - Lưu `retentionUntil` nếu được cung cấp.

---

## E. Unarchive Behavior (Khôi phục trạng thái hoạt động)
- **API Endpoint:** `POST /api/documents/{id}/unarchive`
- **Quyền hạn:** Owner hoặc ROLE_ADMIN.
- **Quy tắc chuyển đổi:**
  - Tài liệu chuyển từ `ARCHIVED` về `ACTIVE`.
  - Giữ nguyên toàn bộ lịch sử phiên bản và lịch sử xét duyệt (`document_reviews` không bị biến động).
  - KHÔNG tự ý sinh phiên bản mới chỉ vì thao tác unarchive.
  - Tài liệu trở lại khả năng chỉnh sửa và phát triển phiên bản bình thường theo ACL.

---

## F. Read-Only Enforcement (Thực thi chế độ chỉ đọc trên tài liệu lưu trữ)
Khi tài liệu ở trạng thái `ARCHIVED`, hệ thống biến tài liệu thành **bản ghi kinh doanh chỉ đọc bất biến**:
- **CÁC THAO TÁC BỊ CHẶN TUYỆT ĐỐI (Trả về `409 Conflict`):**
  1. Cập nhật thông tin / phân loại tài liệu (`PUT /api/documents/{id}`) -> 409 Conflict.
  2. Tải lên phiên bản mới (`POST /api/documents/{id}/versions`) -> 409 Conflict.
  3. Khôi phục phiên bản lịch sử (`POST /api/documents/{id}/versions/{v}/restore`) -> 409 Conflict.
  4. Nộp yêu cầu xét duyệt mới (`POST /api/documents/{id}/review`) -> 409 Conflict.
  5. Cấp quyền hoặc sửa quyền chia sẻ (`POST /api/documents/{id}/permissions`) -> 409 Conflict.
  6. Thay đổi chế độ bảo mật accessMode (`PUT /api/documents/{id}/access-mode`) -> 409 Conflict.
- **CÁC THAO TÁC ĐƯỢC PHÉP TRUY CẬP:**
  - Xem metadata tài liệu (`GET /api/documents/{id}`).
  - Xem trước tệp (`GET /api/documents/{id}/preview`).
  - Tải về tệp gốc (`GET /api/documents/{id}/download`).
  - Xem lịch sử phiên bản (`GET /api/documents/{id}/versions`).
  - Xem lịch sử xét duyệt (`GET /api/documents/{id}/reviews`).
  - Xem danh sách phân quyền ACL (`GET /api/documents/{id}/permissions`).
  - In phiếu đặc tả metadata.

---

## G. Retention (Thời hạn lưu trữ)
- **API Endpoint:** `PUT /api/documents/{id}/retention`
  - Body: `{"retentionUntil": "YYYY-MM-DD"}`
- **Quyền hạn:** Chỉ dành riêng cho `ROLE_ADMIN`.
- **Nghiệp vụ:**
  - Đặt mốc thời gian tối thiểu mà tài liệu bắt buộc phải được lưu giữ trong hệ thống.
  - Định dạng hợp lệ: chuẩn ISO `YYYY-MM-DD`. Nếu định dạng sai hoặc rỗng -> Trả về **`400 Bad Request`**.

---

## H. Legal Hold (Bảo lưu pháp lý)
- **API Endpoint:** `PUT /api/documents/{id}/legal-hold`
  - Body: `{"enabled": boolean, "reason": string}`
- **Quyền hạn:** Dành riêng cho `ROLE_ADMIN`.
- **Quy tắc nghiệp vụ:**
  - Khi `enabled = true`: Thuộc tính `reason` là **BẮT BUỘC** (nếu để trống -> trả về **`400 Bad Request`**).
  - Hệ thống ghi nhận `legalHold = true`, `legalHoldReason`, `legalHoldSetAt`, `legalHoldSetBy`.
  - Khi `enabled = false`: Giải phóng lệnh bảo lưu pháp lý (`legalHold = false`).
  - Lệnh Legal Hold ngăn chặn tuyệt đối việc đánh dấu đủ điều kiện tiêu hủy (`eligibleForDisposition`).
  - Legal Hold KHÔNG làm thay đổi version, review status, hay phân quyền ACL của tài liệu.

---

## I. Disposition Eligibility (Xác định điều kiện tiêu hủy)
- **Thuộc tính suy diễn (Calculated Property):** `eligibleForDisposition: boolean`
- **Nguyên tắc cốt tử:**
  - **Không tin thời gian từ Client.** Tính toán hoàn toàn dựa trên đồng hồ server (`LocalDate.now()`).
  - **KHÔNG thực hiện xóa vật lý trong Phase 8.** Chỉ đánh dấu cờ logic để người quản trị biết tài liệu đã sẵn sàng cho quy trình xử lý disposition trong tương lai.
- **Công thức điều kiện đủ:**
  `eligibleForDisposition = true` KHI VÀ CHỈ KHI:
  1. `lifecycleStatus == ARCHIVED`
  2. `legalHold == false`
  3. `retentionUntil != null`
  4. `LocalDate.now() >= retentionUntil`
  5. Phiên bản hiện hành không có yêu cầu xét duyệt nào đang `PENDING`.
- **Nếu tài liệu đang `ACTIVE`:** `eligibleForDisposition` luôn luôn là `false` bất kể ngày retention trong quá khứ.
- **Nếu `retentionUntil == null`:** `eligibleForDisposition` luôn là `false`.

---

## J. ACL Integration (Tích hợp phân quyền truy cập)
- Archive không biến tài liệu riêng tư (`PRIVATE`) thành tài liệu công cộng hay nội bộ (`INTERNAL`).
- Tài liệu `PRIVATE + ARCHIVED`:
  - Người dùng không có quyền trong ACL tiếp tục bị từ chối với mã **`403 Forbidden`** khi cố gắng truy cập.
  - Người dùng được chia sẻ quyền `READ` hoặc `EDIT` được phép xem metadata, xem trước tệp và tải xuống theo quyền đọc.
  - Người dùng được chia sẻ quyền `EDIT` KHÔNG được phép lưu trữ (Archive) hay khôi phục (Unarchive) tài liệu (chỉ Owner hoặc Admin mới có quyền).

---

## K. Review Integration (Tích hợp quy trình xét duyệt)
- Quy tắc nghiêm ngặt: Chỉ tài liệu có phiên bản hiện hành là `APPROVED` mới được phép Archive.
- Nếu tài liệu có lịch sử v1 APPROVED nhưng hiện tại đã tạo v2 mang trạng thái DRAFT: Hệ thống căn cứ theo phiên bản hiện hành (v2 DRAFT) và **CHẶN Archive với mã 409 Conflict**.
- Khi tài liệu đang ở trạng thái `ARCHIVED`, không ai có thể gửi yêu cầu xét duyệt mới (bị chặn 409 Conflict).

---

## L. Version Integration (Tích hợp phiên bản)
- Trên tài liệu `ARCHIVED`:
  - Thao tác nộp phiên bản mới (`uploadNewVersion`) bị chặn với mã **`409 Conflict`**.
  - Thao tác khôi phục phiên bản (`restoreVersion`) bị chặn với mã **`409 Conflict`**.
- Sau khi tài liệu được Unarchive về `ACTIVE`:
  - Các thao tác upload version và restore version được mở khóa và hoạt động trơn tru bình thường.

---

## M. Search/List Integration (Tích hợp tìm kiếm và danh sách)
- Cập nhật JPA Specification và Repository:
  - Hỗ trợ tham số `lifecycleStatus=ACTIVE` hoặc `lifecycleStatus=ARCHIVED`.
  - Hỗ trợ cờ `includeArchived=true`.
  - Mặc định khi không chỉ định tham số: Trả về toàn bộ tài liệu người dùng có quyền xem, đảm bảo tính toàn vẹn và không làm phá vỡ bất kỳ test nào từ Sprint 1–4 hay Phase 5–7.
- Khả năng kết hợp đồng thời giữa từ khóa tìm kiếm (`q`), phân loại tài liệu (`documentType`), bộ lọc vòng đời (`lifecycleStatus`) và bảo mật phân quyền ACL (`accessMode`, `permissions`).

---

## N. Frontend Implementation (Giao diện người dùng)
1. **Bộ lọc trạng thái vòng đời trên Toolbar:**
   - Bổ sung dropdown lọc: `Vòng đời (Tất cả)`, `Đang hoạt động (ACTIVE)`, `Đã lưu trữ (ARCHIVED)`.
   - Kết hợp mượt mà với ô tìm kiếm từ khóa và bộ lọc loại tài liệu.
2. **Hệ thống Huy hiệu (Badges) nhận diện:**
   - `[Đang hoạt động]`: Màu xanh lá thanh lịch.
   - `[Đã lưu trữ]`: Màu xám trung tính, biểu tượng Archive.
   - `[Legal Hold]`: Màu đỏ nổi bật, hiển thị lý do bảo lưu pháp lý.
   - `[Giữ đến YYYY-MM-DD]`: Hiển thị ngày retention tối thiểu.
   - `[Đủ ĐK tiêu hủy]`: Màu vàng cam cảnh báo tài liệu đã sẵn sàng disposition.
3. **Modal quản trị Vòng đời & Lưu trữ (`DocumentLifecycleModal.tsx`):**
   - Xem chi tiết trạng thái vòng đời, phiên bản hiện tại, người và ngày lưu trữ.
   - Hiển thị bảng điều kiện tiêu hủy (Disposition Eligibility) trực quan.
   - Nút **Lưu trữ tài liệu** cho tài liệu APPROVED (kèm trường chọn ngày retention tùy chọn).
   - Nút **Khôi phục trạng thái hoạt động (Unarchive)** cho tài liệu đã lưu trữ.
   - Khu vực quản trị dành riêng cho Admin: Cập nhật ngày retention và Bật/Tắt Legal Hold (bắt buộc nhập lý do).
4. **Vô hiệu hóa an toàn trên giao diện:**
   - Trên tài liệu `ARCHIVED`: nút Sửa (Edit), Chia sẻ (Share), Gửi duyệt (Submit Review) tự động mờ và chuyển sang trạng thái `disabled`.
   - Trong `DocumentVersionModal`: Tự động ẩn biểu mẫu tải lên phiên bản mới và ẩn nút khôi phục phiên bản khi tài liệu đang được lưu trữ, đồng thời hiển thị thông báo giải thích rõ ràng.

---

## O. Audit Log Integration (Nhật ký kiểm toán)
Bổ sung đầy đủ 5 sự kiện kiểm toán mới cho Phase 8:
1. `DOCUMENT_ARCHIVE`: Ghi nhận khi tài liệu được lưu trữ.
2. `DOCUMENT_UNARCHIVE`: Ghi nhận khi tài liệu được khôi phục về trạng thái hoạt động.
3. `DOCUMENT_RETENTION_UPDATE`: Ghi nhận khi Admin thay đổi ngày retentionUntil.
4. `DOCUMENT_LEGAL_HOLD_SET`: Ghi nhận khi Admin áp dụng lệnh Legal Hold kèm lý do.
5. `DOCUMENT_LEGAL_HOLD_RELEASE`: Ghi nhận khi Admin giải phóng lệnh Legal Hold.
- **Tính bất biến của Audit Log:** Việc lưu trữ tài liệu hoàn toàn không làm xóa hay lưu trữ bảng `audit_logs`. Toàn bộ nhật ký kiểm toán tồn tại độc lập và bất biến.

---

## P. Concurrency & Integrity (An toàn tương tranh & Toàn vẹn dữ liệu)
- Áp dụng khóa bi quan `findByIdForUpdate` trong các giao dịch quản trị vòng đời.
- Hai yêu cầu Archive gửi đồng thời trên cùng một tài liệu: Chỉ duy nhất 1 yêu cầu thành công (200), yêu cầu thứ hai bị chặn an toàn với mã `409 Conflict`.
- Xung đột đồng thời giữa Archive và Upload Version: Được xử lý nguyên tử và tuần tự, ngăn chặn triệt để trạng thái bất thường (không bao giờ sinh ra tài liệu vừa ARCHIVED vừa mang phiên bản mới ngoài ý muốn).

---

## Q. Automated Test Suite (Danh mục kiểm thử tự động Phase 8)
Đã triển khai và thực thi thành công toàn bộ 32 bài test tự động mới (từ TEST 133 đến TEST 164) trong `test_regression.py`:

| STT | Tên bài kiểm thử | Mục tiêu kiểm chứng | Kết quả |
| :--- | :--- | :--- | :---: |
| **TEST 133** | `test_133_existing_documents_migrated_as_active` | Dữ liệu cũ tự động mang `lifecycleStatus = ACTIVE`, `legalHold = false` | **PASS** |
| **TEST 134** | `test_134_draft_cannot_be_archived` | Chặn lưu trữ tài liệu phiên bản DRAFT -> trả về 409 Conflict | **PASS** |
| **TEST 135** | `test_135_pending_cannot_be_archived` | Chặn lưu trữ tài liệu đang PENDING review -> trả về 409 Conflict | **PASS** |
| **TEST 136** | `test_136_rejected_cannot_be_archived` | Chặn lưu trữ tài liệu phiên bản bị REJECTED -> trả về 409 Conflict | **PASS** |
| **TEST 137** | `test_137_approved_can_be_archived` | Lưu trữ thành công tài liệu có phiên bản APPROVED | **PASS** |
| **TEST 138** | `test_138_archive_stores_metadata` | Kiểm tra lưu trữ đủ `archivedAt`, `archivedBy`, `retentionUntil` | **PASS** |
| **TEST 139** | `test_139_archived_document_preview_download_works` | Tài liệu ARCHIVED vẫn cho phép preview và download bình thường | **PASS** |
| **TEST 140** | `test_140_archived_document_cannot_update_metadata` | Chặn cập nhật thông tin metadata trên tài liệu ARCHIVED (409) | **PASS** |
| **TEST 141** | `test_141_archived_document_cannot_upload_version` | Chặn tải lên phiên bản mới trên tài liệu ARCHIVED (409) | **PASS** |
| **TEST 142** | `test_142_archived_document_cannot_restore_version` | Chặn khôi phục phiên bản cũ trên tài liệu ARCHIVED (409) | **PASS** |
| **TEST 143** | `test_143_archived_document_cannot_submit_review` | Chặn nộp duyệt trên tài liệu ARCHIVED (409) | **PASS** |
| **TEST 144** | `test_144_archived_document_cannot_modify_sharing` | Chặn thay đổi phân quyền ACL và accessMode trên tài liệu ARCHIVED (409) | **PASS** |
| **TEST 145** | `test_145_admin_can_update_retention` | Admin cập nhật thời hạn retentionUntil thành công | **PASS** |
| **TEST 146** | `test_146_invalid_retention_rejected` | Định dạng ngày retention không hợp lệ bị từ chối 400 Bad Request | **PASS** |
| **TEST 147** | `test_147_admin_can_set_legal_hold` | Admin kích hoạt Legal Hold kèm lý do chi tiết thành công | **PASS** |
| **TEST 148** | `test_148_legal_hold_without_reason_rejected` | Kích hoạt Legal Hold không có lý do bị chặn 400 Bad Request | **PASS** |
| **TEST 149** | `test_149_legal_hold_blocks_disposition` | Legal Hold ngăn chặn tài liệu trở thành eligibleForDisposition | **PASS** |
| **TEST 150** | `test_150_release_legal_hold_succeeds` | Admin giải phóng Legal Hold (release) thành công | **PASS** |
| **TEST 151** | `test_151_retention_not_reached_not_eligible` | Chưa tới ngày retention -> eligibleForDisposition = False | **PASS** |
| **TEST 152** | `test_152_retention_reached_archived_no_hold_eligible` | ARCHIVED + hết hạn retention + không Hold -> eligibleForDisposition = True | **PASS** |
| **TEST 153** | `test_153_active_document_never_eligible` | Tài liệu ACTIVE không bao giờ đủ điều kiện tiêu hủy | **PASS** |
| **TEST 154** | `test_154_unarchive_succeeds` | Owner/Admin khôi phục tài liệu về ACTIVE thành công | **PASS** |
| **TEST 155** | `test_155_after_unarchive_workflows_resume` | Sau unarchive, chức năng sửa metadata và tải version hoạt động lại | **PASS** |
| **TEST 156** | `test_156_private_archived_obeys_acl` | Tài liệu PRIVATE khi ARCHIVED vẫn tuân thủ nghiêm ngặt quyền ACL | **PASS** |
| **TEST 157** | `test_157_search_filter_by_lifecycle` | Lọc danh sách theo `lifecycleStatus=ACTIVE` và `ARCHIVED` chuẩn xác | **PASS** |
| **TEST 158** | `test_158_search_with_keyword_and_archived_filter` | Tìm kiếm kết hợp từ khóa và bộ lọc ARCHIVED đồng thời | **PASS** |
| **TEST 159** | `test_159_archive_unarchive_audit_events` | Ghi nhận đầy đủ sự kiện kiểm toán ARCHIVE và UNARCHIVE | **PASS** |
| **TEST 160** | `test_160_retention_legal_hold_audit_events` | Ghi nhận đầy đủ sự kiện RETENTION_UPDATE, LEGAL_HOLD_SET, RELEASE | **PASS** |
| **TEST 161** | `test_161_concurrent_double_archive_prevented` | Ngăn chặn 2 request archive đồng thời (1 thành công, 1 trả 409) | **PASS** |
| **TEST 162** | `test_162_archive_vs_version_upload_race` | Xử lý tương tranh giữa Archive và Upload Version bảo toàn tính nhất quán | **PASS** |
| **TEST 163** | `test_163_full_stack_restart_lifecycle_persistence` | Khởi động lại toàn bộ stack: Trạng thái ARCHIVED bền vững 100% | **PASS** |
| **TEST 164** | `test_164_retention_and_legal_hold_persist_after_restart` | Khởi động lại toàn bộ stack: Retention và Legal Hold bền vững 100% | **PASS** |

---

## R. Full Regression Results (Kết quả kiểm thử toàn diện)
- **Tổng số bài test:** 164 / 164 bài test.
- **Tỷ lệ vượt qua:** **100% PASS (0 FAILED, 0 SKIPPED, 0 FLAKY)**.
- **Tiến trình:**
  - Sprint 1–4 Baseline: Tests 1–57 (PASS 100%)
  - Phase 5 ACL & Access Control: Tests 58–79 (PASS 100%)
  - Phase 6 Versioning & Revision History: Tests 80–104 (PASS 100%)
  - Phase 7 Review & Approval Workflow: Tests 105–132 (PASS 100%)
  - Phase 8 Document Lifecycle, Archive & Retention: Tests 133–164 (PASS 100%)

---

## S. Persistence Verification (Kiểm tra tính bền vững sau khởi động lại)
- Thực hiện lệnh `docker compose restart` toàn bộ stack (PostgreSQL, Spring Boot Backend, Vite/Nginx Frontend).
- Tuyệt đối không dùng cờ `-v`.
- **Kết quả xác minh:**
  - CSDL PostgreSQL lưu trữ nguyên vẹn: Users, Documents, Permissions, Versions, Reviews, Saved Searches, Audit Logs.
  - Các trường dữ liệu vòng đời (`lifecycle_status`, `archived_at`, `archived_by`, `retention_until`, `legal_hold`, `legal_hold_reason`) được bảo tồn nguyên trạng.
  - Tệp nhị phân vật lý trên ổ đĩa không bị thất thoát bất kỳ byte nào.

---

## T. Backend Build
- **Công cụ xây dựng:** Maven / Docker Multi-stage build.
- **Số lượng tệp nguồn Java:** 72 source files.
- **Mã kết thúc (Exit code):** `0` (BUILD SUCCESS).
- **Trạng thái đóng gói:** Tạo tệp thực thi `edms-backend-1.0.0-SNAPSHOT.jar` sẵn sàng production.

---

## U. Frontend Build
- **Công cụ xây dựng:** Vite v5.4.21 + TypeScript compiler (`tsc`).
- **Mã kết thúc (Exit code):** `0`.
- **Số lượng modules chuyển đổi:** 1646 modules transformed.
- **Lỗi biên dịch:** `0 errors, 0 warnings`.
- **Gói đầu ra:** `dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js`.

---

## V. Docker Status
Kiểm tra trạng thái các dịch vụ qua `docker compose ps`:
- `edms-postgres`: Up (healthy) - Cổng 5432
- `edms-backend`: Up - Cổng 8080 (`/api/health` trả về `200 OK`)
- `edms-frontend`: Up - Cổng 5173

---

## W. Known Limitations (Giới hạn đã biết nằm ngoài phạm vi Phase 8)
Các tính năng sau không thuộc phạm vi của Phase 8 và sẽ được triển khai trong các giai đoạn tương lai:
1. Tiêu hủy tệp vật lý tự động theo lịch (Automated background physical disposal scheduler).
2. Tích hợp chữ ký số và xác thực chứng thư điện tử (Digital signatures).
3. Động cơ định cấu hình quy tắc lưu trữ đa quyền tài phán (Configurable multi-jurisdiction records engine).
4. Di chuyển dữ liệu sang lưu trữ băng từ / kho lạnh đám mây (AWS S3 Glacier / Cold storage tiering).
5. Trích xuất ký tự quang học (OCR) và lập chỉ mục toàn văn bản (Full-text search engine).

---

## X. Verdict (Kết luận nghiệm thu)
Hệ thống Quản lý Tài liệu Điện tử EDMS đã hoàn thành xuất sắc toàn bộ yêu cầu kỹ thuật và nghiệp vụ của **Phase 8: Document Lifecycle, Archive & Retention**. Toàn bộ 164 bài test hồi quy đều vượt qua 100% với tính toàn vẹn, bảo mật và tương thích tuyệt đối.

# VERDICT: `PHASE8_DOCUMENT_LIFECYCLE_RETENTION_PASS`
