# BÁO CÁO NÂNG CẤP GIAO DIỆN VÀ PHÂN HỆ TRUNG TÂM TÁC VỤ EDMS

**Nhánh phát triển:** `feat/modern-ui-task-management`  
**Ngày thực hiện:** 20/11/2026  
**Trạng thái:** Hoàn thành toàn diện, vượt qua 100% kiểm thử tích hợp và kiểm tra giao diện thực tế.

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC THIẾT KẾ

Nhiệm vụ trọng tâm là hiện đại hóa giao diện EDMS (Enterprise Document Management System) theo chuẩn Enterprise SaaS cao cấp, đồng thời bổ sung phân hệ **Quản lý công việc thủ công** (Manual Task Management) tích hợp mượt mà vào Trung tâm công việc (`TaskCenterPage`), đáp ứng trọn vẹn các nguyên tắc:

1. **Bảo toàn 100% nghiệp vụ quy trình hiện có:** Giữ nguyên vẹn cơ chế suy diễn 3 loại tác vụ hệ thống (`REVIEW_PENDING`, `DISPOSITION_PENDING`, `REVISION_REQUIRED`) từ dữ liệu duyệt, tiêu hủy và vòng đời tài liệu của `TaskCenterService.java`.
2. **Mô hình dữ liệu độc lập, an toàn:** Không ghi đè hoặc can thiệp vào các bảng nghiệp vụ tài liệu. Khởi tạo 2 bảng dữ liệu chuyên biệt `manual_tasks` và `manual_task_activities` với khóa ngoại, chỉ mục (indexes) tối ưu và không tạo migration phá hủy dữ liệu.
3. **Thiết kế giao diện Enterprise SaaS thống nhất:**
   - Tone màu chủ đạo: Xanh Navy hoàng gia (`#111D35` / `#1E3A8A`) kết hợp nền sáng tinh giản (`#F8FAFC` / `#FFFFFF`).
   - Card chỉ số KPI có viền mỏng, đổ bóng nhẹ (`box-shadow: 0 1px 3px rgba(0,0,0,0.06)`).
   - Hỗ trợ song song 2 góc nhìn làm việc: **Kanban Board** (4 cột quy trình) và **List View** (bảng dữ liệu trực quan).
   - Tương thích toàn diện Dark Mode và responsive từ màn hình Desktop (1440px), Laptop (1366px), Tablet (768px) đến Mobile (375px).
4. **Bảo mật và phân quyền chặt chẽ:** Kiểm tra RBAC ở cả tầng controller và service backend, ghi log kiểm toán (`AuditService`) cho mọi thao tác và phát thông báo thời gian thực qua WebSocket (`NotificationService`).

---

## 2. KIẾN TRÚC DỮ LIỆU VÀ BACKEND

### 2.1. Cấu trúc thực thể và quan hệ

Phân hệ công việc thủ công được xây dựng độc lập với 2 thực thể chính:

- **`ManualTask` (Bảng `manual_tasks`):**
  - `id`: Định danh khóa chính (BIGSERIAL).
  - `title`: Tiêu đề công việc (VARCHAR 255, NOT NULL).
  - `description`: Mô tả chi tiết yêu cầu công việc (TEXT).
  - `assignee`: Tên đăng nhập người phụ trách (VARCHAR 100, NOT NULL, indexed).
  - `created_by`: Tên người giao việc (VARCHAR 100, NOT NULL, indexed).
  - `priority`: Mức ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `status`: Trạng thái xử lý (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`).
  - `due_date`: Thời hạn xử lý (TIMESTAMP WITH TIME ZONE, indexed).
  - `document_id` & `document_title`: Khóa liên kết tài liệu tùy chọn.
  - `notes`: Ghi chú nội bộ hoặc kết quả xử lý.
  - `created_at`, `updated_at`, `completed_at`: Mốc thời gian theo dõi tiến độ.
  - Phương thức bổ trợ `isOverdue()`: Xác định động công việc bị trễ hạn khi `dueDate < now()` và `status != DONE && status != CANCELLED`.

- **`ManualTaskActivity` (Bảng `manual_task_activities`):**
  - `id`: Định danh khóa chính (BIGSERIAL).
  - `task_id`: Mã công việc liên kết (BIGINT, indexed).
  - `username` & `user_full_name`: Danh tính người thực hiện thao tác.
  - `action`: Hành động (`CREATED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `UPDATED`, `NOTE_ADDED`).
  - `old_value`, `new_value`: Giá trị trước và sau khi thay đổi (audit diff).
  - `comment`: Lời nhắn hoặc lý do cập nhật.
  - `created_at`: Thời điểm ghi nhận.

