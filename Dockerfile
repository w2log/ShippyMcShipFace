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

RUN apk add --no-cache ca-certificates \
  && adduser -D -u 1001 -h /app thermaldeck

COPY --from=caddy /usr/bin/caddy /usr/bin/caddy

WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=backend-deps /app/package.json ./package.json
COPY --from=backend-deps /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist

COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh \
  && mkdir -p /app/data \
  && chown -R thermaldeck:thermaldeck /app

ENV NODE_ENV=production \
    PORT=3001 \
    DATA_DIR=/app/data

EXPOSE 8080
VOLUME ["/app/data"]

USER thermaldeck

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["/app/start.sh"]
