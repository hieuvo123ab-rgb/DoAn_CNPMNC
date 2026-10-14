# BÁO CÁO NGHIỆM THU ĐÓNG GÓI, CỦNG CỐ NHẤT QUÁN GIAO DỊCH VÀ KHÓA CHẶT EDMS PHASE 14
# (PHASE 14 — CONTROLLED CLOSURE & TRANSACTION CONSISTENCY HARDENING)

- **Dự án**: Hệ Thống Quản Trị Tài Liệu Doanh Nghiệp (EDMS)
- **Giai đoạn**: Phase 14 — Controlled Closure & Transaction Consistency Hardening
- **Môi trường**: Docker Compose (PostgreSQL 16, Spring Boot 3.3.3 / Java 21, React 18 / TypeScript / Vite)
- **Cơ chế lưu trữ**: Docker Named Volumes (`edms_pgdata`, `edms_storage_data`, `edms_keystore_data`)
- **Nguyên tắc an toàn tối thượng**:
  - **Zero Data Loss Guarantee**: Giữ nguyên vẹn toàn bộ dữ liệu tài liệu, phiên bản, chữ ký số, chỉ mục OCR và nhật ký kiểm toán từ các Sprint 1–4, Phase 5–11, Phase 13. Tuyệt đối không xóa database, không xóa Docker volumes, không sửa đổi chứng tích Lab 1 (`docs/final-evidence/`).
  - **Zero Phantom Notifications**: Sự kiện thông báo người dùng chỉ được phát sinh duy nhất sau khi giao dịch nghiệp vụ gốc đã COMMIT thành công vào cơ sở dữ liệu (`AFTER_COMMIT`).
  - **Correct Failure Isolation**: Lỗi ghi nhận thông báo sau commit không bao giờ làm rollback giao dịch nghiệp vụ chính.
  - **Concurrency-Safe Deduplication**: Khử trùng lặp thông báo đồng thời dựa trên bộ khóa định danh nghiệp vụ chuẩn xác (`eventKey`) và ràng buộc duy nhất tại database PostgreSQL.
  - **No Capability Token Leakage**: Bản ghi thông báo lịch sử không cấp quyền truy cập tài liệu; khi mở tài liệu từ thông báo luôn tái thẩm định quyền hạn thực tế hiện thời (Current ACL).
  - **Derived Task Center**: Không nhân bản bảng trạng thái nhiệm vụ tĩnh; suy diễn động từ trạng thái phiên bản hiện thời (`currentVersion`).
- **Bộ kiểm thử toàn hệ thống**: **369/369 Tests PASS (100%)**
  - Baseline Tests 1–310: 100% PASS (Sprint 1–4, Phase 5–11, Phase 13 Hardened)
  - Phase 14 Baseline Tests 311–360: 50/50 Tests PASS (100%)
  - Phase 14 Closure Tests 361–369: 9/9 Tests PASS (100%)
- **Trạng thái phê duyệt chính thức**: **`PHASE14_NOTIFICATION_TASK_CENTER_HARDENED_PASS`**

---

## 1. KIẾN TRÚC GIAO DỊCH SAU COMMIT (AFTER_COMMIT TRANSACTION ARCHITECTURE)

### 1.1. Cơ chế phát tán và xử lý sự kiện trong tiến trình (In-Process Event-Driven Architecture)
Nhằm triệt tiêu hoàn toàn rủi ro xuất hiện thông báo ảo (phantom notifications) mà không cần bổ sung các hạ tầng môi giới tin nhắn phức tạp (Kafka, RabbitMQ, Redis, Outbox table), EDMS áp dụng mô hình Spring Application Event kết hợp `@TransactionalEventListener`:

