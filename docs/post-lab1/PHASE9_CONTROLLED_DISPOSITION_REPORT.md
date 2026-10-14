# EDMS PHASE 9 CONTROLLED DOCUMENT DISPOSITION REPORT

**Dự án:** Hệ thống Quản lý Tài liệu Điện tử (EDMS - Electronic Document Management System)  
**Giai đoạn:** Phase 9 — Controlled Document Disposition Workflow (Post-Lab 1 Incremental Development)  
**Ngày thực hiện:** 20/09/2026  
**Tác giả:** Antigravity Engineering Agent  
**Immutable Baseline Trước Phase 9:** 164/164 Tests PASS (Sprint 1–4, Phase 5 Access Control, Phase 6 Versioning, Phase 7 Review & Approval, Phase 8 Lifecycle & Retention)  
**Current Test Suite Sau Phase 9:** 200/200 Tests PASS (Tests 1–200, 100% Success Rate)  
**Final Verdict:** `PHASE9_CONTROLLED_DISPOSITION_PASS`

---

## A. Baseline

Hệ thống EDMS trước Phase 9 đã hoàn thành:
1. **Lab 1 Core Baseline (Sprint 1–4):**
   - Xác thực JWT, phân quyền vai trò (ROLE_ADMIN, ROLE_STAFF), mã hóa BCrypt.
   - Quản lý tải lên, tải về, xem trước tệp tin an toàn (PDF, DOCX, PNG,...).
   - Tìm kiếm đa tiêu chí, lưu và tái sử dụng bộ lọc tìm kiếm.
   - Thống kê kho tài liệu, nhật ký kiểm toán bất biến (Audit Logging).
2. **Phase 5 Document Access Control (ACL):**
   - Phân quyền mức tài liệu: `accessMode` (`PUBLIC`, `INTERNAL`, `PRIVATE`).
   - Danh sách quyền chi tiết `READ`, `EDIT` chia sẻ cho từng người dùng.
3. **Phase 6 Document Versioning:**
   - Quản lý đa phiên bản: `currentVersionNumber`, lịch sử `DocumentVersion`.
   - Cơ chế tải lên phiên bản mới và phục hồi (`restore`) phiên bản lịch sử.
4. **Phase 7 Review & Approval Workflow:**
   - Quy trình xét duyệt tài liệu: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`.
   - Ngăn chặn chỉnh sửa trong khi đang xét duyệt, cơ chế bảo toàn lịch sử.
5. **Phase 8 Lifecycle, Archive & Retention:**
   - Vòng đời tài liệu: `ACTIVE`, `ARCHIVED`.
   - Thiết lập thời hạn lưu trữ `retentionUntil`, chế độ bảo quản pháp lý `legalHold`.
   - Tính toán điều kiện tiêu hủy động: `eligibleForDisposition` (phải thỏa mãn: `ARCHIVED`, đã hết hạn `retentionUntil`, và `legalHold == false`).

Toàn bộ 164 bài kiểm thử hồi quy từ Test 1 đến Test 164 được duy trì nguyên vẹn tuyệt đối và đạt 100% PASS trước khi tiến hành Phase 9.

---

## B. Migration

- Quá trình nâng cấp cơ sở dữ liệu tuân thủ nghiêm ngặt nguyên tắc **Non-destructive Migration**:
  - Không reset CSDL, không chạy `docker compose down -v`.
  - Bổ sung bảng mới `document_dispositions` để lưu vết độc lập cho quy trình tiêu hủy có kiểm soát.
  - Bổ sung 2 cột mới trong bảng `documents`: `disposed_at` (`TIMESTAMP WITH TIME ZONE`) và `disposed_by` (`VARCHAR(100)`).
  - Mở rộng tập giá trị của `lifecycle_status` trong `documents`: thêm trạng thái `DISPOSED` bên cạnh `ACTIVE` và `ARCHIVED`.
  - Mọi tài liệu hiện hữu tiếp tục duy trì trạng thái vốn có (`ACTIVE` hoặc `ARCHIVED`), không tự ý chuyển đổi dữ liệu lịch sử thành `DISPOSED`.

---

## C. Disposition Model

Quy trình tiêu hủy tài liệu được tách biệt thành một thực thể nghiệp vụ độc lập `DocumentDisposition` nhằm đảm bảo tính phân tách trách nhiệm (Separation of Concerns):

### 1. Thực thể `DocumentDisposition` (`document_dispositions`)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | Primary Key | Định danh duy nhất của yêu cầu tiêu hủy |
| `document_id` | `BIGINT` | Foreign Key -> documents(id), NOT NULL | Tài liệu mục tiêu cần tiêu hủy |
| `requested_by` | `VARCHAR(100)` | NOT NULL | Username của người đề xuất tiêu hủy |
| `requested_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL | Thời điểm gửi yêu cầu |
| `status` | `VARCHAR(30)` | NOT NULL | Trạng thái: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `reason` | `TEXT` | NOT NULL | Lý do yêu cầu tiêu hủy bắt buộc |
| `reviewed_by` | `VARCHAR(100)` | NULL | Username của Quản trị viên xử lý |
| `reviewed_at` | `TIMESTAMP WITH TIME ZONE` | NULL | Thời điểm Quản trị viên ra quyết định |
| `review_comment` | `TEXT` | NULL | Ý kiến/lý do của Quản trị viên |
| `disposed_at` | `TIMESTAMP WITH TIME ZONE` | NULL | Thời điểm hoàn tất tiêu hủy logic |
| `disposed_by` | `VARCHAR(100)` | NULL | Người thực hiện tiêu hủy logic |

