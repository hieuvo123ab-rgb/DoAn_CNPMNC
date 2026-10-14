# EDMS PHASE 5 DOCUMENT ACCESS REPORT
**Dự án:** Hệ thống Quản lý Tài liệu Điện tử Doanh nghiệp (Enterprise Document Management System - EDMS)  
**Giai đoạn:** Post-Lab 1 Development — Phase 5: Document Access Control & Sharing (ACL)  
**Thời điểm hoàn tất:** 19/09/2026  
**Trạng thái kiểm thử:** 79/79 Regression Tests PASS 100%  
**Phán quyết:** `PHASE5_DOCUMENT_ACCESS_PASS`

---

## A. Baseline

1. **Khóa nền tảng Lab 1 (Historical Baseline Locked):**
   - Hoàn thành toàn bộ 26 User Stories (US-01 đến US-26), 79 Story Points phân bổ chuẩn (Võ Trọng Hiếu 47 SP, Tạ Gia Tín 32 SP).
   - 57/57 Regression tests Lab 1 được giữ nguyên tuyệt đối, không sửa đổi logic, không can thiệp thư mục lưu trữ bằng chứng lịch sử `docs/final-evidence/` và tệp `Lab1_EDMS_2SV_CuonChieu_60-40.xlsx`.
2. **Nguyên tắc phát triển tiếp tục:**
   - Triển khai cuốn chiếu (Incremental Vertical Slice), không viết lại hệ thống (no rewrite), không xóa cơ sở dữ liệu (`no reset DB / no docker compose down -v`), không xóa các Docker volume lưu trữ `edms_pgdata` và `edms_storage_data`.
   - Toàn bộ 57 bài test Lab 1 tiếp tục chạy và PASS 100% đồng hành cùng các bài test ACL mới (58–79).

---

## B. Database Migration

Migration được thực hiện an toàn tuyệt đối (non-destructive DDL):

1. **Bổ sung cột `access_mode` vào bảng `documents`:**
   ```sql
   ALTER TABLE documents 
   ADD COLUMN IF NOT EXISTS access_mode VARCHAR(20) NOT NULL DEFAULT 'INTERNAL';
   ```
   - **Tương thích ngược 100%:** Toàn bộ tài liệu cũ được khởi tạo từ Lab 1 được tự động gán giá trị `INTERNAL`. Nhờ đó, người dùng trong tổ chức vẫn tìm kiếm, xem và tải tài liệu cũ bình thường mà không bị biến mất khỏi giao diện người dùng.

2. **Tạo bảng quản lý danh sách kiểm soát truy cập (ACL) `document_permissions`:**
   ```sql
   CREATE TABLE IF NOT EXISTS document_permissions (
       id BIGSERIAL PRIMARY KEY,
       document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
       user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       permission VARCHAR(20) NOT NULL CHECK (permission IN ('READ', 'EDIT')),
       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_document_user UNIQUE (document_id, user_id)
   );

   CREATE INDEX IF NOT EXISTS idx_doc_perm_doc ON document_permissions(document_id);
   CREATE INDEX IF NOT EXISTS idx_doc_perm_user ON document_permissions(user_id);
   ```
   - Ràng buộc toàn vẹn: Khóa ngoại trỏ đến bảng `documents` và bảng `users`, ràng buộc duy nhất `(document_id, user_id)` tránh cấp trùng lặp, ràng buộc CHECK hợp lệ chỉ chấp nhận `READ` hoặc `EDIT`.

---

## C. Access Model

Hệ thống định nghĩa hai chế độ truy cập tài liệu:

1. **`INTERNAL` (Nội bộ - Mặc định):**
   - Mọi người dùng đã xác thực trong hệ thống (Authenticated Users bao gồm ROLE_STAFF và ROLE_ADMIN) đều có quyền đọc (READ: xem metadata, xem trước preview, tải về download).
   - Quyền chỉnh sửa metadata hoặc thay đổi cấu hình truy cập thuộc về Owner và ROLE_ADMIN.