```
+-------------------------------------------------------------------------------+
|                           OUTER BUSINESS TRANSACTION                          |
|                                                                               |
|  1. Business Service (Review, Disposition, Share, Signature, Integrity)       |
|     |                                                                         |
|     +---> Thực hiện biến đổi nghiệp vụ (Cập nhật DB, lưu file, ghi audit)     |
|     |                                                                         |
|     +---> ApplicationEventPublisher.publishEvent(NotificationEvent)          |
|           (Sự kiện được lưu tạm trong TransactionSynchronizationManager)     |
|                                                                               |
|  2. Outer Transaction COMMIT SUCCESS (PostgreSQL commit dữ liệu nghiệp vụ)    |
+-------------------------------------------------------------------------------+
                                      |
                                      v (Giao dịch cha đã commit thành công)
+-------------------------------------------------------------------------------+
|                     AFTER_COMMIT EVENT LISTENER & PERSISTENCE                 |
|                                                                               |
|  3. NotificationEventListener.handleNotificationEvent(NotificationEvent)      |
|     Annotated with:                                                           |
|     @TransactionalEventListener(                                              |
|         phase = TransactionPhase.AFTER_COMMIT,                                |
|         fallbackExecution = true                                              |
|     )                                                                         |
|                                                                               |
|  4. NotificationService.createNotification(...)                               |
|     Annotated with:                                                           |
|     @Transactional(propagation = Propagation.REQUIRES_NEW)                    |
|                                                                               |
|  5. PostgreSQL: INSERT INTO notifications(...)                                |
|     (Tuân thủ chỉ mục duy nhất uq_notifications_recipient_event)              |
+-------------------------------------------------------------------------------+
```

### 1.2. Trình tự luân chuyển luồng thực thi
1. **Dịch vụ nghiệp vụ chính**:
   - `DocumentReviewService`, `DocumentDispositionService`, `DocumentService`, `SignatureService`, `IntegrityService` chuẩn bị DTO và dữ liệu nghiệp vụ.
   - Gọi `notificationService.publishNotification(...)`, `publishNotificationsForAdmins(...)`, hoặc `publishTamperAlert(...)`.
   - Phương thức này đóng gói thành `NotificationEvent` và gửi tới `ApplicationEventPublisher`.
2. **Khóa đồng bộ giao dịch**:
   - Spring Framework tạm hoãn việc kích hoạt listener cho tới khi `TransactionSynchronization.afterCommit()` được gọi.
3. **Phân tách giao dịch độc lập (`REQUIRES_NEW`)**:
   - Sau khi giao dịch cha commit thành công, `NotificationEventListener` bắt sự kiện và gọi `NotificationService.createNotification()`.
   - `NotificationService.createNotification()` mở một transaction mới (`REQUIRES_NEW`) độc lập hoàn toàn để lưu trữ bản ghi thông báo vào PostgreSQL.

---

## 2. BẢO ĐẢM TRIỆT TIÊU THÔNG BÁO ẢO (WHY PHANTOM NOTIFICATIONS ARE IMPOSSIBLE)

### 2.1. Phân tích rủi ro của `REQUIRES_NEW` đơn thuần
Trong các thiết kế trước đây, nếu gọi trực tiếp một phương thức `@Transactional(propagation = Propagation.REQUIRES_NEW)` bên trong transaction cha:
1. Transaction cha mở $\rightarrow$ Gọi `createNotification()` với `REQUIRES_NEW`.
2. Transaction con `REQUIRES_NEW` commit bản ghi thông báo vào database ngay lập tức.
3. Quay trở lại transaction cha $\rightarrow$ Xảy ra lỗi ngoại lệ, xung đột khóa chính, hoặc rollback.
4. Nghiệp vụ chính bị rollback (ví dụ: thẩm định chưa được duyệt, tài liệu chưa được chia sẻ), nhưng thông báo đã nằm vĩnh viễn trong database.
5. **Hậu quả**: Người dùng nhận được thông báo về một sự kiện không có thật (Phantom Notification).

