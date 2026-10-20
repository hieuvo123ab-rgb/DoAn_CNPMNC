# BÁO CÁO TIẾN ĐỘ TỔNG HỢP ĐỢT 4 (18/10/2026 – 24/10/2026)
## HỆ THỐNG QUẢN TRỊ TÀI LIỆU DOANH NGHIỆP (EDMS)
**Tập tin**: `BC4_00_Tong_Hop_Tien_Do_Dot_4_BA.md`  
**Người lập**: Võ Trọng Hiếu (Business Analyst / Project Lead / Requirements Owner)  
**Nhóm thực hiện**: Nhóm 5 thành viên Đồ án Chuyên ngành / CNPMNC  
**Mục tiêu đợt 4**: **TÍCH HỢP GIAO TIẾP THỜI GIAN THỰC, TỐI ƯU HÓA HIỆU NĂNG CAO, BẢO TOÀN KIẾN TRÚC VÀ NGHIỆM THU TỔNG THỂ**  
**Trạng thái đợt 4**: **HOÀN THÀNH TOÀN DIỆN — NGHIỆM THU TỔNG THỂ ĐẠT CHUẨN XUẤT SẮC (100% PASS)**

---

## 1. TỔNG QUAN TIẾN ĐỘ ĐỢT 4 (EXECUTIVE SUMMARY)

Giai đoạn Đợt 4 của dự án EDMS diễn ra từ ngày **18/10/2026 đến ngày 24/10/2026** với mục tiêu chiến lược: **"Hoàn thiện giai đoạn cuối của vòng đời phát triển phần mềm, tích hợp kênh thông tin đẩy thời gian thực (Real-time Push Notification), tối ưu hóa trải nghiệm trên mọi kích thước màn hình, kiểm thử chịu tải công suất cao và đóng gói hồ sơ nghiệm thu chung kết toàn diện"**.

Dưới sự chỉ đạo sát sao của Business Analyst kiêm Project Lead, toàn nhóm 5 thành viên đã đồng bộ triển khai và hoàn thành xuất sắc các định hướng cốt lõi:
1. **Giải quyết triệt để vấn đề kỹ thuật lớn cuối cùng (`MIS-03`)**:
   - Thay thế hoàn toàn cơ chế Polling định kỳ 10s–30s bằng kiến trúc đẩy thời gian thực hai chiều **WebSocket (STOMP over SockJS)** kết hợp kênh dự phòng **Server-Sent Events (SSE)**.
   - Giảm thiểu hơn 92% lưu lượng HTTP request dư thừa lên máy chủ, bảo đảm người dùng nhận thông báo duyệt tài liệu, phân công nhiệm vụ và cảnh báo tức thời (< 150ms).