2. **`PRIVATE` (Riêng tư):**
   - Chỉ có **Document Owner**, **ROLE_ADMIN**, và những người dùng được chia sẻ quyền tường minh (`document_permissions`) mới có thể nhìn thấy và truy cập tài liệu.
   - Người dùng không có quyền sẽ nhận mã lỗi `403 Forbidden` khi truy cập trực tiếp URL và tài liệu bị lọc bỏ hoàn toàn khỏi danh sách tìm kiếm ở tầng CSDL.

---

## D. Permission Rules

| Vai trò / Đối tượng | Xem Metadata | Xem trước (Preview) | Tải xuống (Download) | Sửa Metadata (Edit) | Đổi Access Mode | Quản lý Chia sẻ (Share) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ROLE_ADMIN** | Có | Có | Có | Có | Có | Có |
| **Document Owner** | Có | Có | Có | Có | Có | Có |
| **User được share `EDIT`** | Có | Có | Có | Có | **Không** | **Không** |
| **User được share `READ`** | Có | Có | Có | **Không** | **Không** | **Không** |
| **User không có quyền** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** | **403 Forbidden** |

- **Nguyên tắc suy diễn (Inference):** Quyền DOWNLOAD được suy diễn trực tiếp từ quyền READ (người được phép đọc và xem trước thì được phép tải xuống).
- **Phân tách quyền hạn (Separation of Duty):** Quyền EDIT metadata được tách biệt nghiêm ngặt với quyền CHANGE ACCESS MODE và SHARE. Người dùng được cấp quyền EDIT không được phép biến đổi tài liệu riêng tư thành công khai, không được phép chia sẻ tiếp tài liệu của người khác.

---

## E. API Changes

Các Endpoint mới và nâng cấp trong Phase 5:

1. **Truy vấn quyền chia sẻ:**  
   `GET /api/documents/{id}/permissions`  
   *Quyền hạn:* Owner hoặc ROLE_ADMIN.  
   *Mô tả:* Trả về danh sách người dùng được cấp quyền kèm metadata chi tiết (id, userId, username, fullName, permission, createdAt).
2. **Cấp quyền chia sẻ:**  
   `POST /api/documents/{id}/permissions`  
   *Request Body:* `{"userId": 2, "permission": "READ"}`  
   *Phản hồi:* `200 OK` kèm thông tin quyền vừa tạo.
3. **Cập nhật quyền chia sẻ:**  
   `PUT /api/documents/{id}/permissions/{userId}`  
   *Request Body:* `{"permission": "EDIT"}`  
   *Phản hồi:* `200 OK` kèm thông tin quyền cập nhật.
4. **Thu hồi quyền chia sẻ:**  
   `DELETE /api/documents/{id}/permissions/{userId}`  
   *Phản hồi:* `204 No Content`.
5. **Cập nhật chế độ truy cập (Access Mode):**  
   `PUT /api/documents/{id}/access-mode`  
   *Request Body:* `{"accessMode": "PRIVATE"}`  
   *Quyền hạn:* Chỉ Owner hoặc ROLE_ADMIN.
6. **Lấy danh sách tài liệu được chia sẻ với tôi:**  
   `GET /api/documents/shared-with-me`  
   *Mô tả:* Trả về toàn bộ tài liệu mà người dùng hiện tại được cấp quyền thông qua ACL.
7. **Tải lên tài liệu kèm chế độ truy cập:**  
   `POST /api/documents` (Multipart FormData bổ sung trường `accessMode`: `"INTERNAL"` hoặc `"PRIVATE"`).

---

## F. List / Search Security

- **Lọc trực tiếp ở tầng Cơ sở dữ liệu (Database-level Security via JPA Specification):**  
  Tuyệt đối không sử dụng cơ chế "lấy tất cả về bộ nhớ rồi lọc ở Frontend".
- **Logic vị từ truy vấn (Predicate Specification):**
  - Nếu người dùng hiện tại là `ROLE_ADMIN`: Truy vấn toàn bộ tài liệu không ràng buộc ACL.
  - Nếu là người dùng thường (`ROLE_STAFF`):
    ```sql
    WHERE d.access_mode = 'INTERNAL' 
       OR d.created_by = :currentUsername 
       OR d.id IN (SELECT dp.document_id FROM document_permissions dp WHERE dp.user_id = :currentUserId)
    ```
