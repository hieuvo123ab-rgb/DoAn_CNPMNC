# DANH MỤC KIỂM TRA NGHIỆM THU ĐỢT 3 (ACCEPTANCE CHECKLIST)
## HỆ THỐNG QUẢN TRỊ TÀI LIỆU DOANH NGHIỆP (EDMS)
**Tập tin**: `BC3_06_Dot_3_Acceptance_Checklist.md`  
**Giai đoạn**: Đợt 3 (11/10/2026 – 17/10/2026)  
**Mục tiêu**: Nghiệm thu củng cố an ninh runtime, hoàn thiện giao diện thương mại và chuẩn hóa quy trình vận hành  
**Người kiểm tra**: Võ Trọng Hiếu (Business Analyst / Project Lead)  
**Trạng thái kiểm tra**: **18 / 18 HẠNG MỤC ĐẠT (100% ACCEPTANCE PASS)**

---

## BẢNG KIỂM TRA NGHIỆM THU CHI TIẾT (ACCEPTANCE CRITERIA)

| STT | Tiêu Chí Kiểm Tra (Acceptance Criteria) | Tệp Bằng Chứng (Evidence Artifact) | Kết Quả Đối Soát & Ghi Chú Kỹ Thuật | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Backend Contract & DTO Catalog Bảo Toàn** | [`BC3_01_Tran_Quyen_Minh_Backend_Implementation.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_01_Tran_Quyen_Minh_Backend_Implementation.md) | Duy trì chuẩn mực 18 Controllers, 75 Endpoints, 37 DTOs; không để lộ Entity JPA ra Controller. | **[X] PASS** |
| 2 | **Khóa Chặt Endpoint Reset Rate-Limit (MIS-04)** | `AuthController.java` (L51-59) | Bổ sung `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`, chặn đứng hành vi xóa rate-limit trái phép. | **[X] PASS** |
| 3 | **Cách Ly Dữ Liệu Khởi Tạo (Seed Data Guard)** | `DataInitializer.java` (L1-30) | Đóng gói với `@Profile("!prod & !production")`; tuyệt đối không nạp user demo tĩnh trên môi trường thực tế. | **[X] PASS** |
| 4 | **Khóa Header Can Thiệp Lỗi Mô Phỏng** | `OperationalDiagnosticsService.java`<br>`DocumentController.java` | Chặn triệt để `X-Test-Lockout-Seconds`, `X-Force-Extraction-Failure`, `X-Force-Ocr-Timeout` trên profile `prod`. | **[X] PASS** |
| 5 | **Bắt Buộc An Toàn Khóa Ký JWT (>= 256-bit)** | `JwtTokenProvider.java` (L40-60) | Kiểm tra độ dài bí mật >= 32 bytes; đình chỉ khởi động nếu dùng secret mặc định trên production. | **[X] PASS** |
| 6 | **Toàn Vẹn Chữ Ký Số X.509 RSA-2048** | `SignatureService.java`<br>`KeyStoreService.java` | Ký số SHA256withRSA qua PKCS#12 Keystore `edms-signing.p12`; xác minh tính toàn vẹn đạt 100%. | **[X] PASS** |
| 7 | **Sự Kiện Thông Báo Sau Cam Kết (AFTER_COMMIT)**| `NotificationEventListener.java`<br>`NotificationService.java` | Lắng nghe pha `AFTER_COMMIT`, thực thi lưu trữ độc lập `Propagation.REQUIRES_NEW`, giao dịch lõi bất biến. | **[X] PASS** |
| 8 | **Gỡ Bỏ 100% Nhãn Đồ Án Trên Giao Diện** | [`BC3_02_Nguyen_Quoc_Huy_Frontend_Implementation.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_02_Nguyen_Quoc_Huy_Frontend_Implementation.md) | Làm sạch hoàn toàn các nhãn US-xx, Phase xx, Sprint 1 trên toàn bộ 10 Pages và 13 Modals. | **[X] PASS** |
| 9 | **Loại Bỏ Khối Tài Khoản Demo Tại Trang Đăng Nhập**| `LoginPage.tsx` (L1-80) | Gỡ bỏ panel gợi ý tài khoản và nút tự điền mật khẩu; tích hợp thông báo khóa tài khoản kèm đếm ngược. | **[X] PASS** |
| 10 | **Đồng Bộ Giới Hạn Tải Tệp Chuẩn 20MB** | `UploadModal.tsx`<br>`application.yml` | Sửa thông báo từ 50MB về đúng cấu hình 20MB của máy chủ; kiểm tra dung lượng ngay tại Client. | **[X] PASS** |
| 11 | **Kiểm Chứng Biên Dịch Frontend Thành Công** | Log build trong `BC3_02` | `tsc && vite build`: hoàn thành trong 6.12s, 1655 modules transformed, **0 lỗi TypeScript**. | **[X] PASS** |
| 12 | **Kiểm Chứng Biên Dịch Backend Thành Công** | `backend/target/classes` | Biên dịch đầy đủ 131 lớp Java 21 LTS sạch sẽ, sẵn sàng đóng gói JAR. | **[X] PASS** |
| 13 | **Chi Tiết Hóa Sơ Đồ UML Phân Hệ Lõi** | [`BC3_03_Vien_Bao_Duc_Detailed_Design_UML.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_03_Vien_Bao_Duc_Detailed_Design_UML.md) | Detailed Class Diagram tầng Service, Sequence Diagram OCR Fallback & Ký số Watermark/QR chuẩn xác. | **[X] PASS** |
| 14 | **Cập Nhật Sơ Đồ Triển Khai Deployment v3** | `BC3_03_Vien_Bao_Duc_Detailed_Design_UML.md` (Mục D) | Thể hiện đầy đủ Multi-container stack, 3 Named Volumes độc lập và cụm Disaster Recovery. | **[X] PASS** |
| 15 | **Bảo Vệ Cơ Sở Dữ Liệu Thực Tế Vẹn Toàn** | [`BC3_04_Dinh_Thanh_Tung_Database_DevOps_Implementation.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_04_Dinh_Thanh_Tung_Database_DevOps_Implementation.md) | CSDL PostgreSQL 16 hơn 17.000 bản ghi lịch sử được giữ nguyên vẹn; KHÔNG có lệnh xóa volume nào. | **[X] PASS** |
| 16 | **Kịch Bản Sao Lưu Tự Động & Diễn Tập DR Đạt Chuẩn**| `scripts/backup-edms.ps1`<br>`scripts/restore-edms-test.ps1` | Thiết lập backup tự động hàng ngày lúc 02:00 sáng; kiểm định khôi phục thành công trên cổng độc lập. | **[X] PASS** |
| 17 | **Bộ Kiểm Thử Baseline Giữ Nguyên Trạng Thái Xanh**| Toàn bộ 4 test suites hệ thống | **456 / 456 bài test PASS 100%** (369 Regression + 38 DR + 43 Operational + 6 Security Closure). | **[X] PASS** |
| 18 | **Ma Trận Truy Vết Yêu Cầu RTM v2 Đạt Độ Phủ 100%**| [`BC3_05_Traceability_Matrix.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/BC3_05_Traceability_Matrix.md) | 36 hạng mục kết nối đồng bộ 5 lớp; 100% đạt trạng thái `VERIFIED_ALIGNED` & `HARDENED_ALIGNED`. | **[X] PASS** |

---

## KẾT LUẬN NGHIỆM THU ĐỢT 3

Căn cứ vào kết quả kiểm tra độc lập và đối soát chéo trên toàn bộ **18 tiêu chí kỹ thuật**:
- **Tất cả các tiêu chí đều đạt trạng thái `[X] PASS` (18/18 tiêu chí)**.
- **Không có bất kỳ tiêu chí nào bị bỏ qua hoặc phát sinh lỗi tồn đọng**.
- **Hệ thống EDMS đã đạt độ chín muồi xuất sắc về cả An ninh Runtime, Giao diện Thương mại và Bền vững Vận hành**.
- **Hồ sơ nghiệm thu Đợt 3 chính thức được phê duyệt và đóng dấu hoàn thành xuất sắc**.

---
*Xác nhận của Business Analyst / Project Lead:*  
**Võ Trọng Hiếu** — *Đã kiểm tra và phê duyệt Danh mục nghiệm thu Đợt 3.*