### 2.2. Danh mục API RESTful (`/api/manual-tasks`)

Hệ thống cung cấp trọn bộ API chuẩn REST:

| Phương thức | Endpoint | Phân quyền | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/manual-tasks` | Xác thực | Danh sách công việc phân trang, lọc đa tiêu chí (assignee, status, priority, overdue, search) |
| `GET` | `/api/manual-tasks/summary` | Xác thực | Thống kê KPI tổng quan (total, todo, inProgress, done, overdue) theo phạm vi quyền |
| `GET` | `/api/manual-tasks/assignees` | Xác thực | Danh sách người dùng hợp lệ trong hệ thống để phân công |
| `GET` | `/api/manual-tasks/{id}` | Xác thực | Xem chi tiết công việc kèm toàn bộ dòng lịch sử hoạt động |
| `POST` | `/api/manual-tasks` | ADMIN, STAFF | Tạo mới công việc, tự động ghi audit và gửi thông báo tới người nhận |
| `PUT` | `/api/manual-tasks/{id}` | Quản trị / Người tạo | Cập nhật toàn diện thông tin công việc, người phụ trách, thời hạn |
| `PATCH` | `/api/manual-tasks/{id}/status` | Người nhận / Người tạo / Admin | Cập nhật nhanh trạng thái công việc kèm ghi chú tiến độ |
| `DELETE` | `/api/manual-tasks/{id}` | Admin / Người tạo | Xóa bỏ công việc khỏi hệ thống kèm dọn dẹp lịch sử liên quan |

### 2.3. Quy tắc kiểm soát phân quyền (RBAC)

1. **Xem công việc:**
   - Người dùng có vai trò `ROLE_ADMIN` được quyền tra cứu toàn bộ công việc trên toàn hệ thống.
   - Người dùng vai trò `ROLE_STAFF` và `ROLE_USER` chỉ được xem công việc do chính mình được phân công hoặc do mình khởi tạo.
2. **Cập nhật trạng thái:**
   - Người phụ trách (`assignee`), người tạo (`createdBy`) hoặc Quản trị viên (`ROLE_ADMIN`) có quyền chuyển trạng thái (`TODO` -> `IN_PROGRESS` -> `DONE` / `CANCELLED`).
3. **Chỉnh sửa / Xóa:**
   - Chỉ người tạo (`createdBy`) hoặc Quản trị viên (`ROLE_ADMIN`) mới có quyền chỉnh sửa cấu trúc hoặc xóa công việc. Mọi nỗ lực truy cập trái phép trả về mã lỗi HTTP 403 Forbidden.

---

## 3. GIAO DIỆN NGƯỜI DÙNG SAAS VÀ TRUNG TÂM CÔNG VIỆC

Giao diện Trung tâm công việc (`frontend/src/pages/TaskCenterPage.tsx`) được tái cấu trúc thành 2 Tab chính:

### 3.1. Tab 1: Công việc phân công (Manual Tasks Subsystem)

- **Header & Thanh thao tác:** Hiển thị tiêu đề, nút "Giao công việc mới" và nút "Làm mới" tức thì.
- **5 Thẻ thống kê KPI cao cấp:**
  1. *Tổng công việc:* Tổng số tác vụ trong phạm vi quyền hạn của người dùng.
  2. *Cần làm (TODO):* Đang chờ tiếp nhận giải quyết.
  3. *Đang thực hiện (IN_PROGRESS):* Đang trong tiến trình giải quyết.
  4. *Quá thời hạn (OVERDUE):* Công việc chưa hoàn thành nhưng đã vượt mốc deadline.
  5. *Hoàn thành (DONE):* Nhiệm vụ đã giải quyết thành công.
- **Thanh tìm kiếm & Bộ lọc linh hoạt:**
  - Ô tìm kiếm từ khóa theo tiêu đề, nội dung, ID.
  - Dropdown lọc theo Trạng thái (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`).
  - Dropdown lọc theo Mức ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Dropdown lọc theo Người phụ trách.
  - Nút bấm chuyển đổi nhanh chế độ lọc "Quá hạn".
