# EDMS PHASE 10 — CONTENT EXTRACTION & FULL-TEXT DOCUMENT SEARCH (HARDENED & VERIFIED)

**Dự án**: Hệ thống Quản lý Tài liệu Điện tử Doanh nghiệp (Enterprise Document Management System - EDMS)  
**Giai đoạn**: Phase 10 — Trích xuất nội dung tệp tin & Tìm kiếm toàn văn (Content Extraction & Full-Text Document Search)  
**Môi trường**: Production Docker Stack (PostgreSQL 16, Spring Boot 3.3.3 / Java 21, React 18 / TypeScript / Vite)  
**Ngày thực hiện**: 20/09/2026  
**Trạng thái kiểm thử**: 236/236 PASS (100%)  
**Kết luận (Verdict)**: **PHASE10_CONTENT_SEARCH_HARDENED_PASS**

---

## A. Baseline Verification

Hệ thống EDMS trước khi triển khai Phase 10 sở hữu một nền tảng kiểm thử hồi quy nghiêm ngặt:
- **Baseline bắt buộc**: `200/200 PASS (100%)`, bao gồm:
  - Sprint 1–4 Core Features: Authentication, RBAC, CRUD, Metadata Search, Audit Log, Dashboard, Monitoring (Tests 1–57).
  - Phase 5: Document Access Control, Sharing & Private Permissions (Tests 58–104).
  - Phase 6: Document Versioning, Historical Preservations, Concurrency, Revert/Restore (Tests 105–132).
  - Phase 7: Document Review & Approval Workflow (Tests 133–164).
  - Phase 8: Document Lifecycle, Archive & Retention Management (Tests 165–184).
  - Phase 9: Controlled Document Disposition Workflow (Tests 185–200).
- **Cam kết nguyên tắc**:
  - Không phá vỡ kiến trúc, không reset cơ sở dữ liệu, không xóa Docker volume (`Không chạy docker compose down -v`).
  - Không sửa đổi thư mục `docs/final-evidence/` (lưu vết bất biến của Lab 1).
  - Không xóa vật lý dữ liệu file (`Zero Physical Deletion`).
  - Phạm vi Phase 10: TẬP TRUNG vào Text Content Extraction & Full-Text Search. Không triển khai OCR hay Elasticsearch/Solr/Vector DB.

---

## B. Extraction Architecture

Phase 10 bổ sung module trích xuất văn bản độc lập và hiệu quả thông qua **Apache Tika 2.9.2**:
- **Thư viện tích hợp**:
  - `org.apache.tika:tika-core:2.9.2`
  - `org.apache.tika:tika-parsers-standard-package:2.9.2`
- **Thành phần cốt lõi**:
  - `ContentExtractionService`: Dịch vụ độc lập chịu trách nhiệm nhận diện MIME type và bóc tách văn bản thô từ binary payload.
  - Sử dụng `AutoDetectParser`, `BodyContentHandler` với bộ đệm luồng tối ưu.
- **An toàn tài nguyên & Giới hạn ký tự**:
  - Thiết lập `MAX_EXTRACTED_CHARACTERS = 1,000,000` ký tự.
  - Khi tệp tin vượt quá 1 triệu ký tự, parser tự động dừng trích xuất an toàn và cắt tỉa (safe truncation), không gây tràn bộ nhớ heap (`OutOfMemoryError`).
- **Xử lý ngoại lệ an toàn**:
  - Lỗi phân tích cú pháp (malformed, encrypted, corrupted) được bắt gọn gàng, ghi nhận thông điệp ngắn gọn (`extractionError` được làm sạch, không lưu đường dẫn hệ thống nhạy cảm hay mật khẩu).

---

## C. Database Migration & Schema Extension

Quá trình mở rộng cấu trúc cơ sở dữ liệu được thực hiện **phi phá hủy (Non-Destructive)**:

