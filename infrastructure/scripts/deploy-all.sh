#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# deploy-all.sh — One-Command Full Deployment (run from laptop)
# ═══════════════════════════════════════════════════════════════════
#
# Usage:
#   bash infrastructure/scripts/deploy-all.sh <SERVER1_IP> <SERVER2_IP>
#
# Example:
#   bash infrastructure/scripts/deploy-all.sh 49.13.1.10 49.13.1.20
#
# Prerequisites:
#   - SSH key uploaded to Hetzner (ssh root@<IP> works without password)
#   - Both servers created (Ubuntu 24.04 LTS, CX33 + CX23)
#
# What it does:
#   Phase 1: SCPs init-server.sh to both, runs it (5-10 min each)
#   Phase 2: SCPs setup-server1.sh to Server 1, runs it (10-15 min)
#   Phase 3: SCPs setup-server2.sh to Server 2, runs it (15-20 min)
#
# Total: ~30-45 minutes for full stack.

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${YELLOW}▶ $1${NC}"; echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

if [ $# -lt 2 ]; then
    echo "Usage: bash deploy-all.sh <SERVER1_IP> <SERVER2_IP>"
    echo "Example: bash deploy-all.sh 49.13.1.10 49.13.1.20"
    exit 1
fi

S1="$1"
S2="$2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

log "Deploying to Server 1: $S1"
log "Deploying to Server 2: $S2"
log "Infrastructure dir: $INFRA_DIR"
echo ""

# ═══════════════════════════════════════════════════════════
# PHASE 1: Initialize both servers
# ═══════════════════════════════════════════════════════════

step "Phase 1: Initialize Server 1 ($S1)"
scp "$SCRIPT_DIR/init-server.sh" "root@$S1:/root/"
ssh "root@$S1" "bash /root/init-server.sh"
log "Server 1 initialized"

step "Phase 1: Initialize Server 2 ($S2)"
scp "$SCRIPT_DIR/init-server.sh" "root@$S2:/root/"
ssh "root@$S2" "bash /root/init-server.sh"
log "Server 2 initialized"

# ═══════════════════════════════════════════════════════════
# PHASE 2: Deploy Production (Server 1)
# ═══════════════════════════════════════════════════════════

step "Phase 2: Deploy Production to Server 1 ($S1)"

# Push the setup script + ecosystem config + caddyfile
scp "$SCRIPT_DIR/setup-server1.sh" "root@$S1:/root/"

# Ensure the repo has been pushed first (setup script clones from GitHub)
log "⚠ Ensure the latest code is pushed to GitHub before continuing"
log "Press Enter to proceed with Server 1 deployment..."
read -r

ssh "root@$S1" "bash /root/setup-server1.sh"
log "Production deployed on Server 1"

# ═══════════════════════════════════════════════════════════
# PHASE 3: Deploy UAT + Support (Server 2)
# ═══════════════════════════════════════════════════════════

step "Phase 3: Deploy UAT + Support to Server 2 ($S2)"

scp "$SCRIPT_DIR/setup-server2.sh" "root@$S2:/root/"

ssh "root@$S2" "bash /root/setup-server2.sh"
log "UAT + Support deployed on Server 2"

# ═══════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════

echo ""
echo "============================================================"
echo "  All deployments complete"
echo "============================================================"
echo ""
echo "  Production:"
echo "    Storefront:  https://prod.$S1.nip.io"
echo "    API:         https://api-prod.$S1.nip.io"
echo "    Admin:       https://api-prod.$S1.nip.io/app"
echo ""
echo "  UAT (password-protected):"
echo "    Storefront:  https://uat.$S2.nip.io"
echo "    API:         https://api-uat.$S2.nip.io"
echo "    Auth:        admin / uat-secure-2026"
echo ""
echo "  Support (public):"
echo "    Storefront:  https://support.$S2.nip.io"
echo "    API:         https://api-support.$S2.nip.io"
echo ""
echo "  Next: Set up Phase 5 (nightly DB sync) and Phase 6 (GitHub Actions)"
echo "  See: infrastructure/DEPLOYMENT.md"
echo ""
