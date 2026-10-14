# BÁO CÁO NGHIỆM THU EDMS PHASE 6
## DOCUMENT VERSIONING & REVISION HISTORY
**Trạng thái phê duyệt:** HOÀN THÀNH & TOÀN DIỆN  
**Baseline trước:** LAB1_EDMS_DOCUMENTATION_ALIGNED + PHASE5_DOCUMENT_ACCESS_PASS (79/79 Tests PASS)  
**Baseline sau Phase 6:** 104/104 Tests PASS (100%)  
**Verdict:** `PHASE6_DOCUMENT_VERSIONING_PASS`

---

## A. Baseline Verification (Kiểm tra nền tảng ban đầu)
- **Phương pháp thực hiện:** Code cuốn chiếu (Incremental Vertical Slice).
- **Nguyên tắc bất biến:** Không xóa Docker volumes, không reset database, không xóa dữ liệu người dùng, không sửa tài liệu Lab 1 trong `docs/final-evidence/` và workbook `Lab1_EDMS_2SV_CuonChieu_60-40.xlsx`.
- **Kết quả xác nhận trước khi code:** 
  - Toàn bộ 79/79 bài kiểm thử hồi quy (Sprint 1–4 + Phase 5 ACL) đạt **PASS 100%**.
  - Kiểm tra các dịch vụ nền tảng: `Document`, `FileStorageService`, `DocumentAccessService`, `AuditService`, `StatisticsService` hoạt động ổn định.

---

## B. Database Migration (Di chuyển dữ liệu CSDL)
Quá trình migration được thực thi an toàn, không phá hủy (Non-destructive DDL & DML):
1. **Bổ sung cột vào bảng `documents`:**
   ```sql
   ALTER TABLE documents ADD COLUMN IF NOT EXISTS current_version_number INTEGER NOT NULL DEFAULT 1;
   ```
2. **Tạo bảng `document_versions`:**
   ```sql
   CREATE TABLE IF NOT EXISTS document_versions (
       id BIGSERIAL PRIMARY KEY,
       document_id BIGINT NOT NULL,
       version_number INTEGER NOT NULL,
       original_file_name VARCHAR(255) NOT NULL,
       stored_file_name VARCHAR(255) NOT NULL,
       content_type VARCHAR(100) NOT NULL,
       file_size BIGINT NOT NULL,
       uploaded_by VARCHAR(50) NOT NULL,
       created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
       change_note TEXT,
       CONSTRAINT fk_doc_version_document FOREIGN KEY (document_id) 
           REFERENCES documents(id) ON DELETE CASCADE,
       CONSTRAINT uq_document_version UNIQUE (document_id, version_number)
   );
   CREATE INDEX IF NOT EXISTS idx_doc_version_doc ON document_versions(document_id);
   ```

---

## C. Version Data Model (Mô hình thực thể phiên bản)
Phân định rạch ròi trách nhiệm giữa **Document** và **DocumentVersion**:
- **Document (Logical Identity):**
  - Giữ danh tính logic duy nhất của tài liệu: `id`, `title`, `description`, `documentType`, `createdBy`, `accessMode`, `permissions`, `createdAt`, `updatedAt`.
  - Giữ con trỏ phiên bản hiện hành: `currentVersionNumber` (mặc định trỏ đến phiên bản mới nhất).
  - Duy trì các trường file của phiên bản hiện hành (`originalFileName`, `storedFileName`, `contentType`, `fileSize`) để đảm bảo 100% tương thích ngược với các API cũ.
- **DocumentVersion (Binary Revision Data):**
  - Đại diện cho từng revision tệp tin nhị phân: `id`, `documentId`, `versionNumber`, `originalFileName`, `storedFileName`, `contentType`, `fileSize`, `uploadedBy`, `createdAt`, `changeNote`.
  - Khóa duy nhất phức hợp `(document_id, version_number)` ngăn chặn hoàn toàn việc trùng lặp số phiên bản.

---

## D. Existing Document Migration (Chuyển đổi dữ liệu có sẵn sang v1)
- **Thực thi DML tự động:**
  ```sql
  INSERT INTO document_versions (document_id, version_number, original_file_name, stored_file_name, content_type, file_size, uploaded_by, created_at, change_note)
  SELECT d.id, 1, d.original_file_name, d.stored_file_name, d.content_type, d.file_size, d.created_by, d.created_at, 'Phiên bản ban đầu'
  FROM documents d
  WHERE NOT EXISTS (
      SELECT 1 FROM document_versions v WHERE v.document_id = d.id AND v.version_number = 1
  );
  ```
