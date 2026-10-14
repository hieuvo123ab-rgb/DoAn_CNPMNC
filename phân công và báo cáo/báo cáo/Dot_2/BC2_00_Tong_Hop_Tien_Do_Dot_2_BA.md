# BÁO CÁO TIẾN ĐỘ TỔNG HỢP ĐỢT 2 (04/10/2026 – 10/10/2026)
## HỆ THỐNG QUẢN TRỊ TÀI LIỆU DOANH NGHIỆP (EDMS)
**Tập tin**: `BC2_00_Tong_Hop_Tien_Do_Dot_2_BA.md`  
**Người lập**: Võ Trọng Hiếu (Business Analyst / Project Lead / Requirements Owner)  
**Nhóm thực hiện**: Nhóm 5 thành viên Đồ án Chuyên ngành / CNPMNC  
**Mục tiêu đợt 2**: **CHUẨN HÓA THIẾT KẾ, API CONTRACT VÀ MÔ HÌNH HỆ THỐNG CHI TIẾT**  
**Trạng thái đợt 2**: **HOÀN THÀNH TOÀN DIỆN — NGHIỆM THU ĐẠT CHUẨN (100% PASS)**

---

## 1. TỔNG QUAN TIẾN ĐỘ ĐỢT 2 (EXECUTIVE SUMMARY)

Giai đoạn Đợt 2 của dự án EDMS diễn ra từ ngày **04/10/2026 đến ngày 10/10/2026** với mục tiêu cốt lõi: **"Chuẩn hóa đồng bộ 5 lớp: Requirement $\rightarrow$ Backend API $\rightarrow$ Frontend Screen/Flow $\rightarrow$ UML/Design $\rightarrow$ Database"**.

Trong đợt này, với vai trò Business Analyst kiêm Project Lead, tôi đã chỉ đạo nhóm tách biệt rõ ràng hai luồng công việc:
- **Luồng Học Thuật & Nghiệm Thu Tiến Độ (Academic Progress Report)**: Tập trung toàn lực vào kiểm toán hệ thống, khóa hợp đồng API Contract, xuất bản danh mục DTO, thiết lập từ điển dữ liệu, hoàn thiện 12 sơ đồ UML Baseline v2 và lập ma trận truy vết yêu cầu 36 hạng mục.
- **Luồng Phát Triển Tính Năng Kỹ Thuật (Technical Product Development)**: Bảo toàn bất biến trạng thái kiểm thử của hệ thống hiện tại (**456 / 456 tests PASS**). Các nghiên cứu mở rộng Phase 17 (bắt đầu từ Test 457) được chuẩn bị sẵn sàng nhưng không làm xáo trộn baseline học thuật của Đợt 2.

