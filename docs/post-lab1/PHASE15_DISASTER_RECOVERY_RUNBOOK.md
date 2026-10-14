# EDMS PHASE 15 — DISASTER RECOVERY & BACKUP/RESTORE RUNBOOK
**Hệ Thống Quản Trị Tài Liệu Doanh Nghiệp (EDMS)**  
*Mã tài liệu: EDMS-SOP-DR-PHASE15 | Phiên bản: 1.0.0 | Ngày ban hành: 27/09/2026*

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC CỐT LÕI (OBJECTIVES & CORE PRINCIPLES)

Tài liệu này (Runbook) hướng dẫn chi tiết quy trình chuẩn vận hành (Standard Operating Procedure - SOP) cho việc **sao lưu (Backup)**, **phục hồi (Restore)** và **khắc phục sự cố sau thảm họa (Disaster Recovery - DR)** của hệ thống EDMS.

### 1.1. Phạm vi trạng thái bền vững cần bảo toàn (Persistent Scope)
Hệ thống EDMS chứa 3 vùng dữ liệu thiết yếu phải được phục hồi đồng bộ và nhất quán ứng dụng (Application-Consistent):
1. **Cơ sở dữ liệu quan hệ PostgreSQL (`edms_db`)**:
   - Tài khoản người dùng (`users`), vai trò (`roles`).
   - Tài liệu (`documents`), các phiên bản tệp (`document_versions`), quyền hạn phân quyền (`document_permissions`).
   - Lịch sử phê duyệt (`document_reviews`), vòng đời lưu trữ (`document_dispositions`, `retention_policy`).
   - Lịch sử tìm kiếm lưu trữ (`saved_searches`), nhật ký kiểm toán bất biến (`audit_logs`), thông báo (`notifications`).
2. **Kho lưu trữ tệp vật lý nhị phân (`storage volume`)**:
   - Toàn bộ các tệp vật lý được lưu trữ tại `/app/storage/uploads/` tương ứng với mã băm SHA-256 đã đăng ký.
3. **Kho khóa ký số điện tử PKCS#12 (`keystore volume`)**:
   - Tệp chứng chỉ số và cặp khóa riêng tư `edms-signing.p12` dùng để xác thực chữ ký số RSA-2048 trên các văn bản pháp lý.

### 1.2. Nguyên tắc an toàn tối thượng (Golden Safety Rule)
> [!CAUTION]
> **TUYỆT ĐỐI KHÔNG KIỂM THỬ KHẮC PHỤC SỰ CỐ BẰNG CÁCH PHÁ HỦY MÔI TRƯỜNG CHÍNH (PRIMARY ENVIRONMENT).**
> - Không bao giờ thực hiện `docker compose down -v` trên stack chính.
> - Mọi thao tác khôi phục thử nghiệm phải được tiến hành trên **MÔI TRƯỜNG PHỤC HỒI BIỆT LẬP (ISOLATED RECOVERY ENVIRONMENT)** với cổng mạng, tên container và volumes hoàn toàn tách biệt.

---

## 2. BẢNG PHÂN BIỆT MÔI TRƯỜNG CHÍNH VÀ MÔI TRƯỜNG PHỤC HỒI

| Thành phần | Môi trường Chính (PRIMARY) | Môi trường Phục hồi Biệt lập (RECOVERY) |
|---|---|---|
| **Compose File** | `docker-compose.yml` | `docker-compose.recovery.yml` |
| **Project Name** | `doan_cnpmnc` | `edms-recovery` |
| **PostgreSQL Port** | `5432` | `15432` |
| **Backend REST Port**| `8080` | `18080` |
| **Frontend Web Port** | `5173` | `15173` |
| **Database Container**| `edms-postgres` | `edms-recovery-postgres` |
| **Backend Container** | `edms-backend` | `edms-recovery-backend` |
| **Frontend Container**| `edms-frontend` | `edms-recovery-frontend` |
| **PG Data Volume** | `doan_cnpmnc_postgres_data` | `edms_recovery_pgdata` |
| **Storage Volume** | `doan_cnpmnc_storage_data` | `edms_recovery_storage` |
| **KeyStore Volume** | `doan_cnpmnc_keystore_data` | `edms_recovery_keystore` |
| **Network** | `edms-network` | `edms-recovery-network` |

---

## 3. ĐIỀU KIỆN TIÊN QUYẾT (PREREQUISITES)