- **Kết quả:** 100% tài liệu hiện có trong hệ thống được tự động gán là Version 1 (`versionNumber = 1`), liên kết an toàn tới file vật lý đã có mà không cần sao chép dư thừa.

---

## E. Current-Version Behavior (Hành vi phiên bản hiện hành & Tương thích ngược)
- Các endpoint tải tệp và xem trước cũ:
  - `GET /api/documents/{id}/preview`
  - `GET /api/documents/{id}/download`
- Tiếp tục hoạt động chuẩn xác 100% mà không thay đổi signature hay phá vỡ frontend/consumer.
- Nội bộ `DocumentService.loadDocumentFileAsResource`: Đọc metadata của tài liệu ứng với `currentVersionNumber`, đảm bảo luôn trả về nội dung của phiên bản mới nhất hoặc phiên bản được chỉ định là hiện hành.

---

## F. Upload New Version (Tải lên phiên bản mới)
- **Endpoint:** `POST /api/documents/{id}/versions`
- **Request:** `multipart/form-data` chứa:
  - `file`: Tệp tin nhị phân mới.
  - `changeNote`: Ghi chú mô tả thay đổi (tùy chọn).
- **Cơ chế đánh số thứ tự (Numbering):**
  - Hệ thống tự động xác định `nextVersionNumber = max(versionNumber) + 1`.
  - Người dùng không được can thiệp vào việc đánh số.
- **An toàn tương tranh (Concurrency & Race-condition Safety):**
  - Sử dụng Pessimistic Write Lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) trên bảng `documents` kết hợp với Unique Constraint `(document_id, version_number)`.
  - Khi có 2 yêu cầu tải lên đồng thời cho cùng 1 tài liệu, giao dịch được tuần tự hóa an toàn (ví dụ: tạo thành công tuần tự v6 và v7 không xung đột, đã kiểm chứng trong TEST 98).
- **An toàn tệp (Failure Safety):**
  - Tệp vật lý được lưu trữ dưới tên file UUID độc lập (`uuid-name.ext`), không bao giờ ghi đè file cũ.
  - Nếu quá trình lưu trữ DB thất bại, tệp mồ côi (orphan file) sẽ được dọn dẹp sạch sẽ.

---

## G. Version History (Lịch sử phiên bản)
- **Endpoint:** `GET /api/documents/{id}/versions`
- **Yêu cầu quyền:** Phải có quyền `READ` trở lên trên tài liệu (thông qua `DocumentAccessService`).
- **Thứ tự trả về:** Sắp xếp theo phiên bản mới nhất xếp trước (`versionNumber DESC`).
- **Cấu trúc dữ liệu trả về:**
  - `id`: ID bản ghi phiên bản.
  - `versionNumber`: Số thứ tự phiên bản (1, 2, 3...).
  - `originalFileName`: Tên tệp gốc khi tải lên.
  - `contentType`: Định dạng MIME.
  - `fileSize`: Dung lượng bytes.
  - `uploadedBy`: Username của người tải lên phiên bản đó.
  - `createdAt`: Thời điểm tải lên.
  - `changeNote`: Ghi chú thay đổi.
  - `isCurrent`: Boolean đánh dấu đây có phải phiên bản hiện hành hay không.

---

## H. Historical Preview & Download (Xem trước & Tải về phiên bản lịch sử)
1. **Xem trước phiên bản cụ thể:**
   - **Endpoint:** `GET /api/documents/{id}/versions/{versionNumber}/preview`
   - **Header trả về:** `Content-Disposition: inline; filename="..."`, `Content-Type: <mime>`
   - **Hành vi:** Đọc chính xác các bytes nhị phân của phiên bản được yêu cầu, hiển thị trực tiếp trên trình duyệt/modal.
2. **Tải về phiên bản cụ thể:**
   - **Endpoint:** `GET /api/documents/{id}/versions/{versionNumber}/download`
   - **Header trả về:** `Content-Disposition: attachment; filename="<originalFileName>"`
   - **Hành vi:** Tải về máy với đúng tên tệp gốc của phiên bản đó.
3. **Bảo mật:** Bắt buộc kiểm tra quyền `READ` qua `DocumentAccessService`. Nếu là tài liệu `PRIVATE` và người dùng không được phân quyền, hệ thống trả về mã lỗi `403 Forbidden`. Nếu phiên bản không tồn tại, trả về `404 Not Found`.

---