### 2.2. Cơ chế khóa chặn `AFTER_COMMIT`
Với `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`:
- Nếu giao dịch nghiệp vụ thất bại hoặc bị rollback ở bất kỳ thời điểm nào trước commit, Spring **tuyệt đối không bao giờ kích hoạt** `NotificationEventListener`.
- Bản ghi thông báo không bao giờ được tạo ra.
- **Chứng minh thực nghiệm**:
  - **TEST 361**: Cố ý kích hoạt lỗi trong giao dịch thẩm định sau bước chuẩn bị thông báo $\rightarrow$ Thẩm định rollback về PENDING, thông báo `REVIEW_APPROVED` không tăng (0 bản ghi).
  - **TEST 362**: Cố ý kích hoạt lỗi khi chia sẻ tài liệu $\rightarrow$ Quyền chia sẻ không tồn tại trong database, không có thông báo `DOCUMENT_SHARED`.
  - **TEST 363**: Cố ý ném lỗi trong giao dịch phê duyệt tiêu hủy $\rightarrow$ Trạng thái tài liệu giữ nguyên, không có thông báo `DISPOSITION_APPROVED`.
  - **TEST 364**: Cố ý mô phỏng lỗi trong quá trình ký số $\rightarrow$ Phiên bản vẫn chưa ký, không phát sinh thông báo `DOCUMENT_SIGNED`.

---

## 3. CÔ LẬP LỖI SAU COMMIT (NOTIFICATION FAILURE AFTER CORE COMMIT)

### 3.1. Chiều cô lập đúng đắn (Unidirectional Failure Isolation)
Một hệ thống quản trị tài liệu cần đảm bảo rằng **nghiệp vụ tài liệu là tối thượng**:
- Nếu giao dịch nghiệp vụ chính đã hoàn tất và cam kết vào cơ sở dữ liệu (`COMMIT SUCCESS`), việc lưu thông báo phụ trợ sau đó gặp sự cố kỹ thuật (ví dụ: database áp lực tải cao, vi phạm định dạng chuỗi) **không bao giờ được phép làm rollback hoặc đảo ngược trạng thái nghiệp vụ chính**.
- Trong `NotificationEventListener`:
  ```java
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void handleNotificationEvent(NotificationEvent event) {
      try {
          if (event.isSimulatePersistenceFailure()) {
              throw new RuntimeException("Simulated notification persistence failure after core commit (Test Hook)");
          }
          notificationService.createNotification(...);
      } catch (Exception ex) {
          log.error("Failed to persist notification after core transaction commit: {}", ex.getMessage(), ex);
          // Không throw lại ngoại lệ để bảo vệ tính toàn vẹn trạng thái nghiệp vụ cha
      }
  }
  ```

### 3.2. Giới hạn đã biết và tài liệu hóa trung thực (Documented Limitation)
- **Known Limitation**: Trong trường hợp hãn hữu khi dịch vụ thông báo gặp sự cố sau khi nghiệp vụ chính đã commit (hoặc container bị crash ngay giữa tích tắc commit nghiệp vụ và lưu thông báo), bản ghi thông báo có thể bị thất lạc trong khi dữ liệu nghiệp vụ đã lưu thành công.
- Do Phase 14 tuân thủ nghiêm ngặt chỉ thị không bổ sung hệ thống xếp hàng bền vững (Kafka/RabbitMQ) hay outbox polling, đây là sự đánh đổi có chủ đích để giữ kiến trúc gọn nhẹ, an toàn và không gây overhead không cần thiết. Trạng thái nghiệp vụ và nhật ký kiểm toán (Audit Logs) luôn được bảo toàn trọn vẹn 100%.
- **Chứng minh thực nghiệm**:
  - **TEST 365**: Nghiệp vụ duyệt thẩm định thành công, sau đó cố ý ép lỗi ghi nhận thông báo $\rightarrow$ Bản ghi thẩm định vẫn là `APPROVED`, nhật ký kiểm toán `REVIEW_APPROVE` vẫn ghi nhận đầy đủ, không bị rollback.

---

## 4. CHIẾN LƯỢC KHÓA KHỬ TRÙNG LẶP (DEDUPLICATION KEY STRATEGY)

