# BẰNG CHỨNG MÔI TRƯỜNG DOCKER RUNTIME THỰC TẾ & BẢO ĐẢM CÔ LẬP DỮ LIỆU (QA)

**Hệ thống:** EDMS — Hệ thống Quản lý và Lưu trữ Tài liệu Điện tử  
**Mục tiêu:** Môi trường kiểm thử QA độc lập, chạy trên Docker Windows (WSL2), cổng thực tế `http://localhost:8088`.  
**Thời điểm thực hiện:** 2026-10-28  
**QA Lead / Engineer:** Senior Full-Stack QA & Browser Automation Tester  

---

## 1. Thông số Cấu hình Môi trường QA

| Thành phần | Cấu hình Thực tế | Ghi chú Bảo đảm Cô lập |
| :--- | :--- | :--- |
| **Docker Project Name** | `edms_qa_env` | Độc lập hoàn toàn với `edms_team_server` và project mặc định |
| **Host Binding Port** | `8088:8080` (HTTP) | Reverse Proxy Nginx phục vụ UI & chuyển tiếp API / WS |
| **PostgreSQL Container** | `postgres:16-alpine` | Mạng nội bộ `edms_qa_env_database`, không bind cổng 5432 ra host |
| **PostgreSQL Volume** | `edms_qa_team_pgdata` | **CÔ LẬP HOÀN TOÀN**, không đụng đến `edms_pgdata` hay `edms_team_server_pgdata` |
| **File Storage Volume** | `edms_qa_team_appdata` | Lưu trữ tệp tải lên `/app/persist/uploads` và keystore `/app/persist/keys` |
| **Frontend Stack** | React 18, Vite, Tailwind CSS, Lucide | Build tĩnh phục vụ qua Nginx 8080 |
| **Backend Stack** | Spring Boot 3 / Java 21, Hibernate, HikariCP | Cổng nội bộ 8081, Profile `prod,team-server` |
| **OCR & Semantic AI** | Tesseract OCR 5 (vie + eng), ONNX Runtime E5 | Phân tích toàn văn và tìm kiếm ngữ nghĩa độc lập |
| **WebSocket Protocol** | STOMP qua `/ws-edms` | Đồng bộ tác vụ, thông báo thời gian thực |

---

## 2. Kiểm tra Cô lập Volumes và Tránh Xung đột Cổng

1. **Bảo tồn dịch vụ hiện hữu:**
   - Container `stockflow_postgres` đang chạy trên cổng `0.0.0.0:5432`.
   - Cấu hình QA chỉ kết nối database qua Docker bridge network nội bộ (`edms_qa_env_database`), tuyệt đối không mở port 5432 ra Windows host.
2. **Volumes hoàn toàn mới:**
   - Volume DB: `edms_qa_team_pgdata`.
   - Volume App Data & Storage: `edms_qa_team_appdata`.
   - Không có bất kỳ dữ liệu nào của sản phẩm khác hoặc volume production bị ảnh hưởng hay tái sử dụng.
3. **Cổng 8088:**
   - Đã kiểm tra qua `Get-NetTCPConnection -LocalPort 8088` trước khi chạy: Không có tiến trình chiếm dụng.
   - Nginx điều hướng:
     - `/` $\rightarrow$ React SPA tĩnh (HTML/JS/CSS).
     - `/api/` $\rightarrow$ Spring Boot REST API (`http://127.0.0.1:8081/api/`).
     - `/ws-edms` $\rightarrow$ WebSocket STOMP endpoint (`http://127.0.0.1:8081/ws-edms`).
     - `/healthz` $\rightarrow$ Backend Health (`http://127.0.0.1:8081/api/health`).

---

## 3. Nhật ký Khởi động & Trạng thái Docker (Runtime Evidence)

### Lệnh khởi chạy:
```powershell
wsl -d Ubuntu -e bash -c "cd /mnt/f/DoAn_CNPMNC && docker compose --env-file .env.qa -f docker-compose.qa.yml -p edms_qa_env up -d --build"
```

### Trạng thái Container (`docker compose ps`):
*(Được cập nhật tự động khi container hoàn tất khởi động và healthcheck)*

### Kiểm tra Healthcheck Backend (`/healthz`):
*(Được xác thực trực tiếp qua HTTP GET http://localhost:8088/healthz)*

