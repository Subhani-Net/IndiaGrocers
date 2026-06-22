# IndiaGrocers — Hetzner Cloud Deployment Playbook

> **Project:** IndiaGrocers (ID: 15075896) | **OS:** Ubuntu 24.04 LTS

---

## Before You Start

| Item | How to Get It |
|------|---------------|
| SSH key pair | `ssh-keygen -t ed25519 -C "hetzner-deploy"` on your laptop |
| GitHub token | https://github.com/settings/tokens (repo scope) |

---

## Phase 1 — Create Both Servers

### Step 1.1 — Upload SSH Key

```
Hetzner Console → Security → SSH Keys → Add SSH Key
  Name:  laptop
  Key:   paste ~/.ssh/id_ed25519.pub
```

### Step 1.2 — Create Server 1 (Production, 8 GB RAM)

```
Hetzner Console → Servers → Add Server
  Image:       Ubuntu 24.04 LTS
  Type:        CX33 (2 vCPU, 8 GB RAM, 80 GB NVMe)
  Networking:  Public IPv4
  Name:        indiagrocers-prod
  SSH Key:     laptop
  Volumes:     Add Volume 50 GB → name: prod-data
```

### Step 1.3 — Create Server 2 (Non-Production, 4 GB RAM)

```
Hetzner Console → Servers → Add Server
  Image:       Ubuntu 24.04 LTS
  Type:        CX23 (2 vCPU, 4 GB RAM, 60 GB NVMe)
  Networking:  Public IPv4
  Name:        indiagrocers-nonprod
  SSH Key:     laptop
  Volumes:     Add Volume 40 GB → name: nonprod-data
```

### Step 1.4 — Attach Volumes + Note IPs

For each server: Volumes → Attach → Mount (auto-format).

Note the public IPs. Update these files in the repo, replacing `192.168.1.x`:

- `infrastructure/server1/caddy/Caddyfile` → Server 1's IP
- `infrastructure/server2/caddy/Caddyfile` → Server 2's IP
- `infrastructure/scripts/sync-prod-to-support.sh` → `PROD_HOST` variable
- `infrastructure/README.md` → IP references

---

## Phase 2 — Run init-server.sh on Both Servers

### Step 2.1 — SCP the script

```powershell
scp infrastructure/scripts/init-server.sh root@<SERVER1_IP>:/root/
scp infrastructure/scripts/init-server.sh root@<SERVER2_IP>:/root/
```

### Step 2.2 — Execute on each server

```bash
ssh root@<SERVER1_IP>
bash /root/init-server.sh
# Wait 5 min. Installs: Node 20, PM2, Docker, Caddy, 4GB swap, UFW firewall.

exit
ssh root@<SERVER2_IP>
bash /root/init-server.sh
```

### Step 2.3 — Move Docker data to volume (both servers)

```bash
systemctl stop docker
mkdir -p /mnt/HC_Volume_*/docker
rsync -aP /var/lib/docker/ /mnt/HC_Volume_*/docker/
rm -rf /var/lib/docker
ln -s /mnt/HC_Volume_*/docker /var/lib/docker
systemctl start docker
```

---

## Phase 3 — Server 2 (Non-Production) Setup

### Step 3.1 — Start Docker services

```bash
ssh root@<SERVER2_IP>

# Clone repo temporarily to get compose files
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/infra-temp
cp /opt/infra-temp/infrastructure/server2/docker/*.yml /opt/
rm -rf /opt/infra-temp

# Start both environments
cd /opt
docker compose -p uat -f docker-compose.uat.yml up -d
docker compose -p support -f docker-compose.support.yml up -d
docker ps
# Expected: 6 containers, all "(healthy)"
```

### Step 3.2 — Deploy Caddy

```bash
# From laptop
scp infrastructure/server2/caddy/Caddyfile root@<SERVER2_IP>:/etc/caddy/Caddyfile

# On Server 2
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo systemctl reload caddy

# Create UAT auth credentials
sudo htpasswd -c /etc/caddy/uat.htpasswd admin
# Enter a password. This protects UAT from public access.
```