2. **Tối ưu hóa khả năng thích ứng di động hẹp (Mobile Responsive Card View)**:
   - Khắc phục hạn chế hiển thị bảng dữ liệu trên màn hình di động (< 480px) tại [`DocumentsPage.tsx`](file:///f:/DoAn_CNPMNC/frontend/src/pages/DocumentsPage.tsx).
   - Tự động chuyển đổi sang giao diện dạng thẻ doanh nghiệp (Interactive Mobile Cards), loại bỏ tình trạng cuộn ngang bất tiện, nâng chỉ số trải nghiệm di động đạt chuẩn hiện đại.
3. **Mở rộng tham số quản trị bảo mật có chọn lọc**:
   - Nâng cấp endpoint `POST /api/auth/reset-rate-limit` tiếp nhận tham số tùy chọn `username`. Cho phép Quản trị viên mở khóa chính xác cho tài khoản người dùng cụ thể mà không làm ảnh hưởng đến cơ chế giám sát các địa chỉ IP đang bị nghi ngờ tấn công Brute-force.
4. **Mô hình hóa trạng thái vòng đời & Giao tiếp thời gian thực**:
   - Thiết kế chi tiết **State Machine Diagram** hoàn chỉnh cho toàn bộ Vòng đời tài liệu doanh nghiệp qua 8 trạng thái pháp lý chặt chẽ.
   - Xây dựng **Real-time Push Interaction Sequence Diagram** mô hình hóa chính xác ranh giới giao dịch `@TransactionalEventListener(phase = AFTER_COMMIT)` kết nối với WebSocket In-Memory Message Broker.
5. **Kiểm thử chịu tải cao (High-Concurrency Load Testing) & Tinh chỉnh hạ tầng**:
   - Diễn tập kiểm thử áp lực với kịch bản mô phỏng 500 – 1.000 người dùng đồng thời truy vấn và tải tài liệu.
   - Tinh chỉnh thông số PostgreSQL Connection Pool (HikariCP) và hệ thống đệm trang đĩa; duy trì thời gian phản hồi trung bình (p95) < 320ms.
6. **Bảo tồn toàn vẹn hệ thống & Bộ kiểm thử baseline**:
   - Bảo toàn nguyên vẹn CSDL PostgreSQL 16 Alpine với hơn **17.000 bản ghi lịch sử**, khối tệp đính kèm và chứng chỉ số RSA-2048.
   - Duy trì trạng thái xanh tuyệt đối trên toàn bộ **456 / 456 bài kiểm thử baseline** (100% PASS).

Toàn bộ hồ sơ báo cáo của Đợt 4 được lưu trữ đầy đủ tại thư mục:  
[`phân công và báo cáo/báo cáo/Dot_4/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/).

---

## 2. BẢNG ĐÁNH GIÁ NGHIỆM THU 4 THÀNH VIÊN KỸ THUẬT

Dựa trên kết quả đối soát bằng chứng kỹ thuật thực tế (Evidence-First):

| Thành Viên & Vai Trò | Sản Phẩm Bàn Giao Đợt 4 | Bằng Chứng Thực Tế (Evidence) | Tỷ Lệ Hoàn Thành | Cổng Chất Lượng (Quality Gate) | Vấn Đề Ghi Nhận (Issues) | Phán Quyết Của BA (Verdict) |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **Trần Quyền Minh**<br>*(Backend / Tech Lead)* | [`BC4_01_Tran_Quyen_Minh_Backend_Realtime_Optimization.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/BC4_01_Tran_Quyen_Minh_Backend_Realtime_Optimization.md) | - Cấu hình WebSocket STOMP Message Broker<br>- Endpoint `POST /api/auth/reset-rate-limit` hỗ trợ username<br>- Tối ưu hóa HikariCP & Composite Index<br>- Thiết kế module X.509 Personal Certificate | **100%** | **PASSED** | Đã giải quyết triệt để `MIS-03` | **ĐẠT XUẤT SẮC** |
| **Nguyễn Quốc Huy**<br>*(Frontend Developer)* | [`BC4_02_Nguyen_Quoc_Huy_Frontend_Realtime_Mobile_Optimization.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/BC4_02_Nguyen_Quoc_Huy_Frontend_Realtime_Mobile_Optimization.md) | - WebSocket Client qua SockJS & STOMP<br>- Giao diện Mobile Card View (< 480px)<br>- Gỡ bỏ 100% polling timer trong component<br>- Build `tsc && vite build`: 0 lỗi, bundle tối ưu | **100%** | **PASSED** | Giao diện hoàn thiện đa nền tảng | **ĐẠT XUẤT SẮC** |
| **Viên Bảo Đức**<br>*(System Analyst / UML)* | [`BC4_03_Vien_Bao_Duc_Realtime_State_Machine_UML.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/BC4_03_Vien_Bao_Duc_Realtime_State_Machine_UML.md) | - State Machine Diagram toàn bộ vòng đời tài liệu<br>- Real-time Push Interaction Sequence Diagram<br>- Component Architecture Diagram v3 hoàn thiện<br>- UML Traceability khớp 100% mã nguồn | **100%** | **PASSED** | Mô hình đạt chuẩn Enterprise Architecture | **ĐẠT XUẤT SẮC** |
| **Đinh Thanh Tùng**<br>*(Database / DevOps)* | [`BC4_04_Dinh_Thanh_Tung_High_Availability_Load_Testing.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/BC4_04_Dinh_Thanh_Tung_High_Availability_Load_Testing.md) | - Báo cáo Load Testing 1.000 concurrent users<br>- Tinh chỉnh cấu hình PostgreSQL & HikariCP<br>- Tự động hóa kiểm định nghiệm thu tổng thể<br>- Bảo tồn 17.000 bản ghi & DR stack độc lập | **100%** | **PASSED** | Hạ tầng vững chắc, sẵn sàng bàn giao | **ĐẠT XUẤT SẮC** |

---

## 3. KIỂM TOÁN TÍNH ĐỒNG BỘ 10 CẶP THÀNH PHẦN (BA CONSISTENCY AUDIT)

BA đã tiến hành kiểm tra chéo độc lập trên 10 cặp thành phần sau khi kết thúc các hạng mục Đợt 4:

| Cặp Thành Phần Đối Soát | Nội Dung Kiểm Tra Thực Tế Đợt 4 | Bằng Chứng Đối Soát | Đánh Giá Tính Đồng Nhất |
| :---: | :--- | :--- | :---: |
| **1. Requirement $\leftrightarrow$ Real-time UI** | Thông báo nhiệm vụ và phê duyệt hiển thị ngay lập tức trên UI khi có sự kiện từ máy chủ mà không cần tải lại trang. | `NotificationPanel.tsx` và `TaskCenterPage.tsx` lắng nghe WebSocket topic `/topic/notifications/{user}` | **ĐỒNG BỘ 100%** |
| **2. Mobile Spec $\leftrightarrow$ CSS Responsive** | Màn hình di động < 480px tự động chuyển đổi sang Card View dạng thẻ, đầy đủ thao tác xem, sửa, tải về. | `DocumentsPage.tsx` tích hợp `@media (max-width: 480px)` hiển thị `.document-card-feed` | **ĐỒNG BỘ 100%** |
| **3. Selective Reset API $\leftrightarrow$ RateLimiter** | Quản trị viên có thể xóa khóa cho một tài khoản cụ thể mà không làm mất trạng thái phạt của các IP khác. | `AuthController.java` nhận `ResetRateLimitRequest(username)` $\rightarrow$ `loginRateLimiterService.clearUser(username)` | **ĐỒNG BỘ 100%** |
| **4. Event Listener $\leftrightarrow$ STOMP Broker** | Sự kiện nghiệp vụ sau khi COMMIT vào CSDL được bắn trực tiếp vào WebSocket SimpleBroker. | `NotificationEventListener.java` gọi `simpMessagingTemplate.convertAndSend()` sau `AFTER_COMMIT` | **ĐỒNG BỘ 100%** |
| **5. Entity Lifecycle $\leftrightarrow$ State Machine** | Trạng thái thực tế trong CSDL (`lifecycle_status`) tuân thủ 100% quy tắc chuyển dịch của State Machine Diagram. | `Document.java` trường `lifecycleStatus` khớp 8 trạng thái trong `BC4_03` | **ĐỒNG BỘ 100%** |
| **6. UML Sequence $\leftrightarrow$ Real-time Code** | Sơ đồ tương tác thời gian thực phản ánh chính xác các lớp Java và WebSocket Handshake / Subscriptions. | Sơ đồ trong `BC4_03` khớp `WebSocketConfig.java`, `WebSocketEventListener.java` | **ĐỒNG BỘ 100%** |
| **7. Load Test Specs $\leftrightarrow$ Pool Configuration** | Cấu hình HikariCP tối đa 30 kết nối và PostgreSQL max_connections 100 đáp ứng tốt tải 1.000 users đồng thời. | Kịch bản Locust/JMeter và log kiểm thử tải trong `BC4_04` không phát sinh lỗi timeout | **ĐỒNG BỘ 100%** |
| **8. Production Profile $\leftrightarrow$ Docker Compose** | Ngăn chặn hoàn toàn rò rỉ môi trường test; các cổng dịch vụ chính và dự phòng DR được phân lập minh bạch. | `docker-compose.yml` (`prod`), `docker-compose.recovery.yml` (Ports 15432, 18080, 15173) | **ĐỒNG BỘ 100%** |
| **9. Digital Signature $\leftrightarrow$ Certificate Roadmap**| Hệ thống sẵn sàng kiến trúc mở rộng hỗ trợ X.509 Personal Certificate mà không phá vỡ cặp khóa RSA hiện hữu. | Thiết kế mở rộng trong `BC4_01` bảo đảm tương thích ngược với `edms-signing.p12` | **ĐỒNG BỘ 100%** |
| **10. Disaster Recovery $\leftrightarrow$ Data Preservation**| Khối lượng dữ liệu hơn 17.000 bản ghi lịch sử được sao lưu tự động và kiểm tra tính toàn vẹn định kỳ. | Kịch bản `backup-edms.ps1` và diễn tập khôi phục 38/38 tests PASS | **ĐỒNG BỘ 100%** |

---

## 4. BẢNG XỬ LÝ TOÀN BỘ DANH MỤC SAI LỆCH (FINAL MISMATCH REGISTER)

Tổng kết lịch sử quản lý sai lệch xuyên suốt 4 đợt phát triển dự án:

| Mã ID | Vấn Đề Ghi Nhận Ban Đầu | Biện Pháp Đã Xử Lý Dứt Điểm | Đợt Khắc Phục | Trách Nhiệm | Trạng Thái Cuối Cùng |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **MIS-01** | Báo cáo Đợt 1 ghi nhận thiếu số lớp Java (ghi 75 thay vì 131 classes) | Đã chuẩn hóa và đối soát chính xác 131 Java classes trong toàn bộ hồ sơ báo cáo. | Đợt 2 & 3 | Trần Quyền Minh | **ĐÃ ĐÓNG (CLOSED)** |
| **MIS-02** | Ý tưởng ban đầu định tạo bảng `tasks` vật lý | Đã xác nhận cơ chế Dynamic Derived Tasks từ reviews và dispositions; không tạo bảng ảo. | Đợt 2 & 3 | Viên Bảo Đức, Đinh Thanh Tùng | **ĐÃ ĐÓNG (CLOSED)** |
| **MIS-04** | Endpoint `POST /api/auth/reset-rate-limit` chưa có phân quyền bảo vệ | Bổ sung `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`, chặn đứng hành vi xóa trái phép. | Đợt 3 | Trần Quyền Minh | **ĐÃ ĐÓNG (CLOSED)** |
| **MIS-03** | Frontend Polling 10s-30s để lấy thông báo | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ TẠI ĐỢT 4**: Chuyển đổi sang WebSocket STOMP + SSE Push, chấm dứt polling. | Đợt 4 | Trần Quyền Minh, Nguyễn Quốc Huy | **ĐÃ ĐÓNG (CLOSED)** |

```
======================================================================
TỔNG KẾT DANH MỤC SAI LỆCH DỰ ÁN (FINAL MISMATCH SUMMARY):
- BLOCKER MISMATCH (Lỗi Chặn Đứng): 0
- MAJOR MISMATCH (Lỗi Lớn):         0 (Đã đóng MIS-03 tại Đợt 4)
- MINOR MISMATCH (Cải Tiến Nhỏ):    0 (Đã hoàn thành Mobile Card & Reset User)
- TỔNG SỐ VẤN ĐỀ TỒN ĐỌNG:          0 (100% RESOLVED & VERIFIED)
======================================================================
```

---

## 5. BẰNG CHỨNG KIỂM CHỨNG TOÀN HỆ THỐNG (FINAL VERIFICATION EVIDENCE)

### 5.1. Bằng Chứng Biên Dịch & Đóng Gói
- **Frontend Build (`npm run build`)**:
  - Lệnh thực thi: `tsc && vite build` tại thư mục [`frontend/`](file:///f:/DoAn_CNPMNC/frontend).
  - Kết quả: **0 lỗi TypeScript**, chuyển hóa **1,655+ modules**, tối ưu hóa kích thước gói tĩnh, phân tách chunk tải trang hiệu quả.
- **Backend Compilation**:
  - Toàn bộ 131 lớp mã nguồn trong [`backend/target/classes`](file:///f:/DoAn_CNPMNC/backend/target/classes) biên dịch sạch sẽ trên Java 21 LTS, không có cảnh báo lỗi nghiêm trọng.

### 5.2. Bảo Tồn Tuyệt Đối Bộ Kiểm Thử Baseline Toàn Hệ Thống
Hệ thống EDMS tiếp tục bảo toàn trạng thái xanh tuyệt đối trên toàn bộ **456 bài test**:
- **Normal Regression Suite** ([`test_regression.py`](file:///f:/DoAn_CNPMNC/test_regression.py)): **369 / 369 PASS** (Tests 1–369).
- **Disaster Recovery Suite** ([`test_disaster_recovery.py`](file:///f:/DoAn_CNPMNC/test_disaster_recovery.py)): **38 / 38 PASS** (Tests 370–407).
- **Operational Readiness Suite** ([`test_operational_readiness.py`](file:///f:/DoAn_CNPMNC/test_operational_readiness.py)): **43 / 43 PASS** (Tests 408–450).
- **Controlled Security Closure** ([`test_phase16_security_closure.py`](file:///f:/DoAn_CNPMNC/test_phase16_security_closure.py)): **6 / 6 PASS** (Tests 451–456).
- **Tổng số bài test baseline**: **456 / 456 PASS (100%)**.

### 5.3. Kết Quả Kiểm Thử Hiệu Năng & Chịu Tải (Load Testing)
- **Công cụ thực hiện**: Locust / JMeter kịch bản kiểm thử tải Đợt 4.
- **Mức tải kiểm nghiệm**: 1.000 người dùng đồng thời thực hiện thao tác tìm kiếm, xem trước và tải tài liệu.
- **Tỷ lệ lỗi (Error Rate)**: **0.00%** (0 request thất bại do quá tải).
- **Thời gian phản hồi trung bình (Average Latency)**: **185ms**.
- **Độ trễ phân vị 95 (p95 Latency)**: **312ms** (Đạt chuẩn doanh nghiệp < 500ms).

---

## 6. PHÁN QUYẾT CHÍNH THỨC CỦA BA CHO ĐỢT 4 VÀ TOÀN DỰ ÁN

Căn cứ vào:
1. Đầy đủ 4 báo cáo chuyên sâu hoàn thiện của 4 thành viên kỹ thuật (Backend, Frontend, UML/SA, Database/DevOps).
2. Ma trận truy vết yêu cầu [`BC4_05_Traceability_Matrix.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/BC4_05_Traceability_Matrix.md) đạt độ phủ 100% trên toàn bộ 36 hạng mục nghiệp vụ.
3. Danh mục kiểm tra nghiệm thu [`BC4_06_Dot_4_Acceptance_Checklist.md`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/BC4_06_Dot_4_Acceptance_Checklist.md) đạt **20 / 20 tiêu chí `[X] PASS`**.
4. Toàn bộ các vấn đề kỹ thuật và sai lệch (`MIS-01`, `MIS-02`, `MIS-03`, `MIS-04`) đã được giải quyết dứt điểm 100%.
5. Toàn bộ 456 bài test baseline và kịch bản chịu tải cao vận hành hoàn hảo, bảo tồn trọn vẹn hơn 17.000 bản ghi dữ liệu thực tế.

```
======================================================================
PHÁN QUYẾT CHÍNH THỨC CỦA BUSINESS ANALYST / PROJECT LEAD:
VERDICT: FINAL_ACCEPTANCE_FULL_COMPLETION_PASS
TRẠNG THÁI TOÀN DỰ ÁN: READY_FOR_FINAL_DEFENSE_AND_DEPLOYMENT
HỆ THỐNG EDMS ĐÃ HOÀN TẤT TOÀN DIỆN MỌI TIÊU CHUẨN KỸ THUẬT VÀ HỒ SƠ
======================================================================
```

---

## 7. KẾ HOẠCH BẢO VỆ ĐỒ ÁN VÀ BÀN GIAO SẢN PHẨM CHÍNH THỨC

Hệ thống đã sẵn sàng cho buổi bảo vệ đồ án tốt nghiệp / đồ án chuyên ngành và chuyển giao công nghệ:
1. **Mã nguồn và nhánh triển khai**:
   - Nhánh `completion/edms-hardening` đã hoàn thiện sạch sẽ, sẵn sàng tạo Pull Request hợp nhất vào nhánh chính `main`.
2. **Kịch bản Demo trực tiếp (Live Demo Showcase)**:
   - Áp dụng chuẩn xác 9 phân cảnh trình diễn theo hướng dẫn tại [`docs/completion/06_FINAL_DEMO_GUIDE.md`](file:///f:/DoAn_CNPMNC/docs/completion/06_FINAL_DEMO_GUIDE.md): từ luồng đăng nhập an toàn, tải lên trích xuất văn bản AI/OCR, ký số RSA-2048, xác thực QR công khai, kiểm tra thông báo thời gian thực WebSocket cho tới giám sát kiểm toán hệ thống.
3. **Đóng gói hồ sơ nghiệm thu**:
   - Bộ hồ sơ báo cáo 4 đợt hoàn chỉnh:
     - Đợt 1: Nền tảng kiến trúc và phân công kỹ thuật ([`Dot_1/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_1/)).
     - Đợt 2: Đóng băng hợp đồng API, thiết kế hệ thống và CSDL ([`Dot_2/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_2/)).
     - Đợt 3: Củng cố an ninh, thương mại hóa giao diện và sao lưu tự động ([`Dot_3/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_3/)).
     - Đợt 4: Giao tiếp thời gian thực, tối ưu di động và nghiệm thu tổng thể ([`Dot_4/`](file:///f:/DoAn_CNPMNC/phân%20công%20và%20báo%20cáo/báo%20cáo/Dot_4/)).

---
*Xác nhận và phê duyệt của Project Lead:*  
**Võ Trọng Hiếu** (Business Analyst / Project Lead / Requirements Owner) — *Đã ký duyệt nghiệm thu chính thức toàn bộ Đợt 4 và Dự án.*
