#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# init-server.sh — Clean Ubuntu 24.04 LTS → Production-Ready Stack
# ═══════════════════════════════════════════════════════════════════
#
# Provisions a fresh Hetzner CX instance with:
#   - 4GB swap + swappiness 20
#   - Node.js 20 LTS
#   - PM2 process manager (global)
#   - Docker Engine + Docker Compose v2
#   - Caddy web server (reverse proxy + auto-TLS)
#   - Git, curl, jq, build-essential, apache2-utils (for htpasswd)
#
# Usage (run as root or with sudo):
#   curl -sSL https://raw.githubusercontent.com/.../init-server.sh | sudo bash
#   OR
#   sudo bash init-server.sh
#
# Idempotent — safe to re-run on an already-provisioned server.

set -euo pipefail

# ── Colour output ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Ensure we are root ───────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then fail "Please run as root (sudo bash init-server.sh)"; fi

echo ""
echo "============================================================"
echo "  IndiaGrocers — Server Initialization"
echo "  Target: Ubuntu 24.04 LTS"
echo "  $(date)"
echo "============================================================"
echo ""

# ═══════════════════════════════════════════════════════════════════
# STEP 1: System update + essential packages
# ═══════════════════════════════════════════════════════════════════
log "Step 1/8: Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl wget git gnupg lsb-release ca-certificates build-essential \
    apache2-utils jq net-tools htop unzip
log "System updated. Essential packages installed."

# ═══════════════════════════════════════════════════════════════════
# STEP 2: Swap — 4GB + swappiness 20
# ═══════════════════════════════════════════════════════════════════
log "Step 2/8: Provisioning 4GB swap..."

SWAPFILE="/swapfile"
if [ -f "$SWAPFILE" ]; then
    warn "Swap file already exists at $SWAPFILE. Skipping."
else
    fallocate -l 4096M "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count=4096 status=progress
    chmod 600 "$SWAPFILE"
    mkswap "$SWAPFILE"
    swapon "$SWAPFILE"
    echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

# Swappiness — prefer RAM, swap is safety net for build spikes
sysctl vm.swappiness=20
echo "vm.swappiness=20" > /etc/sysctl.d/99-swappiness.conf

log "Swap: $(swapon --show --noheadings | wc -l) active, swappiness=$(cat /proc/sys/vm/swappiness)"
free -h | grep -i swap

# ═══════════════════════════════════════════════════════════════════
# STEP 3: Node.js 20 LTS
# ═══════════════════════════════════════════════════════════════════
log "Step 3/8: Installing Node.js 20 LTS..."

if command -v node &>/dev/null && node --version | grep -q "v20"; then
    warn "Node.js 20 already installed: $(node --version). Skipping."
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

log "Node.js: $(node --version)"
log "npm:      $(npm --version)"

# ═══════════════════════════════════════════════════════════════════
# STEP 4: PM2 — Global process manager
# ═══════════════════════════════════════════════════════════════════
log "Step 4/8: Installing PM2..."

if command -v pm2 &>/dev/null; then
    warn "PM2 already installed: $(pm2 --version). Skipping."
else
    npm install -g pm2
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 20M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
fi

log "PM2: $(pm2 --version)"

# ═══════════════════════════════════════════════════════════════════
# STEP 5: Docker Engine — from official Docker repo
# ═══════════════════════════════════════════════════════════════════
log "Step 5/8: Installing Docker Engine..."

if command -v docker &>/dev/null && docker --version &>/dev/null; then
    warn "Docker already installed: $(docker --version). Skipping."
else
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker --now
fi

log "Docker: $(docker --version)"
log "Compose: $(docker compose version)"

# ═══════════════════════════════════════════════════════════════════
# STEP 6: Caddy — Reverse proxy + Auto-TLS
# ═══════════════════════════════════════════════════════════════════
log "Step 6/8: Installing Caddy..."

if command -v caddy &>/dev/null && caddy version &>/dev/null; then
    warn "Caddy already installed: $(caddy version | head -1). Skipping."
else
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
    systemctl enable caddy --now
fi

log "Caddy installed."

# ═══════════════════════════════════════════════════════════════════
# STEP 7: Log directories
# ═══════════════════════════════════════════════════════════════════
log "Step 7/8: Creating log directories..."

mkdir -p /var/log/caddy /var/log/pm2
chown -R caddy:caddy /var/log/caddy 2>/dev/null || true
log "Log directories created."

# ═══════════════════════════════════════════════════════════════════
# STEP 8: UFW firewall — allow HTTP, HTTPS, SSH
# ═══════════════════════════════════════════════════════════════════
log "Step 8/8: Configuring firewall..."

if command -v ufw &>/dev/null; then
    ufw --force reset > /dev/null 2>&1
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp    comment "SSH"
    ufw allow 80/tcp    comment "HTTP"
    ufw allow 443/tcp   comment "HTTPS"
    ufw --force enable
    log "Firewall active: SSH(22), HTTP(80), HTTPS(443)"
else
    warn "UFW not found — skipping firewall setup"
fi

# ═══════════════════════════════════════════════════════════════════
# COMPLETE
# ═══════════════════════════════════════════════════════════════════
echo ""
echo "============================================================"
echo "  Server initialization complete"
echo "============================================================"
echo ""
echo "  Installed:"
echo "    Node.js  : $(node --version)"
echo "    npm      : $(npm --version)"
echo "    PM2      : $(pm2 --version)"
echo "    Docker   : $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "    Compose  : v$(docker compose version --short)"
echo "    Caddy    : $(caddy version | head -1)"
echo ""
echo "  Swap: $(free -h | grep Swap | awk '{print $2}')"
echo ""
echo "  Next steps:"
echo "    1. Copy Caddyfile to /etc/caddy/Caddyfile"
echo "    2. Run: sudo caddy fmt --overwrite /etc/caddy/Caddyfile"
echo "    3. Run: sudo systemctl reload caddy"
echo "    4. Start Docker Compose for your environment"
echo "    5. Clone repo, install deps, run migrations"
echo "    6. Start PM2: pm2 start ecosystem.config.js"
echo "    7. Save PM2:  pm2 save && pm2 startup"
echo ""