Toàn bộ hồ sơ báo cáo của Đợt 2 đã được đóng gói hoàn chỉnh tại thư mục:  
[`phân công và báo cáo/báo cáo/Dot_2/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/).

---

## 2. BẢNG ĐÁNH GIÁ NGHIỆM THU 4 THÀNH VIÊN KỸ THUẬT

Dựa trên bằng chứng kiểm tra được (evidence-first) và tiêu chí nghiệm thu tại Mục 5 của tài liệu phân công:

| Thành Viên & Vai Trò | Sản Phẩm Bàn Giao Đợt 2 | Bằng Chứng Thực Tế (Evidence) | Tỷ Lệ Hoàn Thành | Cổng Chất Lượng (Quality Gate) | Vấn Đề Ghi Nhận (Issues) | Phán Quyết Của BA (Verdict) |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **Trần Quyền Minh**<br>*(Backend / Tech Lead)* | [`BC2_01_Tran_Quyen_Minh_Backend_API_Contract.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/BC2_01_Tran_Quyen_Minh_Backend_API_Contract.md) | - 18 Controllers, 75 Endpoints<br>- 37 DTOs trong catalog<br>- Mô hình lỗi `GlobalExceptionHandler`<br>- Ranh giới giao dịch `AFTER_COMMIT` | **100%** | **PASSED** | Cần chuẩn hóa tham số `POST /api/notifications/test-dedup` (Minor) | **ĐẠT XUẤT SẮC** |
| **Nguyễn Quốc Huy**<br>*(Frontend Developer)* | [`BC2_02_Nguyen_Quoc_Huy_Frontend_Design_Contract.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/BC2_02_Nguyen_Quoc_Huy_Frontend_Design_Contract.md) | - 10 Màn hình chính, 13 Modals<br>- Ma trận Screen $\rightarrow$ API chi tiết<br>- 2 sơ đồ User Flow Mermaid<br>- Build `tsc && vite build`: 6.12s, 0 lỗi | **100%** | **PASSED** | Bảng tài liệu nhiều cột cần tối ưu thêm trên màn hình < 480px (Minor) | **ĐẠT XUẤT SẮC** |
| **Viên Bảo Đức**<br>*(System Analyst / UML)* | [`BC2_03_Vien_Bao_Duc_System_Design_UML.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/BC2_03_Vien_Bao_Duc_System_Design_UML.md) | - Đủ 12 sơ đồ Mermaid UML v2<br>- 7 sơ đồ Sequence các luồng lõi<br>- Phân biệt rõ Human Actor vs System<br>- Bảng UML Traceability chi tiết | **100%** | **PASSED** | Không phát hiện sai lệch mô hình so với mã nguồn thực tế | **ĐẠT XUẤT SẮC** |
| **Đinh Thanh Tùng**<br>*(Database / DevOps)* | [`BC2_04_Dinh_Thanh_Tung_Database_Integration_Design.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/BC2_04_Dinh_Thanh_Tung_Database_Integration_Design.md) | - 10 Bảng dữ liệu CSDL PostgreSQL 16<br>- Từ điển dữ liệu Data Dictionary<br>- Physical ERD v2 (không tạo bảng Task ảo)<br>- 38/38 tests DR duy trì dữ liệu vẹn toàn | **100%** | **PASSED** | Đang chuẩn bị kịch bản sao lưu CSDL tự động hàng ngày lúc 02:00 | **ĐẠT XUẤT SẮC** |

---

## 3. KIỂM TOÁN TÍNH ĐỒNG BỘ 10 CẶP THÀNH PHẦN (BA CONSISTENCY AUDIT)

BA đã thực hiện đối soát chéo độc lập giữa 10 cặp thành phần kiến trúc của hệ thống:

| Cặp Thành Phần Đối Soát | Nội Dung Kiểm Tra Thực Tế | Bằng Chứng Đối Soát | Đánh Giá Tính Đồng Nhất |
| :---: | :--- | :--- | :---: |
| **1. Requirement $\leftrightarrow$ UI** | 26 User Stories Lab 1 và các mở rộng đều có giao diện tương ứng trên 10 Pages và 13 Modals. | `LoginPage`, `DocumentsPage`, `UsersPage`, `ReviewQueuePage`, `DispositionQueuePage` | **ĐỒNG BỘ 100%** |
| **2. Requirement $\leftrightarrow$ API** | Mỗi yêu cầu chức năng đều được phục vụ bởi ít nhất một REST endpoint chuyên trách. | Danh mục 75 endpoints trong `BC2_01` khớp ma trận `BC2_05` | **ĐỒNG BỘ 100%** |
| **3. API $\leftrightarrow$ DTO** | Không có endpoint nào nhận hoặc trả trực tiếp JPA Entity. Mọi payload đều qua DTO chuẩn. | 37 DTOs trong `com.edms.dto` đóng gói đầy đủ Request / Response | **ĐỒNG BỘ 100%** |
| **4. API $\leftrightarrow$ Backend Service** | Controller chỉ đóng vai trò định tuyến và xác thực; toàn bộ business logic nằm trong 25 Services. | Controller gọi Service qua Dependency Injection, không viết SQL trong Controller | **ĐỒNG BỘ 100%** |
| **5. Entity $\leftrightarrow$ Database** | 10 lớp JPA `@Entity` khớp 1:1 với 10 bảng vật lý trong PostgreSQL `edms_db`. | Bảng Table Inventory trong `BC2_04` khớp `com.edms.entity` | **ĐỒNG BỘ 100%** |
| **6. UML $\leftrightarrow$ Code Thực Tế** | 12 sơ đồ UML trong `BC2_03` phản ánh chính xác các lớp Java, thành phần React và volumes Docker. | Tên class, tên phương thức, tên bảng trong Sequence diagrams hoàn toàn có thật | **ĐỒNG BỘ 100%** |
| **7. Role $\leftrightarrow$ SecurityConfig** | Các vai trò `ROLE_USER`, `ROLE_STAFF`, `ROLE_ADMIN` được định nghĩa nhất quán từ DB đến filter chain. | Khớp giữa `SecurityConfig.java`, `User.java`, `Navbar.tsx` và `UsersPage.tsx` | **ĐỒNG BỘ 100%** |
| **8. Lifecycle $\leftrightarrow$ DB Values** | Vòng đời tài liệu (`ACTIVE`, `ARCHIVED`, `DESTROYED`) được lưu trữ đúng enum và ràng buộc CHECK. | Bảng `documents.lifecycle_status` và logic trong `DocumentService.java` | **ĐỒNG BỘ 100%** |
| **9. Review Status $\leftrightarrow$ UI** | Các trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`) hiển thị badge màu tương ứng trên UI. | `ReviewQueuePage.tsx` đọc trực tiếp enum từ `DocumentReviewResponse` | **ĐỒNG BỘ 100%** |
| **10. Error Code $\leftrightarrow$ Frontend** | Mã HTTP (400, 401, 403, 404, 409, 413, 429, 500) từ `GlobalExceptionHandler` được Axios bắt và xử lý. | `frontend/src/api/client.ts` interceptor xử lý toast, banner, redirect | **ĐỒNG BỘ 100%** |

