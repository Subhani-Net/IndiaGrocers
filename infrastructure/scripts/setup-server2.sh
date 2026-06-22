#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# setup-server2.sh — Automated Non-Production Deployment (Server 2)
# ═══════════════════════════════════════════════════════════════════
#
# Run ON Server 2 after init-server.sh.
# Deploys both UAT (develop branch) and Support (main branch, synced data).
#
# Usage:
#   ssh root@<SERVER2_IP> "bash -s" < setup-server2.sh
# OR
#   scp setup-server2.sh root@<SERVER2_IP>:/root/
#   ssh root@<SERVER2_IP> bash /root/setup-server2.sh

set -euo pipefail

GREEN='\033[0;32m';  YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

REPO="https://github.com/Subhani-Net/IndiaGrocers.git"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="${ADMIN_PASS:-ChangeMe123!}"
UAT_AUTH_PASSWORD="${UAT_AUTH_PASS:-uat-secure-2026}"

log "=== Server 2 — UAT + Support Deployment ==="

# ═══════════════════════════════════════════════════════════
# 1. Clone repo (temporary — get config files)
# ═══════════════════════════════════════════════════════════
TEMP_DIR="/opt/infra-temp"
if [ ! -d "$TEMP_DIR" ]; then
    git clone "$REPO" "$TEMP_DIR"
fi
cd "$TEMP_DIR" && git pull origin main

# ═══════════════════════════════════════════════════════════
# 2. Start Docker (UAT + Support infrastructure)
# ═══════════════════════════════════════════════════════════
log "Starting Docker services..."

cp "$TEMP_DIR/infrastructure/server2/docker/"*.yml /opt/

cd /opt
docker compose -p uat -f docker-compose.uat.yml up -d
docker compose -p support -f docker-compose.support.yml up -d

for i in $(seq 1 30); do
    if docker ps | grep -q "healthy"; then
        log "Docker services healthy after ${i}s"
        break
    fi
    sleep 2
done

# ═══════════════════════════════════════════════════════════
# 3. Caddy
# ═══════════════════════════════════════════════════════════
log "Deploying Caddy..."

cp "$TEMP_DIR/infrastructure/server2/caddy/Caddyfile" /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile
systemctl reload caddy

# htpasswd for UAT
if [ ! -f /etc/caddy/uat.htpasswd ]; then
    htpasswd -cb /etc/caddy/uat.htpasswd admin "$UAT_AUTH_PASSWORD"
    log "UAT auth created: admin / $UAT_AUTH_PASSWORD"
else
    warn "UAT htpasswd already exists — skipping"
fi

# ═══════════════════════════════════════════════════════════
# 4. UAT — develop branch
# ═══════════════════════════════════════════════════════════
log "Deploying UAT (develop branch)..."

UAT_DIR="/opt/uat"
if [ ! -d "$UAT_DIR" ]; then
    git clone "$REPO" "$UAT_DIR"
fi
cd "$UAT_DIR" && git fetch origin && git checkout main && git pull origin main
npm ci --prefer-offline 2>/dev/null || npm install

# UAT Backend
cd "$UAT_DIR/apps/backend"
if [ ! -f .env ]; then
    cp .env.template .env
    cat >> .env << 'ENVEOF'
DATABASE_URL=postgres://medusa:medusa_uat_password_2026@localhost:5433/indiagrocers_uat
REDIS_URL=redis://localhost:6380
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
ENVEOF
fi
npx medusa db:migrate
npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" 2>/dev/null || true

# Seed UAT catalog
cd "$UAT_DIR"
node catalogue/seed-catalogue.mjs --apply --reindex

# UAT Storefront
cd "$UAT_DIR/apps/storefront"
yarn install --immutable 2>/dev/null || yarn install
yarn build

# ═══════════════════════════════════════════════════════════
# 5. Support — main branch (synced data, no seed)
# ═══════════════════════════════════════════════════════════
log "Deploying Support (main branch, synced data)..."

SUPPORT_DIR="/opt/support"
if [ ! -d "$SUPPORT_DIR" ]; then
    git clone "$REPO" "$SUPPORT_DIR"
fi
cd "$SUPPORT_DIR" && git fetch origin && git checkout main && git pull origin main
npm ci --prefer-offline 2>/dev/null || npm install

# Support Backend (migrations only — data from nightly sync)
cd "$SUPPORT_DIR/apps/backend"
if [ ! -f .env ]; then
    cp .env.template .env
    cat >> .env << 'ENVEOF'
DATABASE_URL=postgres://medusa:medusa_support_password_2026@localhost:5434/indiagrocers_support
REDIS_URL=redis://localhost:6381
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
ENVEOF
fi
npx medusa db:migrate
npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" 2>/dev/null || true

# Support Storefront
cd "$SUPPORT_DIR/apps/storefront"
yarn install --immutable 2>/dev/null || yarn install
yarn build

# ═══════════════════════════════════════════════════════════
# 6. MeiliSearch config (both envs)
# ═══════════════════════════════════════════════════════════
log "Configuring MeiliSearch..."
cd "$UAT_DIR/apps/meilisearch" && npm run configure 2>/dev/null || true
cd "$SUPPORT_DIR/apps/meilisearch" && npm run configure 2>/dev/null || true

# ═══════════════════════════════════════════════════════════
# 7. PM2 — all 4 apps
# ═══════════════════════════════════════════════════════════
log "Starting services with PM2..."

pm2 delete all 2>/dev/null || true

# Copy ecosystem config
for dir in "$UAT_DIR" "$SUPPORT_DIR"; do
    cp "$TEMP_DIR/infrastructure/ecosystem.config.js" "$dir/apps/backend/"
    cp "$TEMP_DIR/infrastructure/ecosystem.config.js" "$dir/apps/storefront/"
done

# Start UAT
cd "$UAT_DIR/apps/backend" && pm2 start ecosystem.config.js --only medusa-uat
cd "$UAT_DIR/apps/storefront" && pm2 start ecosystem.config.js --only storefront-uat

# Start Support
cd "$SUPPORT_DIR/apps/backend" && pm2 start ecosystem.config.js --only medusa-support
cd "$SUPPORT_DIR/apps/storefront" && pm2 start ecosystem.config.js --only storefront-support

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

# ═══════════════════════════════════════════════════════════
# 8. Health check
# ═══════════════════════════════════════════════════════════
for env in "uat 9001" "support 9002"; do
    name=$(echo $env | cut -d' ' -f1)
    port=$(echo $env | cut -d' ' -f2)
    log "Waiting for $name backend (port $port)..."
    for i in $(seq 1 30); do
        if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
            log "  $name backend ready after ${i}s"
            break
        fi
        sleep 2
    done
done

# Clean up temp repo
rm -rf "$TEMP_DIR"

log "=== Server 2 deployment complete ==="
echo ""
echo "  UAT storefront:     http://localhost:3001  (password: admin / $UAT_AUTH_PASSWORD)"
echo "  UAT admin:          http://localhost:9001/app  (login: $ADMIN_EMAIL / $ADMIN_PASSWORD)"
echo "  Support storefront: http://localhost:3002"
echo "  Support admin:      http://localhost:9002/app  (login: $ADMIN_EMAIL / $ADMIN_PASSWORD)"
echo ""
echo "  PM2 status:  pm2 status"
echo "  Logs:        pm2 logs"
echo ""
