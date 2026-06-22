#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# setup-server1.sh — Automated Production Deployment (Server 1)
# ═══════════════════════════════════════════════════════════════════
#
# Run ON Server 1 after init-server.sh.
#
# Usage:
#   ssh root@<SERVER1_IP> "bash -s" < setup-server1.sh
# OR copy to server and run:
#   scp setup-server1.sh root@<SERVER1_IP>:/root/
#   ssh root@<SERVER1_IP> bash /root/setup-server1.sh

set -euo pipefail

GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }

REPO="https://github.com/Subhani-Net/IndiaGrocers.git"
APP_DIR="/opt/production"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
# ── Override via env vars ──
ADMIN_PASSWORD="${ADMIN_PASS:-$ADMIN_PASSWORD}"

log "=== Server 1 — Production Deployment ==="

# ═══════════════════════════════════════════════════════════
# 1. Clone repo
# ═══════════════════════════════════════════════════════════
if [ -d "$APP_DIR" ]; then
    log "Repo already cloned. Pulling latest..."
    cd "$APP_DIR" && git pull origin main
else
    log "Cloning repository..."
    git clone "$REPO" "$APP_DIR"
    cd "$APP_DIR"
fi

# ═══════════════════════════════════════════════════════════
# 2. Start Docker (Postgres, Redis, MeiliSearch)
# ═══════════════════════════════════════════════════════════
log "Starting Docker services..."

if [ ! -f /opt/docker-compose.yml ]; then
    cp "$APP_DIR/docker-compose.yml" /opt/
fi

cd /opt
docker compose -f docker-compose.yml up -d

# Wait for healthy
for i in $(seq 1 30); do
    if docker ps | grep -q "healthy"; then
        log "Docker services healthy after ${i}s"
        break
    fi
    sleep 2
done

# ═══════════════════════════════════════════════════════════
# 3. Caddy reverse proxy
# ═══════════════════════════════════════════════════════════
log "Deploying Caddy configuration..."

if [ -f "$APP_DIR/infrastructure/server1/caddy/Caddyfile" ]; then
    cp "$APP_DIR/infrastructure/server1/caddy/Caddyfile" /etc/caddy/Caddyfile
    caddy fmt --overwrite /etc/caddy/Caddyfile
    systemctl reload caddy
    log "Caddy reloaded"
else
    echo "WARNING: Caddyfile not found at $APP_DIR/infrastructure/server1/caddy/Caddyfile"
fi

# ═══════════════════════════════════════════════════════════
# 4. Install npm dependencies (root workspace)
# ═══════════════════════════════════════════════════════════
log "Installing npm dependencies..."
cd "$APP_DIR"
npm ci --prefer-offline 2>/dev/null || npm install

# ═══════════════════════════════════════════════════════════
# 5. Backend setup
# ═══════════════════════════════════════════════════════════
log "Setting up Medusa backend..."

cd "$APP_DIR/apps/backend"

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.template .env 2>/dev/null || true
    # Ensure minimum values
    grep -q "DATABASE_URL" .env || echo "DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers" >> .env
    grep -q "REDIS_URL" .env || echo "REDIS_URL=redis://localhost:6379" >> .env
    grep -q "JWT_SECRET" .env || echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
    grep -q "COOKIE_SECRET" .env || echo "COOKIE_SECRET=$(openssl rand -hex 32)" >> .env
fi

# Run migrations
npx medusa db:migrate

# Create admin user if not exists
npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" 2>/dev/null || true

# ═══════════════════════════════════════════════════════════
# 6. Seed product catalog
# ═══════════════════════════════════════════════════════════
log "Seeding product catalog..."

cd "$APP_DIR"
node catalogue/seed-catalogue.mjs --apply --reindex

# ═══════════════════════════════════════════════════════════
# 7. Build storefront
# ═══════════════════════════════════════════════════════════
log "Building storefront..."

cd "$APP_DIR/apps/storefront"
yarn install --immutable 2>/dev/null || yarn install
yarn build

# ═══════════════════════════════════════════════════════════
# 8. Configure MeiliSearch
# ═══════════════════════════════════════════════════════════
log "Configuring MeiliSearch..."

cd "$APP_DIR/apps/meilisearch"
npm run configure 2>/dev/null || true

# ═══════════════════════════════════════════════════════════
# 9. Start with PM2
# ═══════════════════════════════════════════════════════════
log "Starting services with PM2..."

# Copy ecosystem config
if [ -f "$APP_DIR/infrastructure/ecosystem.config.js" ]; then
    cp "$APP_DIR/infrastructure/ecosystem.config.js" "$APP_DIR/apps/backend/"
    cp "$APP_DIR/infrastructure/ecosystem.config.js" "$APP_DIR/apps/storefront/"
fi

# Stop any existing processes
pm2 delete all 2>/dev/null || true

# Start backend
cd "$APP_DIR/apps/backend"
pm2 start ecosystem.config.js --only medusa-prod

# Start storefront
cd "$APP_DIR/apps/storefront"
pm2 start ecosystem.config.js --only storefront-prod

# Persist across reboots
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

# ═══════════════════════════════════════════════════════════
# 10. Health check
# ═══════════════════════════════════════════════════════════
log "Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:9000/health > /dev/null 2>&1; then
        log "Backend ready after ${i}s"
        break
    fi
    sleep 2
done

log "=== Deployment complete ==="
echo ""
echo "  Storefront:  http://localhost:3000"
echo "  Admin:       http://localhost:9000/app"
echo "  Admin login: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo ""
echo "  PM2 status:  pm2 status"
echo "  Logs:        pm2 logs"
echo ""
