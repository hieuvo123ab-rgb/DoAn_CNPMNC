# 07 — SECURITY & AUTHORIZATION AUDIT

**Project**: Electronic Document Management System (EDMS)  
**Security Architecture**: Spring Security 6.3 + JJWT 0.12 + BCryptPasswordEncoder  
**Scope**: Authentication, Role-Based Access Control (RBAC), Data Sanitization, Audit Data Hygiene

---

## 1. HTTP Status Code Semantics Verification

| HTTP Status | Semantic Meaning | Enforced Scenarios in EDMS | Test Evidence |
| :---: | :--- | :--- | :---: |
| **401** | `Unauthorized` | - Không truyền Bearer Token vào endpoint bảo vệ<br>- Token sai, hết hạn hoặc không hợp lệ<br>- Đăng nhập sai mật khẩu<br>- Đăng nhập bằng tài khoản đã bị vô hiệu hóa (`enabled = false`) | TEST 2<br>TEST 3<br>TEST 9<br>TEST 34 |
| **403** | `Forbidden` | - Người dùng `ROLE_STAFF` truy cập bất kỳ endpoint quản trị nào (`/api/admin/**`)<br>- `ROLE_STAFF` cố ý cập nhật hoặc đổi metadata tài liệu của người khác | TEST 21<br>TEST 27<br>TEST 38<br>TEST 41<br>TEST 51<br>TEST 57 |
| **404** | `Not Found` | - Truy cập metadata, preview hoặc download tài liệu với ID không tồn tại (`999999`)<br>- Cập nhật tài liệu với ID không tồn tại | TEST 14<br>TEST 20 |
| **409** | `Conflict` | - Khởi tạo tài khoản người dùng mới với `username` đã tồn tại trong hệ thống | TEST 30 |
| **400** | `Bad Request` | - Gán vai trò không hợp lệ (ví dụ: `ROLE_SUPERMAN`)<br>- Cố ý vô hiệu hóa hoặc hạ quyền Quản trị viên (Admin) duy nhất còn hoạt động | TEST 37<br>TEST 39 |

---

## 2. Sensitive Information & Credential Exposure Review

A strict code and network payload review was conducted across all DTOs and API responses:

### 2.1 User & Admin DTOs
- [UserResponse.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/dto/UserResponse.java): Exposes only `id`, `username`, `fullName`, `email`, `role`, `enabled`, and `createdAt`. **Contains ZERO password, password hash, or security secrets**.
- [LoginResponse.java](file:///f:/DoAn_CNPMNC/backend/src/main/java/com/edms/dto/LoginResponse.java): Exposes only `token`, `username`, `fullName`, `email`, and `role`.

### 2.2 Password Hash Storage in PostgreSQL
- All passwords are encrypted with `BCryptPasswordEncoder` (cost factor 10).
- Hash pattern verification: Every stored password in table `users` begins with the signature `$2a$` and has a fixed length of 60 characters. Plaintext passwords are never saved to disk or written to log files.

### 2.3 JWT Token Hygiene
- Tokens are transmitted strictly via standard `Authorization: Bearer <token>` HTTP headers.
- Tokens are not passed in URLs or query strings.
- Backend logs never dump raw JWT tokens or signature keys.

---

## 3. Audit Log Security & Hygiene

Inspection of the `audit_logs` table and logging pipelines confirmed:
- **No Passwords**: The `description` and `resource_id` fields never log passwords or secret inputs.
- **Failed Login Handling**: When `LOGIN_FAILED` occurs, the event records the attempted username only (e.g. `Đăng nhập thất bại cho tài khoản: hieu`). The failed password attempt is deliberately omitted.
- **No Binary Data**: Document preview, download, and upload events log file IDs and file names only. Binary stream payloads are excluded from audit records.
- **No Self-Logging Spam**: Reading the audit log (`GET /api/admin/audit-logs`) does not trigger self-referential audit log creation.
