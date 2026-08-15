#!/bin/sh
set -eu

BACKEND_PID=""
CADDY_PID=""

cleanup() {
  if [ -n "${CADDY_PID}" ] && kill -0 "${CADDY_PID}" 2>/dev/null; then
    kill "${CADDY_PID}" 2>/dev/null || true
  fi
  if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

cd /app/backend
node dist/index.js &
BACKEND_PID=$!

sleep 1
if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
  echo "Backend failed to start" >&2
  exit 1
fi

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
CADDY_PID=$!

# Exit if either child dies
while kill -0 "${BACKEND_PID}" 2>/dev/null && kill -0 "${CADDY_PID}" 2>/dev/null; do
  sleep 2
done

echo "A process exited unexpectedly" >&2
exit 1
