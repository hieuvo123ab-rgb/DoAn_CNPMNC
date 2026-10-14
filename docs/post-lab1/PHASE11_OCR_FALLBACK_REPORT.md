# BÁO CÁO NGHIỆM THU EDMS PHASE 11: OCR FALLBACK CHO TÀI LIỆU SCAN VÀ HÌNH ẢNH
**(OCR FALLBACK FOR SCANNED DOCUMENTS & IMAGES)**

- **Dự án**: Hệ Thống Quản Trị Tài Liệu Doanh Nghiệp (EDMS)
- **Giai đoạn**: Phase 11 — Post-Lab 1 Incremental Development
- **Môi trường**: Docker Compose (PostgreSQL 15, Spring Boot 3.3.3 / Java 21, Vite / React 18 / TypeScript)
- **Engine OCR**: Tesseract OCR v5.5.2 (Alpine Linux runtime container)
- **Gói ngôn ngữ hỗ trợ**: `eng` (English), `vie` (Vietnamese)
- **Bộ kiểm thử hồi quy**: **266/266 Tests PASS (100%)**
- **Trạng thái phê duyệt**: **`PHASE11_OCR_FALLBACK_PASS`**

---

## 1. TỔNG QUAN VÀ NGUYÊN TẮC PHÁT TRIỂN (OVERVIEW & PRINCIPLES)

Phase 11 bổ sung năng lực **Nhận dạng quang học ký tự (Optical Character Recognition - OCR)** như một cơ chế **fallback an toàn** cho các tệp tin hình ảnh (`.png`, `.jpg`, `.jpeg`, `.webp`, `.tiff`) và tài liệu PDF scan/dạng ảnh không có văn bản trực tiếp.

### Các nguyên tắc bất biến được tuân thủ nghiêm ngặt:
1. **Bảo tồn ngữ nghĩa Phase 10 (Semantics Preservation)**:
   - Các tệp hình ảnh tiếp tục duy trì `extractionStatus = UNSUPPORTED` ở tầng native text extraction nhằm bảo toàn tính tương thích ngược và không làm sai lệch kết quả kiểm thử Phase 10 (nhất quán với TEST 205 / TEST 235).
   - Dữ liệu OCR được quản lý hoàn toàn độc lập qua các trường `ocrStatus`, `ocrText`, `ocrAt`, `ocrError`, `ocrCharacterCount`, `ocrLanguage`.
2. **Ưu tiên Native Extraction (Native Precedence)**:
   - Cơ chế OCR chỉ kích hoạt khi tệp là hình ảnh hoặc tệp PDF không chứa đủ văn bản có ý nghĩa (`meaningful text` sau khi chuẩn hóa khoảng trắng `< OCR_MIN_NATIVE_TEXT_CHARS = 50`).
   - Tài liệu PDF, DOCX, TXT chứa native text đầy đủ sẽ tự động đánh dấu `ocrStatus = NOT_REQUIRED` và không bao giờ gọi engine Tesseract.
3. **Bảo mật tuyệt đối (Zero-leak ACL & Isolation)**:
   - Toàn bộ kết quả tìm kiếm OCR tuân thủ nghiêm ngặt ranh giới phân quyền truy cập: Người dùng `ROLE_STAFF` không có quyền trên tài liệu `PRIVATE` sẽ không bao giờ nhận được bất kỳ dấu vết nào (trả về HTTP 200 `[]`, không metadata, không snippet, không count).
   - Tài liệu ở trạng thái `DISPOSED` tuyệt đối không thể phát hiện qua tìm kiếm OCR đối với người dùng thông thường.
4. **An toàn tiến trình và tài nguyên (Process & Resource Safety)**:
   - Không sử dụng `Runtime.getRuntime().exec("string ...")` hay shell interpolation; toàn bộ lệnh gọi CLI thực thi qua `ProcessBuilder(List<String>)` với tham số được kiểm soát chặt chẽ.
   - Thư mục và tệp tạm trong quá trình OCR được sinh ngẫu nhiên trên máy chủ (`edms_ocr_work_*`) và luôn được dọn dẹp sạch sẽ trong khối `finally`.
   - Thiết lập giới hạn kích thước tối đa (50MB), số trang PDF tối đa (50 trang), độ phân giải render (200 DPI), số ký tự OCR tối đa (1,000,000 ký tự) và cơ chế timeout 30s/trang, 180s/tài liệu.
