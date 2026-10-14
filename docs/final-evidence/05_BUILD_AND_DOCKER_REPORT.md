# 05 — BUILD AND DOCKER REPORT

**Project**: Electronic Document Management System (EDMS)  
**Date**: 2026-09-19  
**Status**: All builds and containers operational (Zero compilation or packaging errors)

---

## 1. Backend Build Verification

- **Technology**: Java 21, Spring Boot 3.3.3, Maven 3.9.6
- **Build Mechanism**: Multi-stage Dockerfile ([backend/Dockerfile](file:///f:/DoAn_CNPMNC/backend/Dockerfile))
- **Execution Command**:
  ```bash
  mvn clean package -DskipTests
  ```
- **Exit Code**: `0`
- **Result Log Summary**:
  ```
  [INFO] Compiling 46 source files with javac [debug parameters release 21] to target/classes
  [INFO] Building jar: /app/target/edms-backend-1.0.0-SNAPSHOT.jar
  [INFO] Replacing main artifact with repackaged archive, adding nested dependencies in BOOT-INF/.
  [INFO] ------------------------------------------------------------------------
  [INFO] BUILD SUCCESS
  [INFO] ------------------------------------------------------------------------
  [INFO] Total time: 10.991 s
  ```
- **Status**: **PASS**

---

## 2. Frontend Production Build Verification

- **Technology**: Node.js 20, TypeScript 5.5, React 18, Vite 5.4
- **Working Directory**: `f:\DoAn_CNPMNC\frontend`
- **Execution Command**:
  ```bash
  npm run build
  ```
- **Exit Code**: `0`
- **Result Log Output**:
  ```
  > edms-frontend@1.0.0 build
  > tsc && vite build

  vite v5.4.21 building for production...
  transforming...
  ✓ 1641 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   0.98 kB │ gzip:  0.60 kB
  dist/assets/index-BbCXU79D.css   24.04 kB │ gzip:  4.98 kB
  dist/assets/index-BwOeFt0q.js   290.34 kB │ gzip: 86.52 kB
  ✓ built in 2.41s
  ```
- **Status**: **PASS** (Zero TypeScript diagnostics errors, assets optimized)

---

## 3. Docker Compose Build Verification

- **Execution Command**:
  ```bash
  docker compose build
  ```
- **Exit Code**: `0`
- **Result**:
  - `Image doan_cnpmnc-backend Built`
  - `Image doan_cnpmnc-frontend Built`
- **Status**: **PASS**

---

## 4. Container Fleet Status

- **Command**: `docker compose ps`
- **Exit Code**: `0`
- **Active Container Table**:

| Service Name | Container Name | Image | Ports | Health / Status |
| :--- | :--- | :--- | :--- | :---: |
| `postgres` | `edms-postgres` | `postgres:16-alpine` | `0.0.0.0:5432->5432/tcp` | `Up (healthy)` |
| `backend` | `edms-backend` | `doan_cnpmnc-backend:latest` | `0.0.0.0:8080->8080/tcp` | `Up` |
| `frontend` | `edms-frontend` | `doan_cnpmnc-frontend:latest` | `0.0.0.0:5173->5173/tcp` | `Up` |

---

## 5. Live Service Health Checks

### 5.1 Backend Health Endpoint
- **Request**: `GET http://localhost:8080/api/health`
- **HTTP Status Code**: `200 OK`
- **Payload**:
  ```json
  {
    "service": "EDMS Backend",
    "version": "1.0.0-sprint1",
    "status": "UP",
    "timestamp": "2026-09-18T21:17:14.760173171Z"
  }
  ```
- **Status**: **PASS**

### 5.2 Frontend HTTP Response
- **Request**: `GET http://localhost:5173/`
- **HTTP Status Code**: `200 OK`
- **Content-Type**: `text/html; charset=UTF-8`
- **Status**: **PASS**
