# EDMS — Docker Team Server (Windows / dedicated host)

This is a SEPARATE, persistent deployment for actual team members, not the disposable Railway Preview. It is isolated from the existing local `docker-compose.yml` and from Railway. It is deliberately NOT started automatically on the owner's computer.

## Architecture

```
Team member browser
    |
    | HTTPS (public EDMS hostname)
    v
Cloudflare public edge -> named Cloudflare Tunnel -> cloudflared (Docker)
    |                                              |
    +----------------------------------------------+
                            |
                         web:8080
                    Nginx static React
                    /api -> Spring Boot :8081
                    /ws-edms -> WebSocket STOMP :8081
                            |
                 Docker private database network
                            |
                  postgres:5432 (NO HOST PORT)
```

- `edms_team_server_pgdata`: unique named volume for PostgreSQL 16.
- `edms_team_server_appdata`: unique named volume for uploaded files and private signing KeyStore.
- A single strong **team_admin** account is created ONLY on an empty database (profile `prod,team-server`); Admin can create individually accountable Staff and User accounts in the user-management screen. No shared demo users, no hard-coded password.
- Backend, database and signing KeyStore do **not** have public ports. Nginx is bound only to `127.0.0.1:8088` for the owner's local checks. All off-machine browser traffic must use HTTPS Tunnel.
- The image checks the actual ONNX file bytes and pinned SHA-256 before starting, rather than deploying a Git LFS pointer.

## Requirements

1. Windows with Docker Desktop running (Linux containers, enough free RAM/storage).
2. Git and PowerShell, repository on the current Team Preview branch or this PR branch.
3. For an Internet-accessible persistent URL: Cloudflare account, a domain managed by Cloudflare, and a named Cloudflare Tunnel. The user must create the tunnel in their own Cloudflare account — credentials cannot be manufactured by GitHub or this script.
4. The server PC must remain switched on and have Internet connectivity for members to access it. For true 24/7 availability, run the same Docker stack on a hosted VPS instead.

## First run — localhost only (no public port)

Open PowerShell in the repository root:

```powershell
git fetch origin
git switch deploy/edms-docker-team-server-20261027
powershell -ExecutionPolicy Bypass -File .\scripts\setup-team-server.ps1
docker compose --env-file .env.team-server -f docker-compose.team-server.yml config --quiet
docker compose --env-file .env.team-server -f docker-compose.team-server.yml up -d --build
docker compose --env-file .env.team-server -f docker-compose.team-server.yml ps
```

The script generates four distinct cryptographically random secrets, saves them to a **git-ignored** local `.env.team-server`, and displays the initial Admin credentials once. Keep the secrets private.

Test on the hosting machine:

- `http://localhost:8088/` — login UI.
- `http://localhost:8088/healthz` — Backend health.
- Login as `team_admin` with the generated password.
- In Admin > Users, create one uniquely named `ROLE_STAFF` account per member and `ROLE_USER` accounts as needed. Do not share an Admin password.

Check runtime logs without exposing credentials:

```powershell
docker compose --env-file .env.team-server -f docker-compose.team-server.yml logs --tail=80 web postgres
```

## Internet access through HTTPS Cloudflare Tunnel (no router port-forward)

1. Sign in to Cloudflare Dashboard > **Networking > Tunnels**; create a **remotely managed** tunnel, for example `edms-team`.
2. Create a **Published application** / public hostname like `edms.example.com`, mapped to service **`http://web:8080`**. `web` is the Compose service DNS name; `localhost` is NOT correct from the tunnel container.
3. Get the connector token from your Cloudflare Tunnel. Treat it like a password: anyone possessing it may connect to the tunnel.
4. Edit the **local-only** `.env.team-server`:
   - `EDMS_PUBLIC_ORIGIN=https://edms.example.com` (replace with your exact published hostname).
   - `CLOUDFLARE_TUNNEL_TOKEN=<the token from your own tunnel>`.
   - Keep JWT secret, PostgreSQL password and KeyStore password **unchanged**, or previously signed documents may become unreadable/unverifiable.
5. Start the remote profile:

```powershell
docker compose --env-file .env.team-server -f docker-compose.team-server.yml --profile remote up -d
docker compose --env-file .env.team-server -f docker-compose.team-server.yml --profile remote ps
```

6. Open the exact HTTPS hostname from a second device over mobile data. Test Admin/Staff/User login, upload, preview, download and WebSocket notifications.

Optional: protect the hostname with Cloudflare Access email allowlisting for the known team members in addition to EDMS account authentication. Keep `/api` and `/ws-edms` operating under the same hostname and test both after introducing Access.

**Never** open PostgreSQL port 5432 or Java Backend 8081 on your router. Never expose localhost HTTP port 8088 to the Internet. Do not share `.env.team-server` or a tunnel token with ChatGPT.

## Operational checks and backups

- Only the dedicated team-server containers/volumes belong to this stack; existing `edms_pgdata`, `edms_storage_data`, `edms_keystore_data`, Railway and unrelated Oracle projects are untouched.
- Stop **without deleting data**: `docker compose --env-file .env.team-server -f docker-compose.team-server.yml --profile remote stop`.
- Start after PC reboot: `docker compose --env-file .env.team-server -f docker-compose.team-server.yml --profile remote up -d` (Docker Desktop must be running).
- NEVER run `docker compose down -v`, `docker volume prune`, `docker system prune --volumes`, or delete the signing KeyStore.
- Back up together: PostgreSQL logical dump, `edms_team_server_appdata` (uploads AND keys), and `.env.team-server` in an encrypted offline location. Test restoration on a separate stack before treating the system as a permanent archive.
- If `team_admin` already exists, changing `EDMS_TEAM_ADMIN_PASSWORD` in the .env file does NOT reset that user's password; change credentials through an approved account recovery procedure.
- This deployment has single-host limitations: a power cut or PC sleep takes the server offline, and volumes are not backups. For high availability, move the stack to a managed host and add monitoring, backups and tested recovery.

## Acceptance gates before team rollout

- [ ] `docker compose ... config --quiet` passes.
- [ ] Postgres reports healthy; web `/healthz` returns 200; frontend loads.
- [ ] Admin is bootstrapped once; Staff and User accounts have unique passwords.
- [ ] Staff/User requests to Admin endpoints return HTTP 403.
- [ ] Uploading a synthetic PDF is reflected in metadata and physical storage; preview/download work.
- [ ] WebSocket STOMP connects over the public WSS/SockJS origin, with no cross-user notification leakage.
- [ ] A web container restart preserves documents, versions, DB records and signing KeyStore.
- [ ] HTTPS hostname works from mobile data. No PostgreSQL/backend/public HTTP ports.
- [ ] Backup + restore procedures are tested. Use no real sensitive documents until then.

## Scope and responsibility

This branch supplies executable configuration and a safe first-run bootstrap in GitHub. It does NOT remotely start Docker on the owner's Windows PC, create a Cloudflare domain/tunnel/token, migrate any existing Docker volumes, or prove multi-user E2E has passed. The owner or Antigravity must run the commands locally and supply the resulting health/role test evidence.
