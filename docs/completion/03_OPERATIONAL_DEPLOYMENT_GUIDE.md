# 03 — HƯỚNG DẪN VẬN HÀNH VÀ TRIỂN KHAI DOANH NGHIỆP (OPERATIONAL DEPLOYMENT GUIDE)

**Hệ thống**: Electronic Document Management System (EDMS)  
**Tài liệu**: Hướng dẫn Triển khai & Vận hành Chuẩn Môi trường Sản phẩm (Production Deployment Guide)  
**Phiên bản**: 1.0 — Commercial Ready  
**Thời điểm ban hành**: 15/10/2026  
**Nhánh tham chiếu**: `completion/edms-hardening`

---

## 1. YÊU CẦU HẠ TẦNG VÀ MÔI TRƯỜNG TIỀN ĐỀ

Hệ thống EDMS được đóng gói hoàn toàn dưới dạng Containerized Microservices, yêu cầu môi trường máy chủ đáp ứng tối thiểu:

### 1.1 Yêu cầu Phần cứng (Hardware Requirements)
- **CPU**: Tối thiểu 4 Cores (khuyến nghị 8 Cores để tối ưu tốc độ Onnx Runtime Embedding và OCR).
- **RAM**: Tối thiểu 8 GB RAM khả dụng (JVM heap: `-Xms512m -Xmx2048m`, PostgreSQL: 1 GB, AI model ONNX: ~500 MB).
- **Ổ cứng**: Tối thiểu 50 GB SSD (NVMe khuyến nghị cho phân vùng lưu trữ tệp vật lý và cơ sở dữ liệu).

### 1.2 Yêu cầu Phần mềm (Software Requirements)
- **Hệ điều hành**: Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) hoặc Windows Server có WSL2 / Docker Desktop.
- **Docker Engine**: Phiên bản 24.0 trở lên.
- **Docker Compose**: Phiên bản 2.20 trở lên.
- **Git LFS**: Đã cài đặt để đảm bảo tệp mô hình AI ONNX (`backend/models/multilingual-e5-small-onnx-int8/model.onnx`, ~113 MB) không bị mất mát khi clone kho mã nguồn.

---

## 2. BIẾN MÔI TRƯỜNG & BẢO MẬT CHỨNG CHỈ SỐ