5. **Độ tin cậy giao dịch (Failure Safety)**:
   - Thất bại hoặc timeout của quá trình OCR được ghi nhận vào `ocrStatus = FAILED` / `SKIPPED` và tuyệt đối không làm rollback tài liệu gốc, không làm gián đoạn phiên bản tệp và không ảnh hưởng đến tính năng tải xuống/xem trước.
6. **Không làm lộ dữ liệu thô (No Raw OCR Text Leak)**:
   - Trường `ocrText` tuyệt đối không được trả về trong bất kỳ phản hồi REST API công khai nào (Document detail, Document list, Document versions, Search results, Saved searches). Người dùng chỉ nhận được đoạn trích dẫn ngữ cảnh an toàn `matchSnippet` ($\le 300$ ký tự) kèm nhãn `contentSource = 'OCR'`.

---

## 2. KIẾN TRÚC VÀ CÁC THÀNH PHẦN KỸ THUẬT (ARCHITECTURE & COMPONENTS)

```
                       +-------------------------------------------------+
                       |         Client Upload / New Version / Restore   |
                       +-------------------------------------------------+
                                                |
                                                v
                       +-------------------------------------------------+
                       |         FileStorageService / DB Commit          |
                       +-------------------------------------------------+
                                                |
                                                v
                       +-------------------------------------------------+
                       |      ContentExtractionService (Tika Parsing)    |
                       +-------------------------------------------------+
                                                |
                                                v
                               /---------------------------------\
                              /   Kiểm tra Điều kiện OCR:        \
                             <    - Image (MIME / Ext)?           >
                              \   - PDF (< 50 native chars)?     /
                               \---------------------------------/
                                      /                   \
                                    YES                   NO
                                    /                       \
                                   v                         v
                   +---------------------------+   +---------------------------+
                   |  ocrStatus = PENDING      |   |  ocrStatus = NOT_REQUIRED |
                   |  Queue Async ThreadPool   |   +---------------------------+
                   +---------------------------+
                                 |
                                 v
                +---------------------------------+
                |        OcrService (Worker)      |
                |  - Render PDF (PDFBox 200 DPI)  |
                |  - ProcessBuilder Tesseract CLI |
                |  - Language: vie+eng            |
                |  - Temp dir: edms_ocr_work_*    |
                +---------------------------------+
                                 |
                                 v
                +---------------------------------+
                | Persist DocumentVersion:        |
                | - ocrStatus = READY / FAILED    |
                | - ocrText, ocrCharacterCount    |
                | - Cleanup temp files in finally |
                +---------------------------------+
```

### 2.1. Cấu hình Docker và Engine Tesseract
- **Container**: `edms-backend` (Alpine Linux 3.20 base)
- **Gói cài đặt**: `tesseract-ocr`, `tesseract-ocr-data-eng`, `tesseract-ocr-data-vie`
- **Phiên bản**: Tesseract 5.5.2 (Leptonica 1.84.1)
- **Ngôn ngữ nhận diện**: `vie+eng` (Tiếng Việt có dấu và tiếng Anh)

### 2.2. Mô hình dữ liệu Database (Data Model Schema)
Bảng `document_versions` được mở rộng với 6 trường độc lập:
```sql
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(50);
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ocr_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ocr_error VARCHAR(500);
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ocr_character_count INTEGER;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS ocr_language VARCHAR(50);
```