### 2. Trạng thái Workflow `DispositionStatus`
- `PENDING`: Đang chờ Quản trị viên xem xét và xử lý trong hàng đợi.
- `APPROVED`: Yêu cầu đã được Quản trị viên chấp thuận, tài liệu chuyển sang `DISPOSED`.
- `REJECTED`: Yêu cầu bị Quản trị viên từ chối, tài liệu tiếp tục duy trì trạng thái `ARCHIVED`.
- `CANCELLED`: Yêu cầu bị hủy bỏ bởi chủ sở hữu/Admin hoặc do tài liệu được Unarchive.

---

## D. Eligibility Preconditions

Một tài liệu chỉ được phép gửi yêu cầu tiêu hủy (`POST /api/documents/{id}/disposition`) khi thỏa mãn đồng thời toàn bộ 5 điều kiện tiên quyết:
1. `document.lifecycleStatus == LifecycleStatus.ARCHIVED` (Tài liệu phải đang ở trạng thái lưu trữ).
2. `document.eligibleForDisposition == true` (Được tính toán động: `retentionUntil <= LocalDate.now()`).
3. `document.legalHold == false` (Tài liệu không bị khóa bảo quản phục vụ pháp lý/thanh tra).
4. Không có bất kỳ yêu cầu xét duyệt phiên bản nào đang ở trạng thái `PENDING`.
5. Không có bất kỳ yêu cầu tiêu hủy nào khác của tài liệu này đang ở trạng thái `PENDING` (chống trùng lặp).

Nếu vi phạm bất kỳ điều kiện nào trên, hệ thống ngay lập tức từ chối với mã **HTTP 409 Conflict**.

---

## E. Request Workflow

- **Endpoint:** `POST /api/documents/{id}/disposition`
- **Quyền hạn đề xuất (Authority):**
  - `ROLE_ADMIN`
  - Chủ sở hữu tài liệu (`doc.createdBy == username`)
  - Người dùng chỉ có quyền `EDIT` hoặc `READ` được chia sẻ qua ACL **hoàn toàn bị từ chối với HTTP 403 Forbidden**.
- **Dữ liệu đầu vào:**
  ```json
  {
    "reason": "Hết thời hạn lưu trữ theo chính sách lưu trữ 5 năm của công ty"
  }
  ```
  Trường `reason` bắt buộc (`@NotBlank`, tối đa 1000 ký tự). Nếu để trống sẽ trả về **HTTP 400 Bad Request**.