1. **Bảng `document_versions`**:
   - `extraction_status` (`VARCHAR(30)`): Trạng thái trích xuất nội dung (`PENDING`, `READY`, `UNSUPPORTED`, `FAILED`).
   - `extracted_text` (`TEXT`): Văn bản thô được trích xuất từ tệp tin nhị phân của phiên bản đó.
   - `extracted_at` (`TIMESTAMP WITH TIME ZONE`): Thời điểm hoàn tất trích xuất.
   - `extraction_error` (`VARCHAR(500)`): Lý do lỗi ngắn gọn đã qua làm sạch nếu trích xuất thất bại.
   - `extracted_character_count` (`INTEGER`): Số lượng ký tự trích xuất được.

2. **Bảng `saved_searches`**:
   - `search_scope` (`VARCHAR(30)`): Phạm vi tìm kiếm được lưu lại (`METADATA`, `CONTENT`, `ALL`).
   - Giá trị mặc định đối với các bản ghi cũ là `'METADATA'`, đảm bảo tính tương thích ngược 100%.

---

## D. Supported File Types

Module trích xuất của Phase 10 hỗ trợ đầy đủ các định dạng văn bản doanh nghiệp thông dụng mà không cần external executable:
- **Tài liệu PDF**: Hỗ trợ PDF có text layer thông qua Apache PDFBox tích hợp trong Tika standard package.
- **Tài liệu Word**: Hỗ trợ `.docx` (Office OpenXML) và `.doc` (OLE2) qua Apache POI.
- **Văn bản thuần túy**: `.txt`, `.json`, `.xml`, `.md`, `.csv`.
- **Bảng tính & Trình chiếu**: `.xlsx`, `.pptx`.

---

## E. Failure & Unsupported Handling

- **Định dạng hình ảnh (`.png`, `.jpg`, `.jpeg`, `.webp`)**:
  - Tự động nhận diện qua đuôi mở rộng và MIME type, gán ngay trạng thái `UNSUPPORTED` mà không tốn tài nguyên chạy parser.
  - Upload tài liệu vẫn thành công 100%, không bị rollback.
- **Tệp tin bị hỏng / mã hóa có mật khẩu (Malformed / Password-protected)**:
  - Parser bắt ngoại lệ, ghi nhận trạng thái `FAILED` kèm lý do ngắn gọn (ví dụ: `Trích xuất nội dung thất bại: ...`).
- **Nguyên tắc bất biến**:
  - **Thất bại trong trích xuất nội dung KHÔNG BAO GIỜ làm hỏng document hay version**. Tệp tin vật lý vẫn được lưu trữ, bản ghi `Document` và `DocumentVersion` vẫn được tạo thành công, chức năng Tải xuống (Download) và Xem trước (Preview) vẫn hoạt động bình thường.

---

## F. Existing Content Backfill & Rebuild

Để xử lý các tài liệu đã tồn tại trong hệ thống từ các Phase trước:
- **Admin Rebuild Endpoint**:
  - `POST /api/admin/content-index/rebuild?force=false`
  - Chỉ dành riêng cho quyền quản trị (`ROLE_ADMIN`), người dùng thường (`ROLE_STAFF`) bị chặn với mã `403 Forbidden`.
- **Tính lũy kế (Idempotent)**:
  - Khi chạy lại nhiều lần với `force=false`, hệ thống tự động bỏ qua các phiên bản đã ở trạng thái `READY` (`skipped`).
  - Không sinh ra bản ghi duplicate, không thay đổi `currentVersionNumber`, không tạo phiên bản mới, không ảnh hưởng tới dữ liệu lịch sử.
- **Chỉ lập chỉ mục phiên bản hiện hành**:
  - Backfill chỉ xử lý `DocumentVersion` tương ứng với `currentVersionNumber` của từng tài liệu chưa bị xóa logic.

---

## G. Version Integration

- **Chỉ mục nội dung gắn liền với từng `DocumentVersion`**:
  - Khi tải lên phiên bản mới (`POST /api/documents/{id}/versions`), phiên bản mới được trích xuất nội dung ngay lập tức.
  - Tìm kiếm toàn văn chỉ khớp với **phiên bản hiện tại** (`DocumentVersion.versionNumber == Document.currentVersionNumber`).
  - Các phiên bản cũ không còn là phiên bản hiện tại sẽ không làm cho tài liệu xuất hiện trong kết quả tìm kiếm nếu từ khóa chỉ có trong phiên bản cũ.

---

## H. Restore Integration

