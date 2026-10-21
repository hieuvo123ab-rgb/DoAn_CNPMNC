#!/bin/sh
set -eu

fail() {
    echo "EDMS Team Preview startup refused: $1" >&2
    exit 1
}

[ "${EDMS_TEAM_PREVIEW_ENABLED:-}" = "true" ] || fail "set EDMS_TEAM_PREVIEW_ENABLED=true only for the isolated preview instance"
[ "${SPRING_PROFILES_ACTIVE:-}" = "prod,team-preview" ] || fail "SPRING_PROFILES_ACTIVE must be prod,team-preview"
[ -n "${SPRING_DATASOURCE_URL:-}" ] || fail "dedicated SPRING_DATASOURCE_URL is required"
[ -n "${SPRING_DATASOURCE_USERNAME:-}" ] || fail "SPRING_DATASOURCE_USERNAME is required"
[ -n "${SPRING_DATASOURCE_PASSWORD:-}" ] || fail "SPRING_DATASOURCE_PASSWORD is required"
[ ${#EDMS_JWT_SECRET} -ge 40 ] 2>/dev/null || fail "EDMS_JWT_SECRET must be a unique random secret of at least 40 characters"
[ ${#EDMS_KEYSTORE_PASSWORD} -ge 16 ] 2>/dev/null || fail "EDMS_KEYSTORE_PASSWORD must be at least 16 characters"
[ ${#EDMS_PREVIEW_SHARED_PASSWORD} -ge 16 ] 2>/dev/null || fail "EDMS_PREVIEW_SHARED_PASSWORD must have at least 16 characters"

# Always use the single, independent Railway preview volume.
[ "${EDMS_STORAGE_DIR:-}" = "/app/persist/uploads" ] || fail "EDMS_STORAGE_DIR must be /app/persist/uploads"
[ "${EDMS_KEYSTORE_PATH:-}" = "/app/persist/keys/edms-signing.p12" ] || fail "EDMS_KEYSTORE_PATH must be the dedicated preview KeyStore"
mkdir -p /app/persist/uploads /app/persist/keys
chown edms:edms /app/persist /app/persist/uploads /app/persist/keys

echo "Starting isolated EDMS Team Preview; no production data will be imported."
runuser -u edms -- java -Xms128m -Xmx768m -jar /app/app.jar --server.port=8081 &
JAVA_PID=$!
# Run the Nginx master as root; workers run as edms.
mkdir -p /tmp/edms-nginx-client /tmp/edms-nginx-proxy
chown -R edms:edms /tmp/edms-nginx-client /tmp/edms-nginx-proxy
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
echo "EDMS Team Preview process exited unexpectedly." >&2
exit 1