Trước khi thực hiện sao lưu hoặc phục hồi:
1. Docker Engine / Docker Desktop đang hoạt động bình thường (`docker info`).
2. PowerShell 5.1+ hoặc PowerShell 7+ trên hệ điều hành Windows.
3. Không gian ổ đĩa trống tối thiểu: 5GB cho thư mục lưu trữ `backups/`.
4. Môi trường chính đang ở trạng thái khỏe mạnh:
   ```powershell
   # Kiểm tra healthcheck của backend chính
   curl http://localhost:8080/api/health
   # Kiểm tra trạng thái postgres chính
   docker inspect edms-postgres --format "{{.State.Health.Status}}"
   ```

---

## 4. QUY TRÌNH TẠO BẢN SAO LƯU (BACKUP PROCEDURE - PRIMARY)

### 4.1. Lệnh thực thi tự động
Hệ thống cung cấp kịch bản PowerShell tự động hóa toàn bộ 6 bước sao lưu:
```powershell
# Chạy sao lưu từ thư mục gốc của repository
powershell -ExecutionPolicy Bypass -File .\scripts\backup-edms.ps1
```

### 4.2. Các bước chi tiết thực hiện bên trong kịch bản
1. **Tiền kiểm tra (Pre-flight Validation)**:
   - Kiểm tra `docker info`.
   - Kiểm tra container `edms-postgres` trạng thái `healthy`.
   - Kiểm tra `edms-backend` phản hồi HTTP 200 tại `/api/health`.
   - Xác thực sự hiện diện của `/app/keys/edms-signing.p12` và `/app/storage/uploads`.
2. **Khởi tạo thư mục bản sao lưu**:
   - Định dạng thư mục: `backups/edms_backup_YYYYMMDD_HHmmss`.
3. **Ghi nhận trạng thái trước sao lưu (Pre-backup Metadata Snapshot)**:
   - Truy vấn số lượng bản ghi của 9 bảng dữ liệu chính (`users`, `documents`, `document_versions`, `document_permissions`, `document_reviews`, `document_dispositions`, `saved_searches`, `audit_logs`, `notifications`).
   - Lấy thông tin chứng chỉ số ký (`serialNumber`, `subject`, `issuer`, `validUntil`).
4. **Trích xuất các thành phần bản sao lưu**:
   ```powershell
   # A. Trích xuất CSDL bằng pg_dump dạng custom (-Fc)
   docker exec edms-postgres pg_dump -U edms_user -d edms_db -Fc -f /tmp/edms_db.dump
   docker cp edms-postgres:/tmp/edms_db.dump .\backups\<BACKUP_ID>\database.dump
   docker exec edms-postgres rm -f /tmp/edms_db.dump

   # B. Đóng gói kho lưu trữ tệp vật lý dạng nén tar.gz
   docker exec edms-backend sh -c "tar -czf /tmp/storage.tar.gz -C /app/storage/uploads ."
   docker cp edms-backend:/tmp/storage.tar.gz .\backups\<BACKUP_ID>\storage.tar.gz
   docker exec edms-backend rm -f /tmp/storage.tar.gz

   # C. Sao chép an toàn kho khóa ký số PKCS#12
   docker cp edms-backend:/app/keys/edms-signing.p12 .\backups\<BACKUP_ID>\edms-signing.p12
   ```
5. **Tính toán mã băm SHA-256 & Sinh Manifest**:
   - Tính mã băm SHA-256 cho từng tệp (`database.dump`, `storage.tar.gz`, `edms-signing.p12`).
   - Xuất tệp kiểm tra `checksums.sha256`.
   - Xuất tệp manifest cấu trúc `backup-manifest.json` ghi nhận metadata phi bí mật.
6. **Hậu kiểm tra tính toàn vẹn (Self-Verification)**:
   - Đối chiếu lại mã băm trên đĩa với thông số trong manifest, đảm bảo kích thước tệp > 0.

### 4.3. Cấu trúc thư mục bản sao lưu mẫu
```text
backups/edms_backup_20260926_182344/
├── backup-manifest.json     # Metadata sao lưu, số dòng CSDL, thông tin định danh chứng thư
├── checksums.sha256         # Mã băm SHA-256 chuẩn cho 3 tệp dữ liệu
├── database.dump            # Bản dump nhị phân PostgreSQL (pg_dump -Fc) (~1.5 MB)
├── edms-signing.p12         # Kho khóa ký điện tử PKCS#12 mã hóa (~2.6 KB)
└── storage.tar.gz           # Toàn bộ tệp đính kèm vật lý nén tar.gz (~1.9 MB, 3,627 tệp)
```

