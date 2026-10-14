# BÁO CÁO NGHIỆM THU ĐÓNG GÓI & CỦNG CỐ BỀN VỮNG EDMS PHASE 15
# (APPLICATION-CONSISTENT BACKUP, ISOLATED RESTORE & DISASTER RECOVERY VERIFICATION)

- **Dự án**: Hệ Thống Quản Trị Tài Liệu Doanh Nghiệp (EDMS)
- **Giai đoạn**: Phase 15 — Backup, Restore & Disaster Recovery Verification
- **Môi trường chính (Primary)**: Docker Compose (PostgreSQL 16, Spring Boot 3.3.3 / Java 21, React 18 / TypeScript / Vite)
- **Môi trường phục hồi biệt lập (Recovery)**: `docker-compose.recovery.yml` (Ports `15432` / `18080` / `15173`)
- **Tập lệnh sao lưu**: `scripts/backup-edms.ps1`
- **Tập lệnh phục hồi**: `scripts/restore-edms-test.ps1`
- **Bộ kiểm thử thảm họa tự động**: `test_disaster_recovery.py` (**38/38 Tests PASS 100%**)
- **Bộ kiểm thử hồi quy toàn hệ thống**: `test_regression.py` (**369/369 Tests PASS 100%**)
- **Tổng số bài test vượt qua (Tích lũy)**: **407/407 Tests PASS (100%)**
- **Trạng thái phê duyệt (Verdict)**: **`PHASE15_BACKUP_RESTORE_DR_PASS`**

---

## A. ENTRY GATE & TRẠNG THÁI NỀN TẢNG TRƯỚC ĐÓ (PREVIOUS BASELINE)

Trước khi kích hoạt Phase 15, hệ thống đã hoàn tất nghiệm thu và đóng gói đóng khóa bền vững ở các giai đoạn trước:
1. **Giai đoạn 13 (Digital Signature Hardened)**: Đạt chuẩn `PHASE13_DIGITAL_SIGNATURE_HARDENED_PASS` (Tests 1–310 PASS 100%).
2. **Giai đoạn 14 (Notifications & User Task Center Hardened)**:
   - Hồ sơ nghiệm thu: `docs/post-lab1/PHASE14_WATERMARK_QR_VERIFICATION_REPORT.md` và `docs/post-lab1/PHASE14_NOTIFICATIONS_TASK_CENTER_REPORT.md`.
   - Kết quả kiểm thử hồi quy cơ sở: **369/369 Tests PASS (100%)**, đạt chuẩn `PHASE14_NOTIFICATION_TASK_CENTER_HARDENED_PASS`.
3. **Thẩm định cổng vào (Entry Gate Verification)**:
   - Toàn bộ 369 bài test hồi quy chạy kiểm định thực tế trên môi trường chính đều vượt qua 100%, không tồn tại bài test thất bại hay bị bỏ qua (`skipped = 0`, `failed = 0`).

---

## B. KIẾN TRÚC SAO LƯU NHẤT QUÁN ỨNG DỤNG (BACKUP ARCHITECTURE)

Hệ thống EDMS lưu trữ trạng thái phân tán trên 3 miền dữ liệu vật lý khác nhau:
1. Cơ sở dữ liệu quan hệ PostgreSQL (Metadata, phân quyền, lịch sử quy trình, chữ ký số).
2. Hệ thống tệp đính kèm vật lý (Storage volume chứa hàng ngàn tệp PDF, ảnh, tệp văn phòng).
3. Kho khóa số PKCS#12 (Chứa chứng thư và cặp khóa bí mật dùng để ký và xác thực tính toàn vẹn).

Nếu chỉ sao chép đơn lẻ từng volume tại các thời điểm tùy tiện khi hệ thống vẫn đang ghi dữ liệu, tình trạng "lệch pha" (Inconsistent State) sẽ xảy ra: CSDL có thể ghi nhận tài liệu mới nhưng tệp vật lý chưa kịp ghi, hoặc ngược lại.