- **Quy tắc an toàn chống đúp:**
  Phương thức sử dụng `@Transactional` kết hợp kiểm tra khóa `existsByDocumentIdAndStatus(documentId, DispositionStatus.PENDING)`. Nếu phát hiện yêu cầu trùng lặp, hệ thống trả về **HTTP 409 Conflict**.

---

## F. Admin Queue

- **Endpoint:** `GET /api/admin/dispositions?status=PENDING`
- **Phân quyền truy cập:** `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`. Tài khoản `ROLE_STAFF` truy cập sẽ bị từ chối với mã **HTTP 403 Forbidden**.
- **Thứ tự hiển thị:** `oldest-first` (`ORDER BY d.requestedAt ASC`) giúp xử lý công bằng theo thứ tự gửi đến.
- **Thông tin trả về:** Cung cấp đầy lời snapshot tài liệu tại thời điểm hiển thị: `requestId`, `documentId`, `documentTitle`, `currentVersion`, `requestedBy`, `requestedAt`, `reason`, `retentionUntil`, `legalHold`, `eligibleForDisposition`, `status`.

---

## G. Approval & Real-Time Revalidation

- **Endpoint:** `POST /api/admin/dispositions/{requestId}/approve`
- **Nguyên tắc "Không tin tưởng tính hợp lệ tại thời điểm gửi":**
  Tại thời điểm Quản trị viên nhấn nút Phê duyệt, hệ thống áp dụng khóa bi quan `PESSIMISTIC_WRITE` (`findByIdForUpdate`) trên cả bản ghi `DocumentDisposition` và `Document`.
  Backend tính toán và kiểm tra lại toàn bộ điều kiện thực tế ngay lập tức:
  - Tài liệu còn ở trạng thái `ARCHIVED` không? (Nếu bị Unarchive -> FAIL 409).
  - Tài liệu có bị gán `legalHold` khẩn cấp sau khi gửi yêu cầu không? (Nếu `legalHold == true` -> FAIL 409).
  - Thời hạn lưu trữ `retentionUntil` có còn hợp lệ không? (Nếu bị đổi ngày về tương lai -> FAIL 409).
  - Có yêu cầu xét duyệt mới không?
- **Kết quả khi hợp lệ:**
  - `DocumentDisposition.status` chuyển thành `APPROVED`.
  - Ghi nhận `reviewedBy`, `reviewedAt`, `reviewComment`.
  - Ghi nhận `disposedAt = Instant.now()`, `disposedBy = adminUsername`.
  - `Document.lifecycleStatus` chuyển thành `DISPOSED`.
  - Ghi nhận `Document.disposedAt` và `Document.disposedBy`.
  - Ghi nhật ký kiểm toán: `DOCUMENT_DISPOSITION_APPROVE`.

---

## H. Rejection

- **Endpoint:** `POST /api/admin/dispositions/{requestId}/reject`
- **Quy chuẩn:** Quản trị viên bắt buộc phải cung cấp lý do từ chối (`comment` không được rỗng, vi phạm trả về **HTTP 400 Bad Request**).
- **Hành vi vòng đời:**
  - `DocumentDisposition.status` chuyển thành `REJECTED`.
  - Ghi nhận `reviewComment`, `reviewedBy`, `reviewedAt`.
  - Tài liệu **vẫn giữ nguyên trạng thái `ARCHIVED`**, không bị xóa hay thay đổi trạng thái vòng đời.
  - Chủ sở hữu có quyền đề xuất yêu cầu tiêu hủy mới sau đó nếu tài liệu vẫn đủ điều kiện.
  - Ghi nhật ký kiểm toán: `DOCUMENT_DISPOSITION_REJECT`.

---

## I. Cancellation

- **Endpoint:** `POST /api/documents/{id}/disposition/cancel`
- **Quyền hạn:** Chủ sở hữu hoặc Quản trị viên.
- **Hành vi:**
  - Tìm yêu cầu `PENDING` của tài liệu và chuyển thành `CANCELLED`.
  - Trạng thái tài liệu vẫn duy trì `ARCHIVED`.