### 2.3. Trạng thái OCR (`OcrStatus` Enum)
- `NOT_REQUIRED`: Tài liệu đã có văn bản native trích xuất đầy đủ ($\ge 50$ ký tự) hoặc định dạng không áp dụng OCR.
- `PENDING`: Đang chờ xử lý trong hàng đợi `BoundedThreadPoolExecutor` (Eventual indexing).
- `READY`: Nhận diện quang học hoàn tất thành công, văn bản OCR sẵn sàng cho tìm kiếm `CONTENT` và `ALL`.
- `FAILED`: Gặp lỗi xử lý, tệp ảnh hỏng hoặc vượt quá thời gian timeout.
- `SKIPPED`: Vượt quá giới hạn tài nguyên (ví dụ tài liệu PDF quá 50 trang hoặc dung lượng quá 50MB).

### 2.4. Bounded Executor & Quản lý tác vụ nền
- Sử dụng `ThreadPoolExecutor` cấu hình an toàn:
  - `corePoolSize`: 2
  - `maxPoolSize`: 4
  - `queueCapacity`: 50
  - `RejectedExecutionHandler`: `CallerRunsPolicy` (ngăn chặn thất thoát tác vụ khi tải cao).

---

## 3. TÍCH HỢP TÌM KIẾM TOÀN VĂN (FULL-TEXT SEARCH INTEGRATION)

### 3.1. Vị từ tìm kiếm phiên bản hiện hành (Current-Version Predicate)
Tìm kiếm với phạm vi `CONTENT` hoặc `ALL` truy vấn trực tiếp trên cơ sở dữ liệu SQL thông qua Spring Data JPA Specifications mà **tuyệt đối không khởi chạy lại engine OCR hay đọc tệp vật lý**:
```java
// Predicate khớp nội dung Native HOẶC nội dung OCR trên phiên bản hiện hành
Predicate nativeMatch = cb.and(
        cb.equal(versionJoin.get("extractionStatus"), ExtractionStatus.READY),
        cb.like(cb.lower(versionJoin.get("extractedText")), "%" + query.toLowerCase() + "%")
);

Predicate ocrMatch = cb.and(
        cb.equal(versionJoin.get("ocrStatus"), OcrStatus.READY),
        cb.like(cb.lower(versionJoin.get("ocrText")), "%" + query.toLowerCase() + "%")
);

predicates.add(cb.or(nativeMatch, ocrMatch));
```

### 3.2. Xác định Nguồn Khớp Nội Dung (`contentSource`) & Snippet
- Nếu tài liệu khớp từ native extracted text: `contentSource = 'NATIVE'`, snippet trích xuất từ `extractedText`.
- Nếu tài liệu khớp từ OCR text: `contentSource = 'OCR'`, snippet trích xuất từ `ocrText`.
- Giao diện người dùng hiển thị huy hiệu `[OCR]` trực quan cho các tài liệu khớp từ hình ảnh hoặc tài liệu scan.

---

## 4. QUẢN TRỊ VÀ TÁI TẠO CHỈ MỤC OCR (ADMIN OCR REBUILD)

- **Endpoint**: `POST /api/admin/ocr/rebuild?force={false|true}`
- **Phân quyền**: Yêu cầu quyền quản trị viên `ROLE_ADMIN` (nhân viên `ROLE_STAFF` bị từ chối `403 Forbidden`).
- **Cơ chế hoạt động**:
  - Quét toàn bộ `currentVersion` của các tài liệu trong hệ thống.
  - Bỏ qua các tài liệu đã `DISPOSED`.
  - Nếu `force=false`: Giữ nguyên và bỏ qua các tài liệu đã có trạng thái `READY`, `FAILED`, `SKIPPED` (tính lũy kế Idempotent).
  - Nếu `force=true`: Tái nhận diện toàn bộ các phiên bản đủ điều kiện.
- **Sự kiện kiểm toán**: Ghi nhận hành động `OCR_INDEX_REBUILD` vào `AuditLog` kèm thông tin tài khoản quản trị viên.

---

## 5. KẾT QUẢ KIỂM THỬ HỒI QUY TOÀN DIỆN (REGRESSION TEST SUITE)

