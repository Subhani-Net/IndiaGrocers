# ═══════════════════════════════════════════════════════════════════
# PM2 Ecosystem Config — Medusa Backend
# ═══════════════════════════════════════════════════════════════════
#
# Deploy to: /opt/<environment>/apps/backend/ecosystem.config.js
#
# Usage:
#   pm2 start ecosystem.config.js
#   pm2 reload ecosystem.config.js --update-env
#   pm2 logs medusa-backend

module.exports = {
  apps: [
    {
      name: "medusa-backend",
      script: "npx",
      args: "medusa start",
      cwd: ".",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/medusa-backend-error.log",
      out_file: "/var/log/pm2/medusa-backend-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 10000,
    },
  ],
}
