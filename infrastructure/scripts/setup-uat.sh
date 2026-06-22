#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# setup-uat.sh — Automated UAT Deployment (Single Server)
# ═══════════════════════════════════════════════════════════════════
#
# Run ON the UAT server after init-server.sh.
# Deploys: Docker (PG, Redis, MeiliSearch) + Caddy + Medusa + Next.js.
#
# Usage:
#   ssh root@<SERVER_IP> "bash -s" < setup-uat.sh
# OR
#   scp setup-uat.sh root@<SERVER_IP>:/root/
#   ssh root@<SERVER_IP> bash /root/setup-uat.sh

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

REPO="https://github.com/Subhani-Net/IndiaGrocers.git"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="${ADMIN_PASS:-ChangeMe123!}"
UAT_AUTH_PASSWORD="${UAT_AUTH_PASS:-uat-secure-2026}"

log "=== UAT — Single Server Deployment ==="

# ═══════════════════════════════════════════════════════════
# 1. Clone repo (get config files, ecosystem config, docker-compose)
# ═══════════════════════════════════════════════════════════
TEMP_DIR="/opt/infra-temp"
if [ ! -d "$TEMP_DIR" ]; then
    git clone "$REPO" "$TEMP_DIR"
fi
cd "$TEMP_DIR" && git pull origin main

# ═══════════════════════════════════════════════════════════
# 2. Start Docker (Postgres, Redis, MeiliSearch for UAT)
# ═══════════════════════════════════════════════════════════
log "Starting Docker services..."

cp "$TEMP_DIR/infrastructure/server2/docker/docker-compose.uat.yml" /opt/
cd /opt
docker compose -p uat -f docker-compose.uat.yml up -d

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
log "Deploying Caddy..."

cp "$TEMP_DIR/infrastructure/server2/caddy/Caddyfile" /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile
systemctl reload caddy

if [ ! -f /etc/caddy/uat.htpasswd ]; then
    htpasswd -cb /etc/caddy/uat.htpasswd admin "$UAT_AUTH_PASSWORD"
    log "UAT auth: admin / $UAT_AUTH_PASSWORD"
else
    warn "htpasswd already exists — skipping"
fi

# ═══════════════════════════════════════════════════════════
# 4. Clone application (develop branch)
# ═══════════════════════════════════════════════════════════
APP_DIR="/opt/uat"
log "Deploying application to $APP_DIR..."

if [ ! -d "$APP_DIR" ]; then
    git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"
git fetch origin && git checkout main && git pull origin main

npm ci --prefer-offline 2>/dev/null || npm install

# ═══════════════════════════════════════════════════════════
# 5. Backend setup
# ═══════════════════════════════════════════════════════════
log "Setting up Medusa backend..."

cd "$APP_DIR/apps/backend"
if [ ! -f .env ]; then
    cp .env.template .env
    cat >> .env << 'ENVEOF'
DATABASE_URL=postgres://medusa:medusa_uat_password_2026@localhost:5433/indiagrocers_uat
REDIS_URL=redis://localhost:6380
ENVEOF
    grep -q JWT_SECRET .env || echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
    grep -q COOKIE_SECRET .env || echo "COOKIE_SECRET=$(openssl rand -hex 32)" >> .env
fi

npx medusa db:migrate
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
# 8. MeiliSearch configuration
# ═══════════════════════════════════════════════════════════
log "Configuring MeiliSearch..."
cd "$APP_DIR/apps/meilisearch"
npm run configure 2>/dev/null || true

# ═══════════════════════════════════════════════════════════
# 9. PM2 — start both apps
# ═══════════════════════════════════════════════════════════
log "Starting services with PM2..."

pm2 delete all 2>/dev/null || true

cp "$TEMP_DIR/infrastructure/ecosystem.config.js" "$APP_DIR/apps/backend/"
cp "$TEMP_DIR/infrastructure/ecosystem.config.js" "$APP_DIR/apps/storefront/"

cd "$APP_DIR/apps/backend"
pm2 start ecosystem.config.js --only medusa-uat

cd "$APP_DIR/apps/storefront"
pm2 start ecosystem.config.js --only storefront-uat

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

# ═══════════════════════════════════════════════════════════
# 10. Health check
# ═══════════════════════════════════════════════════════════
log "Waiting for backend..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:9001/health > /dev/null 2>&1; then
        log "Backend ready after ${i}s"
        break
    fi
    sleep 2
done

# Clean up
rm -rf "$TEMP_DIR"

# ═══════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════
log "=== UAT deployment complete ==="
echo ""
echo "  Storefront:  http://localhost:3001"
echo "  Admin:       http://localhost:9001/app"
echo ""
echo "  Admin login: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo "  UAT auth:    admin / $UAT_AUTH_PASSWORD"
echo ""
echo "  PM2 status:  pm2 status"
echo "  Logs:        pm2 logs"
echo ""