---

## 5. QUY TRÌNH KIỂM TRA MÃ BĂM TÍNH TOÀN VẸN (CHECKSUM VERIFICATION)

Trước khi tiến hành phục hồi, bắt buộc phải thẩm định mã băm để phát hiện sớm hiện tượng hỏng hóc tệp hoặc can thiệp trái phép:

```powershell
# Di chuyển vào thư mục bản sao lưu cần kiểm tra
cd backups\edms_backup_20260926_182344

# Kiểm tra SHA-256 bằng PowerShell
$manifest = Get-Content backup-manifest.json | ConvertFrom-Json
$dbHash = (Get-FileHash -Path database.dump -Algorithm SHA256).Hash.ToLower()
$storageHash = (Get-FileHash -Path storage.tar.gz -Algorithm SHA256).Hash.ToLower()
$keystoreHash = (Get-FileHash -Path edms-signing.p12 -Algorithm SHA256).Hash.ToLower()

if ($dbHash -eq $manifest.database.sha256 -and `
    $storageHash -eq $manifest.storage.sha256 -and `
    $keystoreHash -eq $manifest.keystore.sha256) {
    Write-Host "CHECKSUM VERIFIED: PASS" -ForegroundColor Green
} else {
    Write-Error "CHECKSUM FAILED: Backup files have been tampered or corrupted!"
}
```

---

## 6. QUY TRÌNH PHỤC HỒI BIỆT LẬP (ISOLATED RESTORE PROCEDURE - RECOVERY)

### 6.1. Lệnh thực thi tự động
Khôi phục trực tiếp bản sao lưu vào môi trường biệt lập (Port 18080 / 15432):
```powershell
# Chạy kịch bản phục hồi chỉ định thư mục sao lưu
powershell -ExecutionPolicy Bypass -File .\scripts\restore-edms-test.ps1 -BackupDir .\backups\edms_backup_20260926_182344 -KeepRunning
```

### 6.2. Các bước phục hồi thủ công (Manual Step-by-Step Reference)

#### Bước 1: Dọn sạch môi trường phục hồi cũ (KHÔNG CHẠM VÀO PRIMARY)
```powershell
# Dừng và xóa containers phục hồi
docker rm -f edms-recovery-postgres edms-recovery-backend edms-recovery-frontend 2>$null

# Xóa volumes phục hồi cũ để đảm bảo CSDL bắt đầu từ trạng thái rỗng
docker volume rm -f edms_recovery_pgdata edms_recovery_storage edms_recovery_keystore 2>$null

# Khởi tạo volumes mới hoàn toàn
docker volume create edms_recovery_pgdata
docker volume create edms_recovery_storage
docker volume create edms_recovery_keystore
```

#### Bước 2: Khởi động CSDL phục hồi trống
```powershell
# Khởi động dịch vụ postgres phục hồi
docker compose -f docker-compose.recovery.yml up -d recovery-postgres

# Chờ postgres phục hồi sẵn sàng (khoảng 5-10 giây)
docker exec edms-recovery-postgres pg_isready -U edms_user -d edms_db
```

#### Bước 3: Phục hồi CSDL bằng `pg_restore`
```powershell
# Sao chép tệp dump vào container phục hồi
docker cp .\backups\<BACKUP_ID>\database.dump edms-recovery-postgres:/tmp/restore.dump

# Chạy pg_restore tái tạo schema, dữ liệu, sequence và index
docker exec edms-recovery-postgres pg_restore -U edms_user -d edms_db --clean --if-exists --no-owner --no-privileges /tmp/restore.dump

# Dọn dẹp tệp tạm trong container
docker exec edms-recovery-postgres rm -f /tmp/restore.dump
```

#### Bước 4: Phục hồi Kho lưu trữ Tệp vật lý
```powershell
# Khởi động một container tạm gắn volume edms_recovery_storage để giải nén
docker run --rm -v edms_recovery_storage:/target -v ${PWD}\backups\<BACKUP_ID>:/source alpine sh -c "tar -xzf /source/storage.tar.gz -C /target"
```