Verify: `https://uat.<IP>.nip.io` → password prompt. `https://support.<IP>.nip.io` → no backend (expected).

### Step 3.3 — Deploy UAT (develop branch)

```bash
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/uat
cd /opt/uat && git checkout develop
npm install

# Backend
cd apps/backend && cp .env.template .env
nano .env   # DATABASE_URL=postgres://medusa:medusa_uat_password_2026@localhost:5433/indiagrocers_uat
            # REDIS_URL=redis://localhost:6380
            # STRIPE_SECRET_KEY=sk_test_...
npx medusa db:migrate
npx medusa user -e admin@example.com -p <password>

# Seed products
cd /opt/uat && node catalogue/seed-catalogue.mjs --apply --reindex

# Storefront
cd apps/storefront && yarn install && yarn build

# Start with PM2
cd /opt/uat/apps/backend && cp /opt/uat/infrastructure/ecosystem.config.js .
pm2 start ecosystem.config.js --only medusa-uat
cd /opt/uat/apps/storefront && cp /opt/uat/infrastructure/ecosystem.config.js .
pm2 start ecosystem.config.js --only storefront-uat
pm2 save
pm2 startup
```

### Step 3.4 — Deploy Support (main branch, uses synced data)

```bash
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/support
cd /opt/support
npm install

cd apps/backend && cp .env.template .env
nano .env   # DATABASE_URL=postgres://medusa:medusa_support_password_2026@localhost:5434/indiagrocers_support
            # REDIS_URL=redis://localhost:6381
npx medusa db:migrate

cd /opt/support/apps/storefront && yarn install && yarn build

# PM2
cd /opt/support/apps/backend && cp /opt/support/infrastructure/ecosystem.config.js .
pm2 start ecosystem.config.js --only medusa-support
cd /opt/support/apps/storefront && cp /opt/support/infrastructure/ecosystem.config.js .
pm2 start ecosystem.config.js --only storefront-support
pm2 save
```

---

## Phase 4 — Server 1 (Production) Setup

### Step 4.1 — Caddy + Docker

```bash
scp infrastructure/server1/caddy/Caddyfile root@<SERVER1_IP>:/etc/caddy/
ssh root@<SERVER1_IP>
caddy fmt --overwrite /etc/caddy/Caddyfile && systemctl reload caddy

# Docker
cp /opt/production/docker-compose.yml /opt/
docker compose -f /opt/docker-compose.yml up -d
docker ps
```

### Step 4.2 — Deploy Production Application

```bash
git clone https://github.com/Subhani-Net/IndiaGrocers.git /opt/production
cd /opt/production && npm install

cd apps/backend && cp .env.template .env
nano .env   # NODE_ENV=production
            # STRIPE_SECRET_KEY=sk_live_...   ← LIVE KEY
            # STRIPE_WEBHOOK_SECRET=whsec_live_...
            # JWT_SECRET=<openssl rand -hex 32>
            # COOKIE_SECRET=<openssl rand -hex 32>

npx medusa db:migrate
npx medusa user -e admin@example.com -p <strong-unique-password>

cd /opt/production && node catalogue/seed-catalogue.mjs --apply --reindex

cd apps/storefront && yarn install && yarn build

# PM2
cd /opt/production/apps/backend && cp /opt/production/infrastructure/ecosystem.config.js .
pm2 start ecosystem.config.js --only medusa-prod
cd /opt/production/apps/storefront && cp /opt/production/infrastructure/ecosystem.config.js .
pm2 start ecosystem.config.js --only storefront-prod
pm2 save && pm2 startup
```

---

## Phase 5 — Nightly DB Sync

### Step 5.1 — SSH key exchange (Server 2 → Server 1)