Hệ thống đã thực thi toàn bộ **266 bài kiểm thử** tích hợp từ đầu đến cuối:
- **Baseline Tests 1–236**: **236/236 PASS (100%)** — Giữ nguyên vẹn tính đúng đắn từ Sprint 1 đến Phase 10.
- **Phase 11 Tests 237–266**: **30/30 PASS (100%)** — Hoàn thành tất cả các kịch bản OCR Fallback.
- **Tổng cộng**: **266/266 PASS (100%)**.

### Ma trận kiểm thử Phase 11 (Tests 237–266):

| Mã Test | Mô tả nghiệp vụ | Kết quả |
| :--- | :--- | :---: |
| **TEST 237** | PDF có văn bản gốc đầy đủ tự động bỏ qua OCR (`ocrStatus = NOT_REQUIRED`) | **PASS** |
| **TEST 238** | Hình ảnh PNG chứa văn bản tiếng Anh rõ ràng OCR thành công (`READY`, chars > 0) | **PASS** |
| **TEST 239** | Hình ảnh JPEG chứa văn bản rõ ràng OCR thành công (`READY`, chars > 0) | **PASS** |
| **TEST 240** | PDF scan dạng ảnh được render và OCR thành công từng trang (`READY`) | **PASS** |
| **TEST 241** | Tìm kiếm `CONTENT` khớp từ khóa trong tệp OCR, trả về snippet và `contentSource = 'OCR'` | **PASS** |
| **TEST 242** | Tìm kiếm `ALL` khớp cả tiêu đề metadata và nội dung văn bản OCR | **PASS** |
| **TEST 243** | Tìm kiếm `METADATA` không khớp từ khóa chỉ nằm độc quyền trong ảnh OCR | **PASS** |
| **TEST 244** | Chỉ phiên bản hiện hành (Current version) tham gia tìm kiếm; phiên bản lịch sử không match | **PASS** |
| **TEST 245** | Tải lên phiên bản OCR mới cập nhật chỉ mục tìm kiếm ngay lập tức theo nội dung v2 | **PASS** |
| **TEST 246** | Khôi phục phiên bản OCR-ready (Restore) sao chép kết quả OCR sang version mới và tìm kiếm được | **PASS** |
| **TEST 247** | Zero-leak ACL: Cụm từ OCR bí mật trong tài liệu PRIVATE trả về HTTP 200 `[]` cho STAFF chưa phân quyền | **PASS** |
| **TEST 248** | Người dùng được chia sẻ quyền `READ` tìm kiếm thành công nội dung OCR của tài liệu PRIVATE | **PASS** |
| **TEST 249** | Tài liệu `DISPOSED` có văn bản OCR hoàn toàn không thể bị phát hiện bởi người dùng STAFF | **PASS** |
| **TEST 250** | Quá hạn thời gian OCR (Timeout) đánh dấu `FAILED` an toàn, không làm hỏng tài liệu gốc | **PASS** |
| **TEST 251** | Tài liệu PDF vượt giới hạn 50 trang đánh dấu `SKIPPED` ("Page limit exceeded"), không crash | **PASS** |
| **TEST 252** | Khi OCR thất bại (`FAILED`/`SKIPPED`), tính năng Preview và Download vẫn hoạt động 100% | **PASS** |
| **TEST 253** | Trường `ocrText` thô được bảo vệ tuyệt đối, không xuất hiện trong bất kỳ REST response nào | **PASS** |
| **TEST 254** | Toàn bộ tệp ảnh render và tệp tạm thời được xóa sạch khỏi `/tmp` sau khi OCR thành công | **PASS** |
| **TEST 255** | Toàn bộ tệp tạm thời được dọn dẹp sạch sẽ kể cả khi OCR gặp lỗi/ngoại lệ | **PASS** |
| **TEST 256** | Người dùng `ROLE_STAFF` bị từ chối `403 Forbidden` khi gọi Admin OCR Rebuild | **PASS** |
| **TEST 257** | Quản trị viên (`ROLE_ADMIN`) Rebuild OCR Index thành công trên các phiên bản hiện hành | **PASS** |
| **TEST 258** | Rebuild OCR Index đảm bảo tính lũy kế (idempotent, 0 queued) khi `force=false` | **PASS** |
| **TEST 259** | Quá trình Admin OCR Rebuild tự động bỏ qua các tài liệu ở trạng thái `DISPOSED` | **PASS** |
| **TEST 260** | Trạng thái và dữ liệu ký tự OCR lưu trữ bền vững trên PostgreSQL sau `docker compose restart` | **PASS** |
| **TEST 261** | Tìm kiếm `CONTENT` sau khi khởi động lại trả về kết quả tức thì (0.29s) từ DB mà không gọi lại OCR | **PASS** |
| **TEST 262** | Yêu cầu tìm kiếm thuần túy thực thi qua SQL Subquery (0.16s), tuyệt đối không gọi OCR Process | **PASS** |
| **TEST 263** | Đuôi tệp sai lệch (`.bin`) nhưng nội dung là ảnh PNG vẫn được Tika nhận diện MIME và OCR thành công | **PASS** |
| **TEST 264** | Văn bản OCR tuân thủ giới hạn tối đa `MAX_OCR_CHARACTERS` (1,000,000 ký tự) | **PASS** |
| **TEST 265** | Nhận dạng OCR tiếng Việt có dấu (`vie`) hoạt động chuẩn xác với cụm từ "lưu trữ điện tử" | **PASS** |
| **TEST 266** | Thao tác Rebuild OCR Index của quản trị viên được ghi nhận vào `AuditLog` (`OCR_INDEX_REBUILD`) | **PASS** |