#### Bước 5: Phục hồi KeyStore Ký điện tử PKCS#12
```powershell
# Sao chép tệp edms-signing.p12 vào volume edms_recovery_keystore
docker run --rm -v edms_recovery_keystore:/target -v ${PWD}\backups\<BACKUP_ID>:/source alpine sh -c "cp /source/edms-signing.p12 /target/edms-signing.p12 && chmod 600 /target/edms-signing.p12"
```

#### Bước 6: Khởi động Backend Phục hồi
```powershell
# Khởi động toàn bộ stack phục hồi
docker compose -f docker-compose.recovery.yml up -d recovery-backend recovery-frontend

# Chờ backend phục hồi sẵn sàng trên cổng 18080
curl http://localhost:18080/api/health
```

---

## 7. DANH MỤC ĐỐI SOÁT & KIỂM TRA SAU PHỤC HỒI (VALIDATION CHECKLIST)

Sau khi phục hồi, kỹ sư vận hành phải kiểm tra theo bảng tiêu chí sau trên cổng `18080`:

| STT | Hạng mục kiểm tra | Lệnh / Endpoint xác minh | Kết quả mong đợi |
|---|---|---|---|
| 1 | **Trạng thái Health** | `GET http://localhost:18080/api/health` | `status: "UP"`, `semanticModel: "AVAILABLE"` |
| 2 | **Số lượng người dùng** | SQL: `SELECT count(*) FROM users;` | Trùng khớp chính xác với snapshot (131) |
| 3 | **Số lượng tài liệu** | SQL: `SELECT count(*) FROM documents;` | Trùng khớp chính xác với snapshot (2,723) |
| 4 | **Số lượng phiên bản** | SQL: `SELECT count(*) FROM document_versions;` | Trùng khớp chính xác với snapshot (3,620) |
| 5 | **Phân quyền tài liệu** | SQL: `SELECT count(*) FROM document_permissions;` | Trùng khớp chính xác với snapshot (322) |
| 6 | **Quy trình phê duyệt** | SQL: `SELECT count(*) FROM document_reviews;` | Trùng khớp chính xác với snapshot (951) |
| 7 | **Quy trình tiêu hủy** | SQL: `SELECT count(*) FROM document_dispositions;` | Trùng khớp chính xác với snapshot (289) |
| 8 | **Thông báo** | SQL: `SELECT count(*) FROM notifications;` | Trùng khớp chính xác với snapshot (1,185) |
| 9 | **Toàn vẹn tệp vật lý** | So sánh SHA-256 tệp ngẫu nhiên trong storage | Byte-identical (trùng khớp 100% SHA-256) |
| 10 | **Chữ ký số đã ký** | `GET http://localhost:18080/api/documents/1958/versions/1/integrity` | `integrityStatus: "INTACT"`, `signatureStatus: "VALID"` |
| 11 | **Định danh chứng chỉ**| `GET http://localhost:18080/api/admin/signature/certificate` | `serialNumber: "1790137027180"` |
| 12 | **Tìm kiếm nội dung** | `GET http://localhost:18080/api/documents/search?mode=CONTENT&keyword=...` | Hoạt động tức thì không cần bóc tách lại |
| 13 | **Tìm kiếm OCR** | Tra cứu từ khóa OCR đã bóc tách từ ảnh trước sao lưu | Trả về kết quả tức thì không cần chạy lại Tesseract |
| 14 | **Trung tâm tác vụ** | `GET http://localhost:18080/api/tasks` | Tự động tổng hợp đúng ~260 tác vụ chờ xử lý |
| 15 | **Bảo mật bí mật** | Quét JSON phản hồi tại mọi endpoint | Không chứa `privateKey`, `password`, `secret` |

---

## 8. TẦM QUAN TRỌNG CỦA KEYSTORE & BẢO ĐẢM KHÔNG RÒ RỈ KHÓA (KEYSTORE IMPORTANCE)

### 8.1. Tại sao KeyStore là thành phần sống còn?
Chữ ký số RSA-2048 trên các phiên bản tài liệu EDMS được tạo ra bằng khóa riêng tư (`privateKey`) lưu trong tệp `edms-signing.p12`.
- Nếu khôi phục cơ sở dữ liệu và tệp vật lý nhưng **thiếu hoặc sai KeyStore**, hoặc tạo một cặp khóa mới:
  - Khóa công khai (`publicKey`) trong chứng thư mới sẽ không khớp với chữ ký số đã lưu trong CSDL.
  - Toàn bộ các văn bản pháp lý đã ký trước đây sẽ lập tức báo lỗi **`signatureStatus: INVALID`**.
