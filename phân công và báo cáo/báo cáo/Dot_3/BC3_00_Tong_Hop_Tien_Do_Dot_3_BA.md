# BÁO CÁO TIẾN ĐỘ TỔNG HỢP ĐỢT 3 (11/10/2026 – 17/10/2026)
## HỆ THỐNG QUẢN TRỊ TÀI LIỆU DOANH NGHIỆP (EDMS)
**Tập tin**: `BC3_00_Tong_Hop_Tien_Do_Dot_3_BA.md`  
**Người lập**: Võ Trọng Hiếu (Business Analyst / Project Lead / Requirements Owner)  
**Nhóm thực hiện**: Nhóm 5 thành viên Đồ án Chuyên ngành / CNPMNC  
**Mục tiêu đợt 3**: **HOÀN THIỆN LÕI TÀI LIỆU, CỦNG CỐ BẢO MẬT RUNTIME, CHUẨN HÓA VÒNG ĐỜI VÀ THƯƠNG MẠI HÓA GIAO DIỆN**  
**Trạng thái đợt 3**: **HOÀN THÀNH TOÀN DIỆN — NGHIỆM THU ĐẠT CHUẨN XUẤT SẮC (100% PASS)**

---

## 1. TỔNG QUAN TIẾN ĐỘ ĐỢT 3 (EXECUTIVE SUMMARY)

Giai đoạn Đợt 3 của dự án EDMS diễn ra từ ngày **11/10/2026 đến ngày 17/10/2026** với mục tiêu chiến lược: **"Nâng tầm hệ thống từ bản thử nghiệm học thuật đạt chuẩn thành sản phẩm phần mềm thương mại doanh nghiệp (Commercial-Grade Enterprise Software), củng cố an ninh runtime và bảo vệ toàn vẹn dữ liệu vận hành"**.

Dưới sự chỉ đạo của Business Analyst kiêm Project Lead, toàn nhóm 5 thành viên đã đồng lòng triển khai và hoàn thành xuất sắc các định hướng cốt lõi:
1. **Hoàn thiện bảo mật chuyên sâu (Security Hardening)**: Khắc phục dứt điểm sai lệch an ninh `MIS-04` bằng cách bảo vệ endpoint reset rate-limit với quyền `ROLE_ADMIN`; cô lập hoàn toàn seed data mặc định khỏi môi trường production; khóa chặn toàn bộ các header mô phỏng lỗi; bắt buộc kiểm tra độ dài khóa bí mật JWT tối thiểu 256-bit.
2. **Thương mại hóa giao diện người dùng (Commercial UI Polishing)**: Loại bỏ triệt để 100% các nhãn đồ án (`US-01` đến `US-26`, `Phase 5` đến `Phase 14`, `Sprint 1`) trên toàn bộ 10 Pages và 13 Modals; gỡ bỏ khối tài khoản demo tại màn hình đăng nhập; chuẩn hóa giới hạn dung lượng tải tệp lên mức 20MB đồng bộ với máy chủ.
3. **Mô hình hóa chuyên sâu & Ranh giới giao dịch (Advanced Modeling)**: Xây dựng Detailed Class Diagram cho tầng Service lõi; mô hình hóa chi tiết các luồng trích xuất OCR dự phòng, luồng ký số X.509 RSA-2048 và cơ chế phát tán thông báo sau cam kết `@TransactionalEventListener(phase = AFTER_COMMIT)`.
4. **Vận hành bền vững & Bảo vệ dữ liệu thực tế (Database & DevOps)**: Bảo toàn hơn 17.000 bản ghi CSDL PostgreSQL 16 Alpine; chuẩn hóa quy trình sao lưu tự động hàng ngày lúc 02:00 sáng; kiểm định diễn tập phục hồi thảm họa (Disaster Recovery) thành công trên cổng độc lập.
5. **Bảo tồn bộ kiểm thử hệ thống**: Duy trì trạng thái xanh tuyệt đối trên toàn bộ **456 / 456 bài kiểm thử baseline** (100% PASS).

