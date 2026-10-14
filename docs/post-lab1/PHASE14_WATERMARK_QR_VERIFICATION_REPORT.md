# BÁO CÁO NGHIỆM THU ĐÓNG GÓI & CỦNG CỐ BỀN VỮNG EDMS PHASE 14
# (DYNAMIC WATERMARKING & INSTANT QR CODE INTEGRITY VERIFICATION OVERLAY)

- **Dự án**: Hệ Thống Quản Trị Tài Liệu Doanh Nghiệp (EDMS)
- **Giai đoạn**: Phase 14 — Dynamic Watermarking & Instant QR Code Overlay
- **Môi trường**: Docker Compose (PostgreSQL 16, Spring Boot 3.3.3 / Java 21, React 18 / TypeScript / Vite)
- **Thư viện mã QR**: ZXing (`com.google.zxing:core:3.5.3`, `javase:3.5.3`)
- **Bộ công cụ xử lý PDF**: Apache PDFBox 2.0.32 (`PDDocument`, `PDPageContentStream`, `LosslessFactory`)
- **Bộ công cụ xử lý hình ảnh**: Java AWT (`Graphics2D`, `BufferedImage`, `ImageIO`)
- **Cơ chế đóng dấu**: **On-the-fly In-Memory Streaming** — Tuyệt đối không thay đổi tệp vật lý lưu trữ (**Zero-Tamper Guarantee**).
- **Điểm cuối xác thực công khai**:
  - `GET /api/public/verify?hash={sha256}` hoặc `GET /api/public/verify?docId={id}&version={v}`
  - `POST /api/public/verify-file` (Đối soát tệp kéo thả trực tiếp)
- **Bộ kiểm thử toàn hệ thống**: **335/335 Tests PASS (100%)**
  - Baseline Tests 1–310: 100% PASS
  - Phase 14 Tests 311–335: 25/25 PASS (100%)
- **Trạng thái phê duyệt**: **`PHASE14_DYNAMIC_WATERMARK_QR_VERIFICATION_PASS`**

---

## 1. TỔNG QUAN VÀ BẢO ĐẢM NGUYÊN TẮC BẤT BIẾN (ZERO-TAMPER GUARANTEE)

### 1.1. Thách thức cốt lõi
Khi xuất bản tài liệu ra bên ngoài hoặc chia sẻ cho các đối tượng khác nhau, doanh nghiệp cần đóng dấu bản quyền động (chứa tên người tải, thời gian xuất, cảnh báo bảo mật) và mã QR để người nhận có thể tra cứu tức thì tính chính hãng.
Tuy nhiên, nếu hệ thống ghi đè lớp watermark lên tệp lưu trữ vật lý trên đĩa:
1. Byte nhị phân của tệp sẽ bị biến đổi.
2. Mã băm SHA-256 đã đăng ký ban đầu sẽ bị sai lệch.
3. Toàn bộ chữ ký điện tử RSA-2048 (triển khai từ Phase 13) sẽ ngay lập tức bị vô hiệu hóa (`signatureStatus = INVALID`, `integrityStatus = TAMPERED`).

### 1.2. Giải pháp Kiến trúc Zero-Tamper
EDMS Phase 14 giải quyết triệt để bài toán này bằng mô hình **In-Memory Dynamic Streaming Overlay**:
- **Đọc tệp gốc chỉ đọc (Read-Only Source)**: Đọc luồng byte vật lý từ `/app/storage/uploads/<stored_file_name>`.
- **Tạo bản sao đóng dấu trong bộ nhớ**: Sử dụng Apache PDFBox nạp tài liệu vào bộ nhớ RAM, phủ các lớp watermark bán trong suốt, dải banner kiểm toán trên/dưới và con dấu QR tra cứu tính toàn vẹn vào trang đầu tiên.
- **Truyền luồng (Stream) trực tiếp tới client**: Trả về dữ liệu đóng dấu qua HTTP stream (`Content-Disposition: attachment` hoặc `inline`).
- **Bảo toàn 100% tệp gốc**: Tệp lưu trữ vật lý trên đĩa và trường `file_hash` trong PostgreSQL hoàn toàn không bị chạm tới. Nhờ vậy, chữ ký số điện tử của văn bản vẫn luôn giữ trạng thái **`VALID`** và tính toàn vẹn **`INTACT`**.