---

## 6. KIỂM TRA TÍNH BỀN VỮNG VÀ KHỞI ĐỘNG LẠI CONTAINER (PERSISTENCE & REBOOT)

Đã thực hiện khởi động lại toàn bộ hệ thống bằng lệnh:
```bash
docker compose restart backend
```
- **Kết quả kiểm tra**:
  - Dữ liệu `ocrStatus = READY`, `ocrCharacterCount`, `ocrLanguage` tồn tại nguyên vẹn trên PostgreSQL.
  - Tìm kiếm toàn văn qua `CONTENT` và `ALL` phản hồi tức thì trong **$\approx 0.2$ giây**.
  - Không có tiến trình `tesseract` nào bị gọi lại khi người dùng tìm kiếm sau khởi động lại.

---

## 7. GIỚI HẠN ĐÃ BIẾT (KNOWN LIMITATIONS)

Theo đúng phạm vi thiết kế của Phase 11:
1. **Chữ viết tay (Handwriting)**: Tesseract OCR được tối ưu hóa cho tài liệu in ấn và văn bản kỹ thuật số; không hỗ trợ nhận dạng chữ viết tay tự do.
2. **Bố cục bảng phức tạp (Table & Layout Reconstruction)**: OCR trích xuất chuỗi ký tự theo dòng tuần tự, không tái cấu trúc lưới bảng biểu (grid cell mapping).
3. **Chất lượng ảnh thấp (Low DPI / Blur)**: Tài liệu scan mờ, nghiêng quá mức hoặc có độ phân giải dưới 150 DPI có thể làm giảm độ chính xác nhận diện ký tự.

---

## 8. KẾT LUẬN VÀ PHÊ DUYỆT (VERDICT)

Toàn bộ các tiêu chí kỹ thuật, bảo mật, giới hạn tài nguyên, tính tương thích ngược và 30 bài kiểm thử mới của **Phase 11 — OCR Fallback for Scanned Documents & Images** đã hoàn thành xuất sắc và vượt qua 100% kiểm thử hồi quy.

### KẾT QUẢ ĐẠT ĐƯỢC:
- **Baseline Phase 1–10**: **236/236 PASS**
- **Phase 11 (OCR Fallback)**: **30/30 PASS**
- **Tổng điểm kiểm thử tích hợp**: **266/266 PASS (100%)**

### **VERDICT CHÍNH THỨC**:
# **`PHASE11_OCR_FALLBACK_PASS`**
