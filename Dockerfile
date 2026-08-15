# ThermalDeck — Alpine single-container image (Caddy + Express + SPA)
# Build: docker compose build
# Run:   docker compose up -d

# ─── Build frontend + compile backend ─────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN npm ci

COPY frontend ./frontend
COPY backend ./backend

ENV VITE_API_BASE_URL=/api
RUN npm run build --workspace=frontend \
  && npm run build --workspace=backend

# ─── Backend production deps only (Alpine → linuxmusl sharp) ──────
FROM node:20-alpine AS backend-deps

WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci --workspace=backend --omit=dev \
  && npm cache clean --force

# ─── Caddy binary (Alpine/musl) ───────────────────────────────────
FROM caddy:2.9-alpine AS caddy

# ─── Runtime ──────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# ca-certificates: HTTPS status checks to the printer web UI
# tini: proper PID 1 / signal handling on Synology
RUN apk add --no-cache ca-certificates tini

COPY --from=caddy /usr/bin/caddy /usr/bin/caddy

WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=backend-deps /app/package.json ./package.json
COPY --from=backend-deps /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist

COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /app/start.sh

# Root is intentional for Synology bind mounts (UID mismatches kill the app silently).
# This is a LAN home-NAS appliance, not a multi-tenant host.
RUN chmod +x /app/start.sh && mkdir -p /app/data

ENV NODE_ENV=production \
    PORT=3001 \
    DATA_DIR=/app/data \
    XDG_CONFIG_HOME=/app/data/caddy-config \
    XDG_DATA_HOME=/app/data/caddy-data

EXPOSE 8080
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]