```bash
# On Server 2
ssh-keygen -t ed25519 -f ~/.ssh/id_sync -N ""
ssh-copy-id -i ~/.ssh/id_sync.pub root@<SERVER1_IP>
ssh -i ~/.ssh/id_sync root@<SERVER1_IP> "hostname"   # test
```

### Step 5.2 — Configure and test the sync script

```bash
# On Server 2
mkdir -p /opt/scripts
scp infrastructure/scripts/sync-prod-to-support.sh root@<SERVER2_IP>:/opt/scripts/

ssh root@<SERVER2_IP>
nano /opt/scripts/sync-prod-to-support.sh
# Set: PROD_HOST=<SERVER1_IP>, PROD_SSH_USER=root, PROD_SSH_KEY=/root/.ssh/id_sync

bash /opt/scripts/sync-prod-to-support.sh
tail -50 /var/log/db-sync.log
```

### Step 5.3 — Schedule cron

```bash
sudo crontab -e
# Add: 0 3 * * * /opt/scripts/sync-prod-to-support.sh >> /var/log/db-sync.log 2>&1
```

---

## Phase 6 — GitHub Actions

### Step 6.1 — Create deploy user on both servers

```bash
# On both servers
sudo adduser deploy --disabled-password --gecos ""
sudo usermod -aG docker deploy

# On your laptop
ssh-keygen -t ed25519 -f ~/.ssh/gh_actions_deploy -N "" -C "github-actions"
ssh-copy-id -i ~/.ssh/gh_actions_deploy.pub deploy@<SERVER1_IP>
ssh-copy-id -i ~/.ssh/gh_actions_deploy.pub deploy@<SERVER2_IP>
```

### Step 6.2 — Add GitHub Secrets

```
GitHub Repo → Settings → Secrets and variables → Actions

PROD_HOST:       <SERVER1_IP>
PROD_SSH_USER:   deploy
PROD_SSH_KEY:    (contents of ~/.ssh/gh_actions_deploy)
UAT_HOST:        <SERVER2_IP>
UAT_SSH_USER:    deploy
UAT_SSH_KEY:     (same key)
ENV_PROD:        (contents of /opt/production/apps/backend/.env)
ENV_UAT:         (contents of /opt/uat/apps/backend/.env)
```

### Step 6.3 — Trigger a deploy

```bash
git add . && git commit -m "deploy: production" && git push origin main
# Watch: https://github.com/Subhani-Net/IndiaGrocers/actions
```

---

## Verification Checks

| Environment | URL | Expected |
|------------|-----|----------|
| Production storefront | `https://prod.<IP>.nip.io` | Homepage loads, products visible, search works |
| Production API | `https://api-prod.<IP>.nip.io/health` | JSON response |
| Production Admin | `https://api-prod.<IP>.nip.io/app` | Login dashboard |
| UAT storefront | `https://uat.<IP>.nip.io` | Password prompt → storefront loads |
| Support storefront | `https://support.<IP>.nip.io` | Loads (products after sync) |
| PM2 Server 1 | `pm2 status` | medusa-prod + storefront-prod online |
| PM2 Server 2 | `pm2 status` | 4 apps online |

### Common Operations

```bash
# Logs
pm2 logs medusa-prod
sudo tail -f /var/log/caddy/prod-storefront.log
docker logs indiagrocers-postgres --tail 50

# Quick production update (manual, bypassing CI/CD)
ssh deploy@<SERVER1_IP> "cd /opt/production && git pull origin main && \
  cd apps/backend && npm ci && npx medusa db:migrate && pm2 reload ecosystem.config.js --only medusa-prod && \
  cd ../storefront && yarn install && yarn build && pm2 reload ecosystem.config.js --only storefront-prod"

# Database backup
ssh root@<SERVER1_IP> "docker exec indiagrocers-postgres pg_dump -U medusa indiagrocers > /opt/backups/backup_\$(date +%Y%m%d).sql"
```
