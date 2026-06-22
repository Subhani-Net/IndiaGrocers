# Infrastructure — Production Deployment

> **Environment:** Production (Server 1) + UAT / Support (Server 2)

---

## Server Map

| Server | IP | Purpose | Services |
|--------|----|---------|----------|
| **Server 1** | `192.168.1.10` | Production | Caddy proxy, Next.js (3000), Medusa (9000), Docker: Postgres (5432), Redis (6379), MeiliSearch (7700) |
| **Server 2** | `178.105.79.185` | Non-Production | Caddy proxy, UAT Next.js (3001), UAT Medusa (9001), Support Next.js (3002), Support Medusa (9002), Docker: UAT PG (5433) / Support PG (5434), etc. |

### Access URLs (via nip.io — free wildcard DNS)

| Environment | Storefront | API |
|------------|-----------|-----|
| **Production** | `https://prod.192.168.1.10.nip.io` | `https://api-prod.192.168.1.10.nip.io` |
| **UAT** (password-protected) | `https://uat.178.105.79.185.nip.io` | `https://api-uat.178.105.79.185.nip.io` |
| **Support** (public) | `https://support.178.105.79.185.nip.io` | `https://api-support.178.105.79.185.nip.io` |

> When ready for real domains, replace the `nip.io` addresses in both Caddyfiles and restart Caddy.

---

## Quick-Start — Server Initialization

### Both Servers — One Command

```bash
# SSH into the server as root, then:
curl -sSL https://raw.githubusercontent.com/Subhani-Net/IndiaGrocers/main/infrastructure/scripts/init-server.sh | sudo bash
```

This installs: 4GB swap, Node.js 20, PM2, Docker + Compose, Caddy, UFW firewall.
Idempotent — safe to re-run.

---

## Setup — Server 1 (Production)

```bash
# 1. Initialize the server (if not already done)
sudo bash infrastructure/scripts/init-server.sh

# 2. Deploy Caddyfile
sudo cp infrastructure/server1/caddy/Caddyfile /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 3. Clone repo
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/production

# 4. Start Docker services
cd /opt/production
docker compose -f docker-compose.yml up -d

# 5. Setup backend
cd /opt/production/apps/backend
cp .env.template .env    # edit with production values
npx medusa db:migrate
npx medusa user -e admin@example.com -p <strong-password>

# 6. Seed products from CSV
cd /opt/production
node catalogue/seed-catalogue.mjs --apply --reindex

# 7. Build storefront
cd /opt/production/apps/storefront
yarn install
yarn build

# 8. Start services with PM2
cp infrastructure/ecosystem.config.js apps/backend/ecosystem.config.js
cp infrastructure/ecosystem.config.js apps/storefront/ecosystem.config.js
cd apps/backend && pm2 start ecosystem.config.js --only medusa-prod
cd ../storefront && pm2 start ecosystem.config.js --only storefront-prod
pm2 save && pm2 startup
```

---

## Setup — Server 2 (Non-Production)