- **Tự động hủy khi Unarchive tài liệu:**
  - Nếu Quản trị viên hoặc Chủ sở hữu khôi phục tài liệu (`POST /api/documents/{id}/unarchive`), hệ thống tự động quét và chuyển toàn bộ yêu cầu tiêu hủy đang `PENDING` của tài liệu đó sang `CANCELLED`.
  - Ghi nhật ký kiểm toán: `DOCUMENT_DISPOSITION_CANCEL` kèm lý do "Tự động hủy do tài liệu được khôi phục hoạt động (Unarchive)".

---

## J. DISPOSED Lifecycle Behavior

Tài liệu ở trạng thái `DISPOSED` là bản ghi đã hoàn tất vòng đời nghiệp vụ. Mọi hành vi làm biến động dữ liệu đều bị chặn đứng:
- **Cập nhật metadata (`PUT /api/documents/{id}`):** Bị chặn với **HTTP 409 Conflict**.
- **Tải lên phiên bản mới (`POST /api/documents/{id}/versions`):** Bị chặn với **HTTP 409 Conflict**.
- **Khôi phục phiên bản lịch sử (`POST /api/documents/{id}/versions/{v}/restore`):** Bị chặn với **HTTP 409 Conflict**.
- **Gửi yêu cầu xét duyệt (`POST /api/documents/{id}/reviews`):** Bị chặn với **HTTP 409 Conflict**.
- **Chuyển đổi trạng thái lưu trữ (`archive`/`unarchive`):** Bị chặn với **HTTP 409 Conflict**.
- **Cập nhật thời hạn lưu trữ `retentionUntil`:** Bị chặn với **HTTP 409 Conflict**.
- **Thiết lập hoặc giải phóng Legal Hold:** Bị chặn với **HTTP 409 Conflict**.

---

## K. ACL Behavior Sau Tiêu Hủy

- Toàn bộ bản ghi phân quyền `document_permissions` trong CSDL được **bảo toàn nguyên vẹn 100%** nhằm phục vụ truy vết pháp lý và thanh tra lịch sử.
- Tuy nhiên, trạng thái `DISPOSED` ghi đè toàn bộ quyền truy cập thông thường:
  - Người dùng thông thường (kể cả có quyền `READ` hoặc `EDIT` trước đó) bị chặn truy cập trực tiếp với mã **HTTP 403 Forbidden**.
  - Không xuất hiện trong danh sách "Được chia sẻ với tôi" (`/api/documents/shared-with-me`).
  - Mọi thao tác gán quyền mới, sửa quyền, thu hồi quyền hoặc đổi `accessMode` đều bị chặn với **HTTP 409 Conflict**.

---

## L. Version Preservation

- Tuyệt đối không xóa bất kỳ hàng nào trong bảng `document_versions`.
- Toàn bộ các phiên bản v1, v2,... được lưu trữ nguyên vẹn cấu trúc và liên kết dữ liệu.
- Quản trị viên (ROLE_ADMIN) có thể xem danh sách phiên bản đầy đủ phục vụ công tác thanh tra (`GET /api/documents/{id}/versions`).

---

## M. Review History Preservation

- Lịch sử xét duyệt tài liệu trong bảng `document_reviews` được bảo toàn toàn vẹn.
- Toàn bộ trạng thái `APPROVED`, `REJECTED` cùng ý kiến phê duyệt của các phiên bản trước đây đều được lưu giữ vĩnh viễn, không bị cascade-delete.

---

## N. Legal Hold Interaction & Race Conditions

Quy tắc bảo vệ pháp lý đa tầng:
1. **Trước khi gửi yêu cầu:** Nếu tài liệu đang có `legalHold == true`, chặn không cho tạo yêu cầu tiêu hủy (**HTTP 409 Conflict**).
2. **Race condition khi yêu cầu đang `PENDING`:**
   - Nếu Quản trị viên áp dụng `legalHold` khẩn cấp trong khi yêu cầu đang chờ duyệt, yêu cầu tiêu hủy không bị xóa tự động (giữ lại làm bằng chứng).
   - Khi Admin khác hoặc cùng Admin nhấn nút Phê duyệt tiêu hủy, quy trình revalidation tại thời điểm phê duyệt sẽ phát hiện `legalHold == true` và lập tức từ chối phê duyệt với mã **HTTP 409 Conflict**.
   - Tài liệu được bảo vệ an toàn tuyệt đối, duy trì `ARCHIVED`, không bao giờ bị chuyển thành `DISPOSED`.

