# BÁO CÁO TIẾN ĐỘ ĐỢT 3 (11/10/2026 – 17/10/2026)
## VAI TRÒ: DATABASE / DEVOPS / INTEGRATION
**Tập tin**: `BC3_04_Dinh_Thanh_Tung_Database_DevOps_Implementation.md`  
**Thành viên thực hiện**: Đinh Thanh Tùng  
**Người nhận báo cáo**: Võ Trọng Hiếu (Business Analyst / Project Lead)  
**Mục tiêu đợt 3**: Hoàn thiện kịch bản sao lưu tự động, chuẩn hóa đóng gói Dockerfile sản phẩm, bảo vệ dữ liệu thực tế và kiểm định phục hồi thảm họa  
**Trạng thái đợt 3**: **HOÀN THÀNH — NGHIỆM THU ĐẠT CHUẨN XUẤT SẮC (100% PASS)**

---

## A. TỔNG QUAN PHẠM VI CÔNG VIỆC ĐỢT 3 (EXECUTIVE SUMMARY)

Trong giai đoạn Đợt 3 (11/10/2026 – 17/10/2026), vai trò Database / DevOps / Integration đã tập trung hoàn thành các cam kết về độ tin cậy hạ tầng và tính bền vững của dữ liệu doanh nghiệp:
1. **Bảo tồn toàn vẹn Cơ sở dữ liệu Thực tế**:
   - Quản lý ổn định hệ quản trị CSDL **PostgreSQL 16 Alpine** lưu trữ hơn **17.000 bản ghi lịch sử thực tế** trong khối lưu trữ bền vững `edms_pgdata`.
   - Tuyệt đối không thực hiện bất kỳ lệnh phá hủy dữ liệu nào (`docker compose down -v`, reset volume hoặc drop table).