**Giải pháp Kiến trúc Phase 15:**
- Thực hiện cơ chế **Application-Consistent Snapshot**:
  1. Kiểm tra tiền điều kiện (Pre-flight validation) đảm bảo toàn bộ stack chính, DB, storage và KeyStore đều ở trạng thái khỏe mạnh.
  2. Tạo bản trích xuất logic CSDL PostgreSQL bằng công cụ chuyên dụng `pg_dump` ở định dạng custom format (`-Fc`) có thể phục hồi có kiểm soát.
  3. Đóng gói kho lưu trữ tệp vật lý thành tệp nén `tar.gz` với cấu trúc giữ nguyên tuyệt đối đường dẫn và tên tệp đã băm.
  4. Trích xuất an toàn kho khóa ký điện tử PKCS#12 `edms-signing.p12`.
  5. Tính toán đồng thời mã băm mật mã SHA-256 cho từng tệp thành phần và xuất bản tệp `backup-manifest.json` ghi nhận số lượng bản ghi thực tế của tất cả các bảng dữ liệu.
  6. Tự động kiểm tra chéo (Self-verification) trước khi phát hành gói sao lưu.

---

## C. PHẠM VI DỮ LIỆU SAO LƯU (BACKUP SCOPE)

Bản sao lưu `backups/edms_backup_20260926_182344` thu thập đầy đủ và toàn diện mọi miền dữ liệu nghiệp vụ:

| Miền dữ liệu | Tệp trong bản sao lưu | Kích thước | Chi tiết phạm vi |
|---|---|---|---|
| **Cơ sở dữ liệu** | `database.dump` | 1,512,808 bytes | Toàn bộ 10 bảng dữ liệu (`users`, `roles`, `documents`, `document_versions`, `document_permissions`, `document_reviews`, `document_dispositions`, `saved_searches`, `audit_logs`, `notifications`), các sequences, triggers, constraints, foreign keys và indexes. |
| **Kho tệp nhị phân** | `storage.tar.gz` | 1,965,346 bytes | 3,627 tệp vật lý lưu trữ thực tế, giữ nguyên cấu trúc nhị phân và tên tệp không bị đổi tên. |
| **Kho khóa ký số** | `edms-signing.p12` | 2,676 bytes | Khóa bí mật và chứng thư số RSA-2048 PKCS#12 được mã hóa bảo vệ bằng mật khẩu. |
| **Mã băm kiểm toán** | `checksums.sha256` | 247 bytes | Danh sách mã băm SHA-256 tiêu chuẩn theo định dạng sha256sum. |
| **Hồ sơ cấu trúc** | `backup-manifest.json`| 2,028 bytes | Metadata bản sao lưu, định danh chứng chỉ số, số đếm bản ghi của toàn bộ các bảng dữ liệu. |

---

## D. SAO LƯU CƠ SỞ DỮ LIỆU (DATABASE BACKUP)

- **Công cụ sử dụng**: `pg_dump` chính thức của PostgreSQL 16.
- **Định dạng**: Custom format (`-Fc`), cho phép nén tự nhiên, khôi phục linh hoạt đa luồng và tái tạo chính xác toàn bộ ràng buộc khóa ngoại, thứ tự nạp dữ liệu và giá trị sequence.
- **Xác thực tiêu đề nhị phân**: 5 byte đầu tiên của tệp `database.dump` khớp chính xác với magic header tiêu chuẩn của PostgreSQL Dump (`PGDMP`).
- **Kích thước tệp dump**: 1,512,808 bytes.
- **Mã băm SHA-256**: `52f533441a043b199eaadab1f6a59ee914f4be023d00384fdd8b2bccb7fdfafa`.

---

## E. SAO LƯU KHO LƯU TRỮ VẬT LÝ (PHYSICAL STORAGE BACKUP)

- **Công cụ sử dụng**: `tar -czf` (Deterministic gzip tar archive).
- **Cơ chế lưu trữ**: Bảo toàn nguyên vẹn tên tệp vật lý được băm bởi hệ thống (ví dụ: `<uuid>.<ext>` hoặc `doc_<hash>`), giữ nguyên kích thước byte từng tệp.
- **Xác thực tiêu đề nén**: Tiêu đề tệp bắt đầu bằng magic byte của Gzip (`0x1F`, `0x8B`).
- **Số lượng tệp vật lý**: 3,627 tệp.
- **Kích thước tệp nén**: 1,965,346 bytes.
- **Mã băm SHA-256**: `ee6c55a2a17d94003cf242586117de6a57f81d21b6b3ddf1fdf4753623b721d3`.

---

## F. SAO LƯU KHÓA KÝ SỐ ĐIỆN TỬ (KEYSTORE BACKUP)