- **Chế độ hiển thị kép (Dual-View Switcher):**
  - **Kanban View:** Bảng kéo thả/thao tác trực quan gồm 4 cột quy trình chuẩn. Mỗi thẻ công việc hiển thị mã ID, tiêu đề, tóm tắt mô tả, badge ưu tiên, tên người phụ trách kèm avatar, hạn xử lý và các nút chuyển trạng thái nhanh ("Bắt đầu làm", "Hoàn thành", "Mở lại").
  - **List View:** Bảng dữ liệu quản trị thanh lịch với đầy đủ các cột ID, Tiêu đề, Người phụ trách, Mức ưu tiên, Hạn xử lý, Trạng thái và Tài liệu liên kết.
- **Modal Giao việc mới:** Biểu mẫu tiện ích với validation thời gian thực, hỗ trợ phân công nhân sự, chọn mức ưu tiên, chọn deadline qua date-picker và liên kết tài liệu từ kho EDMS.
- **Modal Chi tiết & Lịch sử hoạt động (Activity Timeline):** Hiển thị chi tiết nội dung công việc, ghi chú hiện tại, cụm nút chuyển nhanh trạng thái và dòng thời gian hoạt động chi tiết (ai đã tạo việc, ai đổi trạng thái, kèm lời nhắn tiến độ).

### 3.2. Tab 2: Nhiệm vụ hệ thống (System Derived Tasks)

- Bảo toàn nguyên vẹn 100% 3 loại nhiệm vụ quy trình sẵn có:
  - `REVIEW_PENDING`: Yêu cầu phê duyệt tài liệu đang chờ kiểm duyệt.
  - `DISPOSITION_PENDING`: Hồ sơ tài liệu đã hết thời hạn lưu trữ cần phê duyệt tiêu hủy.
  - `REVISION_REQUIRED`: Tài liệu bị từ chối phê duyệt yêu cầu tải lên phiên bản hiệu chỉnh mới.
- Giữ nguyên các thao tác điều hướng trực tiếp sang "Hàng đợi duyệt" (`ReviewQueuePage`) và "Hàng đợi tiêu hủy" (`DispositionQueuePage`).

---

## 4. BẰNG CHỨNG HÌNH ẢNH GIAO DIỆN THỰC TẾ

Tất cả các ảnh chụp màn hình được tạo từ ứng dụng đang chạy thật trên môi trường thực thông qua trình duyệt Chromium tự động:

| STT | Tên file hình ảnh minh chứng | Mô tả chi tiết giao diện |
| :--- | :--- | :--- |
| 1 | [01_task_center_kanban_desktop_1440.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/01_task_center_kanban_desktop_1440.png) | Giao diện Kanban Board Desktop (1440x900) với 4 cột trạng thái, thẻ công việc SaaS và 5 KPI counters |
| 2 | [02_task_center_list_desktop_1440.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/02_task_center_list_desktop_1440.png) | Giao diện Bảng dữ liệu List View (1440x900) với bộ lọc đa tiêu chí, phân cột rõ ràng và thẻ trạng thái |
| 3 | [03_task_center_create_modal.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/03_task_center_create_modal.png) | Modal Giao việc mới với form nhập liệu đầy đủ trường, validation và dropdown chọn người phụ trách |
| 4 | [04_task_center_detail_timeline.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/04_task_center_detail_timeline.png) | Modal Chi tiết công việc kèm Dòng thời gian lịch sử hoạt động (Audit Timeline) và cụm nút thao tác |
| 5 | [05_task_center_system_tasks_tab.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/05_task_center_system_tasks_tab.png) | Tab Nhiệm vụ hệ thống bảo toàn 100% các tác vụ quy trình duyệt tài liệu và tiêu hủy |
| 6 | [06_task_center_dark_mode.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/06_task_center_dark_mode.png) | Giao diện Dark Mode tone màu Navy Slate tương phản cao, dịu mắt và đồng bộ toàn hệ thống |
| 7 | [07_task_center_mobile_responsive_375.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/07_task_center_mobile_responsive_375.png) | Giao diện Responsive trên thiết bị di động (375x812) với thanh menu hamburger và thẻ KPI xếp dọc |