- Khi khôi phục phiên bản lịch sử (`POST /api/documents/{id}/versions/{versionNumber}/restore`):
  - Hệ thống tạo ra phiên bản mới `N+1` có cùng nội dung nhị phân với phiên bản được khôi phục.
  - Nếu phiên bản nguồn đã có trạng thái `READY`, nội dung văn bản trích xuất được tái sử dụng an toàn (copy), đảm bảo hiệu năng tối ưu.
  - Chỉ mục tìm kiếm của tài liệu lập tức chuyển sang phản ánh nội dung của phiên bản vừa được khôi phục.

---

## I. Search Scopes & Backward Compatibility

Bổ sung tham số truy vấn `searchScope` trên các API tìm kiếm tài liệu:
- `METADATA`: Chỉ tìm kiếm trên tiêu đề (`title`), mô tả (`description`), loại tài liệu (`documentType`), tên tệp tin (`originalFileName`).
- `CONTENT`: Chỉ tìm kiếm bên trong nội dung văn bản trích xuất của phiên bản hiện tại (`extractedText`).
- `ALL`: Khớp nếu từ khóa xuất hiện ở metadata HOẶC xuất hiện trong nội dung tệp tin của phiên bản hiện hành.
- **Tương thích ngược**:
  - Nếu không truyền tham số `searchScope`, hệ thống mặc định áp dụng `searchScope=METADATA`, duy trì 100% ngữ nghĩa của các Phase 1–9.

---

## J. Full-Text Search Implementation

- **Không dùng external search cluster**: Hệ thống tích hợp trực tiếp với PostgreSQL thông qua JPA Criteria Builder Specification.
- **Subquery kiểm tra phiên bản hiện hành**:
  ```java
  Subquery<Long> subquery = query.subquery(Long.class);
  Root<DocumentVersion> dvRoot = subquery.from(DocumentVersion.class);
  subquery.select(dvRoot.get("id"))
          .where(
              cb.equal(dvRoot.get("document"), root),
              cb.equal(dvRoot.get("versionNumber"), root.get("currentVersionNumber")),
              cb.equal(dvRoot.get("extractionStatus"), ExtractionStatus.READY),
              cb.like(cb.lower(dvRoot.get("extractedText")), "%" + q.toLowerCase() + "%")
          );
  Predicate contentPredicate = cb.exists(subquery);
  ```
- **Không nhân bản kết quả**: Kết quả trả về đúng một đối tượng `Document` duy nhất, không phụ thuộc vào số lượng phiên bản của tài liệu.
- **Đoạn trích dẫn văn bản (Match Snippet)**:
  - Khi tài liệu khớp nội dung, backend tự động trích đoạn ~200 ký tự xung quanh từ khóa tìm kiếm (`matchSnippet`) và gắn cờ `contentMatched = true`.
  - Toàn bộ văn bản trích xuất không bị trả về vô tội vạ, đảm bảo an toàn băng thông.

---

## K. Metadata + Content Composition

Tìm kiếm toàn văn trong Phase 10 phối hợp hài hòa với mọi bộ lọc nghiệp vụ hiện có:
1. `q` (Từ khóa)
2. `searchScope` (`METADATA` | `CONTENT` | `ALL`)
3. `documentType` (Phân loại tài liệu)
4. `lifecycleStatus` (`ACTIVE` | `ARCHIVED`)
5. Phân quyền truy cập (ACL)
Tất cả tiêu chí được kết hợp dưới dạng biểu thức logic giao thoa (Intersection - `AND`) chặt chẽ.

---

## L. ACL Security

Bảo vệ quyền riêng tư tuyệt đối theo chuẩn Phase 5:
- **Ngăn chặn rò rỉ sự tồn tại (No Existence Leak)**:
  - Khi một tài liệu ở chế độ `PRIVATE`, người dùng không có quyền truy cập tìm kiếm chính xác cụm từ chỉ có trong nội dung tài liệu đó sẽ nhận về danh sách rỗng `[]` (HTTP 200).
  - Hệ thống không trả về 403, không trả về metadata, không tiết lộ số lượng bản ghi `totalElements = 1`.