Hệ thống cung cấp tệp mẫu cấu hình [`.env.example`](file:///f:/DoAn_CNPMNC/.env.example). Khi triển khai thực tế trên môi trường sản phẩm (Production), quản trị viên hệ thống bắt buộc tạo tệp `.env` với các giá trị bí mật độc lập:

```ini
# ==============================================================================
# EDMS PRODUCTION ENVIRONMENT CONFIGURATION
# ==============================================================================

# 1. Cơ sở dữ liệu PostgreSQL
POSTGRES_DB=edms_db
POSTGRES_USER=edms_admin
POSTGRES_PASSWORD=<MẬT_KHẨU_PHỨC_TẠP_POSTGRESQL>

# 2. Xác thực JWT (Bắt buộc tối thiểu 256-bit / 32 ký tự ngẫu nhiên)
EDMS_JWT_SECRET=<CHUỖI_BÍ_MẬT_JWT_NGẪU_NHIÊN_KHÔNG_DÙNG_MẪU_TEST>
EDMS_JWT_EXPIRATION_MS=86400000

# 3. Chứng thư số & Chữ ký điện tử PKCS#12
EDMS_KEYSTORE_PASSWORD=<MẬT_KHẨU_BẢO_VỆ_KEYSTORE_SAN_PHAM>
EDMS_KEYSTORE_LEGACY_PASSWORD=

# 4. Profile vận hành hệ thống (Bắt buộc: prod)
SPRING_PROFILES_ACTIVE=prod
```

> [!IMPORTANT]
> - Trong profile `prod`, thành phần [JwtTokenProvider.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/security/JwtTokenProvider.java) sẽ tự động kiểm tra và **từ chối khởi động** nếu phát hiện khóa bí mật vẫn là chuỗi placeholder thử nghiệm.
> - Thành phần [DataInitializer.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/config/DataInitializer.java) sẽ **tự động vô hiệu hóa** việc chèn tài khoản seed mặc định (`hieu` / `tin`) với mật khẩu thử nghiệm `password123`.

---

## 3. QUY TRÌNH KHỞI CHẠY HỆ THỐNG QUA DOCKER COMPOSE

### Bước 1: Đồng bộ mã nguồn và mô hình AI LFS
```bash
git clone https://github.com/hieuvo123ab-rgb/DoAn_CNPMNC.git
cd DoAn_CNPMNC
git checkout completion/edms-hardening
git lfs pull
```

### Bước 2: Khởi tạo tệp môi trường bảo mật
```bash
cp .env.example .env
# Chỉnh sửa các mật mã bí mật trong .env bằng nano hoặc vim
```

### Bước 3: Biên dịch và khởi chạy toàn bộ dịch vụ
```bash
docker compose up -d --build
```

### Bước 4: Kiểm tra trạng thái sức khỏe container
```bash
docker compose ps
```
Kết quả mong đợi:
- `edms-postgres`: Cổng `5432:5432` — `Up (healthy)`
- `edms-backend`: Cổng `8080:8080` — `Up (healthy)`
- `edms-frontend`: Cổng `5173:5173` — `Up` (Chạy ở chế độ static preview tối ưu)

---

## 4. QUẢN TRỊ DỮ LIỆU & BẢO LƯU TÍNH TOÀN VẸN

### 4.1 Cơ chế lưu trữ dữ liệu bền vững (Persistence Volumes)
Dữ liệu của hệ thống được cô lập an toàn trong 3 Docker Named Volumes:
1. `edms_pgdata`: Lưu trữ toàn bộ bảng CSDL PostgreSQL, người dùng, metadata tài liệu, nhật ký kiểm toán (Audit Logs) và vector chunks.
2. `edms_storage_data`: Lưu trữ tệp nhị phân gốc của tài liệu tải lên (`/app/storage/uploads`).
3. `edms_keystore_data`: Lưu trữ tệp KeyStore bảo mật chữ ký điện tử (`/app/keys`).

> [!CAUTION]
> Tuyệt đối không sử dụng cờ `docker compose down -v` vì sẽ xóa sạch các Docker Volumes chứa dữ liệu hoạt động thực tế.

### 4.2 Quy trình Sao lưu & Khôi phục (Disaster Recovery)
Hệ thống cung cấp sẵn các kịch bản kiểm thử và vận hành khôi phục thảm họa độc lập:
- Sao lưu CSDL:
  ```bash
  docker compose exec -t edms-postgres pg_dump -U edms_admin edms_db > backups/edms_backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- Khởi chạy môi trường kiểm định khôi phục:
  ```bash
  docker compose -f docker-compose.recovery.yml up -d
  ```

---

## 5. CỔNG TRUY CẬP VÀ GIÁM SÁT THỜI GIAN THỰC

Sau khi khởi chạy thành công, quản trị viên và người dùng có thể truy cập các địa chỉ:

| Giao diện / Dịch vụ | Địa chỉ truy cập | Đối tượng sử dụng | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **Cổng Đăng Nhập** | `http://localhost:5173` | Toàn bộ người dùng | Đăng nhập hệ thống qua chuẩn JWT bảo mật. |
| **Quản lý Tài liệu** | `http://localhost:5173/` | Nhân viên & Quản trị | Tải lên, tìm kiếm ngữ nghĩa, xem trước, tải về có đóng dấu watermark. |
| **Bảng Điều Khiển** | `http://localhost:5173/` (Dashboard) | Quản trị viên | Thống kê dung lượng, biểu đồ thể loại, tần suất sử dụng thời gian thực. |
| **Giám định Toàn vẹn** | `http://localhost:5173/verify` | Công khai bên ngoài | Quét mã QR hoặc tải tệp để đối soát chữ ký số RSA và mã băm SHA-256. |
| **Health Check API** | `http://localhost:8080/api/health` | Hệ thống Load Balancer | Endpoint kiểm tra sức khỏe Liveness / Readiness và mô hình ONNX. |
| **Metrics Giám Sát** | `http://localhost:8080/api/admin/system/status` | Quản trị viên | Giám sát trạng thái kết nối DB, CPU, RAM và tệp lưu trữ. |