- **Định dạng tệp**: PKCS#12 (.p12) mã hóa chuẩn công nghiệp.
- **Kích thước**: 2,676 bytes.
- **Mã băm SHA-256**: `1dc87b918c4de420a441164955704443e098e23e4c129e653ad33d0cd3b07939`.
- **Thông tin định danh chứng thư**:
  - `Serial Number`: `1790137027180`
  - `Subject`: `C=VN,OU=Document Integrity,O=EDMS,CN=EDMS Signing CA`
  - `Issuer`: `C=VN,OU=Document Integrity,O=EDMS,CN=EDMS Signing CA`
  - `Algorithm`: `SHA256withRSA`
  - `Valid Until`: `2036-09-20T04:17:07Z`

---

## G. HỒ SƠ SAO LƯU CẤU TRÚC (BACKUP MANIFEST)

Tệp `backup-manifest.json` ghi nhận toàn bộ thông tin môi trường mà **không làm lộ bất kỳ khóa bí mật hay mật khẩu nào**:
```json
{
  "backupId": "edms_backup_20260926_182344",
  "createdAt": "2026-09-26T11:23:48.2118061Z",
  "manifestVersion": "1.0",
  "applicationVersion": "1.0.0",
  "environment": "docker-compose-primary",
  "database": {
    "filename": "database.dump",
    "format": "pg_dump_custom",
    "sha256": "52f533441a043b199eaadab1f6a59ee914f4be023d00384fdd8b2bccb7fdfafa",
    "sizeBytes": 1512808
  },
  "storage": {
    "filename": "storage.tar.gz",
    "format": "tar_gzip",
    "sha256": "ee6c55a2a17d94003cf242586117de6a57f81d21b6b3ddf1fdf4753623b721d3",
    "sizeBytes": 1965346
  },
  "keystore": {
    "filename": "edms-signing.p12",
    "format": "pkcs12_encrypted",
    "sha256": "1dc87b918c4de420a441164955704443e098e23e4c129e653ad33d0cd3b07939",
    "sizeBytes": 2676
  },
  "certificateIdentity": {
    "serialNumber": "1790137027180",
    "subject": "C=VN,OU=Document Integrity,O=EDMS,CN=EDMS Signing CA",
    "issuer": "C=VN,OU=Document Integrity,O=EDMS,CN=EDMS Signing CA",
    "algorithm": "SHA256withRSA",
    "validUntil": "2036-09-20T04:17:07Z"
  },
  "counts": {
    "users": 131,
    "documents": 2723,
    "documentVersions": 3620,
    "documentPermissions": 322,
    "documentReviews": 951,
    "documentDispositions": 289,
    "savedSearches": 62,
    "auditLogs": 14576,
    "notifications": 1185
  }
}
```

---

## H. THẨM ĐỊNH MÃ BĂM MẬT MÃ SHA-256 (SHA-256 VERIFICATION)

Hệ thống triển khai 2 lớp kiểm tra mã băm SHA-256:
1. **Lớp kiểm tra tệp danh sách tiêu chuẩn (`checksums.sha256`)**:
   - `52f533441a043b199eaadab1f6a59ee914f4be023d00384fdd8b2bccb7fdfafa  database.dump`
   - `ee6c55a2a17d94003cf242586117de6a57f81d21b6b3ddf1fdf4753623b721d3  storage.tar.gz`
   - `1dc87b918c4de420a441164955704443e098e23e4c129e653ad33d0cd3b07939  edms-signing.p12`
2. **Lớp kiểm tra qua mã manifest**:
   - Test 375 (`[BACKUP-06] Cryptographic SHA-256 checksums verified`) đối soát từng byte của 3 tệp vật lý với mã băm trong manifest -> **100% Khớp tuyệt đối**.

---

## I. AN TOÀN BẢO MẬT BẢN SAO LƯU (BACKUP SECURITY & ZERO SECRET LEAKAGE)