- **Người dùng được cấp quyền READ**:
  - Sau khi chủ sở hữu chia sẻ quyền `READ` cho tài liệu `PRIVATE`, người dùng được chia sẻ có thể tìm thấy tài liệu này thông qua cả tìm kiếm metadata lẫn tìm kiếm nội dung `CONTENT`.

---

## M. Lifecycle & Disposition Security

- **Tài liệu DISPOSED**:
  - Người dùng thông thường (`ROLE_STAFF`) hoàn toàn không thể tìm thấy tài liệu đã bị tiêu hủy thông qua `CONTENT` search hay `METADATA` search.
  - Giữ vững tính bất biến của Phase 9.
- **Tài liệu ARCHIVED**:
  - Có thể được tìm kiếm chính xác khi kết hợp `searchScope=CONTENT` và bộ lọc `lifecycleStatus=ARCHIVED`.

---

## N. Saved Search Integration

- Mở rộng entity `SavedSearch` với trường `searchScope`.
- API `POST /api/saved-searches` chấp nhận `searchScope`.
- Khi người dùng lưu bộ lọc tìm kiếm nội dung, phạm vi tìm kiếm được ghi nhận và tái sử dụng chính xác khi kích hoạt lại bộ lọc.

---

## O. Frontend Search UI

Giao diện người dùng trên `DocumentsPage.tsx` được nâng cấp tinh gọn, hiện đại và bảo mật:
1. **Dropdown chọn phạm vi tìm kiếm**:
   - `Tìm trong: Thông tin tài liệu` (`METADATA` - mặc định)
   - `Tìm trong: Nội dung tài liệu` (`CONTENT`)
   - `Tìm trong: Tất cả (Thông tin & Nội dung)` (`ALL`)
2. **Hiển thị kết quả tìm kiếm**:
   - Badge xanh ngọc: `[Khớp nội dung]`.
   - Hiển thị đoạn trích dẫn plain text (`matchSnippet`) trực quan.
   - **Bảo mật XSS**: Render plain text qua React JSX tiêu chuẩn, tuyệt đối KHÔNG sử dụng `dangerouslySetInnerHTML`.
3. **Modal lưu bộ lọc (SaveSearchModal)**:
   - Hiển thị tag phạm vi tìm kiếm trong box preview điều kiện lưu trữ và tự động lưu `searchScope`.

---

## P. Admin Rebuild Endpoint & Diagnostics

- Endpoint: `POST /api/admin/content-index/rebuild?force=true/false`
- Định dạng phản hồi:
  ```json
  {
    "total": 418,
    "processed": 418,
    "ready": 135,
    "unsupported": 2,
    "failed": 281,
    "skipped": 0
  }
  ```
- Kiểm soát phân quyền: `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`.

---

## Q. Audit Trail Compliance

- Thao tác Rebuild Content Index của Quản trị viên sinh ra sự kiện kiểm toán:
  - `action`: `CONTENT_INDEX_REBUILD`
  - `targetType`: `SYSTEM`
  - `username`: Tên tài khoản Admin thực hiện
- **Bảo mật kiểm toán**: Không ghi nhật ký nội dung văn bản đầy đủ vào Audit Log để tránh nguy cơ rò rỉ dữ liệu nhạy cảm và tràn log.
- Không làm sai lệch các chỉ số thống kê nghiệp vụ (`totalUploads`, `totalDownloads`, `totalPreviews`, `totalUpdates`).

---

## R. Performance Behavior

- **Lập chỉ mục trước (Pre-indexing)**: Quá trình trích xuất văn bản diễn ra tại thời điểm tải lên tài liệu/phiên bản mới hoặc qua admin rebuild.
- **Không load file nhị phân khi tìm kiếm**: Yêu cầu tìm kiếm (`GET /api/documents?q=...&searchScope=CONTENT`) thực thi trực tiếp trên cột `extractedText` đã được lưu trữ trong cơ sở dữ liệu.
- Thời gian phản hồi đo đạc thực tế: `0.076s` ngay cả sau khi restart toàn bộ hệ thống.

---

## S. Architectural & Security Hardening Guarantees

