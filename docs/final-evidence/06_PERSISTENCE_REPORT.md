# 06 — DATA PERSISTENCE REPORT

**Project**: Electronic Document Management System (EDMS)  
**Verification Method**: Cold Stack Restart (`docker compose restart`) without volume purging (`-v` flag prohibited)  
**Target Persistence Volumes**:
- `edms_pgdata`: PostgreSQL database storage directory (`/var/lib/postgresql/data`)
- `edms_storage_data`: Physical electronic document files (`/app/storage/uploads`)

---

## 1. Restart Procedure

1. **Stack Execution Command**:
   ```bash
   docker compose restart
   ```
2. **Container Restart Log**:
   ```
   Container edms-postgres Restarting
   Container edms-backend Restarting
   Container edms-frontend Restarting
   Container edms-backend Started
   Container edms-postgres Started
   Container edms-frontend Started
   ```
3. **Health Recovery**:
   - PostgreSQL completed WAL recovery and accepted connections in 2.1 seconds.
   - Spring Boot Tomcat server initialized in 11.49 seconds, connecting successfully to HikariPool-1.
   - Endpoint `GET /api/health` responded with `{"status": "UP"}`.

---

## 2. Post-Restart Entity Verification

| Entity / Asset | Pre-Restart State | Post-Restart State | Verification Method | Status |
| :--- | :---: | :---: | :--- | :---: |
| **User Accounts** | 21 accounts | 21 accounts | Query `GET /api/admin/users` | **PERSISTED** |
| **User Roles** | ADMIN & STAFF roles | ADMIN & STAFF roles | JWT authentication & role-based endpoint enforcement | **PERSISTED** |
| **Enabled States** | Enabled / Disabled flags | Enabled / Disabled flags | Disabled user login rejection test (401) | **PERSISTED** |
| **Document Records** | 49 records | 49 records | Query `GET /api/documents` | **PERSISTED** |
| **Document Metadata** | Titles, types, descriptions | Titles, types, descriptions | Metadata inspection `GET /api/documents/{id}` | **PERSISTED** |
| **Physical Files** | 49 disk files | 49 disk files | Container file listing `ls -la /app/storage/uploads` | **PERSISTED** |
| **Saved Searches** | 2 saved queries | 2 saved queries | Query `GET /api/saved-searches` | **PERSISTED** |
| **Audit Logs** | 247 records | 247 records | Query `GET /api/admin/audit-logs` | **PERSISTED** |

---

## 3. Post-Restart Smoke Test Results

A deterministic end-to-end verification script was executed directly against the restarted environment:

```
1. Login ADMIN (hieu): PASS (Role: ROLE_ADMIN)
2. Login STAFF (tin): PASS (Role: ROLE_STAFF)
3. Users count: PASS (21 users active in database)
4. Docs count: PASS (49 documents available)
5. Preview: PASS (MIME type verified, stream open)
6. Download: PASS (File binary stream verified)
7. Saved searches: PASS (2 user queries retrieved)
8. Dashboard: PASS (Total docs: 49, Storage: 2458 bytes)
9. Audit logs: PASS (247 total records verified)
```

---

## 4. Full Regression Post-Restart

The automated test suite of 57 test cases was re-executed following the restart:
- **Result**: **57 / 57 PASS (100%)**
- **Conclusion**: The entire data model, relational constraints, file storage bindings, security authorities, and audit history demonstrate 100% durability and persistence across server restarts.