- Do đó, tệp `edms-signing.p12` bắt buộc phải được sao lưu và phục hồi đồng bộ.

### 8.2. Bảo mật tuyệt đối tệp bản sao lưu KeyStore
- Tệp `edms-signing.p12` là tệp nhị phân được mã hóa chuẩn PKCS#12 bằng thuật toán mạnh.
- Tệp `backup-manifest.json` chỉ ghi nhận các trường công khai (`serialNumber`, `subject`, `issuer`, `validUntil`, `sha256`) và **tuyệt đối không chứa mật khẩu hay khóa riêng tư**.
- Không bao giờ đưa tệp `.p12` lên kho mã nguồn công khai (Git). Thư mục `backups/` đã được cấu hình trong `.gitignore`.

---

## 9. XỬ LÝ SỰ CỐ VÀ KHẮC PHỤC LỖI THƯỜNG GẶP (FAILURE HANDLING)

| Hiện tượng | Nguyên nhân có thể | Cách xử lý |
|---|---|---|
| **Lỗi `Pre-flight FAILED: Docker daemon is not accessible`** | Docker Desktop chưa được khởi động hoặc bị treo pipe. | Mở Docker Desktop từ Start Menu hoặc chạy lệnh: `Start-Process "C:\Users\...\Docker Desktop.exe"`. Đợi đến khi `docker info` trả về mã 0. |
| **Lỗi `Checksum mismatch on newly created backup`** | Ổ cứng có lỗi đọc ghi hoặc có tiến trình khác can thiệp vào thư mục `backups/`. | Kiểm tra phần mềm diệt virus; chạy lại lệnh sao lưu `backup-edms.ps1`. |
| **Lỗi `pg_restore: error: could not connect to database`** | Container `edms-recovery-postgres` chưa sẵn sàng chấp nhận kết nối. | Kiểm tra bằng lệnh `docker logs edms-recovery-postgres`. Đảm bảo cờ `-h localhost -p 15432` hoặc lệnh `docker exec` sử dụng đúng tài khoản `edms_user`. |
| **Chữ ký số báo `INVALID` sau khi phục hồi** | Khôi phục sai KeyStore hoặc KeyStore bị ghi đè bởi chứng chỉ tự sinh mới. | Kiểm tra `serialNumber` tại `GET /api/admin/signature/certificate`. Khôi phục lại đúng tệp `edms-signing.p12` từ bản sao lưu và khởi động lại container backend phục hồi. |
| **Lỗi xung đột cổng `18080` hoặc `15432`** | Đang có một phiên phục hồi trước đó chạy nền hoặc tiến trình khác chiếm dụng cổng. | Chạy lệnh `docker rm -f edms-recovery-postgres edms-recovery-backend` hoặc kiểm tra `netstat -ano \| findstr 18080`. |

---

## 10. DỌN DẸP MÔI TRƯỜNG THỬ NGHIỆM PHỤC HỒI (CLEANUP RECOVERY ENVIRONMENT)

Sau khi hoàn tất công tác kiểm định phục hồi hoặc diễn tập khắc phục thảm họa, thực hiện dọn dẹp để giải phóng tài nguyên CPU/RAM và dung lượng ổ đĩa:

```powershell
# 1. Dừng và xóa containers phục hồi (TUYỆT ĐỐI KHÔNG CHẠM VÀO edms-backend, edms-postgres)
docker rm -f edms-recovery-backend edms-recovery-postgres edms-recovery-frontend

# 2. Xóa các volumes phục hồi biệt lập
docker volume rm -f edms_recovery_pgdata edms_recovery_storage edms_recovery_keystore

# 3. Xóa mạng phục hồi
docker network rm edms-recovery-network 2>$null

# 4. Xác nhận môi trường chính vẫn hoạt động 100% nguyên vẹn
docker ps
curl http://localhost:8080/api/health
```

---
*Tài liệu được phê chuẩn bởi Bộ phận Kỹ thuật EDMS — Đảm bảo tính nhất quán và khả năng phục hồi dữ liệu 100% sau sự cố.*