---

## O. Frontend Implementation

Giao diện người dùng được nâng cấp hiện đại, minh bạch, cảnh báo rõ ràng không gây hiểu lầm cho người dùng:
1. **Modal Vòng Đời Tài Liệu (`DocumentLifecycleModal.tsx`):**
   - Khi tài liệu ở trạng thái `ARCHIVED` và đủ điều kiện tiêu hủy, hiển thị nút: **"Yêu cầu tiêu hủy hồ sơ"** (Tuyệt đối không dùng từ ngữ "Xóa tài liệu").
   - Modal xác nhận ghi rõ: *"Yêu cầu này sẽ gửi hồ sơ vào hàng đợi xem xét của Quản trị viên. Tài liệu và tệp tin vật lý sẽ không bị xóa trực tiếp."*
   - Cung cấp nút "Hủy yêu cầu" khi hồ sơ có yêu cầu đang `PENDING`.
   - Hiển thị bảng **Lịch sử tiêu hủy** trực quan: Thời gian, Người yêu cầu, Lý do, Trạng thái, Người phê duyệt/từ chối, Ý kiến phản hồi.
   - Đối với tài liệu `DISPOSED`, hiển thị banner cảnh báo: *"Tài liệu này đã hoàn tất thủ tục tiêu hủy logic (DISPOSED). Toàn bộ dữ liệu và tệp tin được lưu giữ nguyên vẹn phục vụ công tác thanh tra."*
2. **Trang Hàng Đợi Tiêu Hủy Quản Trị (`DispositionQueuePage.tsx`):**
   - Bổ sung trang quản trị mới tại đường dẫn `/disposition-queue`.
   - Hỗ trợ lọc theo trạng thái: Tất cả, Đang chờ duyệt (PENDING), Đã duyệt (APPROVED), Đã từ chối (REJECTED), Đã hủy (CANCELLED).
   - Cung cấp tính năng **Xem chi tiết hồ sơ**, **Phê duyệt**, **Từ chối**.
   - Hộp thoại phê duyệt ghi rõ cam kết an toàn: *"Phê duyệt sẽ chuyển tài liệu sang trạng thái DISPOSED. File vật lý và lịch sử dữ liệu vẫn được bảo toàn nguyên vẹn trong Phase 9."*
3. **Thanh Điều Hướng (`Navbar.tsx`):**
   - Bổ sung liên kết: **"Hàng đợi tiêu hủy"** dành riêng cho tài khoản Quản trị viên (`ROLE_ADMIN`).
4. **Kiểm thử giao diện:**
   - Đã chạy `npm run build` thành công, kiểm tra TypeScript hoàn toàn không có lỗi cú pháp hay cảnh báo dư thừa.

---

## P. Audit Evidence

Bổ sung 4 loại sự kiện kiểm toán chuyên biệt cho Phase 9:
1. `DOCUMENT_DISPOSITION_REQUEST`: Ghi lại thời điểm, người yêu cầu và mã yêu cầu tiêu hủy.
2. `DOCUMENT_DISPOSITION_CANCEL`: Ghi lại sự kiện hủy yêu cầu do người dùng hoặc do Unarchive.
3. `DOCUMENT_DISPOSITION_APPROVE`: Ghi lại quyết định phê duyệt của Quản trị viên và thời điểm chuyển trạng thái `DISPOSED`.
4. `DOCUMENT_DISPOSITION_REJECT`: Ghi lại lý do từ chối tiêu hủy của Quản trị viên.

Toàn bộ các sự kiện kiểm toán được ghi nhận bất biến vào bảng `audit_logs`, không bị chỉnh sửa hay xóa bỏ theo tài liệu.

---

## Q. Concurrency Safety

