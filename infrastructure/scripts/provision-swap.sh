#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# provision-swap.sh — 4GB Swap File for Ubuntu VPS
# ═══════════════════════════════════════════════════════════════════
#
# Prevents OOM crashes during Next.js builds (which can consume
# 2-3 GB RAM temporarily). Run once on EACH server.
#
# Usage:
#   sudo bash provision-swap.sh
#
# No reboot required. Swap activates immediately.

set -euo pipefail

SWAPFILE="/swapfile"
SWAP_SIZE_MB=4096   # 4 GB

echo "=== Provisioning ${SWAP_SIZE_MB}MB swap file ==="

# ── Step 1: Allocate the swap file ──
if [ -f "$SWAPFILE" ]; then
    echo "Swap file already exists at $SWAPFILE. Skipping allocation."
else
    echo "Creating ${SWAP_SIZE_MB}MB swap file (this may take 30-60 seconds)..."
    sudo fallocate -l ${SWAP_SIZE_MB}M "$SWAPFILE" \
        || sudo dd if=/dev/zero of="$SWAPFILE" bs=1M count=$SWAP_SIZE_MB status=progress
    sudo chmod 600 "$SWAPFILE"
    echo "Swap file created."
fi

# ── Step 2: Format as swap ──
if sudo swapon --show | grep -q "$SWAPFILE"; then
    echo "Swap file already active."
else
    sudo mkswap "$SWAPFILE"
    sudo swapon "$SWAPFILE"
    echo "Swap activated."
fi

# ── Step 3: Persist across reboots ──
if grep -q "$SWAPFILE" /etc/fstab; then
    echo "Swap entry already in /etc/fstab."
else
    echo "$SWAPFILE none swap sw 0 0" | sudo tee -a /etc/fstab
    echo "Added to /etc/fstab for persistence."
fi

# ── Step 4: Adjust swappiness for build workload ──
# Lower swappiness means the system prefers RAM over swap,
# but swap is available as a safety net for build spikes.
CURRENT_SWAPPINESS=$(cat /proc/sys/vm/swappiness)
if [ "$CURRENT_SWAPPINESS" -gt 20 ]; then
    sudo sysctl vm.swappiness=20
    echo "vm.swappiness=20" | sudo tee -a /etc/sysctl.conf
    echo "Swappiness lowered from $CURRENT_SWAPPINESS to 20."
else
    echo "Swappiness already at $CURRENT_SWAPPINESS (good)."
fi

# ── Summary ──
echo ""
echo "=== Swap provisioned successfully ==="
sudo swapon --show
free -h