- Khi người dùng tìm kiếm theo từ khóa (`?q=...`) hoặc phân loại (`?documentType=...`), điều kiện ACL luôn được kết hợp bằng phép toán logic `AND (aclPredicate)`, đảm bảo các tài liệu PRIVATE không bao giờ bị rò rỉ trong kết quả tìm kiếm của người không có quyền.

---

## G. Preview / Download Security

- Các endpoint `GET /api/documents/{id}/preview` và `GET /api/documents/{id}/download` được bảo vệ tập trung thông qua `DocumentAccessService.requireRead(document, user)`.
- Khi người dùng cố gắng tải xuống hoặc xem trước một tài liệu `PRIVATE` không thuộc quyền sở hữu và chưa được cấp quyền qua bảng ACL, hệ thống phản hồi ngay lập tức `403 Forbidden` kèm thông điệp kiểm soát truy cập chuẩn.

---

## H. Update Security

- Endpoint `PUT /api/documents/{id}` được bảo vệ qua `DocumentAccessService.requireEdit(document, user)`.
- Chỉ Owner, ROLE_ADMIN, hoặc người dùng được cấp quyền `EDIT` mới có thể sửa đổi tiêu đề, mô tả và phân loại tài liệu.
- Người dùng chỉ có quyền `READ` sẽ nhận lỗi `403 Forbidden`.
- Người dùng được chia sẻ quyền `EDIT` khi cố tình gửi yêu cầu sửa đổi `accessMode` sẽ bị từ chối; việc sửa đổi `accessMode` được quản lý độc lập tại endpoint `PUT /api/documents/{id}/access-mode`.

---

## I. Sharing Implementation

- Lớp trung gian dịch vụ `DocumentAccessService.java` tập trung hóa toàn bộ logic kiểm tra thẩm quyền:
  - `canRead(Document, User)`
  - `canEdit(Document, User)`
  - `canShare(Document, User)`
  - `canChangeAccessMode(Document, User)`
  - Các hàm tiện ích `requireRead`, `requireEdit`, `requireShare`, `requireChangeAccessMode` tự động ném ngoại lệ `AccessDeniedException` chuẩn của Spring Security (được chuyển hóa thành HTTP 403 Forbidden qua Global Exception Handler).
- **Validation chia sẻ:**
  - Kiểm tra tài liệu tồn tại (`404 Not Found`).
  - Kiểm tra người dùng được chia sẻ tồn tại (`404 Not Found`).
  - Kiểm tra không được tự chia sẻ cho chính mình (`400 Bad Request`).
  - Kiểm tra người thực hiện có quyền Owner hoặc ROLE_ADMIN (`403 Forbidden`).

---

## J. Frontend UI

1. **Hộp thoại quản lý quyền truy cập (`DocumentAccessModal.tsx`):**
   - Hiển thị và cho phép thay đổi chế độ truy cập giữa **Nội bộ (INTERNAL)** và **Riêng tư (PRIVATE)**.
   - Bảng danh sách người dùng được chia sẻ: Hiển thị tên đăng nhập, họ tên, quyền (`READ` / `EDIT`), thời điểm cấp quyền.
   - Thao tác: Cho phép chuyển đổi quyền trực tiếp giữa `READ` và `EDIT`, hoặc thu hồi quyền truy cập (Xóa).
   - Form thêm người dùng: Tìm chọn tài khoản người dùng từ danh sách hệ thống, chọn quyền và bấm "Thêm quyền".
2. **Nâng cấp giao diện Danh sách Tài liệu (`DocumentsPage.tsx`):**
   - Bổ sung tab bộ lọc: **Tất cả tài liệu** | **Tài liệu của tôi** | **Được chia sẻ với tôi**.
   - Bổ sung Huy hiệu (Badge) trực quan trạng thái tài liệu: Xanh lá (`Nội bộ`) và Vàng cam (`Riêng tư`).
   - Bổ sung nút bấm hành động **Chia sẻ (Share)** trong danh sách tài liệu, chỉ hiển thị đối với Owner của tài liệu hoặc người dùng có vai trò `ROLE_ADMIN`.