## I. Restore Behavior (Hành vi khôi phục phiên bản)
- **Endpoint:** `POST /api/documents/{id}/versions/{versionNumber}/restore`
- **Yêu cầu quyền:** `ADMIN`, `OWNER` hoặc người dùng được cấp quyền `EDIT`.
- **Nguyên tắc bất biến (Non-destructive / Immutable History):**
  - Khôi phục **KHÔNG** xóa lịch sử cũ.
  - Khôi phục **KHÔNG** làm biến đổi các bản ghi phiên bản trong quá khứ.
  - Khôi phục **TẠO RA MỘT PHIÊN BẢN MỚI** có nội dung nhị phân sao chép từ phiên bản được chọn.
  - Ví dụ: Tài liệu đang ở v3 (lịch sử: v1, v2, v3). Khôi phục v1 $\rightarrow$ Sinh ra v4 có nội dung bằng v1, ghi chú thay đổi tự động: `"Khôi phục từ phiên bản 1"`. Lịch sử trở thành [v4 (current), v3, v2, v1].
  - Phiên bản mới này trở thành `currentVersionNumber` của tài liệu.

---

## J. ACL Integration (Tích hợp kiểm soát truy cập)
Tái sử dụng hoàn toàn hạ tầng bảo mật của Phase 5 (`DocumentAccessService`):
- **Xem danh sách phiên bản, xem trước, tải về:** Yêu cầu quyền `READ` (hoặc tài liệu ở chế độ `INTERNAL`, hoặc người dùng là `OWNER`/`ADMIN`).
- **Tải lên phiên bản mới, khôi phục phiên bản cũ:** Yêu cầu quyền `EDIT` (hoặc `OWNER`/`ADMIN`).
- **Bảo vệ tài liệu PRIVATE:** Các API phiên bản lịch sử tuyệt đối không cho phép bypass bảo mật. Người dùng không có quyền bị từ chối `403 Forbidden` ở mọi endpoint liên quan đến version.

---

## K. Frontend Implementation (Triển khai Giao diện Người dùng)
1. **API Client (`frontend/src/api/documentApi.ts`):**
   - Bổ sung định nghĩa kiểu `DocumentVersion`.
   - Bổ sung các phương thức: `getDocumentVersions`, `uploadNewVersion`, `getVersionPreviewUrl`, `downloadVersion`, `restoreVersion`.
2. **Modal Quản lý Phiên bản (`frontend/src/components/DocumentVersionModal.tsx`):**
   - Hiển thị thông tin tổng quan: Tên tài liệu, huy hiệu phiên bản hiện hành (`Current: vX`).
   - Bảng Lịch sử phiên bản (Revision Table): Số phiên bản, Huy hiệu trạng thái (Hiện hành / Lịch sử), Tên tệp gốc, Dung lượng định dạng chuẩn, Người tải lên, Thời gian tạo định dạng đẹp, Ghi chú thay đổi, Các nút thao tác.
   - Thao tác trên từng phiên bản:
     - Nút "Xem trước" (Preview): Mở PreviewModal với nội dung của phiên bản đó.
     - Nút "Tải về" (Download): Tải về tệp của phiên bản tương ứng.
     - Nút "Khôi phục" (Restore): Chỉ hiển thị cho người có quyền `EDIT`/`OWNER`/`ADMIN`. Có hộp thoại xác nhận rõ ràng giải thích khôi phục sẽ tạo phiên bản mới chứ không làm mất lịch sử cũ.
   - Khu vực "Tải lên phiên bản mới":
     - Form chọn tệp tin và nhập ghi chú thay đổi (Change note).
     - Chỉ hiển thị nếu người dùng có quyền `EDIT`/`OWNER`/`ADMIN`.
     - Tự động làm mới danh sách phiên bản và cập nhật tài liệu cha ngay sau khi tải lên thành công.
3. **Tích hợp vào Trang Danh sách Tài liệu (`frontend/src/pages/DocumentsPage.tsx`):**
   - Hiển thị badge phiên bản (ví dụ `v1`, `v2`, `v3`) cạnh tiêu đề tài liệu.
   - Bổ sung nút "Phiên bản" (icon lịch sử) trong cột Thao tác để mở `DocumentVersionModal`.

---

## L. Audit Integration (Ghi nhận Nhật ký Kiểm toán)
Bổ sung 4 loại sự kiện kiểm toán mới vào `AuditService`:
1. `DOCUMENT_VERSION_UPLOAD`: Ghi nhận sự kiện tải lên phiên bản mới kèm số phiên bản và tên tệp.
2. `DOCUMENT_VERSION_PREVIEW`: Ghi nhận sự kiện xem trước một phiên bản cụ thể.
3. `DOCUMENT_VERSION_DOWNLOAD`: Ghi nhận sự kiện tải về một phiên bản cụ thể.
4. `DOCUMENT_VERSION_RESTORE`: Ghi nhận sự kiện khôi phục từ phiên bản cũ thành phiên bản mới.
- **Bảo mật:** Không bao giờ ghi log nội dung nhị phân của tệp tin, chuỗi JWT token, hoặc mật khẩu/hash.