---

## 4. BẢNG ĐĂNG KÝ SAI LỆCH VÀ QUYẾT ĐỊNH CỦA BA (MISMATCH REGISTER)

Toàn bộ các sai lệch được phát hiện trong quá trình kiểm toán Đợt 2:

| Mã ID | Nguồn Phát Hiện A | Nguồn Đối Soát B | Mô Tả Sai Lệch (Mismatch Description) | Mức Độ (Severity) | Người Chịu Trách Nhiệm | Hành Động Yêu Cầu (Required Action) | Hạn Xử Lý |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **MIS-01** | Báo cáo Đợt 1 (`BC1_01`) | Thư mục mã nguồn `com.edms` | Đợt 1 ghi "75 Java classes" do chỉ quét thư mục nông; thực tế mã nguồn gồm **131 Java classes** (có thêm `config`, `dto`, `event`). | **DOCUMENTATION** | Trần Quyền Minh | Đã đính chính chính xác 131 classes trong báo cáo `BC2_01`. | **ĐÃ XONG** |
| **MIS-02** | Ý tưởng thiết kế Task | CSDL thực tế | Đề xuất ban đầu định tạo bảng `tasks` vật lý; thực tế `TaskCenterService` suy xuất động từ reviews và dispositions. | **DOCUMENTATION** | Viên Bảo Đức, Đinh Thanh Tùng | Không tạo bảng `tasks` trong ERD v2; ghi chú rõ cơ chế derived work items. | **ĐÃ XONG** |
| **MIS-03** | Frontend Polling | Tải mạng hệ thống | Frontend hiện đang polling 10s-30s để lấy thông báo và nhiệm vụ mới; tiềm ẩn tải dư thừa khi mở rộng quy mô. | **MAJOR** | Trần Quyền Minh, Nguyễn Quốc Huy | **QUYẾT ĐỊNH CỦA BA (OWNER-OPEN)**: Duy trì polling ở Đợt 2 và 3; chuyển sang WebSocket/SSE ở Đợt 4. | **Đợt 4** |
| **MIS-04** | Giới hạn Rate-limit | Endpoint reset | `POST /api/auth/reset-rate-limit` hiện reset toàn bộ cache thay vì mở khóa cho một User cụ thể. | **MINOR** | Trần Quyền Minh | Bổ sung tham số `username` trong DTO của endpoint này ở Đợt 3. | **Đợt 3** |

> **Tổng kết**:  
> - **Số lượng sai lệch nghiêm trọng (BLOCKER MISMATCH)**: **0**  
> - **Số lượng sai lệch mức độ MAJOR**: **1** (Đã có lộ trình xử lý ở Đợt 4)  
> - **Số lượng sai lệch tài liệu (DOCUMENTATION / MINOR)**: **3** (Đã được xử lý dứt điểm trong Đợt 2)

---

## 5. BẰNG CHỨNG KIỂM CHỨNG TOÀN DIỆN (SYSTEM VERIFICATION EVIDENCE)