Toàn bộ hồ sơ báo cáo của Đợt 3 đã được đóng gói hoàn chỉnh tại thư mục:  
[`phân công và báo cáo/báo cáo/Dot_3/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/).

---

## 2. BẢNG ĐÁNH GIÁ NGHIỆM THU 4 THÀNH VIÊN KỸ THUẬT

Dựa trên kết quả đối soát bằng chứng kỹ thuật thực tế (Evidence-First):

| Thành Viên & Vai Trò | Sản Phẩm Bàn Giao Đợt 3 | Bằng Chứng Thực Tế (Evidence) | Tỷ Lệ Hoàn Thành | Cổng Chất Lượng (Quality Gate) | Vấn Đề Ghi Nhận (Issues) | Phán Quyết Của BA (Verdict) |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **Trần Quyền Minh**<br>*(Backend / Tech Lead)* | [`BC3_01_Tran_Quyen_Minh_Backend_Implementation.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_01_Tran_Quyen_Minh_Backend_Implementation.md) | - Endpoint reset rate-limit có guard `ROLE_ADMIN`<br>- Seed data cô lập `@Profile("!prod")`<br>- Khóa test header trên `prod`<br>- Bắt buộc JWT secret >= 256-bit<br>- Xử lý thông báo `AFTER_COMMIT` | **100%** | **PASSED** | Đã giải quyết triệt để `MIS-04` | **ĐẠT XUẤT SẮC** |
| **Nguyễn Quốc Huy**<br>*(Frontend Developer)* | [`BC3_02_Nguyen_Quoc_Huy_Frontend_Implementation.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_02_Nguyen_Quoc_Huy_Frontend_Implementation.md) | - 100% nhãn đồ án bị loại bỏ sạch sẽ<br>- Gỡ bỏ demo account selector<br>- Giới hạn upload hiển thị chuẩn 20MB<br>- Build `tsc && vite build`: 6.12s, 0 lỗi<br>- Tối ưu Responsive và Status Badges | **100%** | **PASSED** | Giao diện đã sẵn sàng thương mại hóa | **ĐẠT XUẤT SẮC** |
| **Viên Bảo Đức**<br>*(System Analyst / UML)* | [`BC3_03_Vien_Bao_Duc_Detailed_Design_UML.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_03_Vien_Bao_Duc_Detailed_Design_UML.md) | - Detailed Class Diagram tầng Service lõi<br>- Sequence Diagrams: OCR Fallback & Ký số QR<br>- Deployment Diagram v3 đa container<br>- Bảng UML Traceability chi tiết | **100%** | **PASSED** | Mô hình khớp 100% mã nguồn thực tế | **ĐẠT XUẤT SẮC** |
| **Đinh Thanh Tùng**<br>*(Database / DevOps)* | [`BC3_04_Dinh_Thanh_Tung_Database_DevOps_Implementation.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_04_Dinh_Thanh_Tung_Database_DevOps_Implementation.md) | - Bảo toàn CSDL hơn 17.000 bản ghi<br>- Kịch bản backup tự động hàng ngày lúc 02:00<br>- Backend Dockerfile chạy user non-root UID 10001<br>- Frontend Dockerfile chạy `vite preview`<br>- 38/38 DR tests & 43/43 Ops tests PASS | **100%** | **PASSED** | Hạ tầng đạt chuẩn sản xuất ổn định | **ĐẠT XUẤT SẮC** |

---

## 3. KIỂM TOÁN TÍNH ĐỒNG BỘ 10 CẶP THÀNH PHẦN (BA CONSISTENCY AUDIT)

BA đã tiến hành kiểm tra chéo độc lập trên 10 cặp thành phần sau các nâng cấp của Đợt 3:

| Cặp Thành Phần Đối Soát | Nội Dung Kiểm Tra Thực Tế Đợt 3 | Bằng Chứng Đối Soát | Đánh Giá Tính Đồng Nhất |
| :---: | :--- | :--- | :---: |
| **1. Requirement $\leftrightarrow$ Clean UI** | Mọi nhãn học thuật đã được loại bỏ; người dùng trải nghiệm đúng các chức năng nghiệp vụ của 26 US và 10 Extensions. | `LoginPage`, `DocumentsPage`, `UsersPage`, `ReviewQueuePage` hoàn toàn sạch nhãn | **ĐỒNG BỘ 100%** |
| **2. Requirement $\leftrightarrow$ Hardened API** | Toàn bộ 75 endpoints hoạt động ổn định; các lỗ hổng bảo mật tiềm ẩn (reset rate-limit, test headers) đã được khóa chặt. | `AuthController.java`, `DocumentController.java`, `JwtTokenProvider.java` | **ĐỒNG BỘ 100%** |
| **3. API $\leftrightarrow$ DTO Catalog** | 37 DTOs bảo đảm an toàn dữ liệu, tách bạch Request / Response, không để lộ Entity CSDL. | `com.edms.dto` khớp 100% hợp đồng API | **ĐỒNG BỘ 100%** |
| **4. UI Upload Limit $\leftrightarrow$ Backend Config** | Giới hạn dung lượng tải tệp hiển thị đồng nhất ở mức 20MB trên cả giao diện và cấu hình máy chủ. | `UploadModal.tsx` và `application.yml` (`max-file-size: 20MB`) | **ĐỒNG BỘ 100%** |
| **5. Entity $\leftrightarrow$ PostgreSQL Database** | 10 lớp JPA Entity ánh xạ chính xác 10 bảng CSDL vật lý; hơn 17.000 bản ghi lịch sử nguyên vẹn. | Bảng Table Inventory trong `BC3_04` khớp `com.edms.entity` | **ĐỒNG BỘ 100%** |
| **6. UML Service Diagram $\leftrightarrow$ Java Code** | Sơ đồ Detailed Class Diagram phản ánh đúng 25 Services; Sequence diagrams phản ánh đúng luồng thực tế. | Tên class, tham số, ranh giới `@Transactional` trong `BC3_03` khớp code | **ĐỒNG BỘ 100%** |
| **7. Production Profile $\leftrightarrow$ Docker Stack** | Cụm dịch vụ Docker Compose mặc định chạy profile an toàn `prod`, không kích hoạt mock/seed. | `docker-compose.yml` (`SPRING_PROFILES_ACTIVE: prod`) | **ĐỒNG BỘ 100%** |
| **8. Digital Signature $\leftrightarrow$ Public Verify Portal**| Chữ ký số RSA-2048 sinh ra từ Backend được xác minh hợp lệ tức thì trên cổng công khai `/verify`. | `VerifyPage.tsx` đọc mã QR và đối soát chữ ký số qua `PublicVerificationController` | **ĐỒNG BỘ 100%** |
| **9. Event Listener $\leftrightarrow$ Transaction Commit**| Thông báo hệ thống chỉ được lưu trữ khi giao dịch nghiệp vụ cốt lõi đã cam kết thành công (`AFTER_COMMIT`).| `NotificationEventListener.java` bắt sự kiện sau cam kết | **ĐỒNG BỘ 100%** |
| **10. Disaster Recovery $\leftrightarrow$ Backup Runbook**| Kịch bản phục hồi thảm họa hoạt động độc lập trên các cổng 15432, 18080, 15173 mà không ảnh hưởng cụm chính.| `docker-compose.recovery.yml` và 38/38 tests DR PASS | **ĐỒNG BỘ 100%** |

---

## 4. BẢNG XỬ LÝ SAI LỆCH VÀ QUYẾT ĐỊNH CỦA BA (MISMATCH REGISTER ĐỢT 3)

| Mã ID | Vấn Đề Ghi Nhận Ban Đầu | Hiện Trạng & Biện Pháp Đã Xử Lý Tại Đợt 3 | Mức Độ | Trách Nhiệm | Trạng Thái Đợt 3 |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **MIS-01** | Báo cáo Đợt 1 ghi nhận thiếu số lớp Java (ghi 75 thay vì 131 classes) | Đã chuẩn hóa và đối soát chính xác 131 Java classes trong cả báo cáo Đợt 2 và Đợt 3. | DOCUMENTATION | Trần Quyền Minh | **ĐÃ ĐÓNG (CLOSED)** |
| **MIS-02** | Ý tưởng ban đầu định tạo bảng `tasks` vật lý | Đã xác nhận cơ chế Dynamic Derived Tasks từ reviews và dispositions; không tạo bảng ảo. | ARCHITECTURAL | Viên Bảo Đức, Đinh Thanh Tùng | **ĐÃ ĐÓNG (CLOSED)** |
| **MIS-04** | Endpoint `POST /api/auth/reset-rate-limit` chưa có phân quyền bảo vệ | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ**: Thêm `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`, chỉ Quản trị viên mới có quyền mở khóa. | MINOR $\rightarrow$ RESOLVED | Trần Quyền Minh | **ĐÃ ĐÓNG (CLOSED)** |
| **MIS-03** | Frontend hiện đang Polling 10s-30s để lấy thông báo | **QUYẾT ĐỊNH CỦA BA (OWNER-OPEN)**: Duy trì Polling ổn định trong Đợt 2 và Đợt 3; chuyển sang WebSocket/SSE Push ở Đợt 4. | MAJOR | Trần Quyền Minh, Nguyễn Quốc Huy | **CHUYỂN GIAO ĐỢT 4** |

> **Tổng kết sai lệch Đợt 3**:  
> - **Số lượng sai lệch nghiêm trọng (BLOCKER MISMATCH)**: **0**  
> - **Số lượng sai lệch đã giải quyết dứt điểm**: **3** (`MIS-01`, `MIS-02`, `MIS-04`)  
> - **Số lượng sai lệch đang xử lý theo lộ trình định trước**: **1** (`MIS-03` chuyển giao Đợt 4)

---

## 5. BẰNG CHỨNG KIỂM CHỨNG TOÀN DIỆN (SYSTEM VERIFICATION EVIDENCE)

### 5.1. Bằng Chứng Biên Dịch & Đóng Gói
- **Frontend Build (`npm run build`)**:
  - Lệnh thực thi: `tsc && vite build` tại thư mục [`frontend/`](file:///f:/DoAn_CNPMNC/frontend).
  - Kết quả: Hoàn thành trong **6.12 giây**, chuyển hóa **1,655 modules**, **Mã kết thúc = 0**, **0 lỗi TypeScript**.
- **Backend Compilation**:
  - Toàn bộ 131 lớp mã nguồn trong [`backend/target/classes`](file:///f:/DoAn_CNPMNC/backend/target/classes) biên dịch sạch sẽ trên Java 21 LTS.

### 5.2. Xác Minh Bộ Kiểm Thử Baseline Toàn Hệ Thống
Hệ thống EDMS bảo toàn trạng thái xanh tuyệt đối trên toàn bộ **456 bài test**:
- **Normal Regression Suite** ([`test_regression.py`](file:///f:/DoAn_CNPMNC/test_regression.py)): **369 / 369 PASS** (Tests 1–369).
- **Disaster Recovery Suite** ([`test_disaster_recovery.py`](file:///f:/DoAn_CNPMNC/test_disaster_recovery.py)): **38 / 38 PASS** (Tests 370–407).
- **Operational Readiness Suite** ([`test_operational_readiness.py`](file:///f:/DoAn_CNPMNC/test_operational_readiness.py)): **43 / 43 PASS** (Tests 408–450).
- **Controlled Security Closure** ([`test_phase16_security_closure.py`](file:///f:/DoAn_CNPMNC/test_phase16_security_closure.py)): **6 / 6 PASS** (Tests 451–456).
- **Tổng số bài test baseline**: **456 / 456 PASS (100%)**.

---

## 6. PHÁN QUYẾT CHÍNH THỨC CỦA BA CHO ĐỢT 3 (FINAL VERDICT)

Căn cứ vào:
1. Đầy đủ 4 báo cáo kỹ thuật chuyên sâu của Backend, Frontend, UML/SA và Database/DevOps.
2. Ma trận truy vết yêu cầu [`BC3_05_Traceability_Matrix.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_05_Traceability_Matrix.md) đạt độ phủ 100% trên 36 hạng mục.
3. Danh mục kiểm tra nghiệm thu [`BC3_06_Dot_3_Acceptance_Checklist.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_06_Dot_3_Acceptance_Checklist.md) đạt **18 / 18 tiêu chí `[X] PASS`**.
4. Các sai lệch an ninh và tài liệu (`MIS-01`, `MIS-02`, `MIS-04`) đã được khắc phục triệt để; số lượng Blocker Mismatch = 0.
5. Toàn bộ 456 bài kiểm thử baseline và bản build sản phẩm đạt kết quả hoàn hảo.

```
======================================================================
PHÁN QUYẾT CHÍNH THỨC CỦA BUSINESS ANALYST / PROJECT LEAD:
VERDICT: DOT3_SECURITY_HARDENING_COMMERCIAL_POLISHING_PASS
TỔNG SỐ BÀI TEST BẢO TOÀN HỆ THỐNG: 456 / 456 (100% PASS)
HỆ THỐNG ĐÃ HOÀN TẤT CỦNG CỐ AN NINH VÀ THƯƠNG MẠI HÓA TOÀN DIỆN
======================================================================
```

---

## 7. KẾ HOẠCH BÀN GIAO ĐỢT 4 (18/10/2026 – 24/10/2026)

**Mục tiêu trọng tâm Đợt 4**: **"TÍCH HỢP GIAO TIẾP THỜI GIAN THỰC, TỐI ƯU HÓA HIỆU NĂNG CAO VÀ NGHIỆM THU TỔNG THỂ"**  
**Thời gian thực hiện**: 18/10/2026 – 24/10/2026 | **Hạn nộp nội bộ**: 20:00 ngày 24/10/2026.

### Định hướng công việc cho từng thành viên:
- **Trần Quyền Minh (Backend)**: Thiết kế endpoint WebSocket/SSE cho Task Center và Notification, thay thế dần cơ chế polling theo lộ trình giải quyết `MIS-03`.
- **Nguyễn Quốc Huy (Frontend)**: Tích hợp WebSocket Client nhận thông báo đẩy thời gian thực, hoàn thiện chế độ hiển thị Card View cho màn hình di động < 480px.
- **Viên Bảo Đức (System Analyst / UML)**: Xây dựng sơ đồ Sequence thời gian thực (Real-time Push Interaction) và State Machine Diagram hoàn chỉnh cho toàn bộ vòng đời tài liệu.
- **Đinh Thanh Tùng (Database / DevOps)**: Kiểm thử chịu tải đa người dùng đồng thời (Load & Stress Testing), tinh chỉnh Connection Pool và chuẩn bị kịch bản demo nghiệm thu chung kết.

---
*Xác nhận và phê duyệt của Project Lead:*  
**Võ Trọng Hiếu** (Business Analyst / Project Lead) — *Đã ký duyệt nghiệm thu chính thức Đợt 3.*
