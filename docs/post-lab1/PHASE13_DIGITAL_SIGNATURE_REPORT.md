# BÁO CÁO NGHIỆM THU ĐÓNG GÓI & CỦNG CỐ BỀN VỮNG EDMS PHASE 13
# (EDMS PHASE 13 — CONTROLLED CLOSURE, REAL TAMPER TEST & SIGNING KEY DURABILITY HARDENING)

- **Dự án**: Hệ Thống Quản Trị Tài Liệu Doanh Nghiệp (EDMS)
- **Giai đoạn**: Phase 13 Hardened — Controlled Closure & Key Durability
- **Môi trường**: Docker Compose (PostgreSQL 16, Spring Boot 3.3.3 / Java 21, React 18 / TypeScript / Vite)
- **Thuật toán băm**: SHA-256 (`java.security.MessageDigest`, định dạng chuẩn `sha256:<64-char-hex>`)
- **Mã hóa & Ký số**: RSA-2048 (`SHA256withRSA`, PKCS#12 KeyStore tại `/app/keys/edms-signing.p12`)
- **Chứng thư số**: X.509 v3 Internal Self-Signed Certificate (Issuer & Subject: `CN=EDMS Signing CA, O=EDMS, OU=Document Integrity, C=VN`, Serial Number: `1790137027180`, thời hạn 10 năm)
- **Phân định pháp lý**: **Chữ ký số nội bộ phía máy chủ (Server-side Internal Electronic Seal)** — Phục vụ kiểm soát toàn vẹn dữ liệu nội bộ và nhật ký truy vết thao tác, không thay thế chữ ký số công cộng được cấp bởi CA quốc gia.
- **Bộ kiểm thử hồi quy**: **310/310 Tests PASS (100%)**
- **Trạng thái phê duyệt**: **`PHASE13_DIGITAL_SIGNATURE_HARDENED_PASS`**

---

## 1. BẢO VỆ TOÀN VẸN VẬT LÝ VÀ PHÁT HIỆN SỬA ĐỔI THỰC TẾ (REAL PHYSICAL TAMPER VERIFICATION)

Hệ thống triển khai cơ chế kiểm định tính toàn vẹn độc lập và thực chất:
- **Kiểm định thực tế trên đĩa vật lý**: Không sử dụng mock cờ nhớ bộ nhớ hay cờ logic. Quy trình kiểm thử thực tế can thiệp trực tiếp vào file lưu trữ trên đĩa (`/app/storage/uploads/<stored_file_name>`) bằng cách thêm byte dữ liệu trái phép bên ngoài tầng ứng dụng EDMS.
- **Kết quả xác minh khi bị xâm phạm**:
  - `integrityStatus = "TAMPERED"`: Do giá trị băm SHA-256 tính toán từ tệp vật lý hiện thời không khớp với `file_hash` tin cậy lưu trong cơ sở dữ liệu.
  - `signatureStatus = "INVALID"`: Chữ ký số RSA-2048 không thể xác thực vì payload nhị phân thực tế đã bị biến đổi.
- **Hành vi bảo vệ dấu vết bằng chứng (Tamper Behavior Guard)**:
  - Khi tệp bị sửa đổi trái phép, các thao tác nghiệp vụ đọc dữ liệu như **Preview** (`/preview`) hoặc **Download** (`/download`) tuyệt đối **KHÔNG** tự động sửa chữa, thay thế hoặc tính toán lại để ghi đè lên `file_hash` ban đầu trong database.
  - Dấu vết băm ban đầu được bảo toàn nguyên vẹn trong PostgreSQL để phục vụ công tác điều tra số học (forensic audit).

---

## 2. CHÍNH SÁCH BĂM DỮ LIỆU CŨ (LEGACY HASH CONTROLLED BACKFILL POLICY)

Đối với các tài liệu được tạo ra trước Phase 13 (Sprint 1–4, Phase 5–11) mà trường `file_hash` trong `document_versions` đang là `NULL`:
- **Chính sách Backfill có kiểm soát (Controlled Backfill)**:
  - Khi người dùng có thẩm quyền thực hiện kiểm tra toàn vẹn lần đầu (`GET /api/documents/{id}/versions/{vn}/integrity`), hệ thống phát hiện `file_hash == null` và tự động tính toán mã băm SHA-256 thực tế từ tệp lưu trữ vật lý.
  - Kết quả được cập nhật và đóng dấu thời gian vào cơ sở dữ liệu (`file_hash`, `hash_algorithm = 'SHA-256'`, `hash_computed_at = Instant.now()`).
  - Trạng thái trả về: `integrityStatus = INTACT`, `signatureStatus = UNSIGNED`.
  - Các lần kiểm tra tiếp theo duy trì tính bất biến, trả về chính xác giá trị băm và thời điểm đã được lưu.
- **Quy tắc bảo vệ bất di bất dịch đối với dữ liệu không khớp (Strict Mismatch Preservation)**:
  - Nếu `file_hash` đã tồn tại trong DB nhưng **không khớp** với mã băm của tệp vật lý hiện tại, hệ thống **TUYỆT ĐỐI KHÔNG** coi đây là dữ liệu cũ cần cập nhật lại.
  - Trường hợp này được định danh chính xác là **xâm hại dữ liệu (`TAMPERED`)**, hệ thống giữ nguyên giá trị `file_hash` gốc làm bằng chứng kiểm toán và lập tức cảnh báo `TAMPERED` cùng `INVALID`.

---

## 3. NGỮ NGHĨA DỮ LIỆU KÝ (SIGNING DATA SEMANTICS)

- **Payload được ký**: Toàn bộ byte nhị phân thô (raw file bytes) của tệp phiên bản lưu trữ trên đĩa vật lý, được bảo đảm bằng thuật toán ký số `SHA256withRSA` theo chuẩn PKCS#1 v1.5.
- **Chữ ký gắn liền với phiên bản (Version-Bound Signature)**:
  - Chữ ký không ký trên dữ liệu trừu tượng hay metadata tổng hợp, mà gắn chặt với từng phiên bản độc lập (`DocumentVersion`).
  - Trường nhị phân `signature_bytes` (BYTEA) và số sê-ri chứng thư số `cert_serial_number` được lưu trữ trực tiếp trên bản ghi phiên bản tương ứng.

---

## 4. KIẾN TRÚC LƯU TRỮ VÀ BỀN VỮNG KHÓA KÝ (KEYSTORE PERSISTENCE ARCHITECTURE)

- **Docker Named Volume `edms_keystore_data`**:
  - Thư mục `/app/keys` trong container `edms-backend` được gắn (mount) với Docker named volume `edms_keystore_data:/app/keys`.
  - Tệp keystore PKCS#12 mang tên `edms-signing.p12` được tạo một lần duy nhất khi hệ thống khởi tạo lần đầu và tồn tại độc lập với vòng đời của container.
- **Phân quyền tệp KeyStore nghiêm ngặt (0600 Owner-Only)**:
  - Tệp `edms-signing.p12` được thiết lập quyền hạn `rw-------` (POSIX `0600`), chỉ cho phép tiến trình ứng dụng sở hữu tệp có quyền đọc/ghi, ngăn chặn truy cập trái phép từ các tiến trình khác trên host hoặc container.

---

## 5. QUẢN LÝ MẬT MÃ VÀ BÍ MẬT HỆ THỐNG (KEYSTORE SECRET HANDLING)

- **Biến môi trường quản lý tập trung**:
  - Mật khẩu KeyStore được cung cấp thông qua biến môi trường `EDMS_KEYSTORE_PASSWORD` trong `docker-compose.yml` (hoặc nạp từ hệ thống quản lý bí mật môi trường thực tế).
  - Đường dẫn KeyStore được cấu hình qua `EDMS_KEYSTORE_PATH=/app/keys/edms-signing.p12`.
- **An toàn mã nguồn (Zero Secret Leakage in Git)**:
  - Quy tắc `.gitignore` được cấu hình mở rộng để chặn toàn bộ các phần mở rộng liên quan đến khóa và chứng chỉ: `*.p12`, `*.pfx`, `*.keystore`, `*.jks`, `*.key`, `*.pem`.
  - Mật khẩu và khóa riêng tư tuyệt đối không bao giờ được hardcode vào mã nguồn hoặc phản hồi qua các API DTO.

---

## 6. XÁC MINH TÍNH BỀN VỮNG QUA VÒNG ĐỜI CONTAINER (CONTAINER RECREATION VERIFICATION)

Hệ thống đã trải qua kiểm thử tự động khắc nghiệt:
1. **Container Recreation (`docker compose up -d --force-recreate backend`)**:
   - Khi container bị xóa và tạo lại hoàn toàn từ image, khóa ký và chứng chỉ được tải lại từ volume `edms_keystore_data`.
   - Số sê-ri chứng chỉ được bảo toàn bất biến: **`1790137027180`**.
   - Các tài liệu đã ký trước khi recreate vẫn duy trì trạng thái **`INTACT`** và chữ ký **`VALID`**.
2. **Image Rebuild (`docker compose build backend` + `--force-recreate`)**:
   - Sau khi build lại toàn bộ image từ Dockerfile và khởi động lại, khóa ký không bị sinh mới, chứng thư số giữ nguyên sê-ri `1790137027180`, toàn bộ chữ ký lịch sử được xác thực thành công 100%.

---

## 7. PHÂN ĐỊNH PHÁP LÝ VÀ GIỚI HẠN CHỨNG THƯ SỐ TỰ KÝ (SELF-SIGNED LIMITATION)

- **Thuật ngữ chính xác**: **"Chữ ký số nội bộ phía máy chủ" (Server-side Internal Electronic Seal)**.
- **Phạm vi áp dụng**:
  - Hệ thống sử dụng chứng thư số tự ký (Self-Signed X.509 v3 Certificate) bởi EDMS Signing CA nội bộ.
  - Phục vụ mục đích: Kiểm soát tính toàn vẹn của hồ sơ điện tử trong phạm vi tổ chức, phát hiện sửa đổi tệp vật lý ngoài ý muốn, và cung cấp dấu vết kiểm toán trách nhiệm cho người phê duyệt.
- **Ranh giới pháp lý**:
  - Đây không phải là chữ ký số công cộng được cấp bởi Tổ chức cung cấp dịch vụ chứng thực chữ ký số công cộng (CA quốc gia / Root CA được cấp phép).
  - Không tuyên bố tính chống chối bỏ tuyệt đối (absolute legal non-repudiation) trước tòa án hoặc cơ quan tài chính công trừ khi được tích hợp với HSM / CA chuyên dụng trong tương lai.

---

## 8. THUẬT NGỮ VÀ NHẬT KÝ TRUY VẾT THAO TÁC (AUDIT TRAIL TERMINOLOGY)

- Sử dụng thuật ngữ chuẩn hóa: **"Nhật ký truy vết thao tác" (Audit Trail / Audit Log)**.
- Ghi nhận đầy đủ, tức thời các hành vi nhạy cảm:
  - `DOCUMENT_SIGNED`: Ghi nhận người ký (`signer_username`), thời điểm ký, phiên bản tài liệu.
  - `DOCUMENT_INTEGRITY_VERIFIED`: Ghi nhận người thực hiện kiểm tra, kết quả băm và tính hợp lệ của chữ ký.
- Quyền hạn truy cập:
  - Nhật ký truy vết toàn hệ sinh thái chỉ dành riêng cho Quản trị viên (`ROLE_ADMIN`) tại endpoint `/api/admin/audit-logs`.
  - Nhân viên thông thường (`ROLE_STAFF`) không thể truy cập nhằm đảm bảo an toàn thông tin kiểm toán.

---

## 9. NGỮ NGHĨA PHIÊN BẢN VÀ KHÔI PHỤC (VERSION & RESTORE SIGNATURE SEMANTICS)

- **Tính cô lập theo phiên bản (Version-Specific Signature Isolation)**:
  - Khi tài liệu đã có phiên bản `v1` được ký hợp lệ (`VALID`), việc tải lên phiên bản mới `v2` hoàn toàn **không** làm mất chữ ký của `v1`.
  - Phiên bản `v1` tiếp tục duy trì trạng thái `VALID`, trong khi phiên bản `v2` bắt đầu với trạng thái `UNSIGNED` và mã băm SHA-256 riêng biệt.
- **Quy tắc khôi phục phiên bản (Restored Version Semantics)**:
  - Khi người dùng khôi phục phiên bản cũ (ví dụ khôi phục `v1` tạo thành `v3`), phiên bản `v3` là một bản ghi mới với file vật lý mới.
  - `v3` nhận giá trị băm SHA-256 mới tương ứng với nội dung được khôi phục, nhưng **bắt đầu ở trạng thái `UNSIGNED`** (`signed_at = null`, `signer_username = null`).
  - Người có thẩm quyền cần chủ động thực hiện ký mới trên `v3` để xác lập chữ ký số cho phiên bản này.

---

## 10. TÍNH NHẤT QUÁN CỦA CÁC GIAI ĐOẠN PHÁT TRIỂN (PHASE 12 CONSISTENCY CLARIFICATION)

- **Lộ trình phát triển đã được ghi nhận**:
  - Hệ thống EDMS được xây dựng liên tục từ nền tảng Sprint 1–4 (Core Authentication, Search, User Management, Audit Logging) và các giai đoạn mở rộng:
    - Phase 5: Document Access Control & Sharing (ACL)
    - Phase 6: Document Versioning & Revision History
    - Phase 7: Document Review & Approval Workflow
    - Phase 8: Retention Policies & Archival
    - Phase 9: Controlled Disposition & Audit
    - Phase 10: Full-Text Content Search & PDF Text Extraction
    - Phase 11: OCR Fallback for Scanned Documents & Images
  - **Làm rõ Phase 12**: Trong quá trình phát triển thực tế, các tính năng nền tảng và kiểm thử hồi quy được chuyển giao trực tiếp từ Phase 11 sang bộ tính năng Chữ ký số toàn vẹn của Phase 13. Hệ thống không có một giai đoạn kiểm thử độc lập mang mã định danh "Phase 12". Toàn bộ 266 bài test cơ sở ban đầu đại diện đầy đủ cho tất cả các năng lực từ Sprint 1 đến Phase 11.

---

## 11. BẢNG TỔNG HỢP MA TRẬN KIỂM THỬ HỒI QUY PHASE 13 (TESTS 267–310)

Toàn bộ 44 bài kiểm thử mở rộng thuộc Phase 13 đã được thực thi và đạt tỷ lệ **PASS 100%**:

| STT | Mã Test | Nội dung kiểm thử chi tiết | Kết quả |
| :---: | :--- | :--- | :---: |
| 1 | **TEST 267** | Upload tài liệu mới tự động đóng dấu `fileHash` SHA-256 và `hashAlgorithm = SHA-256` | **PASS** |
| 2 | **TEST 268** | Băm SHA-256 có tính xác định (deterministic) — cùng nội dung sinh ra cùng mã băm | **PASS** |
| 3 | **TEST 269** | Tải lên phiên bản mới sinh mã băm mới độc lập và khác biệt với phiên bản cũ | **PASS** |
| 4 | **TEST 270** | Khôi phục phiên bản cũ sinh phiên bản mới có mã băm nội dung tương ứng | **PASS** |
| 5 | **TEST 271** | Xác minh toàn vẹn tài liệu nguyên bản trả về `INTACT` và `signatureStatus = UNSIGNED` | **PASS** |
| 6 | **TEST 272** | Chủ sở hữu tài liệu ký phiên bản thành công bằng `SHA256withRSA` | **PASS** |
| 7 | **TEST 273** | Xác minh sau khi ký trả về đồng thời `integrityStatus = INTACT` và `signatureStatus = VALID` | **PASS** |
| 8 | **TEST 274** | Quản trị viên (`ROLE_ADMIN`) có quyền ký tài liệu của bất kỳ người dùng nào | **PASS** |
| 9 | **TEST 275** | Nhân viên (`ROLE_STAFF`) không có quyền ký tài liệu của người khác (`403 Forbidden`) | **PASS** |
| 10 | **TEST 276** | Cố gắng ký lại phiên bản đã có chữ ký bị từ chối với mã `409 Conflict` | **PASS** |
| 11 | **TEST 277** | Ký phiên bản không tồn tại trả về `404 Not Found` | **PASS** |
| 12 | **TEST 278** | Ký tài liệu không tồn tại trả về `404 Not Found` | **PASS** |
| 13 | **TEST 279** | Thay đổi byte tệp vật lý trực tiếp trên đĩa phát hiện chính xác `TAMPERED` | **PASS** |
| 14 | **TEST 280** | Tài liệu legacy không có hash ban đầu được tự động băm (Controlled Backfill) | **PASS** |
| 15 | **TEST 281** | Nhân viên không có quyền xem tài liệu PRIVATE bị chặn `403` khi kiểm tra toàn vẹn | **PASS** |
| 16 | **TEST 282** | Phản hồi API ký không bao giờ chứa `privateKey` hoặc chuỗi byte chữ ký thô | **PASS** |
| 17 | **TEST 283** | Danh sách phiên bản hiển thị đúng `signatureStatus` (`UNSIGNED` trước ký, `VALID` sau ký) | **PASS** |
| 18 | **TEST 284** | Danh sách phiên bản không bao giờ để lộ trường nhị phân `signatureBytes` | **PASS** |
| 19 | **TEST 285** | Quản trị viên lấy thành công thông tin chứng chỉ ký X.509 v3 (Subject, Issuer, Serial) | **PASS** |
| 20 | **TEST 286** | Nhân viên (`ROLE_STAFF`) bị từ chối `403` khi gọi endpoint chứng chỉ quản trị | **PASS** |
| 21 | **TEST 287** | Thao tác ký phiên bản ghi nhận sự kiện `DOCUMENT_SIGNED` trong AuditLog | **PASS** |
| 22 | **TEST 288** | Thao tác xác minh toàn vẹn ghi nhận sự kiện `DOCUMENT_INTEGRITY_VERIFIED` trong AuditLog | **PASS** |
| 23 | **TEST 289** | Phản hồi kiểm tra toàn vẹn không để lộ `privateKey` hay `signatureBytes` | **PASS** |
| 24 | **TEST 290** | Tài liệu chưa ký hiển thị `signatureStatus = UNSIGNED` và `signerUsername = null` | **PASS** |
| 25 | **TEST 291** | `certSubject` hoàn toàn nhất quán giữa các endpoint ký, xác minh và chứng chỉ | **PASS** |
| 26 | **TEST 292** | Ký nhiều tài liệu độc lập duy trì trạng thái chữ ký riêng rẽ cho từng tài liệu | **PASS** |
| 27 | **TEST 293** | Chi tiết tài liệu hiển thị trường `fileHash` cho từng phiên bản | **PASS** |
| 28 | **TEST 294** | `certSerialNumber` khớp chính xác giữa phản hồi ký và phản hồi xác minh toàn vẹn | **PASS** |
| 29 | **TEST 295** | Yêu cầu xác thực bắt buộc đối với endpoint xác minh toàn vẹn (`401 Unauthorized`) | **PASS** |
| 30 | **TEST 296** | Yêu cầu xác thực bắt buộc đối với endpoint ký số (`401 Unauthorized`) | **PASS** |
| 31 | **TEST 297** | Phản hồi xác minh phiên bản đã ký cung cấp đầy đủ thông tin thời hạn chứng chỉ | **PASS** |
| 32 | **TEST 298** | Phiên bản sau khi ký lưu trữ đồng thời `fileHash`, `signedAt`, `signerUsername` | **PASS** |
| 33 | **TEST 299** | Hash và chữ ký điện tử bền vững 100% sau khi khởi động lại container backend | **PASS** |
| 34 | **TEST 300** | Kiểm tra hồi quy toàn diện: Tất cả các API Phase 1–11 duy trì hoạt động hoàn hảo | **PASS** |
| 35 | **TEST 301** | Sửa đổi byte vật lý tệp đã ký dẫn đến cả `TAMPERED` và chữ ký `INVALID` | **PASS** |
| 36 | **TEST 302** | Thao tác đọc/preview tệp bị tamper không làm ghi đè hash tin cậy ban đầu | **PASS** |
| 37 | **TEST 303** | Tài liệu legacy (NULL hash) được backfill chuẩn xác và bất biến ở các lần gọi sau | **PASS** |
| 38 | **TEST 304** | Tuyệt đối không bao giờ backfill đè lên tệp có hash sẵn bị sai lệch | **PASS** |
| 39 | **TEST 305** | Khóa ký và chứng chỉ bền vững qua container recreate nhờ Docker Named Volume | **PASS** |
| 40 | **TEST 306** | Khóa ký và chứng chỉ bền vững qua lệnh build lại Docker image hoàn toàn | **PASS** |
| 41 | **TEST 307** | Tính cô lập chữ ký theo phiên bản: v1 ký VALID, tải v2 thì v2 là UNSIGNED | **PASS** |
| 42 | **TEST 308** | Phiên bản khôi phục (v3) bắt đầu UNSIGNED và được ký độc lập thành công | **PASS** |
| 43 | **TEST 309** | Tài liệu ở trạng thái ARCHIVED bị từ chối ký mới với mã 409 Conflict | **PASS** |
| 44 | **TEST 310** | Tài liệu DISPOSED: ADMIN được xem kiểm toán (200), STAFF bị cấm (403) | **PASS** |

---

## 12. KẾT LUẬN VÀ TRẠNG THÁI NGHIỆM THU CUỐI CÙNG

```
======================================================================
KẾT QUẢ CUỐI CÙNG EDMS PHASE 13 HARDENED:
TẤT CẢ 44/44 BÀI TEST PHASE 13 (267–310) ĐÃ PASS 100%!
TỔNG CỘNG HỆ THỐNG: 310/310 BÀI TEST PASS 100%!
VERDICT: PHASE13_DIGITAL_SIGNATURE_HARDENED_PASS
======================================================================
```

Hệ thống EDMS đã hoàn thành đầy đủ, trọn vẹn và đạt mức độ tin cậy cao nhất cho toàn bộ các mục tiêu của **Phase 13 Controlled Closure & Key Durability Hardening**. Dự án hoàn toàn sẵn sàng cho phiên báo cáo nghiệm thu chính thức.