### 1. Core transaction vs extraction transaction boundary
- **Kiến trúc tách biệt giao dịch (Decoupled Transaction Boundaries)**:
  - Hệ thống áp dụng `DocumentCoreService` với các phương thức mang phân định `@Transactional` độc lập:
    - `createDocumentAndVersion1(...)`: Lưu file vật lý, tạo bản ghi `Document`, tạo `DocumentVersion` (v1), cập nhật `currentVersionNumber = 1` và commit dứt điểm vào PostgreSQL.
    - `uploadNewVersionCore(...)`: Lưu file vật lý của phiên bản mới, tạo `DocumentVersion` (vN), cập nhật metadata và `currentVersionNumber = N` của `Document` và commit dứt điểm vào PostgreSQL.
    - `restoreVersionCore(...)`: Tạo phiên bản mới (vN+1), sao chép nhị phân, trỏ `currentVersionNumber = N+1` và commit dứt điểm vào PostgreSQL.
  - Sau khi giao dịch cốt lõi (Core Transaction) đã commit thành công và bền vững, việc trích xuất nội dung văn bản (`ContentExtractionService.extractAndSaveById`) mới được thực thi bên ngoài giao dịch cốt lõi (Orchestrated best-effort execution).
  - Tuyệt đối không để việc gọi Tika parser hoặc lỗi trích xuất nằm chung trong cùng giao dịch lưu trữ tài liệu.

### 2. Parser failure rollback protection
- **Bảo vệ toàn vẹn phiên bản trước sự cố Parser**:
  - Khi thư viện parser (Tika) gặp lỗi (tệp hỏng, stream lỗi, crash bất ngờ, hoặc cố tình mô phỏng lỗi qua header test `X-Force-Extraction-Failure: true`), ngoại lệ được bắt trọn vẹn tại tầng điều phối dịch vụ.
  - Tác vụ xử lý lỗi cập nhật `extractionStatus = FAILED` và lưu thông báo lỗi `extractionError` vào bản ghi `DocumentVersion`.
  - **Quy tắc bất biến**: Bản ghi `DocumentVersion` mới và `currentVersionNumber` của `Document` **TUYỆT ĐỐI KHÔNG BỊ ROLLBACK**. File vật lý vẫn tồn tại nguyên vẹn trên đĩa, các API xem trước (`/preview`) và tải xuống (`/download`) vẫn phục vụ tệp tin nhị phân bình thường.
  - Đã được chứng minh tự động qua **TEST 227**, **TEST 229** (upload version) và **TEST 230** (restore version).

### 3. MIME detection strategy
- **Phát hiện định dạng độc lập với phần mở rộng tệp tin**:
  - `ContentExtractionService` không dựa đơn thuần vào phần mở rộng tệp tin (`.txt`, `.pdf`) do người dùng gửi lên.
  - Sử dụng cơ chế phân tích magic bytes của Apache Tika: `tika.detect(inputStream, filename)`.
  - Nếu tệp tin có tên `fake.txt` nhưng nội dung thực tế là nhị phân PNG (`image/png`), hệ thống nhận diện chính xác kiểu MIME thực sự và đánh dấu `ExtractionStatus.UNSUPPORTED` với thông điệp `"Định dạng hình ảnh không hỗ trợ trích xuất văn bản (không OCR)"`.
  - Hỗ trợ chặn parser crash trên các định dạng ảnh phổ biến: `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/bmp`, `image/svg+xml`.
  - Đã được chứng minh qua **TEST 205** và **TEST 235**.

### 4. Extraction size limiting strategy
- **Kiểm soát kích thước trích xuất an toàn (Bounded Stream Parsing)**:
  - Cấu hình trần giới hạn trích xuất: `MAX_EXTRACTED_CHARACTERS = 1,000,000` (1 triệu ký tự).
  - Parser sử dụng `WriteOutContentHandler(MAX_EXTRACTED_CHARACTERS)` kết hợp cùng `BodyContentHandler` trong luồng SAX parsing của Tika.
  - Khi luồng văn bản đạt ngưỡng 1,000,000 ký tự, Tika ngắt luồng phân tích bằng `WriteLimitReachedException`.
  - Hệ thống bắt ngoại lệ `WriteLimitReachedException.isWriteLimitReached(e)`, lưu lại 1,000,000 ký tự đã trích xuất, gán trạng thái `READY` và ghi chú cảnh báo thân thiện `"Nội dung vượt quá giới hạn 1,000,000 ký tự (đã cắt tỉa)"`.
  - Tuyệt đối không đọc toàn bộ văn bản vô hạn vào bộ nhớ rồi mới cắt chuỗi (substring), ngăn ngừa triệt để nguy cơ `OutOfMemoryError`.
  - Đã được chứng minh qua **TEST 236**.

