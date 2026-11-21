# BÁO CÁO NÂNG CẤP TRUNG TÂM TÁC VỤ EDMS TASK CENTER 2.0

**Nhánh phát triển:** `feat/modern-ui-task-management`  
**Ngày thực hiện:** 20/11/2026  
**Trạng thái:** Hoàn thành toàn diện, vượt qua 100% kiểm thử tích hợp và kiểm tra giao diện thực tế.

---

## 1. TỔNG QUAN VÀ NGUYÊN TẮC THIẾT KẾ TASK CENTER 2.0

Phiên bản **Task Center 2.0** được triển khai theo phong cách Enterprise SaaS hiện đại, cung cấp nền tảng quản lý công việc tập trung cho hệ thống EDMS (Enterprise Document Management System):

1. **Giao diện hợp nhất (Unified Task Management):** Hiển thị song song cả công việc do quản trị viên/nhân sự giao (Manual Tasks) và các nhiệm vụ quy trình hệ thống tự động phát sinh từ tài liệu (`REVIEW_PENDING`, `DISPOSITION_PENDING`, `REVISION_REQUIRED`). Dữ liệu được quản lý thống nhất, không trùng lặp và hỗ trợ lọc linh hoạt theo nguồn (`Tất cả`, `Thủ công`, `Quy trình`).
2. **Bảo toàn 100% cơ chế nghiệp vụ gốc:** Cơ chế suy diễn 3 tác vụ quy trình tài liệu từ `TaskCenterService.java` được giữ nguyên vẹn. Tác vụ phê duyệt và tiêu hủy không bị ghi đè, không bị thay đổi trạng thái trái phép bằng kéo thả mà phải tuân theo quy trình phê duyệt tài liệu chính thức.
3. **Bảng Kanban kéo thả thực tế (True Drag & Drop):** Hỗ trợ kéo thả thẻ công việc thủ công giữa 4 cột trạng thái (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`) và đồng bộ tức thì xuống cơ sở dữ liệu qua API `PATCH /api/manual-tasks/{id}/status`. Kéo thả tác vụ hệ thống bị chặn an toàn với thông báo hướng dẫn người dùng mở đúng trang quy trình.
4. **Task Detail Drawer trượt từ cạnh phải:** Khi nhấp vào bất kỳ công việc nào trên Kanban hoặc bảng Danh sách, một Drawer thanh lịch sẽ trượt ra từ lề phải với đầy đủ thông tin: mã công việc, người phụ trách, người giao việc, thời hạn deadline, liên kết tài liệu, cụm nút chuyển trạng thái nhanh, khu vực bình luận thảo luận và dòng thời gian lịch sử hoạt động chi tiết.
5. **Phân tích tải công việc & Cơ chế nhắc hạn (Workload & Escalation):** Bảng phân tích tải công việc theo từng nhân sự (`GET /api/manual-tasks/workload`) với thanh tiến độ trực quan, đo lường tỷ lệ hoàn thành, cảnh báo tồn đọng quá hạn và nút kích hoạt quét gửi thông báo nhắc hạn tự động không trùng lặp (`POST /api/manual-tasks/escalate-check`).
6. **Hệ thống Design System Enterprise:**
   - Tone màu chủ đạo: Xanh Navy hoàng gia (`#111D35` / `#1E3A8A`) kết hợp nền sáng tinh giản (`#F8FAFC` / `#FFFFFF`).
   - Lưới 5 thẻ KPI ngang với viền màu nhận diện trạng thái và hiệu ứng di chuột nhẹ nhàng.
   - Hỗ trợ toàn diện Dark Mode và đáp ứng responsive hoàn hảo trên Desktop (1440px), Laptop (1366px), Tablet (768px) và Mobile (375px).

---

## 2. KIẾN TRÚC BACKEND VÀ CƠ SỞ DỮ LIỆU

### 2.1. Cấu trúc thực thể và quan hệ

Phân hệ công việc thủ công được tổ chức độc lập với 2 thực thể chính:

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
  - `action`: Hành động (`CREATED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `UPDATED`, `NOTE_ADDED`, `COMMENT_ADDED`).
  - `old_value`, `new_value`: Giá trị trước và sau khi thay đổi (audit diff).
  - `comment`: Lời nhắn tiến độ hoặc nội dung bình luận trao đổi.
  - `created_at`: Thời điểm ghi nhận.

### 2.2. Danh mục API RESTful (`/api/manual-tasks`)

| Phương thức | Endpoint | Phân quyền | Chức năng chi tiết |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/manual-tasks` | Xác thực | Lấy danh sách công việc phân trang, lọc theo người phụ trách, trạng thái, mức ưu tiên, quá hạn và từ khóa |
| `GET` | `/api/manual-tasks/summary` | Xác thực | Thống kê số lượng theo 5 chỉ số KPI trong phạm vi quyền hạn |
| `GET` | `/api/manual-tasks/assignees` | Xác thực | Lấy danh sách nhân sự hợp lệ trong hệ thống để phân công |
| `GET` | `/api/manual-tasks/workload` | Xác thực | Báo cáo phân bổ tải công việc theo từng nhân sự và tỷ lệ tồn đọng |
| `GET` | `/api/manual-tasks/{id}` | Xác thực | Lấy chi tiết công việc kèm toàn bộ lịch sử hoạt động và thảo luận |
| `POST` | `/api/manual-tasks` | ADMIN, STAFF | Khởi tạo công việc mới, ghi audit và phát thông báo WebSocket tới người nhận |
| `POST` | `/api/manual-tasks/{id}/comments` | Người liên quan / Admin | Thêm bình luận trao đổi vào công việc, ghi audit `COMMENT_ADDED` và gửi thông báo |
| `POST` | `/api/manual-tasks/escalate-check` | ADMIN | Kích hoạt quét và gửi thông báo nhắc hạn chót (escalation) không trùng lặp |
| `PUT` | `/api/manual-tasks/{id}` | Quản trị / Người tạo | Cập nhật thông tin công việc, phân công lại nhân sự, gia hạn deadline |
| `PATCH` | `/api/manual-tasks/{id}/status` | Người nhận / Người tạo / Admin | Cập nhật nhanh trạng thái công việc (dùng cho kéo thả Kanban và Task Drawer) |
| `DELETE` | `/api/manual-tasks/{id}` | Quản trị / Người tạo | Xóa bỏ công việc khỏi hệ thống kèm dọn dẹp lịch sử liên quan |

### 2.3. Quy tắc kiểm soát phân quyền (RBAC)

1. **Phạm vi tra cứu:** Quản trị viên (`ROLE_ADMIN`) xem toàn bộ công việc trên hệ thống; nhân sự (`ROLE_STAFF`) và người dùng (`ROLE_USER`) chỉ xem công việc do mình phụ trách hoặc do mình khởi tạo.
2. **Cập nhật trạng thái:** Người được phân công, người tạo hoặc Quản trị viên có quyền chuyển đổi trạng thái (`TODO` -> `IN_PROGRESS` -> `DONE` / `CANCELLED`).
3. **Thảo luận & Bình luận:** Mọi người dùng có quyền xem công việc đều có thể đăng bình luận trao đổi.
4. **Phân công & Xóa bỏ:** Chỉ người có quyền quản trị hoặc chính người tạo mới được sửa cấu trúc hoặc xóa công việc. Mọi hành vi vi phạm trả về HTTP 403 Forbidden.

---

## 3. BẰNG CHỨNG HÌNH ẢNH GIAO DIỆN TASK CENTER 2.0 THỰC TẾ

Tất cả các hình ảnh minh chứng dưới đây được chụp tự động trực tiếp từ ứng dụng đang hoạt động thực tế trên trình duyệt Chromium:

| STT | Tên file hình ảnh minh chứng | Mô tả chi tiết giao diện |
| :--- | :--- | :--- |
| 1 | [01_task_center_2_kanban_view.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/01_task_center_2_kanban_view.png) | Bảng Kanban Board hợp nhất với 4 cột trạng thái, kéo thả thực tế, lưới 5 thẻ KPI và bộ lọc đa tiêu chí |
| 2 | [02_task_center_2_list_view.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/02_task_center_2_list_view.png) | Bảng dữ liệu List View quản trị SaaS với đầy đủ thông tin mã ID, nguồn tác vụ, mức ưu tiên, hạn xử lý và phân trang |
| 3 | [03_task_center_2_detail_drawer.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/03_task_center_2_detail_drawer.png) | Task Detail Drawer trượt từ cạnh phải hiển thị chi tiết công việc, cụm nút đổi trạng thái, luồng bình luận và timeline hoạt động |
| 4 | [04_task_center_2_workload_analytics.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/04_task_center_2_workload_analytics.png) | Modal Phân tích tải công việc & Báo cáo tồn đọng với thanh tiến độ phân bổ theo từng nhân sự và nút quét gửi nhắc hạn |
| 5 | [05_task_center_2_dark_mode.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/05_task_center_2_dark_mode.png) | Giao diện Task Center 2.0 Dark Mode với bảng màu Navy Slate tương phản cao, chuyên nghiệp và dịu mắt |
| 6 | [06_task_center_2_mobile_drawer.png](file:///f:/DoAn_CNPMNC/docs/ui-modernization/screenshots_task_center/06_task_center_2_mobile_drawer.png) | Giao diện Task Detail Drawer trượt cạnh phải tối ưu hóa hoàn toàn trên màn hình thiết bị di động (375x812) |

---

## 4. KẾT QUẢ KIỂM THỬ TÍCH HỢP TỰ ĐỘNG

Bộ kiểm thử tích hợp tự động [test_manual_tasks_subsystem.py](file:///f:/DoAn_CNPMNC/scripts/test_manual_tasks_subsystem.py) đã thực thi toàn bộ 11 bước kiểm tra nghiệp vụ và bảo mật trên môi trường chạy thực:

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
SUCCESS: Created task #9: title='Kiểm tra tính pháp lý của hợp đồng mua sắm thiết bị', assignee='tin', status='TODO'

[STEP 6] Verifying detail & activity history for task #9...
SUCCESS: Retrieved task #9 with 1 activity logs.

[STEP 7] Verifying filtering and keyword search...
SUCCESS: Keyword search 'pháp lý' correctly returned task #9

[STEP 8] Staff user 'tin' advances task #9 to IN_PROGRESS...
SUCCESS: Task #9 status updated to IN_PROGRESS by staff 'tin'

[STEP 8.1] Adding a collaborative comment on task #9...
SUCCESS: Successfully added comment to task #9 and recorded COMMENT_ADDED in audit trail.

[STEP 8.2] Verifying workload analytics endpoint (/api/manual-tasks/workload)...
SUCCESS: Retrieved workload distribution for 4 team members:
  - @hieu (Võ Trọng Hiếu): total=1, inProgress=0, done=0, overdue=0
  - @tin (Tạ Gia Tín): total=4, inProgress=2, done=0, overdue=1
  - @admin (Quản trị viên Hệ thống): total=1, inProgress=0, done=1, overdue=0
  - @user (Người dùng Phổ thông): total=0, inProgress=0, done=0, overdue=0

[STEP 8.3] Triggering deadline escalation scan (/api/manual-tasks/escalate-check)...
SUCCESS: Escalation scan completed: reminded=1, overdue=1, message='Đã kiểm tra và gửi 1 thông báo nhắc hạn thành công (1 công việc quá hạn).'

[STEP 8.4] Staff user 'tin' completes task #9 (DONE)...
SUCCESS: Task #9 status updated to DONE with completedAt=2026-11-20T13:13:44.281250407Z

[STEP 9] Inspecting updated activity timeline for task #9...
SUCCESS: Activity count is now 4:
  - [STATUS_CHANGED] by @tin: IN_PROGRESS -> DONE (comment: Đã hoàn thành rà soát và xác nhận các điều khoản hợp lệ)
  - [COMMENT_ADDED] by @tin: None -> None (comment: Đã đính kèm biên bản thẩm định pháp lý chi tiết theo yêu cầu.)
  - [STATUS_CHANGED] by @tin: TODO -> IN_PROGRESS (comment: Đã tiếp nhận hồ sơ và bắt đầu rà soát)
  - [CREATED] by @hieu: None -> TODO (comment: Khởi tạo công việc mới)

[STEP 10] Testing RBAC boundaries (unauthorized operations)...
SUCCESS: Ordinary user correctly forbidden (403) from deleting task #9
SUCCESS: Ordinary user correctly forbidden (403) from triggering escalation check

[STEP 11] Cleaning up test task #9 as admin...
SUCCESS: Task #9 deleted successfully.

==================================================================
ALL 11 INTEGRATION VERIFICATION CHECKS PASSED WITH ZERO REGRESSIONS
==================================================================
```

---

## 5. TỔNG KẾT DANH MỤC FILE THAY ĐỔI

Mọi mã nguồn được xây dựng và đóng gói hoàn chỉnh trong nhánh phát triển `feat/modern-ui-task-management`:

### Backend (Spring Boot & Java 21):
- `backend/Dockerfile` - Cấu hình biên dịch tối ưu DNS và IPv4 cho môi trường container.
- `backend/src/main/java/com/edms/entity/ManualTask.java` - Thực thể công việc thủ công độc lập.
- `backend/src/main/java/com/edms/entity/ManualTaskActivity.java` - Thực thể lịch sử hoạt động và thảo luận.
- `backend/src/main/java/com/edms/entity/ManualTaskStatus.java` - Enum trạng thái (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`).
- `backend/src/main/java/com/edms/entity/ManualTaskPriority.java` - Enum độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- `backend/src/main/java/com/edms/entity/NotificationType.java` - Bổ sung các loại thông báo công việc, bình luận và nhắc hạn.
- `backend/src/main/java/com/edms/repository/ManualTaskRepository.java` - Repository JPA kèm truy vấn KPI và JPA Specification.
- `backend/src/main/java/com/edms/repository/ManualTaskActivityRepository.java` - Repository lịch sử hoạt động.
- `backend/src/main/java/com/edms/dto/ManualTaskCreateRequest.java` - DTO tạo công việc mới.
- `backend/src/main/java/com/edms/dto/ManualTaskUpdateRequest.java` - DTO cập nhật công việc.
- `backend/src/main/java/com/edms/dto/ManualTaskStatusUpdateRequest.java` - DTO đổi trạng thái nhanh.
- `backend/src/main/java/com/edms/dto/ManualTaskCommentRequest.java` - DTO gửi bình luận.
- `backend/src/main/java/com/edms/dto/ManualTaskWorkloadDto.java` - DTO báo cáo tải công việc nhân sự.
- `backend/src/main/java/com/edms/dto/EscalationResultDto.java` - DTO kết quả quét nhắc hạn.
- `backend/src/main/java/com/edms/dto/ManualTaskResponse.java` - DTO trả về chi tiết công việc.
- `backend/src/main/java/com/edms/dto/ManualTaskActivityResponse.java` - DTO trả về timeline hoạt động.
- `backend/src/main/java/com/edms/dto/ManualTaskSummaryDto.java` - DTO chỉ số thống kê KPI.
- `backend/src/main/java/com/edms/dto/AssigneeOptionDto.java` - DTO danh sách nhân sự.
- `backend/src/main/java/com/edms/service/ManualTaskService.java` - Nghiệp vụ CRUD, phân công, bình luận, phân tích tải và nhắc hạn.
- `backend/src/main/java/com/edms/controller/ManualTaskController.java` - REST Controller điểm cuối `/api/manual-tasks`.

### Frontend (React, TypeScript & Design System):
- `frontend/src/api/taskApi.ts` - Client API cho phân hệ công việc, bình luận, workload và escalation.
- `frontend/src/pages/TaskCenterPage.tsx` - Toàn bộ giao diện Task Center 2.0 (Kanban kéo thả, List View, Task Drawer trượt phải, Modal phân tích tải).
- `frontend/src/components/Navbar.tsx` - Sidebar Enterprise thống nhất, đồng bộ navigation view.
- `frontend/src/components/NotificationPanel.tsx` - Icon thông báo mới cho phân công, bình luận và nhắc hạn.
- `frontend/src/index.css` - Hệ thống CSS Enterprise SaaS, bảng Kanban, Task Drawer trượt phải, thanh tiến độ Workload, Dark Mode.

### Kịch bản kiểm thử và công cụ chụp ảnh:
- `scripts/test_manual_tasks_subsystem.py` - Kịch bản kiểm thử tích hợp 11 bước tự động.
- `scripts/seed_demo_manual_tasks.py` - Kịch bản sinh dữ liệu mẫu công việc thực tế.
- `frontend/scripts/capture_modern_task_center.cjs` - Kịch bản tự động hóa chụp ảnh minh chứng UI bằng Puppeteer.
- `docs/ui-modernization/TASK_CENTER_MODERNIZATION_REPORT.md` - Tài liệu báo cáo chi tiết nghiệm thu.