---

## 2. KIẾN TRÚC ĐÓNG DẤU ĐỘNG (WATERMARK & QR ENGINE)

### 2.1. Cấu trúc Lớp Phủ trên PDF (PDF Overlay Layers)
Mỗi trang PDF được phủ 4 lớp thông tin bảo mật và kiểm toán:
1. **Watermark chéo trung tâm (Diagonal Watermark)**:
   - Nghiêng 45 độ, căn giữa trang.
   - Phông chữ: Helvetica Bold.
   - Độ mờ: Alpha = 0.20 (bán trong suốt, không che khuất nội dung tài liệu).
   - Nội dung: Tùy biến (`watermarkText`) hoặc tự động sinh theo mẫu: `EDMS - <USERNAME> - <DD/MM/YYYY HH:mm:ss>`.
2. **Dải Banner An toàn Phía trên (Top Security Header)**:
   - Vị trí: `y = height - 18`, kích thước phông 8pt, Alpha = 0.70.
   - Nội dung: `EDMS SECURED | DOC #<ID> (v<VN>) | <TITLE> | <TYPE>`.
3. **Dải Banner Kiểm toán Phía dưới (Bottom Audit Footer)**:
   - Vị trí: `y = 14`, kích thước phông 7.5pt.
   - Nội dung: `Exported by: <USERNAME> | Time: <TIMESTAMP> | SHA-256: <SHORT_HASH>`.
4. **Con dấu QR Tra cứu Tính Toàn vẹn (Page 1 QR Integrity Stamp)**:
   - Chỉ xuất hiện ở góc dưới bên phải trang 1 (ngay trên footer).
   - Hộp đóng khung trắng viền xám chuyên nghiệp: kích thước QR 65x65pt.
   - Hình ảnh mã QR sinh bởi ZXing dạng ma trận điểm ảnh với độ phân giải cao (`LosslessFactory`).
   - Nhãn định danh: `SCAN TO VERIFY INTEGRITY`.
   - Nội dung mã QR: URL tra cứu trực tiếp dạng `https://<domain>/verify?docId=<ID>&version=<VN>&hash=<SHA256>`.

### 2.2. Xử lý An toàn Mã ký tự Tiếng Việt (Font Encoding Safety)
Các phông chữ chuẩn Type-1 của PDFBox (Helvetica, Times-Roman) chỉ hỗ trợ bảng mã WinAnsi (Latin-1). Việc hiển thị trực tiếp ký tự tiếng Việt có dấu (như `ấ`, `ệ`, `đ`, `ờ`) sẽ gây ra lỗi nghiêm trọng `IllegalArgumentException: U+1EA5 is not available in font Helvetica`.
Hệ thống triển khai hàm `toAscii()` sử dụng `java.text.Normalizer.normalize(..., Form.NFD)` và Regex loại bỏ dấu thanh, chuyển đổi ký tự `đ/Đ` thành `d/D`, đảm bảo an toàn tuyệt đối cho mọi tiêu đề và tên người dùng tiếng Việt.

### 2.3. Cơ chế Dự phòng cho Tệp Hình ảnh (Image Fallback)
Đối với tệp hình ảnh (PNG, JPEG):
- Sử dụng Java AWT `Graphics2D` xử lý ảnh nạp vào `BufferedImage`.
- Phủ watermark chéo bán trong suốt (Alpha = 0.22).
- Nếu kích thước ảnh đủ lớn (tối thiểu 250x250px), tự động vẽ dải banner chân trang và đóng dấu mã QR góc dưới phải.
- Kiểm tra biên an toàn: các ảnh có kích thước siêu nhỏ (< 50px) được bảo vệ chống tràn bộ đệm hoặc lỗi tọa độ âm.

---

## 3. CỔNG TRA CỨU CÔNG KHAI VÔ DANH (PUBLIC VERIFICATION PORTAL)

### 3.1. Điểm cuối Tra cứu API
Hệ thống mở cổng truy cập nặc danh (không yêu cầu JWT Bearer token) qua `SecurityConfig` cho tiền tố `/api/public/**`:

| Phương thức | Đường dẫn API | Mục đích |
|---|---|---|
| `GET` | `/api/public/verify?hash={sha256}` | Tra cứu theo mã băm SHA-256 (Mô phỏng quét mã QR) |
| `GET` | `/api/public/verify?docId={id}&version={v}` | Tra cứu theo số hiệu tài liệu và phiên bản |
| `POST` | `/api/public/verify-file` | Kéo thả tệp bất kỳ lên máy chủ để băm và đối soát tự động |

### 3.2. Lọc sạch Dữ liệu Phản hồi (Data Sanitization & Zero Key Leakage)
Endpoint công khai trả về DTO `PublicVerificationResponse`:
- **Thông tin công khai hợp lệ**: `documentId`, `title`, `versionNumber`, `documentType`, `fileHash`, `hashAlgorithm`, `integrityStatus`, `signatureStatus`, `signerUsername`, `signedAt`, `certSerialNumber`, `certSubject`, `certValidFrom`, `certValidUntil`, `verifiedAt`.
- **Thông tin được chặn tuyệt đối**: Tuyệt đối **KHÔNG** rò rỉ khóa riêng tư (`privateKey`), đường dẫn tệp trên ổ cứng máy chủ (`storagePath`, `storedFileName`, `localPath`), hoặc mật khẩu hệ thống.

---

## 4. GIAO DIỆN NGƯỜI DÙNG FRONTEND

1. **Trang Tra cứu Công khai (`/verify`)**:
   - Truy cập trực tiếp không cần đăng nhập.
   - Hỗ trợ nạp tham số tự động từ URL khi quét mã QR (`?docId=...&version=...&hash=...`).
   - Khu vực kéo thả tệp (`Dropzone`) cho phép tải tệp từ máy tính để đối soát tức thì.
   - Thẻ hiển thị chứng chỉ số, người ký, tình trạng toàn vẹn với huy hiệu màu sắc trực quan (Xanh lục: `INTACT` & `VALID`; Đỏ cảnh báo: `TAMPERED` hoặc `INVALID`).
2. **Nút Thao tác trong Modal Phiên bản (`DocumentVersionModal.tsx`)**:
   - Thêm nút **"Tải bản đóng dấu (Watermark)"** kèm mã QR.
   - Thêm nút **"Xem trước bản đóng dấu"** mở tab trình duyệt với PDF đã được đóng dấu.
   - Thêm liên kết nhanh dẫn đến trang đối soát công khai của phiên bản tài liệu.

---

## 5. BẢNG TỔNG HỢP KIỂM THỬ HỒI QUY (TEST MATRIX 311–335)

Toàn bộ 25 bài kiểm thử mới đã được tích hợp vào bộ kiểm thử hồi quy chuẩn của hệ thống:

| Test ID | Tên Bài Kiểm Thử | Trọng Tâm Nghiệp Vụ | Kết Quả |
|:---:|---|---|:---:|
| **311** | `test_311_download_watermarked_pdf_streaming_valid_header` | Tải xuống PDF đóng dấu, kiểm tra header `%PDF-` và attachment disposition | **PASS** |
| **312** | `test_312_download_watermarked_custom_text` | Kiểm tra tham số `watermarkText` tùy chỉnh | **PASS** |
| **313** | `test_313_download_watermarked_default_text` | Kiểm tra sinh watermark mặc định kèm thông tin người dùng và thời gian | **PASS** |
| **314** | `test_314_preview_watermarked_inline_disposition` | Kiểm tra xem trước watermark trả về `Content-Disposition: inline` | **PASS** |
| **315** | `test_315_document_level_watermarked_download` | Tải xuống watermark ở cấp tài liệu (phiên bản mới nhất) | **PASS** |
| **316** | `test_316_document_level_watermarked_preview` | Xem trước watermark ở cấp tài liệu (phiên bản mới nhất) | **PASS** |
| **317** | `test_317_watermark_zero_tamper_file_bytes_identical` | Khẳng định tệp vật lý gốc bất biến 100% sau khi đóng dấu | **PASS** |
| **318** | `test_318_watermark_zero_tamper_signature_remains_valid` | Khẳng định chữ ký số RSA vẫn giữ `VALID` và `INTACT` | **PASS** |
| **319** | `test_319_public_verify_by_sha256_hash_anonymous` | Tra cứu công khai vô danh bằng mã băm SHA-256 không cần token | **PASS** |
| **320** | `test_320_public_verify_by_doc_id_and_version_anonymous` | Tra cứu công khai vô danh bằng `docId` và `version` | **PASS** |
| **321** | `test_321_public_verify_nonexistent_hash_returns_found_false` | Tra cứu mã băm giả lập trả về `found=false` | **PASS** |
| **322** | `test_322_public_verify_nonexistent_doc_id_returns_found_false` | Tra cứu tài liệu không tồn tại trả về `found=false` | **PASS** |
| **323** | `test_323_public_verify_missing_parameters_returns_400` | Thiếu tham số tra cứu trả về mã lỗi 400 Bad Request | **PASS** |
| **324** | `test_324_public_verify_file_matching_exact_bytes` | Tải tệp lên `/verify-file` khớp chính xác tài liệu trong kho | **PASS** |
| **325** | `test_325_public_verify_file_tampered_or_unregistered_file` | Tải tệp lạ không có trong kho trả về `found=false` | **PASS** |
| **326** | `test_326_public_verify_file_empty_returns_400` | Gửi tệp rỗng 0 byte lên `/verify-file` bị từ chối 400 Bad Request | **PASS** |
| **327** | `test_327_public_verification_response_sanitization` | Xác minh phản hồi công khai không rò rỉ khóa riêng hay đường dẫn nội bộ | **PASS** |
| **328** | `test_328_watermark_download_unauthorized_user_private_document_rejected` | Phân quyền ACL: Người dùng không có quyền bị từ chối 403 khi tải watermark | **PASS** |
| **329** | `test_329_watermark_download_requires_authentication` | Tải xuống bản watermark yêu cầu xác thực người dùng (401) | **PASS** |
| **330** | `test_330_watermark_download_nonexistent_document_returns_404` | Yêu cầu tài liệu không tồn tại trả về 404 Not Found | **PASS** |
| **331** | `test_331_watermark_audit_trail_recorded` | Ghi nhận nhật ký kiểm toán `DOCUMENT_DOWNLOAD_WATERMARKED` | **PASS** |
| **332** | `test_332_public_verification_audit_trail_recorded` | Ghi nhận nhật ký kiểm toán `DOCUMENT_PUBLIC_VERIFIED` khi tra cứu công khai | **PASS** |
| **333** | `test_333_watermark_image_fallback` | Áp dụng watermark cho tệp hình ảnh (PNG/JPG) an toàn và chuẩn xác | **PASS** |
| **334** | `test_334_multi_version_watermark_and_verification_isolation` | Tính độc lập và cách ly mã băm/chữ ký giữa các phiên bản v1, v2 | **PASS** |
| **335** | `test_335_baseline_and_phase14_comprehensive_integrity_closure` | Toàn vẹn chu trình khép kín: Tạo -> Ký -> Xác thực QR -> Đối soát tệp -> Watermark -> Zero-Tamper | **PASS** |

---

## 6. KẾT LUẬN & CHUẨN BỊ BÀN GIAO

- **Tính tương thích ngược**: 100% chức năng từ Sprint 1–4, Phase 5–13 (Quyền truy cập, Phiên bản, Phê duyệt, Vòng đời, Tiêu hủy, Tìm kiếm toàn văn, OCR, Tìm kiếm ngữ nghĩa AI, Chữ ký số) hoạt động ổn định và không phát sinh lỗi phụ thuộc.
- **Tính toàn vẹn**: Nguyên tắc **Zero-Tamper Guarantee** được chứng minh bằng thực nghiệm: các thao tác đóng dấu watermark động không làm thay đổi dù chỉ 1 bit của tệp gốc lưu trên hệ thống tệp tin vật lý.
- **Phê duyệt hoàn tất**: Hệ thống đạt chuẩn nghiệm thu cao nhất với **335/335 bài kiểm thử thành công tuyệt đối**.
