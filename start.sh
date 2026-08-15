#!/bin/sh
set -eu

echo "[thermaldeck] starting (uid=$(id -u) data=${DATA_DIR:-/app/data})"

mkdir -p "${DATA_DIR:-/app/data}"

cd /app/backend

echo "[thermaldeck] launching backend on :${PORT:-3001}"
node dist/index.js &
BACKEND_PID=$!

# Wait for backend to accept connections (up to ~30s)
i=0
while [ "$i" -lt 30 ]; do
  if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
    echo "[thermaldeck] backend exited during startup" >&2
    wait "${BACKEND_PID}" || true
    exit 1
  fi
  if node -e "fetch('http://127.0.0.1:${PORT:-3001}/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "[thermaldeck] backend is healthy"
    break
  fi
  i=$((i + 1))
  sleep 1
done

if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
  echo "[thermaldeck] backend died before ready" >&2
  exit 1
fi

echo "[thermaldeck] launching caddy on :8080"
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
CADDY_PID=$!

sleep 1
if ! kill -0 "${CADDY_PID}" 2>/dev/null; then
  echo "[thermaldeck] caddy failed to start (is port 8080 free?)" >&2
  kill "${BACKEND_PID}" 2>/dev/null || true
  exit 1
fi

echo "[thermaldeck] ready"

cleanup() {
  echo "[thermaldeck] shutting down"
  kill "${CADDY_PID}" "${BACKEND_PID}" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM

# Keep PID 1 alive; exit if either child dies
while kill -0 "${BACKEND_PID}" 2>/dev/null && kill -0 "${CADDY_PID}" 2>/dev/null; do
  sleep 2
done

echo "[thermaldeck] a process exited — backend=$(kill -0 "${BACKEND_PID}" 2>/dev/null && echo up || echo down) caddy=$(kill -0 "${CADDY_PID}" 2>/dev/null && echo up || echo down)" >&2
cleanup
exit 1