3. **Nâng cấp hộp thoại Tải lên tài liệu (`UploadModal.tsx`):**
   - Bổ sung bộ chọn chế độ truy cập (Radio buttons):
     - `○ Nội bộ` (Mặc định — Tất cả thành viên trong tổ chức đều có thể xem).
     - `○ Riêng tư` (Chỉ người tải lên, Quản trị viên và người được chia sẻ cụ thể).

---

## K. Audit Integration

Tích hợp hoàn hảo với `AuditService` đã xây dựng từ Sprint 4, bổ sung 4 mã hành động kiểm toán mới:
1. `DOCUMENT_ACCESS_MODE_CHANGE`: Ghi nhận khi tài liệu được chuyển đổi giữa INTERNAL và PRIVATE.
2. `DOCUMENT_SHARE`: Ghi nhận khi cấp mới quyền cho người dùng (READ / EDIT).
3. `DOCUMENT_PERMISSION_UPDATE`: Ghi nhận khi nâng cấp hoặc hạ cấp quyền người dùng.
4. `DOCUMENT_UNSHARE`: Ghi nhận khi thu hồi quyền truy cập của một người dùng.

**Bảo mật thông tin kiểm toán:**
- Không ghi log token JWT, mật khẩu hoặc chuỗi hash BCrypt.
- Định dạng mô tả chuẩn: `hieu shared Document #63 with tin as READ`, `hieu changed access mode of Document #63 to PRIVATE`.
- Không ảnh hưởng đến độ chính xác của các chỉ số thống kê `UsageStatistics` (vẫn tính toán chuẩn xác uploads, downloads, previews, updates).

---

## L. New Tests (TEST 58 – 79)

Bộ kiểm thử hồi quy được mở rộng thêm 22 bài test chuyên sâu cho Phase 5:

- **TEST 58:** Xác minh CSDL sau migration mặc định gán `accessMode = INTERNAL` cho toàn bộ tài liệu cũ.
- **TEST 59:** Xác minh tài khoản nhân viên (ROLE_STAFF) đọc thành công tài liệu INTERNAL của người khác.
- **TEST 60:** Xác minh Owner chuyển đổi chế độ truy cập tài liệu từ INTERNAL sang PRIVATE thành công.
- **TEST 61:** Xác minh STAFF không được chia sẻ bị từ chối xem chi tiết tài liệu PRIVATE (`403 Forbidden`).
- **TEST 62:** Xác minh STAFF không được chia sẻ bị từ chối xem trước (preview) tài liệu PRIVATE (`403 Forbidden`).
- **TEST 63:** Xác minh STAFF không được chia sẻ bị từ chối tải xuống (download) tài liệu PRIVATE (`403 Forbidden`).
- **TEST 64:** Xác minh Owner cấp quyền `READ` thành công cho người dùng STAFF khác.
- **TEST 65:** Xác minh người dùng được cấp quyền `READ` xem được metadata và cờ `userPermission = READ`.
- **TEST 66:** Xác minh người dùng được cấp quyền `READ` thực hiện thành công preview và download.
- **TEST 67:** Xác minh người dùng chỉ có quyền `READ` bị từ chối cập nhật metadata (`403 Forbidden`).
- **TEST 68:** Xác minh Owner nâng cấp quyền thành công từ `READ` lên `EDIT`.
- **TEST 69:** Xác minh người dùng có quyền `EDIT` cập nhật metadata tài liệu thành công.
- **TEST 70:** Xác minh người dùng được share `EDIT` không được phép đổi accessMode hoặc chia sẻ tiếp (`403 Forbidden`).
- **TEST 71:** Xác minh Owner thu hồi quyền (Revoke permission) thành công.
- **TEST 72:** Xác minh người dùng sau khi bị thu hồi quyền lập tức bị từ chối truy cập (`403 Forbidden`).
- **TEST 73:** Xác minh `ROLE_ADMIN` có toàn quyền truy cập tài liệu PRIVATE của nhân viên khác.
- **TEST 74:** Xác minh `ROLE_ADMIN` có toàn quyền quản lý ACL và đổi accessMode trên tài liệu của bất kỳ ai.
- **TEST 75:** Xác minh tìm kiếm (`q=...`) và danh sách lọc không rò rỉ tài liệu PRIVATE trái phép ở tầng CSDL.
- **TEST 76:** Xác minh tài liệu được chia sẻ xuất hiện chính xác trong endpoint `/api/documents/shared-with-me`.
- **TEST 77:** Xác minh STAFF không phải Owner bị chặn truy cập quản lý quyền (`403 Forbidden`).
- **TEST 78:** Xác minh từ chối chia sẻ cho user không tồn tại (`404`) hoặc tự chia sẻ cho chính mình (`400`).
- **TEST 79:** Xác minh nhật ký kiểm toán ghi nhận đầy đủ 4 sự kiện ACL mới không rò rỉ dữ liệu nhạy cảm.

