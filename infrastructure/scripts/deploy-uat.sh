#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# deploy-uat.sh — One-Command UAT Deployment (run from laptop)
# ═══════════════════════════════════════════════════════════════════
#
# Usage:
#   bash infrastructure/scripts/deploy-uat.sh <SERVER_IP>
#
# Example:
#   bash infrastructure/scripts/deploy-uat.sh 49.13.1.20
#
# What it does:
#   1. SCPs init-server.sh → installs Node 20, Docker, PM2, Caddy, swap (5 min)
#   2. SCPs setup-uat.sh → clones repo, starts Docker, runs Caddy,
#      migrates, seeds, builds storefront, starts PM2 (10-15 min)
#
# Total: ~20 minutes for a fully functional UAT environment.

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${YELLOW}▶ $1${NC}"; echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

if [ $# -lt 1 ]; then
    echo "Usage: bash deploy-uat.sh <SERVER_IP>"
    echo "Example: bash deploy-uat.sh 49.13.1.20"
    exit 1
fi

S1="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log "Deploying UAT to: $S1"
log "Script directory: $SCRIPT_DIR"
echo ""

# ═══════════════════════════════════════════════════════════
# PHASE 1: Initialize the server
# ═══════════════════════════════════════════════════════════

step "Phase 1: Initialize server (install Node 20, Docker, PM2, Caddy, swap)"
scp "$SCRIPT_DIR/init-server.sh" "root@$S1:/root/"
ssh "root@$S1" "bash /root/init-server.sh"
log "Server initialized"

# ═══════════════════════════════════════════════════════════
# PHASE 2: Deploy UAT application
# ═══════════════════════════════════════════════════════════

step "Phase 2: Deploy UAT application (clone, migrate, seed, build, start)"

log "⚠  Make sure the latest code is pushed to GitHub (main branch) before continuing"
log "Press Enter to proceed..."
read -r

scp "$SCRIPT_DIR/setup-uat.sh" "root@$S1:/root/"
ssh "root@$S1" "bash /root/setup-uat.sh"
log "UAT application deployed"

# ═══════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════

echo ""
echo "============================================================"
echo "  UAT deployment complete"
echo "============================================================"
echo ""
echo "  Storefront: https://uat.$S1.nip.io"
echo "  API:        https://api-uat.$S1.nip.io"
echo "  Admin:      https://api-uat.$S1.nip.io/app"
echo ""
echo "  UAT htpasswd: admin / uat-secure-2026"
echo "  Admin login:  admin@example.com / ChangeMe123!"
echo ""
echo "  PM2:     ssh root@$S1 pm2 status"
echo "  Logs:    ssh root@$S1 pm2 logs"
echo "  Restart: ssh root@$S1 pm2 reload all"
echo ""