Hệ thống xử lý an toàn tuyệt đối trước các tình huống tương tranh thực tế:
- **Double Request:** Hai yêu cầu tiêu hủy gửi đồng thời trên cùng tài liệu -> Đúng 1 yêu cầu thành công, yêu cầu thứ hai trả về **HTTP 409 Conflict**.
- **Double Approve:** Hai quản trị viên phê duyệt đồng thời trên cùng một yêu cầu -> Khóa bi quan `findByIdForUpdate` đảm bảo đúng 1 lượt phê duyệt thành công, lượt còn lại trả về **HTTP 409 Conflict**.
- **Approve vs Reject Race:** Hai thao tác phê duyệt và từ chối diễn ra đồng thời trong đa luồng -> Chỉ 1 quyết định được ghi nhận, quyết định đến sau trả về **HTTP 409 Conflict**.
- **Approve vs Unarchive Race:** Nếu tài liệu bị Unarchive ngay trước hoặc trong khi approve -> Giao dịch approve kiểm tra lại trạng thái và trả về **HTTP 409 Conflict**.

---

## R. Physical File Preservation Verification

Đã thực hiện rà soát toàn diện mã nguồn backend (`com.edms`):
- Hoàn toàn **KHÔNG CÓ** bất kỳ lệnh xóa file vật lý nào trong quy trình tiêu hủy:
  - Không có lệnh `Files.delete(...)`.
  - Không có lệnh `Files.deleteIfExists(...)`.
  - Không có lệnh `File.delete()`.
  - Không có lệnh `DELETE FROM documents`.
  - Không có lệnh `DELETE FROM document_versions`.
  - Không có lệnh `documentRepository.delete(...)`.
- Các bài test TEST 180, 181, 182, 200 đã chứng minh bằng thực nghiệm:
  - Bản ghi tài liệu trong CSDL vẫn tồn tại.
  - Các bản ghi phiên bản tài liệu vẫn tồn tại.
  - Tệp tin vật lý trên volume lưu trữ (`/app/storage/uploads`) vẫn tồn tại nguyên vẹn kích thước byte và tải về thành công phục vụ thanh tra.

---

## S. New Tests (Tests 165–200)

Phase 9 bổ sung 36 bài kiểm thử tự động toàn diện từ TEST 165 đến TEST 200:

| Mã Bài Test | Nội Dung Kiểm Thử | Kết Quả |
| :--- | :--- | :--- |
| **TEST 165** | Tài liệu ở trạng thái ACTIVE không thể yêu cầu tiêu hủy (409 Conflict) | **PASS** |
| **TEST 166** | Tài liệu ARCHIVED nhưng chưa hết thời hạn lưu trữ không thể yêu cầu tiêu hủy (409 Conflict) | **PASS** |
| **TEST 167** | Tài liệu ARCHIVED đang có Legal Hold không thể yêu cầu tiêu hủy (409 Conflict) | **PASS** |
| **TEST 168** | Chủ sở hữu tài liệu đủ điều kiện gửi yêu cầu tiêu hủy thành công (200 OK, PENDING) | **PASS** |
| **TEST 169** | Người dùng được chia sẻ quyền EDIT không có quyền yêu cầu tiêu hủy (403 Forbidden) | **PASS** |
| **TEST 170** | Ngăn chặn trùng lặp yêu cầu tiêu hủy đang chờ xử lý (409 Conflict) | **PASS** |
| **TEST 171** | ROLE_STAFF không thể truy cập hàng đợi tiêu hủy Admin (403 Forbidden) | **PASS** |
| **TEST 172** | ROLE_ADMIN truy cập hàng đợi và thấy yêu cầu tiêu hủy đang chờ | **PASS** |
| **TEST 173** | Từ chối yêu cầu tiêu hủy bắt buộc phải có lý do (400 Bad Request) | **PASS** |
| **TEST 174** | Admin từ chối yêu cầu tiêu hủy, tài liệu tiếp tục duy trì trạng thái ARCHIVED | **PASS** |
| **TEST 175** | Tài liệu có thể gửi lại yêu cầu tiêu hủy sau khi bị từ chối | **PASS** |
| **TEST 176** | Chủ sở hữu có thể hủy yêu cầu tiêu hủy đang chờ xử lý (CANCELLED) | **PASS** |
| **TEST 177** | Yêu cầu tiêu hủy bị hủy không làm thay đổi trạng thái ARCHIVED của tài liệu | **PASS** |
| **TEST 178** | Admin phê duyệt yêu cầu tiêu hủy hợp lệ thành công (APPROVED) | **PASS** |
| **TEST 179** | Phê duyệt yêu cầu tiêu hủy chuyển lifecycleStatus thành DISPOSED kèm metadata | **PASS** |
| **TEST 180** | Tiêu hủy logic bảo toàn hàng dữ liệu Document trong CSDL | **PASS** |
| **TEST 181** | Tiêu hủy logic bảo toàn toàn bộ bản ghi DocumentVersion trong CSDL | **PASS** |
| **TEST 182** | Tiêu hủy logic KHÔNG xóa file vật lý trên ổ đĩa lưu trữ | **PASS** |
| **TEST 183** | Tiêu hủy logic bảo toàn toàn bộ lịch sử xét duyệt | **PASS** |
| **TEST 184** | Tiêu hủy logic bảo toàn các bản ghi phân quyền ACL | **PASS** |
| **TEST 185** | Tài liệu DISPOSED không thể cập nhật thông tin metadata (409 Conflict) | **PASS** |
| **TEST 186** | Tài liệu DISPOSED không thể tải lên phiên bản mới (409 Conflict) | **PASS** |
| **TEST 187** | Tài liệu DISPOSED không thể khôi phục phiên bản lịch sử (409 Conflict) | **PASS** |
| **TEST 188** | Tài liệu DISPOSED không thể gửi yêu cầu xét duyệt (409 Conflict) | **PASS** |
| **TEST 189** | Tài liệu DISPOSED không thể thay đổi phân quyền hay chế độ truy cập (409 Conflict) | **PASS** |
| **TEST 190** | Tài liệu DISPOSED hoàn toàn không xuất hiện trong danh sách và tìm kiếm của STAFF | **PASS** |
| **TEST 191** | Tài liệu DISPOSED không xuất hiện trong danh sách "Được chia sẻ với tôi" | **PASS** |
| **TEST 192** | Admin được phép xem bằng chứng tài liệu DISPOSED; STAFF truy cập trực tiếp bị từ chối (403) | **PASS** |
| **TEST 193** | Thiết lập Legal Hold sau khi gửi yêu cầu sẽ chặn phê duyệt tiêu hủy (409 Conflict) | **PASS** |
| **TEST 194** | Khôi phục tài liệu (Unarchive) khi có yêu cầu tiêu hủy đang chờ sẽ tự động hủy yêu cầu | **PASS** |
| **TEST 195** | Ngăn chặn phê duyệt trùng lặp trên cùng một yêu cầu tiêu hủy (409 Conflict) | **PASS** |
| **TEST 196** | Xử lý đồng thời giữa Approve và Reject chỉ tạo ra duy nhất 1 quyết định cuối cùng | **PASS** |
| **TEST 197** | Ghi nhận đầy đủ 4 sự kiện kiểm toán của quy trình tiêu hủy vào Audit Log | **PASS** |
| **TEST 198** | Lịch sử tiêu hủy được truy xuất chính xác theo thứ tự mới nhất trước (newest-first) | **PASS** |
| **TEST 199** | Khởi động lại TOÀN BỘ STACK (`docker compose restart`) và kiểm tra tính bền vững của DISPOSED | **PASS** |
| **TEST 200** | Kiểm tra tệp tin vật lý của tài liệu DISPOSED vẫn tồn tại nguyên vẹn trên ổ đĩa sau restart | **PASS** |

---

## T. Full Regression Test Results