### 4.1. Khóa định danh nghiệp vụ tất định (Deterministic Business Event Keys)
Để chống trùng lặp dữ liệu, Phase 14 áp dụng thuộc tính `event_key` (VARCHAR 128) trên bảng `notifications`. Khóa được sinh tự động theo quy tắc cấu trúc thực thể bền vững, **tuyệt đối không sử dụng timestamp hay chuỗi thông điệp UI dễ thay đổi**:

| Loại thông báo (`type`) | Định dạng `event_key` chuẩn | Ví dụ thực tế |
| :--- | :--- | :--- |
| `REVIEW_SUBMITTED` | `REVIEW_SUBMITTED:<reviewId>` | `REVIEW_SUBMITTED:45` |
| `REVIEW_APPROVED` | `REVIEW_APPROVED:<reviewId>` | `REVIEW_APPROVED:45` |
| `REVIEW_REJECTED` | `REVIEW_REJECTED:<reviewId>` | `REVIEW_REJECTED:45` |
| `DISPOSITION_REQUESTED` | `DISPOSITION_REQUESTED:<dispositionId>` | `DISPOSITION_REQUESTED:12` |
| `DISPOSITION_APPROVED` | `DISPOSITION_APPROVED:<dispositionId>` | `DISPOSITION_APPROVED:12` |
| `DISPOSITION_REJECTED` | `DISPOSITION_REJECTED:<dispositionId>` | `DISPOSITION_REJECTED:12` |
| `DOCUMENT_SHARED` | `DOCUMENT_SHARED:<documentId>:<recipientUsername>` | `DOCUMENT_SHARED:102:staff` |
| `DOCUMENT_PERMISSION_UPDATED` | `DOCUMENT_PERMISSION_UPDATED:<documentId>:<recipientUsername>:<permissionLevel>` | `DOCUMENT_PERMISSION_UPDATED:102:staff:EDIT` |
| `DOCUMENT_ACCESS_REVOKED` | `DOCUMENT_ACCESS_REVOKED:<documentId>:<recipientUsername>` | `DOCUMENT_ACCESS_REVOKED:102:staff` |
| `DOCUMENT_SIGNED` | `DOCUMENT_SIGNED:<documentId>:<versionNumber>` | `DOCUMENT_SIGNED:102:1` |
| `INTEGRITY_TAMPER_DETECTED` | `INTEGRITY_TAMPER:<documentId>:<versionNumber>` | `INTEGRITY_TAMPER:102:1` |

---

## 5. BẢO VỆ KHỬ TRÙNG LẶP CẤP CƠ SỞ DỮ LIỆU VÀ ĐỒNG THỜI (DATABASE-LEVEL & CONCURRENT DEDUPLICATION)

