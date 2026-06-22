# ═══════════════════════════════════════════════════════════════════
# PM2 Ecosystem — Unified Multi-Environment Config
# ═══════════════════════════════════════════════════════════════════
#
# Deploy to: /opt/<environment>/apps/<backend|storefront>/ecosystem.config.js
# See deployment notes below for per-environment copy/paste.
#
# This single file defines 6 apps across 3 environments:
#   - Production  (Server 1): Next.js:3000  Medusa:9000
#   - UAT         (Server 2): Next.js:3001  Medusa:9001
#   - Support     (Server 2): Next.js:3002  Medusa:9002
#
# Usage:
#   pm2 start ecosystem.config.js         # start apps for THIS environment only
#   pm2 reload ecosystem.config.js        # zero-downtime reload
#   pm2 logs                              # tail all logs
#   pm2 save && pm2 startup               # persist across reboots
#
# exec_mode: "cluster" — one process per CPU core, zero-downtime reloads.
# For Hetzner CX33 (2 vCPU): 2 instances per app.
# For Hetzner CX23 (2 vCPU): 2 instances per app.

module.exports = {

  apps: [

    // ═══════════════════════════════════════════════════════════
    // PRODUCTION — Server 1 (192.168.1.10)
    // Copy this block to: /opt/production/apps/backend/ecosystem.config.js
    // ═══════════════════════════════════════════════════════════

    {
      name: "medusa-prod",
      script: "npx",
      args: "medusa start",
      cwd: "/opt/production/apps/backend",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 10000,
      error_file: "/var/log/pm2/medusa-prod-error.log",
      out_file: "/var/log/pm2/medusa-prod-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 9000,
      },
    },

    {
      name: "storefront-prod",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/production/apps/storefront",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "512M",
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 5000,
      error_file: "/var/log/pm2/storefront-prod-error.log",
      out_file: "/var/log/pm2/storefront-prod-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // UAT — Server 2 (192.168.1.20)
    // Copy this block to: /opt/uat/apps/backend/ecosystem.config.js
    // ═══════════════════════════════════════════════════════════

    {
      name: "medusa-uat",
      script: "npx",
      args: "medusa start",
      cwd: "/opt/uat/apps/backend",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "768M",
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 10000,
      error_file: "/var/log/pm2/medusa-uat-error.log",
      out_file: "/var/log/pm2/medusa-uat-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 9001,
      },
    },

    {
      name: "storefront-uat",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/uat/apps/storefront",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "512M",
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 5000,
      error_file: "/var/log/pm2/storefront-uat-error.log",
      out_file: "/var/log/pm2/storefront-uat-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },

    // ═══════════════════════════════════════════════════════════
    // PROD-SUPPORT — Server 2 (192.168.1.20)
    // Copy this block to: /opt/support/apps/backend/ecosystem.config.js
    // ═══════════════════════════════════════════════════════════

    {
      name: "medusa-support",
      script: "npx",
      args: "medusa start",
      cwd: "/opt/support/apps/backend",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "768M",
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 10000,
      error_file: "/var/log/pm2/medusa-support-error.log",
      out_file: "/var/log/pm2/medusa-support-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 9002,
      },
    },

    {
      name: "storefront-support",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/opt/support/apps/storefront",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "512M",
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 5000,
      error_file: "/var/log/pm2/storefront-support-error.log",
      out_file: "/var/log/pm2/storefront-support-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },

  ],
}