Bộ kiểm thử hồi quy tổng hợp `test_regression.py` thực hiện tuần tự và hoàn thành trọn vẹn:
```
=================================================================
KẾT QUẢ CUỐI CÙNG: TẤT CẢ 200/200 BÀI TEST TỪ TEST 1 ĐẾN TEST 200 ĐÃ PASS 100%!
PHASE 9 CONTROLLED DOCUMENT DISPOSITION WORKFLOW: THÀNH CÔNG HOÀN HẢO!
VERDICT: PHASE9_CONTROLLED_DISPOSITION_PASS
=================================================================
```
- **Tổng số bài test:** 200 bài test.
- **Số bài test đạt:** 200/200 (100%).
- **Số bài test thất bại / bỏ qua:** 0.

---

## U. Persistence Verification

Thực hiện kiểm tra tính bền vững bằng lệnh:
```bash
docker compose restart
```
Sau khi toàn bộ các container khởi động lại hoàn tất:
1. Dữ liệu tài khoản người dùng, vai trò, mật khẩu mã hóa BCrypt nguyên vẹn.
2. Trạng thái vòng đời `DISPOSED` cùng thời gian `disposedAt` và người tiêu hủy `disposedBy` được lưu giữ chính xác trong PostgreSQL.
3. Toàn bộ lịch sử các yêu cầu tiêu hủy (`document_dispositions`) được bảo toàn 100%.
4. Toàn bộ các phiên bản tài liệu (`document_versions`) và phân quyền ACL (`document_permissions`) không bị thất thoát.
5. Toàn bộ tệp tin vật lý nhị phân trên ổ đĩa (`edms_storage_data`) hoàn toàn nguyên vẹn, đọc và tải về thành công.

---

## V. Builds

- **Backend Build:** Đóng gói bằng Maven bên trong container Docker (`docker.io/library/doan_cnpmnc-backend:latest`) thành công với JDK 21 và Spring Boot 3.3.3.
- **Frontend Build:** Thực thi lệnh `npm run build` (`tsc && vite build`) hoàn tất 100% trong 2.10 giây, sinh thư mục `dist/` đóng gói chuẩn production không có lỗi.

---

## W. Docker Status

Trạng thái các container của hệ thống EDMS tại thời điểm kiểm tra:
```
NAME            IMAGE                  COMMAND                  SERVICE    STATUS                    PORTS
edms-backend    doan_cnpmnc-backend    "java -jar app.jar"      backend    Up (healthy)              0.0.0.0:8080->8080/tcp
edms-frontend   doan_cnpmnc-frontend   "docker-entrypoint.s…"   frontend   Up                        0.0.0.0:5173->5173/tcp
edms-postgres   postgres:16-alpine     "docker-entrypoint.s…"   postgres   Up (healthy)              0.0.0.0:5432->5432/tcp
```
Endpoint `/api/health` phản hồi mã **HTTP 200 OK**.

---

## X. Known Limitations

Nhằm đảm bảo an toàn tuyệt đối và tính cuốn chiếu của dự án, các tính năng chuyên sâu sau đây được bảo lưu cho các Phase tiếp theo theo đúng định hướng kiến trúc:
1. **Physical secure erase / wiping:** Chưa ghi đè bit ngẫu nhiên hoặc zero-fill ổ cứng vật lý.
2. **Cryptographic erasure:** Chưa triển khai cơ chế hủy khóa giải mã envelope per-file.
3. **Automatic scheduled background disposition:** Không sử dụng cronjob nền tự động tiêu hủy để tránh rủi ro xóa nhầm dữ liệu nghiệp vụ ngoài tầm kiểm soát.
4. **Multi-level disposition board:** Chưa áp dụng quy trình duyệt nhiều cấp hội đồng độc lập.
5. **Certificate of destruction:** Biên bản tiêu hủy điện tử và chữ ký số xác nhận tiêu hủy sẽ được bổ sung ở các Phase sau.

---

## Y. Verdict

```
=================================================================
VERDICT: PHASE9_CONTROLLED_DISPOSITION_PASS
=================================================================
```
Hệ thống EDMS đã hoàn thành xuất sắc Phase 9 — Controlled Document Disposition Workflow, đảm bảo tính kế thừa, an toàn dữ liệu tuyệt đối và đạt tỷ lệ vượt qua kiểm thử 200/200 (100%).
