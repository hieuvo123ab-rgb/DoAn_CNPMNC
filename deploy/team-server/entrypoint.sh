#!/bin/sh
set -eu

fail() { echo "EDMS team server startup refused: $1" >&2; exit 1; }

[ "${EDMS_TEAM_SERVER_ENABLED:-}" = "true" ] || fail "EDMS_TEAM_SERVER_ENABLED must be true"
[ "${SPRING_PROFILES_ACTIVE:-}" = "prod,team-server" ] || fail "only prod,team-server is allowed"
[ "${SPRING_DATASOURCE_URL:-}" = "jdbc:postgresql://postgres:5432/edms_team_db" ] || fail "a dedicated Docker team database is required"
[ "${SPRING_DATASOURCE_USERNAME:-}" = "edms_team_user" ] || fail "unexpected database username"
[ -n "${SPRING_DATASOURCE_PASSWORD:-}" ] || fail "database password is missing"
[ ${#EDMS_JWT_SECRET} -ge 40 ] 2>/dev/null || fail "provide EDMS_JWT_SECRET of at least 40 characters"
[ ${#EDMS_KEYSTORE_PASSWORD} -ge 16 ] 2>/dev/null || fail "provide EDMS_KEYSTORE_PASSWORD of at least 16 characters"
[ ${#EDMS_TEAM_ADMIN_PASSWORD} -ge 16 ] 2>/dev/null || fail "provide a strong initial Admin password"
[ "${EDMS_STORAGE_DIR:-}" = "/app/persist/uploads" ] || fail "storage must use the dedicated team volume"
[ "${EDMS_KEYSTORE_PATH:-}" = "/app/persist/keys/edms-signing.p12" ] || fail "KeyStore must use the dedicated team volume"

mkdir -p /app/persist/uploads /app/persist/keys /tmp/edms-nginx-client /tmp/edms-nginx-proxy
chown -R edms:edms /app/persist /tmp/edms-nginx-client /tmp/edms-nginx-proxy

echo "Starting standalone EDMS team server (isolated PostgreSQL and persisted files)"
runuser -u edms -- java -Xms128m -Xmx1024m -jar /app/app.jar --server.port=8081 &
JAVA_PID=$!

nginx -c /etc/nginx/nginx.conf -t
nginx -c /etc/nginx/nginx.conf -g 'daemon off;' &
NGINX_PID=$!

cleanup() {
  kill "$JAVA_PID" "$NGINX_PID" 2>/dev/null || true
  wait "$JAVA_PID" "$NGINX_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

while kill -0 "$JAVA_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 2
done
echo "EDMS team server exited unexpectedly" >&2
exit 1