```bash
# 1. Initialize the server
sudo bash infrastructure/scripts/init-server.sh

# 2. Deploy Caddyfile
sudo cp infrastructure/server2/caddy/Caddyfile /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 3. Generate UAT htpasswd (prompts for password)
sudo htpasswd -c /etc/caddy/uat.htpasswd admin

# 4. Start UAT Docker
docker compose -p uat -f infrastructure/server2/docker/docker-compose.uat.yml up -d

# 5. Start Support Docker
docker compose -p support -f infrastructure/server2/docker/docker-compose.support.yml up -d

# 6. Clone repo for UAT (develop branch)
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/uat
cd /opt/uat && git checkout develop

# 7. Setup UAT backend
cd /opt/uat/apps/backend
cp .env.template .env    # edit with UAT values (ports 5433/6380/7701)
npx medusa db:migrate
npx medusa user -e admin@example.com -p password123

# 8. Seed UAT from CSV
cd /opt/uat
node catalogue/seed-catalogue.mjs --apply --reindex

# 9. Build UAT storefront
cd /opt/uat/apps/storefront
yarn install && yarn build

# 10. Start UAT with PM2
cp /opt/production/infrastructure/ecosystem.config.js /opt/uat/apps/backend/ecosystem.config.js
cp /opt/production/infrastructure/ecosystem.config.js /opt/uat/apps/storefront/ecosystem.config.js
cd /opt/uat/apps/backend && pm2 start ecosystem.config.js --only medusa-uat
cd /opt/uat/apps/storefront && pm2 start ecosystem.config.js --only storefront-uat

# 11. Clone repo for Support (main branch, uses synced-anonymised data)
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/support
cd /opt/support && git checkout main

# 12. Setup Support (migrations only — data comes from nightly sync)
cd /opt/support/apps/backend
cp .env.template .env    # edit with support values (ports 5434/6381/7702)
npx medusa db:migrate

# 13. Build Support storefront
cd /opt/support/apps/storefront
yarn install && yarn build

# 14. Start Support with PM2
cp /opt/production/infrastructure/ecosystem.config.js /opt/support/apps/backend/ecosystem.config.js
cp /opt/production/infrastructure/ecosystem.config.js /opt/support/apps/storefront/ecosystem.config.js
cd /opt/support/apps/backend && pm2 start ecosystem.config.js --only medusa-support
cd /opt/support/apps/storefront && pm2 start ecosystem.config.js --only storefront-support

# 15. Set up SSH key exchange for nightly DB sync
ssh-keygen -t ed25519 -f ~/.ssh/id_rsa -N ""
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@192.168.1.10

# 16. Test DB sync
sudo bash infrastructure/scripts/sync-prod-to-support.sh

# 17. Add nightly cron
sudo crontab -e
# Add: 0 3 * * * /opt/support/infrastructure/scripts/sync-prod-to-support.sh >> /var/log/db-sync.log 2>&1
```

---

## GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `PROD_HOST` | `192.168.1.10` |
| `PROD_SSH_USER` | `deploy` |
| `PROD_SSH_KEY` | SSH private key for deploy@Server1 |
| `UAT_HOST` | `178.105.79.185` |
| `UAT_SSH_USER` | `deploy` |
| `UAT_SSH_KEY` | SSH private key for deploy@Server2 |
| `ENV_PROD` | Full contents of production `.env` |
| `ENV_UAT` | Full contents of UAT `.env` |

---

## Directory Structure

```
infrastructure/
├── README.md
├── MINUTES.md
├── ecosystem.config.js                     # Unified PM2 — 6 apps across 3 environments
├── scripts/
│   ├── init-server.sh                      # Full Ubuntu 24.04 provisioning
│   ├── provision-swap.sh                   # Standalone swap setup
│   └── sync-prod-to-support.sh             # Nightly DB anonymise + restore
├── server1/
│   └── caddy/
│       └── Caddyfile                       # Production reverse proxy
├── server2/
│   ├── caddy/
│   │   └── Caddyfile                       # UAT + Support reverse proxy (nip.io)
│   ├── docker/
│   │   ├── docker-compose.uat.yml
│   │   └── docker-compose.support.yml
│   ├── ecosystem.backend.config.js         # Legacy — per-env backend PM2
│   └── ecosystem.storefront.config.js      # Legacy — per-env storefront PM2
└── .github/workflows/
    └── deploy.yml                          # CI/CD — main→prod, develop→UAT
```

---

## PM2 Commands

```bash
pm2 status                   # list all running apps
pm2 logs                     # tail all logs
pm2 reload ecosystem.config.js --only medusa-prod  # zero-downtime restart
pm2 delete all               # stop everything
pm2 save                     # save current process list
pm2 startup                  # generate startup script for systemd
```

## Switching to Real Domains

1. Replace `nip.io` addresses in both Caddyfiles with your actual domains
2. Run `sudo caddy fmt --overwrite /etc/caddy/Caddyfile && sudo systemctl reload caddy` on each server
3. Update DNS A records to point to the server IPs
4. Caddy auto-obtains Let's Encrypt certificates