### 5.1. Chỉ mục duy nhất có điều kiện tại PostgreSQL
Khóa khử trùng lặp được áp đặt trực tiếp tại tầng cơ sở dữ liệu PostgreSQL thông qua Partial Unique Index:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_recipient_event 
ON notifications(recipient_username, event_key) 
WHERE event_key IS NOT NULL;
```
- **Phạm vi bảo vệ cục bộ cho từng người nhận**: Việc kết hợp `(recipient_username, event_key)` đảm bảo rằng nhiều người nhận khác nhau vẫn có thể nhận cùng một sự kiện hệ thống (ví dụ: nhiều quản trị viên cùng nhận `REVIEW_SUBMITTED:45`), nhưng mỗi người nhận chỉ nhận **chính xác 1 bản ghi duy nhất**.
- **Khả năng tương thích ngược**: Mệnh đề `WHERE event_key IS NOT NULL` bảo đảm các bản ghi thông báo lịch sử cũ (có `event_key = NULL`) không bao giờ bị xung đột khóa.

### 5.2. Xử lý an toàn ngoại lệ tranh chấp đồng thời
Khi hai tiến trình hoặc hai luồng kiểm định toàn vẹn cố gắng ghi nhận cùng một `(recipient_username, event_key)` đồng thời:
1. Luồng thứ nhất thực hiện INSERT thành công.
2. Luồng thứ hai chạm ràng buộc duy nhất và ném `DataIntegrityViolationException`.
3. `NotificationService` bắt `DataIntegrityViolationException`, ghi nhận cảnh báo deduplication vào log và kết thúc an toàn, **không để lỗi làm hỏng Hibernate Session hay bắn lỗi 500 ra ngoài**.
- **Chứng minh thực nghiệm**:
  - **TEST 366**: Bắn 5 yêu cầu tạo thông báo đồng thời qua đa luồng với cùng `eventKey` $\rightarrow$ Kết quả trong database chỉ tồn tại duy nhất 1 bản ghi.
  - **TEST 367**: Thực hiện kiểm tra tính toàn vẹn lặp lại nhiều lần sau khi tệp bị sửa đổi byte vật lý $\rightarrow$ Chỉ có 1 thông báo `INTEGRITY_TAMPER_DETECTED` duy nhất được lưu.

---

## 6. PHÂN TÁCH GIỮA BẢN GHI THÔNG BÁO VÀ QUYỀN TRUY CẬP THỰC TẾ (NOTIFICATION VS CURRENT ACL)

### 6.1. Nguyên tắc Không coi thông báo là Capability Token
- Một thông báo mang tính chất thông tin lịch sử về một sự kiện đã diễn ra trong quá khứ. Nó **tuyệt đối không mang quyền truy cập (capability token)** vượt qua các quy tắc phân quyền hệ thống.
- Khi người dùng click vào một thông báo có `actionKey = OPEN_DOCUMENT` để mở `/documents/:id`:
  - Frontend gọi `GET /api/documents/:id`.
  - Backend kích hoạt `DocumentAccessService.getUserPermissionLevel(doc, username, isAdmin)`.
  - Nếu quyền truy cập của người dùng đó đã bị thu hồi (`DOCUMENT_ACCESS_REVOKED`), hệ thống lập tức trả về **HTTP 403 Forbidden**.
- **Chứng minh thực nghiệm**:
  - **TEST 368**: Chủ sở hữu chia sẻ tài liệu cho `staff` $\rightarrow$ `staff` nhận thông báo `DOCUMENT_SHARED`. Sau đó chủ sở hữu thu hồi quyền $\rightarrow$ Thông báo vẫn hiển thị trong hộp thư của `staff`, nhưng khi `staff` mở tài liệu, hệ thống trả về mã **HTTP 403 Forbidden** chính xác.

### 6.2. Kiểm soát điều hướng có kiểm duyệt (Controlled Action Key Whitelist)
Hệ thống chỉ chấp nhận danh sách các hành động nội bộ được quy định trước:
`OPEN_DOCUMENT`, `OPEN_REVIEW_QUEUE`, `OPEN_DISPOSITION_QUEUE`, `OPEN_VERSION_HISTORY`, `OPEN_INTEGRITY`.
Tuyệt đối không lưu trữ hay điều hướng tới các đường dẫn tùy ý (`http://`, `javascript:`, `data:`).

---

## 7. SUY DIỄN NHIỆM VỤ THEO PHIÊN BẢN HIỆN THỜI (TASK CURRENT-VERSION DERIVATION)

- Trung tâm Nhiệm vụ (`GET /api/tasks`) tuân thủ nghiêm ngặt nguyên tắc **Derived State — No Duplicate Task Status**:
  - Nhiệm vụ `REVISION_REQUIRED` chỉ xuất hiện khi phiên bản **hiện thời** (`doc.getCurrentVersionNumber()`) có trạng thái `reviewStatus = 'REJECTED'`.
  - Nếu phiên bản v1 bị từ chối, nhưng chủ sở hữu đã tải lên phiên bản mới v2 (đang ở trạng thái `DRAFT` hoặc `PENDING`), điều kiện phiên bản hiện thời bị từ chối không còn thỏa mãn $\rightarrow$ Nhiệm vụ tự động biến mất ngay lập tức mà không cần bất kỳ lệnh xóa nhiệm vụ thủ công nào.
  - Các bản ghi thẩm định cũ của phiên bản lịch sử vẫn được bảo toàn nguyên vẹn trong bảng `document_reviews` phục vụ mục đích kiểm toán.