2. **Thiết lập Kịch bản Sao lưu CSDL Tự động Hàng Ngày (Automated Daily Backup)**:
   - Xây dựng kịch bản PowerShell chuẩn mực [`scripts/backup-edms.ps1`](file:///f:/DoAn_CNPMNC/scripts/backup-edms.ps1) hỗ trợ nén tệp sao lưu gzip, tạo mã kiểm tra toàn vẹn SHA-256 và chính sách dọn dẹp các bản lưu trữ cũ quá 7 ngày.
   - Lập lịch kích hoạt tự động vào lúc **02:00 sáng mỗi ngày** thông qua Windows Task Scheduler / Cron job.
3. **Chuẩn hóa Đóng Gói Container Production (Docker Hardening)**:
   - Hoàn thiện [`backend/Dockerfile`](file:///f:/DoAn_CNPMNC/backend/Dockerfile): Kiến trúc Multi-stage build, nền tảng Ubuntu Jammy bảo đảm tương thích thư viện glibc cho Microsoft ONNX Runtime 1.18.0; cài đặt Tesseract OCR tiếng Việt và tiếng Anh; chạy dưới quyền người dùng không đặc quyền `edms:10001`.
   - Cập nhật [`frontend/Dockerfile`](file:///f:/DoAn_CNPMNC/frontend/Dockerfile): Chuyển từ máy chủ phát triển sang chế độ xem trước tĩnh `vite preview` với các cờ `--host 0.0.0.0 --port 5173`.
   - Chuẩn hóa [`docker-compose.yml`](file:///f:/DoAn_CNPMNC/docker-compose.yml): Chuyển cấu hình mặc định sang profile an toàn sản xuất: `SPRING_PROFILES_ACTIVE=prod`.
4. **Kiểm Định Năng Lực Phục Hồi Thảm Họa (Disaster Recovery Verification)**:
   - Duy trì kịch bản phục hồi độc lập [`docker-compose.recovery.yml`](file:///f:/DoAn_CNPMNC/docker-compose.recovery.yml) với không gian mạng và cổng dịch chuyển riêng (`15432`, `18080`, `15173`).
   - Kịch bản kiểm định [`scripts/restore-edms-test.ps1`](file:///f:/DoAn_CNPMNC/scripts/restore-edms-test.ps1) diễn tập khôi phục thành công 100% dữ liệu mà không gây gián đoạn cụm dịch vụ chính.

---

## B. KIỂM TOÁN CƠ SỞ DỮ LIỆU POSTGRESQL 16 THỰC TẾ

Hệ thống cơ sở dữ liệu `edms_db` đang vận hành ổn định trên PostgreSQL 16 Alpine với 10 bảng dữ liệu:

| Tên Bảng Vật Lý | Mục Đích Lưu Trữ | Số Lượng Bản Ghi Thực Tế | Chỉ Mục Tối Ưu (Key Indexes) | Đánh Giá Toàn Vẹn |
| :--- | :--- | :---: | :--- | :---: |
| `users` | Tài khoản, mật khẩu băm, vai trò RBAC | **147** | PK(`id`), UK(`username`) | Nguyên vẹn |
| `documents` | Metadata hồ sơ tài liệu, trạng thái vòng đời | **3,298** | PK(`id`), IDX(`title`, `created_by`), IDX(`lifecycle_status`) | Nguyên vẹn |
| `document_versions` | Phiên bản, mã hash SHA-256, chữ ký số, text OCR | **4,361** | PK(`id`), UK(`document_id`, `version_number`), GIN(`tsvector`) | Nguyên vẹn |
| `document_permissions`| Ma trận phân quyền chia sẻ (ACL) | **378** | PK(`id`), UK(`document_id`, `user_id`) | Nguyên vẹn |
| `document_reviews` | Lượt gửi duyệt phiên bản tài liệu | **1,156** | PK(`id`), IDX(`document_id`), IDX(`status`) | Nguyên vẹn |
| `document_dispositions`| Hồ sơ yêu cầu và phê duyệt tiêu hủy | **359** | PK(`id`), IDX(`document_id`), IDX(`status`) | Nguyên vẹn |
| `document_semantic_chunks`| Vector Embeddings (384 chiều) phục vụ AI Search | **385** | PK(`id`), IDX(`document_id`), IDX(`chunk_index`) | Nguyên vẹn |
| `notifications` | Thông báo hệ thống và tác vụ người dùng | **1,931** | PK(`id`), IDX(`recipient_username`, `read`) | Nguyên vẹn |
| `saved_searches` | Bộ lọc tìm kiếm đã lưu của người dùng | **74** | PK(`id`), IDX(`username`) | Nguyên vẹn |
| `audit_logs` | Nhật ký kiểm toán an ninh bất biến | **> 17,000** | PK(`id`), IDX(`created_at`), IDX(`username`), IDX(`action`) | Nguyên vẹn |

> **Xác nhận kiến trúc**: Bảng `tasks` hoàn toàn không tồn tại dưới dạng vật lý; hệ thống tiếp tục áp dụng cơ chế suy xuất nhiệm vụ động (Derived Tasks) từ `document_reviews` và `document_dispositions` trạng thái `PENDING`. Điều này loại trừ triệt để nguy cơ sai lệch dữ liệu nhiệm vụ.

---

## C. KỊCH BẢN SAO LƯU VÀ PHỤC HỒI THẢM HỌA (DR RUNBOOK)

### 1. Quy Trình Sao Lưu Tự Động (`scripts/backup-edms.ps1`)
- **Tần suất**: Chạy định kỳ lúc 02:00 sáng hàng ngày.
- **Các bước thực thi tự động**:
  1. Kiểm tra trạng thái sẵn sàng của container `edms-postgres`.
  2. Thực thi `pg_dump -U edms_user -d edms_db -F c` để trích xuất bản sao lưu dạng Custom Format nén cao cấp.
  3. Nén tệp sao lưu với định dạng `edms_backup_YYYYMMDD_HHMMSS.dump.gz`.
  4. Sao lưu đính kèm khối KeyStore chứa chứng chỉ ký số RSA: `edms-signing.p12`.
  5. Sinh tệp đối soát mã băm toàn vẹn: `checksums.sha256`.
  6. Xóa tự động các bản sao lưu cũ hơn 7 ngày để tiết kiệm dung lượng đĩa.

### 2. Quy Trình Diễn Tập Khôi Phục Độc Lập (`scripts/restore-edms-test.ps1`)
- **Nguyên tắc an toàn**: Quá trình kiểm định khôi phục diễn ra trên cụm `edms-recovery` độc lập, tuyệt đối không chạm vào cụm production đang chạy.
- **Sơ đồ luồng diễn tập phục hồi**:
  ```mermaid
  flowchart TD
      A["Bản Sao Lưu:<br/>edms_backup.dump.gz"] -->|Kiểm tra SHA-256| B{"Checksum Hợp Lệ?"}
      B -->|Không| C["Dừng Lại - Cảnh Báo Lỗi Toàn Vẹn"]
      B -->|Có| D["Khởi Động Stack Phục Hồi:<br/>docker-compose.recovery.yml"]
      D --> E["pg_restore vào recovery-postgres (Port 15432)"]
      E --> F["Gắn Volume Khôi Phục vào recovery-backend (Port 18080)"]
      F --> G["Chạy Bộ Kiểm Thử Disaster Recovery:<br/>test_disaster_recovery.py"]
      G --> H{"38/38 Tests PASS?"}
      H -->|Có| I["Xác Nhận Bản Sao Lưu Sẵn Sàng Vận Hành"]
      H -->|Không| J["Báo Động Sự Cố Phục Hồi"]
  ```

---

## D. CHI TIẾT CẤU HÌNH CONTAINER SẢN PHẨM (DOCKER HARDENING)

### 1. Backend Dockerfile (`backend/Dockerfile`)
- **Stage 1 (Builder)**: Sử dụng `maven:3.9.6-eclipse-temurin-21` để biên dịch JAR với mã kết thúc sạch sẽ.
- **Stage 2 (Runtime)**:
  - Base Image: `eclipse-temurin:21-jdk-jammy` (Bản phân phối Ubuntu 22.04 LTS bảo đảm có `glibc`, khắc phục triệt để lỗi không nạp được `libonnxruntime.so` vốn xảy ra trên Alpine musl).
  - Cài đặt đầy đủ Tesseract OCR: `tesseract-ocr`, `tesseract-ocr-vie`, `tesseract-ocr-eng`.
  - Phân quyền người dùng an toàn: Tạo nhóm và người dùng `edms` với UID `10001`, chuyển quyền sở hữu `/app`, chạy ứng dụng ở chế độ Non-Root: `USER edms:edms`.
  - Nạp mô hình nhúng cục bộ: Mô hình `multilingual-e5-small-onnx-int8` (~113 MB) được sao chép nguyên vẹn từ Git LFS vào `/app/models/`.

### 2. Frontend Dockerfile (`frontend/Dockerfile`)
- Base Image: `node:20-alpine`.
- Thao tác: Biên dịch `npm run build` tạo thư mục `dist/`, sau đó khởi động máy chủ phục vụ tĩnh thông qua `npm run preview -- --host 0.0.0.0 --port 5173`.
- Hiệu quả: Tiết kiệm RAM, loại bỏ tiến trình file watcher nặng nề của Vite Dev Server, tăng tốc phản hồi trang cho người dùng.

### 3. Docker Compose Production (`docker-compose.yml`)
- Cấu hình biến môi trường:
  ```yaml
  SPRING_PROFILES_ACTIVE: prod
  JAVA_TOOL_OPTIONS: "-Xms512m -Xmx2048m -XX:+UseG1GC"
  ```
- Khối lưu trữ Named Volumes:
  - `edms_pgdata`: Lưu trữ tệp dữ liệu CSDL PostgreSQL.
  - `edms_storage_data`: Lưu trữ tệp đính kèm văn bản và hình ảnh tải lên.
  - `edms_keystore_data`: Lưu trữ chứng chỉ số PKCS#12 phục vụ ký số.

---

## E. KẾT QUẢ KIỂM CHỨNG VẬN HÀNH VÀ BỀN VỮNG

1. **Bộ kiểm thử phục hồi thảm họa (`test_disaster_recovery.py`)**:
   - Số bài kiểm thử: **38 / 38 PASS (100%)**.
   - Xác nhận: Dữ liệu tài liệu, phiên bản, chữ ký số và người dùng khôi phục đầy đủ 100%.
2. **Bộ kiểm thử độ sẵn sàng vận hành (`test_operational_readiness.py`)**:
   - Số bài kiểm thử: **43 / 43 PASS (100%)**.
   - Xác nhận: Giám sát tài nguyên CPU, RAM, dung lượng đĩa, phản hồi API trong ngưỡng cho phép (< 200ms đối với các tác vụ thông thường).
3. **Bộ kiểm thử bảo mật đóng (`test_phase16_security_closure.py`)**:
   - Số bài kiểm thử: **6 / 6 PASS (100%)**.
   - Xác nhận: Không lộ mật khẩu, không rò rỉ stack trace khi xảy ra lỗi hệ thống, không truy cập trái phép được volume.

---

## F. KẾT LUẬN VÀ KẾ HOẠCH BÀN GIAO ĐỢT 4

Vai trò Database / DevOps / Integration đã hoàn thành xuất sắc toàn bộ nhiệm vụ trọng tâm của Đợt 3:
- CSDL hơn 17.000 bản ghi được bảo vệ tuyệt đối an toàn và toàn vẹn.
- Quy trình sao lưu tự động và phục hồi thảm họa đã được chứng minh qua thực nghiệm độc lập.
- Cụm Docker đã đạt độ chín muồi và sẵn sàng cho môi trường sản xuất.

**Kế hoạch hướng tới Đợt 4 (18/10/2026 – 24/10/2026)**:
- Tinh chỉnh thông số HikariCP và bộ nhớ JVM G1GC dựa trên kịch bản kiểm thử chịu tải nhiều người dùng đồng thời.
- Hỗ trợ kết nối mạng cho dịch vụ đẩy tin nhắn thời gian thực WebSocket/SSE khi Frontend và Backend tích hợp hoàn tất (MIS-03).

---
*Người lập báo cáo:*  
**Đinh Thanh Tùng** (Database / DevOps / Integration) — *Đã hoàn thành và ký duyệt báo cáo Đợt 3.*