---

## M. Storage & Statistics Semantics (Ngữ nghĩa Thống kê & Lưu trữ)
- **Tính toàn vẹn số lượng tài liệu:** `totalDocuments` phản ánh số lượng hồ sơ tài liệu logic duy nhất. Việc tải lên nhiều phiên bản **KHÔNG** làm tăng ảo số lượng `totalDocuments`.
- **Dung lượng lưu trữ (`totalStorageBytes`):**
  - Giữ tương thích tuyệt đối với TEST 52 trong bộ kiểm thử hồi quy: trường `fileSize` trên `Document` luôn cập nhật đồng bộ với dung lượng của phiên bản hiện hành.
  - Cung cấp thêm phương thức tính toán tổng dung lượng vật lý tích lũy của toàn bộ các phiên bản trong CSDL thông qua `DocumentVersionRepository.sumAllVersionsFileSize()`.

---

## N. Test Suite (Danh mục kiểm thử Phase 6: Tests 80–104)

| Test ID | Nội dung kiểm thử | Kết quả |
| :--- | :--- | :---: |
| **TEST 80** | Toàn bộ tài liệu có sẵn đã được tự động migrate thành phiên bản 1 (v1) | **PASS** |
| **TEST 81** | Endpoint preview/download cũ tiếp tục hoạt động trơn tru sau migration | **PASS** |
| **TEST 82** | Owner tải lên phiên bản 2 (Version 2) kèm ghi chú thay đổi thành công | **PASS** |
| **TEST 83** | Lịch sử phiên bản chứa đầy đủ v2 và v1 theo thứ tự mới nhất xếp trên | **PASS** |
| **TEST 84** | Preview tài liệu hiện hành trả về chính xác nội dung bytes của v2 | **PASS** |
| **TEST 85** | Preview cụ thể phiên bản 1 (/versions/1/preview) trả về bytes gốc của v1 | **PASS** |
| **TEST 86** | Tải về cụ thể phiên bản 1 (/versions/1/download) trả về tệp gốc v1_original.pdf | **PASS** |
| **TEST 87** | Người dùng được chia sẻ quyền READ xem được đầy đủ lịch sử các phiên bản | **PASS** |
| **TEST 88** | Người dùng có quyền READ xem trước và tải về phiên bản cũ thành công | **PASS** |
| **TEST 89** | Người dùng chỉ có quyền READ bị từ chối 403 khi cố tình tải lên phiên bản mới | **PASS** |
| **TEST 90** | Người dùng được nâng cấp lên quyền EDIT tải lên phiên bản v3 thành công | **PASS** |
| **TEST 91** | Người dùng chưa được cấp quyền bị chặn 403 khi xem lịch sử tài liệu PRIVATE | **PASS** |
| **TEST 92** | Người dùng chưa được cấp quyền bị chặn 403 khi preview/download phiên bản lịch sử | **PASS** |
| **TEST 93** | Owner khôi phục phiên bản v1 (Restore) tạo thành công phiên bản mới v4 | **PASS** |
| **TEST 94** | Thao tác khôi phục tạo phiên bản mới v4 và bảo toàn toàn bộ 4 phiên bản | **PASS** |
| **TEST 95** | Khôi phục không xóa hoặc làm biến đổi nội dung bất kỳ phiên bản cũ nào | **PASS** |
| **TEST 96** | Phiên bản vừa khôi phục (v4) chính thức trở thành current version trên tài liệu | **PASS** |
| **TEST 97** | Số thứ tự phiên bản tăng tiến tuần tự chính xác (1 -> 2 -> 3 -> 4 -> 5) | **PASS** |
| **TEST 98** | Ngăn chặn trùng lặp số phiên bản; Pessimistic Lock xử lý an toàn đồng thời | **PASS** |
| **TEST 99** | Sự kiện kiểm toán DOCUMENT_VERSION_UPLOAD được ghi nhận đầy đủ | **PASS** |
| **TEST 100** | Sự kiện kiểm toán DOCUMENT_VERSION_PREVIEW và DOWNLOAD được ghi nhận | **PASS** |
| **TEST 101** | Sự kiện kiểm toán DOCUMENT_VERSION_RESTORE được ghi nhận an toàn bảo mật | **PASS** |
| **TEST 102** | Thống kê totalDocuments không bị tăng ảo khi sinh ra nhiều phiên bản | **PASS** |
| **TEST 103** | Toàn bộ 7 bản ghi phiên bản (v7..v1) tồn tại nguyên vẹn sau khởi động lại container | **PASS** |
| **TEST 104** | Nội dung bytes vật lý của toàn bộ các phiên bản lịch sử được bảo toàn sau restart | **PASS** |

