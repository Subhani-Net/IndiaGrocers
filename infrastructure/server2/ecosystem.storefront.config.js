# ═══════════════════════════════════════════════════════════════════
# PM2 Ecosystem Config — Next.js Storefront
# ═══════════════════════════════════════════════════════════════════
#
# Deploy to: /opt/<environment>/apps/storefront/ecosystem.config.js
#
# Usage:
#   pm2 start ecosystem.config.js
#   pm2 reload ecosystem.config.js --update-env

module.exports = {
  apps: [
    {
      name: "storefront",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: ".",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,   // override per environment: 3001 for UAT, 3002 for support
      },
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/storefront-error.log",
      out_file: "/var/log/pm2/storefront-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      kill_timeout: 5000,
    },
  ],
}