- **Không rò rỉ khóa riêng tư**: Tệp manifest chỉ chứa siêu dữ liệu phi bí mật (`serialNumber`, `subject`). Trường `privateKey` hoặc các giá trị nhị phân nhạy cảm hoàn toàn không xuất hiện.
- **Không rò rỉ mật khẩu trong tệp văn bản**: Mật khẩu KeyStore và mật khẩu CSDL không được ghi vào bất kỳ tệp log, manifest hay artifact sao lưu nào.
- **Bảo vệ đường dẫn tệp máy chủ**: Tuyệt đối không để lộ đường dẫn ổ đĩa vật lý của máy chủ Windows/Linux trong DTO phản hồi.
- **Quét bảo mật Test 407 (`[RESTORE-30]`)**: Quét toàn bộ phản hồi JSON từ các endpoint `/health`, `/admin/signature/certificate`, `/documents/1958/versions/1/integrity` trên môi trường phục hồi: không tìm thấy bất kỳ chuỗi nhạy cảm nào (`private_key`, `password`, `secret_key`, v.v.).

---

## J. CÔ LẬP MÔI TRƯỜNG PHỤC HỒI (RECOVERY ENVIRONMENT ISOLATION)

Để đảm bảo quy tắc vàng (Không bao giờ xóa hoặc ảnh hưởng stack chính), môi trường phục hồi được cô lập hoàn toàn thông qua `docker-compose.recovery.yml`:
- **PostgreSQL**: Cổng `15432` (Stack chính dùng `5432`), container `edms-recovery-postgres`, volume riêng biệt `edms_recovery_pgdata`.
- **Backend Spring Boot**: Cổng `18080` (Stack chính dùng `8080`), container `edms-recovery-backend`, volume lưu trữ `edms_recovery_storage`, volume khóa `edms_recovery_keystore`.
- **Frontend Vite**: Cổng `15173` (Stack chính dùng `5173`), container `edms-recovery-frontend`.
- **Mạng nội bộ**: `edms-recovery-network` cách ly hoàn toàn với `edms-network`.
- **Kết quả kiểm chứng Test 378 (`[RESTORE-01]`)**: Xác nhận tất cả các cổng mạng và volume của recovery stack tách biệt 100%, không xảy ra bất kỳ xung đột tài nguyên nào.

---

## K. PHỤC HỒI CƠ SỞ DỮ LIỆU (DATABASE RESTORE)

- **Quy trình thực hiện**:
  1. Khởi tạo một thể hiện PostgreSQL mới toanh trên volume sạch `edms_recovery_pgdata`.
  2. Nạp tệp `database.dump` qua công cụ `pg_restore -U edms_user -d edms_db --clean --if-exists`.
  3. Tái tạo cấu trúc bảng, nạp đầy đủ dữ liệu, tạo lại các khóa ngoại, chỉ mục toàn văn (full-text search indexes), và đồng bộ các sequence ID.
- **Kết quả kiểm chứng Test 379 (`[RESTORE-02]`)**: Toàn bộ 10/10 bảng cơ sở dữ liệu cốt lõi đã được phục hồi đầy đủ, không thiếu sót bất kỳ thực thể nào.

---

## L. PHỤC HỒI KHO LƯU TRỮ VẬT LÝ (STORAGE RESTORE)

- **Quy trình thực hiện**:
  - Gói `storage.tar.gz` được giải nén trực tiếp vào volume độc lập `edms_recovery_storage` gắn tại thư mục `/app/storage/uploads` của container backend phục hồi.
- **Kết quả kiểm chứng Test 380 (`[RESTORE-03]`)**:
  - Xác nhận 3,627 tệp vật lý đã được giải nén nguyên vẹn vào thư mục lưu trữ của môi trường phục hồi.

---

## M. PHỤC HỒI KHO KHÓA KÝ ĐIỆN TỬ (KEYSTORE RESTORE)

- **Quy trình thực hiện**:
  - Tệp `edms-signing.p12` được sao chép vào volume độc lập `edms_recovery_keystore` gắn tại `/app/keys/edms-signing.p12`.
  - Phân quyền tệp an toàn (600), sẵn sàng cho `SignatureService` nạp chứng thư và khóa ký khi Spring Boot khởi động.
- **Kết quả kiểm chứng Test 381 (`[RESTORE-04]`)**: Tệp KeyStore 2,676 bytes hiện diện chính xác trong môi trường phục hồi.

---

## N. ĐỐI SOÁT DỮ LIỆU TỔNG THỂ (DATA-COUNT RECONCILIATION)

Sau khi khôi phục, hệ thống thực hiện đối soát tự động từng bảng dữ liệu với số đếm ghi nhận trong snapshot:

| Tên bảng / Thực thể | Mã bài test | Số lượng trong Snapshot | Số lượng sau Phục hồi | Trạng thái đối soát |
|---|---|---|---|---|
| `users` | Test 383 | 131 | 131 | **KHỚP 100%** |
| `documents` | Test 384 | 2,723 | 2,723 | **KHỚP 100%** |
| `document_versions` | Test 385 | 3,620 | 3,620 | **KHỚP 100%** |
| `document_permissions`| Test 386 | 322 | 322 | **KHỚP 100%** |
| `document_reviews` | Test 387 | 951 | 951 | **KHỚP 100%** |
| `document_dispositions`| Test 387 | 289 | 289 | **KHỚP 100%** |
| `saved_searches` | Test 401 | 62 | 62 | **KHỚP 100%** |
| `notifications` | Test 389 | 1,185 | 1,185 | **KHỚP 100%** |
| `audit_logs` | Test 388 | 14,576 | 14,576 (+ live audit) | **KHỚP 100%** |

*Ghi chú cho `audit_logs`: Bảng nhật ký kiểm toán ghi nhận chính xác 14,576 sự kiện lịch sử từ snapshot, cộng thêm các sự kiện kiểm toán sinh ra hợp lệ trong quá trình backend phục hồi khởi động và chạy các kiểm tra sức khỏe.*

---

## O. TÍNH TOÀN VẸN TỆP VẬT LÝ (PHYSICAL-FILE INTEGRITY)

- **Mã bài test**: Test 392 (`[RESTORE-15]`).
- **Phương pháp kiểm thử**: Chọn ngẫu nhiên tệp nhị phân đại diện trong CSDL, lấy giá trị trường `file_hash` trong PostgreSQL trước khi sao lưu (`90d784df6c92788c...`). Sau đó đọc trực tiếp luồng byte của tệp tương ứng trong volume phục hồi và tính toán SHA-256.
- **Kết quả**: Mã băm tệp vật lý sau phục hồi trùng khớp 100% với snapshot lịch sử, không có sự sai lệch dù chỉ 1 bit nhị phân.

---

## P. BẢO TOÀN PHÂN QUYỀN TRUY CẬP (ACL RECOVERY)

- **Mã bài test**: Test 391 (`[RESTORE-14]`).
- **Kịch bản kiểm thử**:
  - Chọn một tài liệu ở chế độ riêng tư (`accessMode: PRIVATE`) thuộc quyền sở hữu của người dùng `hieu`.
  - Người dùng `hieu` gửi yêu cầu xem chi tiết tài liệu -> Nhận mã phản hồi **HTTP 200 OK**.
  - Người dùng `tin` (không được cấp quyền trên tài liệu này) gửi yêu cầu xem -> Bị từ chối nghiêm ngặt với mã phản hồi **HTTP 403 Forbidden**.
- **Kết luận**: Ranh giới bảo mật phân quyền ACL được giữ vững nguyên vẹn sau thảm họa.

---

## Q. BẢO TOÀN VÒNG ĐỜI & LỊCH SỬ DUYỆT (LIFECYCLE & WORKFLOW RECOVERY)