---

## 8. QUẢN LÝ TỰ ĐỘNG THĂM DÒ VÀ GIAO DIỆN NGƯỜI DÙNG (FRONTEND POLLING CLEANUP & UX)

### 8.1. Dọn dẹp Timer trong React Lifecycle
- Trong thành phần `frontend/src/components/Navbar.tsx`:
  ```typescript
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Chu kỳ 30 giây
    return () => clearInterval(interval); // Cleanup bắt buộc ngăn chặn rò rỉ timer
  }, [user]);
  ```
- Việc gọi `clearInterval` trong hàm hủy của `useEffect` ngăn chặn triệt để tình trạng nhân bản interval khi người dùng chuyển trang hoặc re-render component.

### 8.2. Quy tắc hiển thị huy hiệu (99+ Badge Rule)
- `unreadCount == 0`: Ẩn hoàn toàn huy hiệu trên biểu tượng quả chuông.
- `1 <= unreadCount <= 99`: Hiển thị số lượng chính xác.
- `unreadCount >= 100`: Hiển thị định dạng rút gọn `99+`.

---

## 9. XÁC THỰC THAM SỐ PHÂN TRANG (PAGINATION VALIDATION)

- Trong `NotificationController.java`:
  - `page`: Yêu cầu `page >= 0`.
  - `size`: Yêu cầu `1 <= size <= 100`.
  - Khi client gửi các giá trị bất thường (ví dụ: `page=-1`, `size=0`, `size=1000`), hệ thống trả về mã **HTTP 400 Bad Request** với thông điệp rõ ràng, triệt tiêu hoàn toàn khả năng ném ngoại lệ không kiểm soát **HTTP 500 Internal Server Error**.
- **Chứng minh thực nghiệm**:
  - **TEST 369**: Gọi endpoint lấy danh sách thông báo với `page=-1`, `size=0`, `size=1000` $\rightarrow$ Tất cả đều trả về **HTTP 400 Bad Request**.

---

## 10. BẢNG CHỨNG TÍCH TOÀN BỘ CÁC BÀI TEST ĐÓNG GÓI PHASE 14 (TESTS 361–369)

| Bài test | Kịch bản kiểm thử giao dịch & củng cố | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- |
| **TEST 361** | Mô phỏng lỗi giao dịch thẩm định sau bước chuẩn bị thông báo $\rightarrow$ Không tạo thông báo ảo (`REVIEW_APPROVED` = 0) | **PASS (100%)** | Hoàn thành |
| **TEST 362** | Mô phỏng lỗi trong giao dịch chia sẻ tài liệu $\rightarrow$ Không cấp quyền, không tạo thông báo ảo `DOCUMENT_SHARED` | **PASS (100%)** | Hoàn thành |
| **TEST 363** | Mô phỏng rollback giao dịch duyệt tiêu hủy $\rightarrow$ Dữ liệu giữ nguyên, không tạo thông báo `DISPOSITION_APPROVED` | **PASS (100%)** | Hoàn thành |
| **TEST 364** | Mô phỏng lỗi ký số văn bản $\rightarrow$ Phiên bản vẫn chưa ký, không tạo thông báo `DOCUMENT_SIGNED` | **PASS (100%)** | Hoàn thành |
| **TEST 365** | Lỗi lưu thông báo sau khi nghiệp vụ chính đã commit $\rightarrow$ Nghiệp vụ chính vẫn thành công (`APPROVED`), audit log bảo toàn | **PASS (100%)** | Hoàn thành |
| **TEST 366** | Tạo thông báo đồng thời qua đa luồng với cùng `eventKey` $\rightarrow$ Khử trùng lặp chính xác, chỉ có 1 bản ghi duy nhất | **PASS (100%)** | Hoàn thành |
| **TEST 367** | Kiểm tra toàn vẹn tệp bị sửa đổi byte lặp lại $\rightarrow$ Chỉ phát sinh duy nhất 1 cảnh báo `INTEGRITY_TAMPER_DETECTED` | **PASS (100%)** | Hoàn thành |
| **TEST 368** | Mở tài liệu qua thông báo lịch sử sau khi quyền đã bị thu hồi $\rightarrow$ Tái kiểm tra ACL hiện thời, trả về HTTP 403 Forbidden | **PASS (100%)** | Hoàn thành |
| **TEST 369** | Xác thực tham số phân trang thông báo (`page < 0`, `size < 1`, `size > 100`) $\rightarrow$ Trả về HTTP 400 Bad Request (không phải 500) | **PASS (100%)** | Hoàn thành |