### So sánh trực quan Trước và Sau nâng cấp

- **Trước khi nâng cấp ([after_07_task_center_1440.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/after/after_07_task_center_1440.png)):**
  - Chỉ có 1 danh sách duy nhất đọc từ 3 tác vụ quy trình hệ thống.
  - Không có chức năng tạo công việc thủ công, không phân công được nhân sự, không có thời hạn deadline, không có mức ưu tiên.
  - Không hỗ trợ Kanban Board, không có dòng thời gian ghi nhận lịch sử xử lý.
- **Sau khi nâng cấp ([01_task_center_kanban_desktop_1440.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/01_task_center_kanban_desktop_1440.png)):**
  - Tách bạch 2 Tab nghiệp vụ chuyên nghiệp.
  - Hỗ trợ toàn diện vòng đời công việc: Tạo mới -> Phân công -> Bắt đầu làm -> Hoàn thành / Hủy bỏ.
  - Đầy đủ 2 chế độ hiển thị Kanban và Bảng dữ liệu.
  - Cảnh báo trễ hạn trực quan và ghi nhận nhật ký hoạt động chi tiết từng phút.

---

## 5. KẾT QUẢ KIỂM THỬ TÍCH HỢP HỆ THỐNG

Bộ kiểm thử tự động hóa [test_manual_tasks_subsystem.py](file:///f:/DoAn_CNPMNC/scripts/test_manual_tasks_subsystem.py) đã thực thi toàn diện 11 bước kiểm thử với tỷ lệ thành công 100%:

```text
==================================================================
EDMS MANUAL TASK SUBSYSTEM INTEGRATION VERIFICATION
==================================================================
[STEP 1] Logging in test accounts (hieu, tin, user)...
SUCCESS: Authenticated hieu (ROLE_ADMIN), tin (ROLE_STAFF), user (ROLE_USER)

[STEP 2] Verifying derived system tasks endpoint (/api/tasks)...
SUCCESS: /api/tasks returned 0 system workflow tasks without modification.

[STEP 3] Verifying /api/manual-tasks/assignees...
SUCCESS: Retrieved 4 valid assignees: ['user', 'admin', 'tin', 'hieu']

[STEP 4] Verifying /api/manual-tasks/summary...
SUCCESS: Initial summary: total=5, todo=3, inProgress=1, done=1, overdue=1

[STEP 5] Creating a new manual task assigned to tin...
SUCCESS: Created task #8: title='Kiểm tra tính pháp lý của hợp đồng mua sắm thiết bị', assignee='tin', status='TODO'

[STEP 6] Verifying detail & activity history for task #8...
SUCCESS: Retrieved task #8 with 1 activity logs.

[STEP 7] Verifying filtering and keyword search...
SUCCESS: Keyword search 'pháp lý' correctly returned task #8

[STEP 8] Staff user 'tin' advances task #8 to IN_PROGRESS...
SUCCESS: Task #8 status updated to IN_PROGRESS by staff 'tin'
[STEP 8.2] Staff user 'tin' completes task #8 (DONE)...
SUCCESS: Task #8 status updated to DONE with completedAt=2026-11-20T06:38:17.403822088Z

[STEP 9] Inspecting updated activity timeline for task #8...
SUCCESS: Activity count is now 3:
  - [STATUS_CHANGED] by @tin: IN_PROGRESS -> DONE (comment: Đã hoàn thành rà soát và xác nhận các điều khoản hợp lệ)
  - [STATUS_CHANGED] by @tin: TODO -> IN_PROGRESS (comment: Đã tiếp nhận hồ sơ và bắt đầu rà soát)
  - [CREATED] by @hieu: None -> TODO (comment: Khởi tạo công việc mới)

[STEP 10] Testing RBAC boundaries (unauthorized user deletion)...
SUCCESS: Ordinary user correctly forbidden (403) from deleting task #8

[STEP 11] Cleaning up test task #8 as admin...
SUCCESS: Task #8 deleted successfully.

==================================================================
ALL 11 INTEGRATION VERIFICATION CHECKS PASSED WITH ZERO REGRESSIONS
==================================================================
```

---

## 6. DANH SÁCH FILE THAY ĐỔI VÀ BÀN GIAO

Tất cả các thay đổi được kiểm soát chặt chẽ trên nhánh `feat/modern-ui-task-management`:

### Backend (Java / Spring Boot):
1. `backend/src/main/java/com/edms/entity/ManualTask.java` - Thực thể công việc thủ công.
2. `backend/src/main/java/com/edms/entity/ManualTaskActivity.java` - Thực thể lịch sử hoạt động.
3. `backend/src/main/java/com/edms/entity/ManualTaskStatus.java` - Enum trạng thái (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`).
4. `backend/src/main/java/com/edms/entity/ManualTaskPriority.java` - Enum ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
5. `backend/src/main/java/com/edms/entity/NotificationType.java` - Bổ sung thông báo phân công và trạng thái công việc.
6. `backend/src/main/java/com/edms/repository/ManualTaskRepository.java` - Repository JPA kèm truy vấn thống kê KPI và JPA Specifications.
7. `backend/src/main/java/com/edms/repository/ManualTaskActivityRepository.java` - Repository lưu trữ lịch sử hoạt động.
8. `backend/src/main/java/com/edms/dto/ManualTaskCreateRequest.java` - DTO tạo việc mới.
9. `backend/src/main/java/com/edms/dto/ManualTaskUpdateRequest.java` - DTO chỉnh sửa việc.
10. `backend/src/main/java/com/edms/dto/ManualTaskStatusUpdateRequest.java` - DTO cập nhật trạng thái nhanh.
11. `backend/src/main/java/com/edms/dto/ManualTaskResponse.java` - DTO trả về thông tin công việc.
12. `backend/src/main/java/com/edms/dto/ManualTaskActivityResponse.java` - DTO trả về lịch sử hoạt động.
13. `backend/src/main/java/com/edms/dto/ManualTaskSummaryDto.java` - DTO chỉ số KPI.
14. `backend/src/main/java/com/edms/dto/AssigneeOptionDto.java` - DTO danh sách nhân sự phân công.
15. `backend/src/main/java/com/edms/service/ManualTaskService.java` - Business logic, RBAC, kiểm toán và thông báo.
16. `backend/src/main/java/com/edms/controller/ManualTaskController.java` - REST Controller điểm cuối `/api/manual-tasks`.

### Frontend (React / TypeScript / CSS):
17. `frontend/src/api/taskApi.ts` - TypeScript interfaces và API client cho phân hệ công việc.
18. `frontend/src/pages/TaskCenterPage.tsx` - Trung tâm công việc nâng cấp 2 Tab, Kanban & List View, modals.
19. `frontend/src/components/Navbar.tsx` - Điều hướng và icon thông báo công việc mới.
20. `frontend/src/components/NotificationPanel.tsx` - Hiển thị thông báo loại `TASK_ASSIGNED` và `TASK_STATUS_UPDATED`.
21. `frontend/src/index.css` - Hệ thống style Enterprise SaaS, Kanban columns, Task badges, Timeline, Dark mode.
22. `frontend/.dockerignore` - Tối ưu hóa build Docker context.

### Báo cáo & Kịch bản kiểm thử:
23. `scripts/test_manual_tasks_subsystem.py` - Kịch bản kiểm thử tích hợp 11 bước.
24. `scripts/seed_demo_manual_tasks.py` - Kịch bản tạo dữ liệu mẫu thực tế.
25. `frontend/scripts/capture_modern_task_center.cjs` - Kịch bản tự động chụp ảnh minh chứng UI.
26. `docs/ui-modernization/TASK_CENTER_MODERNIZATION_REPORT.md` - Báo cáo tổng thể bàn giao.
27. `docs/ui-modernization/screenshots_task_center/*.png` - Bộ 7 ảnh minh chứng giao diện thực tế.