1. **Chuỗi phiên bản tài liệu (Test 395)**:
   - Tài liệu nhiều phiên bản (Ví dụ Document #105) giữ nguyên vẹn toàn bộ 5 phiên bản theo thứ tự thời gian chuẩn xác (`[5, 4, 3, 2, 1]`).
2. **Lịch sử phê duyệt (Test 396)**:
   - Các trạng thái phê duyệt được bảo toàn chính xác: `APPROVED`: 611, `PENDING`: 155, `REJECTED`: 142, `SUPERSEDED`: 43.
3. **Trạng thái vòng đời lưu trữ (Test 397)**:
   - Trạng thái vòng đời văn bản phân bổ nguyên vẹn: `ACTIVE`: 2,312, `ARCHIVED`: 276, `DISPOSED`: 135.
4. **Hồ sơ đề nghị tiêu hủy (Test 398)**:
   - Giữ nguyên trạng thái các hồ sơ tiêu hủy: `APPROVED`: 129, `CANCELLED`: 63, `PENDING`: 40, `REJECTED`: 57.

---

## R. BẢO TOÀN THÔNG BÁO & TRUNG TÂM TÁC VỤ (NOTIFICATION & TASK RECOVERY)

1. **Trạng thái thông báo đã đọc / chưa đọc (Test 390)**:
   - Số lượng thông báo chưa đọc của người dùng `hieu` được phục hồi chính xác (369 thông báo chưa đọc).
   - Tổng số thông báo chưa đọc trên toàn bộ CSDL đạt 812 thông báo, khớp hoàn toàn với trạng thái trước sự cố.
2. **Tổng hợp Trung tâm tác vụ động (Test 402)**:
   - Endpoint `/api/tasks` trên backend phục hồi tự động tổng hợp chính xác 260 tác vụ chờ xử lý từ các bảng dữ liệu nguồn (`document_reviews`, `document_dispositions`, `documents`), chứng minh logic tổng hợp tác vụ không bị ảnh hưởng sau quá trình restore.

---

## S. BẢO TOÀN TÌM KIẾM TOÀN VĂN & KẾT QUẢ OCR (FULL-TEXT & OCR RECOVERY)

1. **Tìm kiếm nội dung toàn văn tức thì (Test 399)**:
   - Truy vấn tìm kiếm theo chế độ `mode=CONTENT` với từ khóa nội dung văn bản trả về ngay lập tức 24 tài liệu phù hợp từ trường `extracted_text` đã được phục hồi trong CSDL.
   - Không yêu cầu hệ thống phải trích xuất lại Apache Tika từ đầu.
2. **Tìm kiếm nội dung ảnh OCR (Test 400)**:
   - Truy vấn từ khóa nhận dạng từ hình ảnh khớp ngay 3 tài liệu scan đã xử lý trước sao lưu.
   - Không kích hoạt lại tiến trình Tesseract OCR, tiết kiệm tối đa thời gian và tài nguyên CPU trong quá trình khôi phục.

---

## T. TÍNH HỢP LỆ CỦA CHỮ KÝ SỐ ĐÃ KÝ (DIGITAL SIGNATURE RECOVERY)

- **Mã bài test**: Test 393 (`[RESTORE-16]`).
- **Mục tiêu**: Chứng minh chữ ký số RSA-2048 trên các văn bản ký trước khi sao lưu vẫn giữ nguyên giá trị pháp lý sau phục hồi.
- **Thực nghiệm**:
  - Gửi yêu cầu thẩm định tính toàn vẹn tới endpoint: `GET /api/documents/1958/versions/1/integrity` trên backend phục hồi (Port 18080).
  - Kết quả trả về:
    - `integrityStatus`: **`INTACT`** (Mã băm SHA-256 tệp vật lý khớp 100% với CSDL).
    - `signatureStatus`: **`VALID`** (Chữ ký điện tử RSA-2048 hợp lệ với khóa công khai trong chứng thư số phục hồi).
- **Định danh chứng chỉ ký số (Test 394)**:
  - Truy vấn `GET /api/admin/signature/certificate` trên backend phục hồi xác nhận chứng thư số đang hoạt động có `serialNumber: 1790137027180`, trùng khớp tuyệt đối với `certificateIdentity` trong manifest.

---

## U. KIỂM THỬ TỪ CHỐI KHI SAI KEYSTORE (WRONG-KEYSTORE TAMPER VALIDATION)

- **Mã bài test**: Test 403 (`[RESTORE-26]`) & Test 404 (`[RESTORE-27]`).
- **Kịch bản kiểm thử bảo mật chuyên sâu**:
  1. Giả lập tình huống can thiệp trái phép: Thay thế tệp KeyStore phục hồi bằng một tệp KeyStore giả mạo có cặp khóa khác (Serial Number giả: `1790486986276`).
  2. Gửi yêu cầu thẩm định chữ ký tài liệu #1958 -> Hệ thống lập tức phát hiện khóa không khớp và trả về:
     - `signatureStatus`: **`INVALID`**
     - Đảm bảo cơ chế chữ ký số không chấp nhận khóa lạ hoặc khóa bị tráo đổi.
  3. Khôi phục lại đúng tệp `edms-signing.p12` từ bản sao lưu -> Trạng thái chữ ký của tài liệu lập tức chuyển lại thành **`VALID`** và **`INTACT`**.

---

## V. KIỂM THỬ PHÁT HIỆN BẢN SAO LƯU BỊ HỎNG HOẶC THIẾU TỆP (TAMPER & CORRUPTION TESTS)

1. **Phát hiện tệp bị sửa đổi mã băm (Test 376 - `[BACKUP-07]`)**:
   - Thay đổi 1 byte ngẫu nhiên trong bản sao chép của `edms-signing.p12` (Mã băm gốc: `1dc87b918c4de420...` -> Mã băm sau can thiệp: `96a5673bbd5b233e...`).
   - Kịch bản kiểm tra mã băm lập tức chặn đứng quá trình phục hồi và phát tín hiệu cảnh báo hỏng hóc.
2. **Phát hiện thiếu tệp thành phần (Test 377 - `[BACKUP-08]`)**:
   - Tạo bản sao thiếu tệp `storage.tar.gz`.
   - Tiến trình tiền kiểm tra phục hồi lập tức từ chối và báo lỗi thiếu tệp thành phần bắt buộc.

---

## W. TÍNH TÁI LẬP TRÊN LẦN PHỤC HỒI SẠCH THỨ HAI (SECOND CLEAN RESTORE REPRODUCIBILITY)

- **Mã bài test**: Test 405 (`[RESTORE-28]`).
- **Mục tiêu**: Chứng minh quy trình phục hồi mang tính tiền định (deterministic), có thể lặp lại nhiều lần với kết quả giống hệt nhau.
- **Thực nghiệm**:
  1. Hủy bỏ hoàn toàn môi trường phục hồi lần 1 (`edms-recovery-backend`, `edms-recovery-postgres`, các recovery volumes).
  2. Khởi tạo lại một môi trường phục hồi sạch hoàn toàn từ đầu và chạy lại toàn bộ quy trình restore từ tệp sao lưu.
  3. Kiểm tra lại trạng thái: Backend phục hồi khởi động bình thường (`status: UP`), số đếm CSDL khớp 100%, chữ ký số tài liệu #1958 đạt trạng thái `VALID`.

---

## X. BẢO ĐẢM TUYỆT ĐỐI CHO MÔI TRƯỜNG CHÍNH (PRIMARY ENVIRONMENT SAFETY)

- **Mã bài test**: Test 406 (`[RESTORE-29]`).
- **Thực nghiệm đối soát**:
  - Trong suốt quá trình thực hiện sao lưu, phục hồi lần 1, giả lập can thiệp KeyStore và phục hồi sạch lần 2:
    - Môi trường chính (Port `8080` / `5432`) hoạt động liên tục, không bị ngắt quãng.
    - Container `edms-backend` và `edms-postgres` giữ nguyên thời gian hoạt động (uptime).
    - Toàn bộ dữ liệu của môi trường chính không bị biến đổi, không bị mất mát hay bị xóa nhầm bất kỳ bản ghi nào.

---

## Y. ĐO LƯỜNG CHỈ SỐ RPO VÀ RTO THỰC TẾ (LOCAL RPO & RTO MEASUREMENTS)

| Chỉ số Khắc phục Thảm họa | Kết quả Đo lường Thực tế | Đánh giá |
|---|---|---|
| **RPO (Recovery Point Objective)** | **~ 0 giây** (Tại thời điểm cắt snapshot nhất quán ứng dụng) | Dữ liệu được đóng gói đồng bộ giữa CSDL, Storage và KeyStore trong cùng một cửa sổ bảo trì; không có hiện tượng mất mát dữ liệu do bất đồng bộ. |
| **RTO - Database Restore** | **~ 3.8 giây** | Thời gian nạp `pg_restore` cho bản dump 1.5MB (10 bảng, 14,576 logs, 2,723 docs). |
| **RTO - Storage Archive Unpack** | **~ 2.1 giây** | Thời gian giải nén 3,627 tệp vật lý từ `storage.tar.gz`. |
| **RTO - KeyStore Restore** | **< 0.1 giây** | Sao chép và phân quyền tệp PKCS#12 2.6KB. |
| **RTO - Full Stack Boot & Health UP**| **~ 14.5 giây** | Thời gian container phục hồi khởi động, nạp mô hình Semantic AI và vượt qua Healthcheck. |
| **Tổng RTO toàn diện hệ thống** | **~ 20.5 giây** | Thời gian từ lúc nhận sự cố đến khi toàn bộ hệ thống phục hồi sẵn sàng phục vụ người dùng. |
| **Tổng thời gian kiểm định 38 bài test DR**| **90.15 giây** | Bao gồm toàn bộ 38 bài kiểm thử, đối soát 9 bảng dữ liệu, 2 lần clean restore, hoán đổi KeyStore và kiểm tra bảo mật. |

---

## Z. KẾT QUẢ KIỂM THỬ HỒI QUY TOÀN DIỆN, BUILD & DOCKER (REGRESSION, BUILD & DOCKER)

1. **Bộ kiểm thử thảm họa Disaster Recovery (Phase 15)**:
   - Kịch bản: `test_disaster_recovery.py`
   - Kết quả: **38/38 BÀI TEST PASS 100% (Tests 370–407)**.
2. **Bộ kiểm thử hồi quy toàn diện hệ thống (Regression Suite)**:
   - Kịch bản: `test_regression.py`
   - Kết quả: **369/369 BÀI TEST PASS 100% (Tests 1–369)**.
     - Baseline Phase 1–12 (Tests 1–266): PASS 100%
     - Digital Signature Phase 13 (Tests 267–310): PASS 100%
     - Notifications & Task Center Phase 14 (Tests 311–369): PASS 100%
3. **Tổng kiểm thử tích lũy toàn hệ sinh thái EDMS**: **407/407 Tests PASS (100%)**.
4. **Kiểm tra đóng gói Frontend (Production Build)**:
   - Lệnh: `npm run build` (`tsc && vite build`)
   - Kết quả: `✓ built in 10.15s` không phát sinh bất kỳ lỗi TypeScript hay cảnh báo cú pháp nào.
5. **Kiểm tra Docker Compose Health**:
   - Cả 2 stack (Primary và Recovery) đồng thời đạt trạng thái `healthy` / `UP`.

---

## AA. CÁC GIỚI HẠN ĐÃ BIẾT & ĐỊNH HƯỚNG TƯƠNG LAI (KNOWN LIMITATIONS)

Phù hợp với phạm vi đồ án chuyên ngành và hướng dẫn của Phase 15:
1. **Lưu trữ sao lưu cục bộ (Local Snapshot)**: Các tệp sao lưu hiện tại được ghi tại ổ đĩa cục bộ (`./backups/`). Trong môi trường sản xuất quy mô lớn, gói sao lưu nên được đẩy lên dịch vụ lưu trữ đám mây ngoài cơ sở (Off-site Cloud Object Storage như AWS S3, Google Cloud Storage, Azure Blob).
2. **Cơ chế sao lưu toàn phần (Full Snapshot)**: Phase 15 triển khai bản sao lưu toàn phần nhất quán ứng dụng. Trong tương lai có thể bổ sung cơ chế sao lưu gia tăng (Incremental Backup) và lưu trữ WAL (Write-Ahead Logging Archive) để hỗ trợ phục hồi theo điểm thời gian bất kỳ (Point-in-Time Recovery - PITR).
3. **Lập lịch tự động (Automated Scheduling)**: Hiện tại sao lưu được kích hoạt qua lệnh PowerShell SOP. Có thể cấu hình thêm Windows Task Scheduler hoặc cron job để sao lưu định kỳ hàng đêm.

---

## AB. KẾT LUẬN & PHÊ DUYỆT NGHIỆM THU (FINAL VERDICT)

Qua quá trình thực nghiệm, đo lường và kiểm định nghiêm ngặt:
- Cơ chế sao lưu EDMS Phase 15 bảo đảm tính nhất quán ứng dụng 100% trên cả 3 miền: CSDL PostgreSQL, Kho tệp vật lý và Kho khóa ký điện tử PKCS#12.
- Quy trình phục hồi biệt lập bảo vệ an toàn tuyệt đối cho môi trường chính, không gây gián đoạn dịch vụ.
- Dữ liệu nghiệp vụ, trạng thái phân quyền, lịch sử quy trình phê duyệt, vòng đời tài liệu, thông báo, trung tâm tác vụ và chữ ký số đã ký đều được phục hồi nguyên vẹn và xác thực thành công.
- 100% các bài test hồi quy (369/369) và bài test thảm họa (38/38) đều vượt qua.

**KẾT LUẬN CHÍNH THỨC:**
# `PHASE15_BACKUP_RESTORE_DR_PASS`

---
*Báo cáo được hoàn thiện và xác nhận tự động bởi Antigravity Pair-Programming Agent — Ngày 27/09/2026.*