---

## 11. BỀN VỮNG KHỞI ĐỘNG LẠI VÀ ĐÓNG GÓI SẢN XUẤT (PERSISTENCE & PRODUCTION BUILDS)

### 11.1. Bền vững trên Docker Named Volumes
- Sau khi khởi động lại toàn bộ ngăn xếp dịch vụ (`docker compose restart`), các thành phần sau được xác thực duy trì tính toàn vẹn 100%:
  1. Toàn bộ bản ghi thông báo và cờ `is_read`.
  2. Bảng ánh xạ khóa duy nhất `uq_notifications_recipient_event`.
  3. Trạng thái suy diễn của User Task Center.
  4. Lịch sử thẩm định, tiêu hủy, và chữ ký số RSA-2048 PKCS12 trên kho khóa.
  5. Các tệp tin vật lý trong thư mục lưu trữ `/app/storage/uploads`.

### 11.2. Kết quả biên dịch Production Bundle
- **Backend Production Package**:
  - `mvn clean package -DskipTests` hoàn tất thành công trong container `maven:3.9.6-eclipse-temurin-21`.
  - Tệp jar sản phẩm: `/app/target/edms-backend-1.0.0-SNAPSHOT.jar`.
- **Frontend Production Build**:
  - `npm run build` thực thi `tsc && vite build`.
  - 1653 modules biên dịch không có lỗi nào, tạo gói tài nguyên tĩnh tối ưu:
    - `dist/index.html` (0.98 kB)
    - `dist/assets/index-CbKIshgg.css` (24.15 kB)
    - `dist/assets/index-B1t6ZffT.js` (428.49 kB)
- **Sức khỏe Docker Containers**:
  - `edms-postgres`: Up (healthy)
  - `edms-backend`: Up (healthy / port 8080)
  - `edms-frontend`: Up (port 5173)

---

## 12. PHÁN QUYẾT CHÍNH THỨC VÀ KHÓA CHẶT (FINAL VERDICT & GATE CLOSURE)

1. **Tổng số bài test vượt qua**: **369/369 Tests PASS (100%)**.
2. **Khóa chặn Giao dịch**: Toàn bộ luồng phát sinh thông báo đều vận hành theo cơ chế `AFTER_COMMIT` an toàn tuyệt đối.
3. **Khử trùng lặp**: Hoạt động bền vững ở cấp cơ sở dữ liệu với khóa nghiệp vụ tất định.
4. **Phân quyền**: Bản ghi thông báo không đóng vai trò token truy cập, luôn tuân thủ ACL hiện thời.
5. **Dừng tại cổng Phase 14**: Không tự ý triển khai bất kỳ tính năng nào của Phase 15 khi chưa có sự ủy quyền chính thức.

**PHÁN QUYẾT NGHIỆM THU**:
# **`PHASE14_NOTIFICATION_TASK_CENTER_HARDENED_PASS`**