### 5.1. Bằng Chứng Biên Dịch Frontend & Backend
- **Frontend Build (`npm run build`)**:
  - Lệnh thực thi: `tsc && vite build` tại [`frontend/`](file:///f:/DoAn_CNPMNC/frontend).
  - Kết quả: `1655 modules transformed`, hoàn thành trong **6.12 giây**, **Mã kết thúc = 0**, **0 lỗi TypeScript**.
  - Kích thước Assets: `index.html` (0.98 kB), `index.css` (24.15 kB), `index.js` (444.64 kB).
- **Backend Build & Docker Readiness**:
  - Thư mục [`backend/target/classes`](file:///f:/DoAn_CNPMNC/backend/target/classes) biên dịch đầy đủ 131 lớp mã nguồn Java 21 LTS.
  - Image Docker và các dịch vụ sẵn sàng khởi động qua [`docker-compose.yml`](file:///f:/DoAn_CNPMNC/docker-compose.yml).

### 5.2. Xác Minh Bộ Kiểm Thử Baseline Toàn Hệ Thống
Hệ thống EDMS duy trì trạng thái xanh 100% trên toàn bộ **456 bài test** đã chốt từ Phase 16:
- **Normal Regression Suite** ([`test_regression.py`](file:///f:/DoAn_CNPMNC/test_regression.py)): **369 / 369 PASS** (Tests 1–369).
- **Disaster Recovery Suite** ([`test_disaster_recovery.py`](file:///f:/DoAn_CNPMNC/test_disaster_recovery.py)): **38 / 38 PASS** (Tests 370–407).
- **Operational Readiness Suite** ([`test_operational_readiness.py`](file:///f:/DoAn_CNPMNC/test_operational_readiness.py)): **43 / 43 PASS** (Tests 408–450).
- **Controlled Security Closure** ([`test_phase16_security_closure.py`](file:///f:/DoAn_CNPMNC/test_phase16_security_closure.py)): **6 / 6 PASS** (Tests 451–456).
- **Tổng số bài test baseline**: **456 / 456 PASS (100%)**.

---

## 6. PHÁN QUYẾT CHÍNH THỨC CỦA BA CHO ĐỢT 2 (FINAL VERDICT)

Căn cứ vào:
1. Đầy đủ 4 báo cáo kỹ thuật thành phần của Backend, Frontend, UML/SA và Database/DevOps.
2. Ma trận truy vết yêu cầu [`BC2_05_Traceability_Matrix.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/BC2_05_Traceability_Matrix.md) đạt độ phủ 100% trên 36 hạng mục.
3. Danh mục kiểm tra nghiệm thu [`BC2_06_Dot_2_Acceptance_Checklist.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/BC2_06_Dot_2_Acceptance_Checklist.md) đạt 16 / 16 tiêu chí `[X] PASS`.
4. Không có bất kỳ sai lệch nào ở mức độ Blocker (`Blocker Mismatch = 0`).
5. Các bản build thành công và toàn bộ 456 bài kiểm thử baseline giữ nguyên trạng thái xanh.

```
======================================================================
PHÁN QUYẾT CHÍNH THỨC CỦA BUSINESS ANALYST / PROJECT LEAD:
VERDICT: DOT2_DESIGN_CONTRACT_BASELINE_PASS
TỔNG SỐ BÀI TEST BẢO TOÀN HỆ THỐNG: 456 / 456 (100% PASS)
HỢP ĐỒNG API CONTRACT VÀ MÔ HÌNH HỆ THỐNG ĐÃ ĐƯỢC ĐÓNG BĂNG AN TOÀN
======================================================================
```

---

## 7. KẾ HOẠCH BÀN GIAO ĐỢT 3 (11/10/2026 – 17/10/2026)

**Mục tiêu trọng tâm Đợt 3**: **"Hoàn thiện lõi tài liệu, bảo mật và phiên bản"**  
**Thời gian thực hiện**: 11/10/2026 – 17/10/2026 | **Hạn nộp nội bộ**: 20:00 ngày 17/10/2026.

### Định hướng công việc cho từng thành viên:
- **Trần Quyền Minh (Backend)**: Hoàn thiện tính toàn vẹn chữ ký số cá nhân, tối ưu hóa xử lý OCR ngầm, nâng cấp endpoint reset rate-limit theo username.
- **Nguyễn Quốc Huy (Frontend)**: Xây dựng bộ kiểm thử Component Tests tự động (Vitest), hoàn thiện Dark Mode và tối ưu giao diện trên thiết bị di động.
- **Viên Bảo Đức (System Analyst / UML)**: Thiết kế Detailed Class Diagram cho tầng Service và các sơ đồ Sequence nâng cao cho luồng xử lý OCR và ký số đa chứng chỉ.
- **Đinh Thanh Tùng (Database / DevOps)**: Triển khai Flyway migration script và thiết lập Cron job sao lưu CSDL tự động hàng ngày lúc 02:00 sáng.

---
*Xác nhận và phê duyệt của Project Lead:*  
**Võ Trọng Hiếu** (Business Analyst / Project Lead) — *Đã ký duyệt nghiệm thu chính thức Đợt 2.*