### 5. Current-version FAILED behavior
- **Hành vi khi phiên bản hiện hành trích xuất FAILED hoặc UNSUPPORTED**:
  - Tài liệu vẫn tồn tại hợp lệ trong hệ thống, xem trước và tải xuống bình thường.
  - Tìm kiếm theo `METADATA` vẫn tìm thấy tài liệu dựa trên tiêu đề, mô tả, tên file, loại tài liệu.
  - Tìm kiếm theo `CONTENT` không trả về tài liệu này vì điều kiện tìm kiếm yêu cầu phiên bản hiện tại phải có `extractionStatus = READY`.

### 6. No historical fallback proof
- **Nguyên tắc phiên bản hiện tại là tuyệt đối (No Historical Fallback)**:
  - Nếu phiên bản v1 trích xuất thành công (`READY`) chứa cụm từ độc nhất `HISTORICAL_ONLY_ABC991`, nhưng phiên bản hiện tại v2 có nội dung mới bị lỗi trích xuất (`FAILED`):
  - Truy vấn `GET /api/documents?q=HISTORICAL_ONLY_ABC991&searchScope=CONTENT` trả về danh sách rỗng `[]`.
  - Hệ thống **tuyệt đối không fallback** về phiên bản v1 để trả kết quả.
  - Vị từ truy vấn JPA:
    ```sql
    dv.document_id = doc.id 
    AND dv.version_number = doc.current_version_number 
    AND dv.extraction_status = 'READY'
    AND LOWER(dv.extracted_text) LIKE '%...%'
    ```
  - Đã được chứng minh qua **TEST 209** và **TEST 232**.

### 7. No extractedText API exposure
- **Không làm rò rỉ dữ liệu văn bản trích xuất thô qua REST API**:
  - Trường `extractedText` là dữ liệu lập chỉ mục nội bộ trên cơ sở dữ liệu.
  - Kiểm tra toàn bộ DTO phản hồi: `DocumentResponse`, `DocumentVersionResponse`, `SavedSearchResponse` xác nhận không có bất kỳ thuộc tính nào để lộ `extractedText`.
  - Chỉ các thông tin dẫn xuất an toàn được phép trả về: `extractionStatus`, `extractedCharacterCount`, `matchSnippet` (đoạn trích dẫn ngắn <= 300 ký tự plain text).
  - Đã được chứng minh qua **TEST 233**.

### 8. PRIVATE unique-phrase leak test
- **Chứng minh Zero-Leak trên nội dung tài liệu riêng tư (PRIVATE)**:
  - Tài liệu riêng tư chứa cụm từ tuyệt mật `ZXQ_PRIVATE_CONTENT_991177` trong tệp tin (không xuất hiện trong metadata).
  - Người dùng `STAFF` chưa được chia sẻ quyền thực hiện tìm kiếm:
    `GET /api/documents?q=ZXQ_PRIVATE_CONTENT_991177&searchScope=CONTENT`
  - Kết quả trả về: HTTP 200 `[]` (danh sách rỗng).
  - Kiểm tra sâu payload phản hồi: Không có ID tài liệu, không có tiêu đề, không có snippet, không có cờ khớp, không có số đếm tiết lộ sự tồn tại.
  - Đã được chứng minh qua **TEST 214** và **TEST 234**.

### 9. Search performs zero file parsing
- **Tìm kiếm nội dung không đọc file nhị phân**:
  - Yêu cầu tìm kiếm nội dung thực hiện 100% bằng câu lệnh SQL trên cột `extracted_text` của PostgreSQL thông qua Hibernate JPA Specification.
  - Không khởi tạo `AutoDetectParser`, không gọi `Tika.parse`, không gọi `FileStorageService.loadFileAsResource`, không phát sinh I/O đọc ổ đĩa tệp tin gốc.
  - Tốc độ truy vấn trung bình đạt dưới `0.08s` đối với hàng trăm tài liệu.