---

## O. Full Regression Execution (Kiểm thử hồi quy toàn diện)
- **Tập lệnh thực thi:** `python test_regression.py`
- **Phạm vi:** Chạy tuần tự không gián đoạn từ **TEST 1 đến TEST 104**.
- **Kết quả tổng kết:**
  ```text
  =================================================================
  KẾT QUẢ CUỐI CÙNG: TẤT CẢ 104/104 BÀI TEST TỪ TEST 1 ĐẾN TEST 104 ĐÃ PASS 100%!
  PHASE 6 DOCUMENT VERSIONING & REVISION HISTORY: THÀNH CÔNG RỰC RỠ!
  =================================================================
  ```
- **Tỷ lệ thành công:** **104 / 104 (100% PASS)**. Không có bài test nào bị bỏ qua hoặc thất bại.

---

## P. Persistence Verification (Xác minh tính bền vững dữ liệu)
- **Thử nghiệm khởi động lại:** `docker compose restart backend`.
- **Kết quả xác minh:**
  - Endpoint sức khỏe `/api/health` trả về HTTP 200 `UP`.
  - Mọi bản ghi `document_versions` trong PostgreSQL còn nguyên vẹn 100%.
  - Tệp nhị phân trên persistent volume `edms_storage_data` của mọi phiên bản được giữ nguyên vẹn (kiểm chứng bằng so khớp từng byte trong TEST 104).
  - Trạng thái quyền ACL, người dùng, tìm kiếm đã lưu, và nhật ký kiểm toán không bị ảnh hưởng.

---

## Q. Backend Build Verification (Kiểm tra biên dịch Backend)
- **Công cụ:** Maven 3.9 / OpenJDK 17 trong Docker build.
- **Số tệp nguồn Java đã biên dịch:** 59 source files.
- **Kết quả biên dịch:** `BUILD SUCCESS` (Thời gian: 13.985 s).
- **Mã thoát (Exit code):** `0`.
- **Artifact:** `target/edms-backend-1.0.0-sprint1.jar` được đóng gói và vận hành chính xác trong container `edms-backend`.

---

## R. Frontend Build Verification (Kiểm tra biên dịch Frontend)
- **Công cụ:** TypeScript Compiler (`tsc -b`) & Vite Bundler (`vite build`).
- **Kết quả biên dịch:** Hoàn thành trong 10.75s, không có cảnh báo hoặc lỗi type checking.
- **Mã thoát (Exit code):** `0`.
- **Artifact:** Thư mục `dist` sinh ra đầy đủ các bundle tối ưu hóa (HTML, JS chunks, CSS). Container `edms-frontend` phục vụ ổn định trên cổng 5173.

---

## S. Docker Environment Status (Trạng thái môi trường Docker)
Lệnh kiểm tra: `docker compose ps`
```text
NAME            IMAGE                  COMMAND                  SERVICE    STATUS
edms-backend    doan_cnpmnc-backend    "java -jar app.jar"      backend    Up (healthy)
edms-frontend   doan_cnpmnc-frontend   "docker-entrypoint.s…"   frontend   Up
edms-postgres   postgres:16-alpine     "docker-entrypoint.s…"   postgres   Up (healthy)
```
Tất cả 3 container đang hoạt động bình thường, dữ liệu được ánh xạ an toàn vào Docker Volumes độc lập.

---

## T. Known Limitations (Giới hạn đã biết - Nằm ngoài phạm vi Phase 6)
Theo đúng yêu cầu không over-engineer tại mục 2 và 33:
- Chưa hỗ trợ cơ chế phân nhánh kiểu Git (branch/merge engine).
- Chưa hỗ trợ đồng chỉnh sửa thời gian thực (real-time coauthoring).
- Chưa hỗ trợ so khớp diff nội dung file văn bản phức tạp (content diff engine).
- Chưa triển khai quy trình phê duyệt phiên bản (approval workflow) hoặc chữ ký điện tử (digital signature).
- Không triển khai chức năng xóa/purge từng phiên bản riêng lẻ (đảm bảo tính bất biến của lịch sử).
Các tính năng nâng cao này có thể được phát triển trong các giai đoạn tiếp theo nếu có yêu cầu.

---

## U. Verdict (Kết luận nghiệm thu)

# **PHASE6_DOCUMENT_VERSIONING_PASS**