---

## M. Full Regression

Toàn bộ 79/79 bài kiểm thử hồi quy tự động được chạy trong tệp `test_regression.py` và đạt kết quả tuyệt đối:
```
=================================================================
KẾT QUẢ: TẤT CẢ 79/79 BÀI TEST TỪ TEST 1 ĐẾN TEST 79 ĐÃ PASS 100%!
=================================================================
```

---

## N. Persistence

Kiểm thử khởi động lại nguội toàn bộ hệ thống (`docker compose restart`):
1. Cả 3 container phục hồi trạng thái hoạt động bình thường.
2. Dữ liệu tài liệu, tài khoản người dùng, cấu hình quyền phân chia ACL (`document_permissions`), và nhật ký kiểm toán (`audit_logs`) được duy trì nguyên vẹn trong volume PostgreSQL.
3. Ràng buộc bảo mật tài liệu `PRIVATE` tiếp tục thực thi nghiêm ngặt sau khi hệ thống khởi động lại (người không có quyền vẫn bị chặn 403 Forbidden, Owner truy cập bình thường).
4. Bộ kiểm thử hồi quy toàn diện 79/79 bài test chạy lại sau restart và tiếp tục PASS 100%.

---

## O. Backend Build

- **Trạng thái:** Biên dịch thành công với 55 file nguồn Java.
- **Công cụ:** Maven 3.9.9 / Eclipse Temurin JDK 17 bên trong Docker multi-stage build.
- **Cảnh báo/Lỗi:** 0 errors.

---

## P. Frontend Build

- **Trạng thái:** Biên dịch và đóng gói thành công.
- **Công cụ:** TypeScript (`tsc -b`) & Vite v5.4.14.
- **Kết quả bundle:**
  - `dist/index.html`: 0.90 kB
  - `dist/assets/index-*.css`: 21.05 kB
  - `dist/assets/index-*.js`: 319.46 kB
- **Cảnh báo/Lỗi:** 0 errors.

---

## Q. Docker Status

```
NAME            IMAGE                  COMMAND                  SERVICE    STATUS                    PORTS
edms-backend    doan_cnpmnc-backend    "java -jar app.jar"      backend    Up                        0.0.0.0:8080->8080/tcp
edms-frontend   doan_cnpmnc-frontend   "docker-entrypoint.s…"   frontend   Up                        0.0.0.0:5173->5173/tcp
edms-postgres   postgres:16-alpine     "docker-entrypoint.s…"   postgres   Up (healthy)              0.0.0.0:5432->5432/tcp
```

---

## R. Known Issues

- Không có lỗi tồn đọng (Zero blocking issues).
- Mọi giới hạn được giữ đúng phạm vi thiết kế (không over-engineer các tính năng không yêu cầu như OAuth/LDAP/SSO/cây phân cấp phòng ban phức tạp).

---

## S. Verdict

# **PHASE5_DOCUMENT_ACCESS_PASS**