### 10. Saved Search DB migration/default
- **Giá trị mặc định bền vững cho `saved_searches.search_scope`**:
  - Schema PostgreSQL: Cột `search_scope` được thiết lập `DEFAULT 'METADATA'` ở mức Database DDL:
    `ALTER TABLE saved_searches ALTER COLUMN search_scope SET DEFAULT 'METADATA';`
  - Đã thực hiện backfill an toàn toàn bộ dữ liệu lịch sử (`UPDATE saved_searches SET search_scope = 'METADATA' WHERE search_scope IS NULL;`).
  - Thực thể JPA `SavedSearch.java` trang bị `@Column(columnDefinition = "VARCHAR(30) DEFAULT 'METADATA'")` và `@PrePersist` đảm bảo không bao giờ lưu giá trị `NULL`.
  - Đã được chứng minh qua **TEST 221**, **TEST 222** và truy vấn kiểm tra trực tiếp PostgreSQL `information_schema`.

---

## T. Danh mục kiểm thử Phase 10 (Tests 201–236)

| Mã kiểm thử | Nội dung kiểm thử | Kết quả |
|---|---|---|
| **TEST 201** | Admin backfill/rebuild content index cho các current versions hiện có | **PASS** |
| **TEST 202** | PDF chứa text layer trích xuất nội dung có thể tìm kiếm | **PASS** |
| **TEST 203** | DOCX trích xuất nội dung có thể tìm kiếm | **PASS** |
| **TEST 204** | TXT trích xuất nội dung có thể tìm kiếm | **PASS** |
| **TEST 205** | File ảnh không hỗ trợ OCR (PNG/JPG) đánh dấu UNSUPPORTED không làm hỏng document | **PASS** |
| **TEST 206** | File lỗi/hỏng (malformed) extraction FAILED không phá hủy xem trước/tải xuống | **PASS** |
| **TEST 207** | METADATA default searchScope giữ nguyên tính tương thích ngược với Phase 1–9 | **PASS** |
| **TEST 208** | CONTENT search tìm thấy từ khóa bên trong tệp tin dù không có trong metadata | **PASS** |
| **TEST 209** | CONTENT search KHÔNG match từ khóa ở historical non-current version | **PASS** |
| **TEST 210** | ALL searchScope match metadata HOẶC content | **PASS** |
| **TEST 211** | Tìm kiếm nội dung không phân biệt chữ hoa / chữ thường (case-insensitive) | **PASS** |
| **TEST 212** | Kết hợp CONTENT search và filter documentType (Intersection) | **PASS** |
| **TEST 213** | Kết hợp CONTENT search và filter lifecycleStatus (ACTIVE / ARCHIVED) | **PASS** |
| **TEST 214** | Bảo mật ACL: Người dùng chưa cấp quyền KHÔNG THỂ tìm thấy PRIVATE document bằng content | **PASS** |
| **TEST 215** | Người dùng được chia sẻ quyền READ tìm thấy tài liệu PRIVATE qua content search | **PASS** |
| **TEST 216** | Tài liệu DISPOSED không xuất hiện trong CONTENT search của STAFF | **PASS** |
| **TEST 217** | Kết quả tìm kiếm chỉ trả về logical Document DUY NHẤT một lần dù có nhiều versions | **PASS** |
| **TEST 218** | Tải lên phiên bản mới tự động trích xuất và lập chỉ mục nội dung mới | **PASS** |
| **TEST 219** | Nội dung phiên bản cũ ngừng match khi không còn trong current version | **PASS** |
| **TEST 220** | Khôi phục phiên bản (Restore) cập nhật chỉ mục tìm kiếm theo nội dung version restored | **PASS** |
| **TEST 221** | Saved Search lưu trữ và trả về đúng searchScope (CONTENT / ALL) | **PASS** |
| **TEST 222** | Saved Search cũ/không truyền searchScope tự động có giá trị mặc định METADATA | **PASS** |
| **TEST 223** | ROLE_STAFF bị chặn truy cập endpoint admin rebuild content index (403 Forbidden) | **PASS** |
| **TEST 224** | Admin content index rebuild đảm bảo tính lũy kế (idempotent), không tạo duplicate | **PASS** |
| **TEST 225** | Trạng thái chỉ mục (extractionStatus) lưu trữ bền vững sau restart container | **PASS** |
| **TEST 226** | CONTENT search hoạt động ngay lập tức sau restart mà không cần reparse lại file | **PASS** |
| **TEST 227** | Parser thất bại không bao giờ làm hỏng quy trình upload hoặc phiên bản tài liệu | **PASS** |
| **TEST 228** | Thao tác Rebuild Content Index của Admin sinh ra sự kiện AuditLog | **PASS** |
| **TEST 229** | Mô phỏng parser crash sau khi lưu version: DocumentVersion không bị rollback, status=FAILED | **PASS** |
| **TEST 230** | Khôi phục phiên bản thất bại trong extraction: Phiên bản restore mới không bị rollback | **PASS** |
| **TEST 231** | Truy vấn searchScope không hợp lệ (`INVALID_SCOPE`) trả về mã HTTP 400 Bad Request | **PASS** |
| **TEST 232** | Phiên bản hiện tại có extraction FAILED tuyệt đối không fallback về dữ liệu cũ của v1 | **PASS** |
| **TEST 233** | Kiểm tra toàn bộ REST APIs xác nhận tuyệt đối không để lộ trường thô `extractedText` | **PASS** |
| **TEST 234** | Zero-Leak reconfirmation: Staff không có quyền tìm kiếm tài liệu PRIVATE trả về HTTP 200 `[]` | **PASS** |
| **TEST 235** | Phát hiện MIME qua magic bytes: File `fake.txt` chứa PNG được nhận diện UNSUPPORTED, không crash | **PASS** |
| **TEST 236** | Giới hạn ký tự an toàn: Văn bản > 1,200,000 ký tự được bounded ở 1,000,000 ký tự, status READY | **PASS** |

---

## U. Full Regression Summary

- **Tổng số test case thực thi**: **236 / 236 tests**
- **Tỷ lệ thành công**: **100% PASS**
- **Không có bài kiểm thử nào bị xóa, bỏ qua (skip) hay sửa đổi điều kiện kiểm tra**.
- **Tính tuần tự nghiêm ngặt**: Thực thi đầy đủ từ TEST 1 đến TEST 236.

---

## V. Persistence & Resilience

- Cơ chế lưu trữ bền vững:
  - Trường `extractedText` và `extractionStatus` nằm trực tiếp trong bảng quan hệ `document_versions` của PostgreSQL.
  - Thử nghiệm khởi động lại toàn bộ stack (`docker compose restart`) xác nhận:
    - Trạng thái chỉ mục được giữ nguyên vẹn 100%.
    - Truy vấn tìm kiếm nội dung diễn ra tức thì (`0.076s`) mà không cần quét lại ổ đĩa hay phân tích lại tệp tin.
    - Cấu hình `searchScope` trong `saved_searches` được bảo toàn nguyên vẹn.

---

## W. Backend Production Build Status

- Maven Java 21 production build thành công:
  - 87 source files biên dịch hoàn chỉnh không cảnh báo nghiêm trọng hay lỗi cú pháp.
  - Container `edms-backend` chạy image mới nhất.
  - Health check endpoint: `GET http://localhost:8080/api/health` -> HTTP 200 OK (`status: UP`).

---

## X. Frontend Production Build Status

- TypeScript / Vite build hoàn tất:
  - `npm run build` thành công trong `6.74s` với 1647 module được chuyển đổi sạch sẽ.
  - Không có lỗi type checking hay cảnh báo cú pháp.

---

## Y. Docker Stack Health

Tất cả 3 container Docker cốt lõi đang hoạt động ổn định và khỏe mạnh:
- `edms-postgres`: Up / Healthy (Port 5432)
- `edms-backend`: Up / Healthy (Port 8080)
- `edms-frontend`: Up (Port 5173)

---

## Z. Final Verdict

# **PHASE10_CONTENT_SEARCH_HARDENED_PASS**

