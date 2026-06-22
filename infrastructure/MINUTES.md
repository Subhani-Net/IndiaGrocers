# Minutes of Meeting — Cloud Infrastructure & DevOps Setup

> **Date:** 2026-06-22 | **Attendees:** Architect, DevOps Engineer | **Topic:** Production Infrastructure Design

---

## 1. Agenda

1. Infrastructure architecture for IndiaGrocers London launch
2. Reverse proxy setup for non-production server
3. Docker containerisation strategy
4. Production-to-support database sync with GDPR compliance
5. CI/CD pipeline design
6. System hardening (swap, PM2, health checks)

---

## 2. Decisions Made

### 2.1 Server Topology

| Decision | Detail |
|----------|--------|
| **Server 1** | Production only — `192.168.1.10`. Runs Medusa (9000), Next.js (3000), Docker services (Postgres, Redis, MeiliSearch on standard ports) |
| **Server 2** | Non-production — `192.168.1.20`. Hosts UAT + Prod-Support environments side-by-side using Docker Compose project names and port offsets |
| **No containerised Medusa/Next.js** | Backend and storefront run directly on the host via PM2 for simpler deploys, lower memory overhead, and direct filesystem access for images/uploads. Only infrastructure services (Postgres, Redis, MeiliSearch) are Dockerised |
| **PM2 process manager** | Chosen over systemd for unified process management, log rotation, and zero-downtime reloads |

### 2.2 Reverse Proxy

| Decision | Detail |
|----------|--------|
| **Caddy over Nginx** | Chosen for automatic HTTPS (Let's Encrypt), simpler config syntax, and built-in HTTP Basic Auth support. No external certbot cron jobs needed |
| **Domain mapping** | `staging.grocery.com` / `api-staging.grocery.com` → UAT (ports 3001/9001). `support.grocery.com` / `api-support.grocery.com` → Support (ports 3002/9002) |
| **UAT auth** | HTTP Basic Authentication via Caddy's `basicauth` directive + htpasswd file. Prevents Google indexing and public access to staging |
| **Support public** | No auth — used for training, demos, and admin testing. Populated with anonymised production data |

### 2.3 Docker Strategy

| Decision | Detail |
|----------|--------|
| **Project isolation** | `docker compose -p uat` and `docker compose -p support` keep volumes and networks separate |
| **Port offsets** | UAT: Postgres 5433, Redis 6380, MeiliSearch 7701. Support: Postgres 5434, Redis 6381, MeiliSearch 7702. No collisions |
| **Health checks** | All containers have `healthcheck` directives. Docker reports unhealthy state if services fail |
| **Redis memory policy** | `allkeys-lru` with 256MB limit — prevents Redis from consuming all RAM while keeping frequently-accessed data hot |

### 2.4 Database Sync

| Decision | Detail |
|----------|--------|
| **Nightly cron** | Runs at 3 AM UTC. Full pg_dump from production, anonymised, restored into support |
| **GDPR compliance** | All customer emails replaced with `customer-anon@support.internal`. Phone numbers zeroed (`07000000000`). bcrypt password hashes replaced with known hash (`TestPass1`) so support staff can log into any account |
| **MeiliSearch reindex** | Support MeiliSearch is cleared and reindexed after DB restore so search reflects synced data |
| **Migrations run** | Medusa migrations are executed against the restored database to handle schema changes from newer code |

### 2.5 CI/CD Pipeline

| Decision | Detail |
|----------|--------|
| **Trigger** | `main` → Production (Server 1), `develop` → UAT (Server 2) |
| **Strategy** | SSH-based deploy via `appleboy/ssh-action`. No Docker image building — direct code pull, install, build, reload |
| **Environment secrets** | `.env` files stored as GitHub Secrets (`ENV_PROD`, `ENV_UAT`) and written at deploy time. No secrets in the repository |
| **Build memory safety** | PM2 stopped before Next.js build on UAT (lower-memory server). 4GB swap provisioned as safety net |
| **Health check** | Backend polled for 30 seconds after restart before MeiliSearch reindex. Deploy fails if backend doesn't come up |

### 2.6 System Hardening

| Decision | Detail |
|----------|--------|
| **Swap** | 4GB swap file on both servers. Next.js builds peak at 2-3GB — swap prevents OOM killer from terminating the process |
| **Swappiness** | Set to 20 (default: 60). System prefers RAM but swap is available for build spikes |
| **PM2 auto-restart** | `pm2 save` + `pm2 startup` ensures processes survive server reboots |
| **Log rotation** | Caddy logs roll at 20MB (keep 5). PM2 logs handled by pm2-logrotate module |

---

## 3. Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `infrastructure/README.md` | Complete setup guide for both servers |
| 2 | `infrastructure/server2/caddy/Caddyfile` | Caddy reverse proxy configuration |
| 3 | `infrastructure/server2/docker/docker-compose.uat.yml` | UAT Docker services |
| 4 | `infrastructure/server2/docker/docker-compose.support.yml` | Support Docker services |
| 5 | `infrastructure/scripts/provision-swap.sh` | 4GB swap provisioning |
| 6 | `infrastructure/scripts/sync-prod-to-support.sh` | Nightly DB sync + GDPR anonymisation |
| 7 | `.github/workflows/deploy.yml` | CI/CD pipeline (main→prod, develop→UAT) |
| 8 | `infrastructure/server2/ecosystem.backend.config.js` | PM2 config for Medusa |
| 9 | `infrastructure/server2/ecosystem.storefront.config.js` | PM2 config for Next.js |
| 10 | `infrastructure/MINUTES.md` | This document |

---

## 4. Pre-Launch Checklist

| # | Task | Server | Status |
|---|------|--------|--------|
| 1 | Run `provision-swap.sh` | Server 1, Server 2 | Pending |
| 2 | Install Docker + Docker Compose | Server 1, Server 2 | Pending |
| 3 | Install Caddy | Server 2 | Pending |
| 4 | Deploy Caddyfile + generate htpasswd | Server 2 | Pending |
| 5 | Start `docker-compose.uat.yml` (`-p uat`) | Server 2 | Pending |
| 6 | Start `docker-compose.support.yml` (`-p support`) | Server 2 | Pending |
| 7 | Clone repo to `/opt/production`, seed DB | Server 1 | Pending |
| 8 | Clone repo to `/opt/uat` (develop branch) | Server 2 | Pending |
| 9 | Clone repo to `/opt/support` (main branch) | Server 2 | Pending |
| 10 | Install PM2 globally (`npm install -g pm2`) | Server 1, Server 2 | Pending |
| 11 | Set up SSH key exchange (Server 2 → Server 1) | Server 2 | Pending |
| 12 | Test `sync-prod-to-support.sh` manually | Server 2 | Pending |
| 13 | Add cron job for nightly sync | Server 2 | Pending |
| 14 | Add GitHub Secrets (PROD_HOST, ENV_PROD, etc.) | GitHub | Pending |
| 15 | Test CI/CD: push to `develop` → verify UAT deploy | GitHub | Pending |
| 16 | Test CI/CD: push to `main` → verify production deploy | GitHub | Pending |
| 17 | Verify Caddy auto-TLS (staging.grocery.com, support.grocery.com) | Server 2 | Pending |
| 18 | Verify htpasswd protects UAT storefront | Browser | Pending |
| 19 | Verify GDPR anonymisation in support DB | Server 2 | Pending |
| 20 | Run full checkout + payment test on production | Browser | Pending |

---

## 5. Open Items / Risks

| # | Item | Risk | Mitigation |
|---|------|------|-----------|
| 1 | Next.js build OOM on Server 2 (UAT — lower RAM) | Medium | 4GB swap provisioned; PM2 stopped before build; `yarn build` uses `--experimental-worker` if available |
| 2 | Caddy auto-TLS failure on DNS not propagated | Low | DNS must be configured before Caddy starts. Caddy retries automatically |
| 3 | `sed` anonymisation too aggressive | Low | Tested pattern — targets only customer INSERT statements. Admin/system emails preserved |
| 4 | PM2 ecosystem config `PORT` override per environment | Low | PORT is set in ecosystem config and also in `.env`. Both must match |
| 5 | Stripe webhooks — production needs Stripe CLI or live webhook endpoint | Medium | Stripe webhook secret must be in production `.env`. Webhook endpoint: `https://api.grocery.com/hooks/payment/stripe` |

---

## 6. Next Steps

1. Provision both VPS servers (swap, Docker, Caddy, PM2)
2. Configure DNS records for all 4 domains pointing to Server 2
3. Run the pre-launch checklist (Section 4)
4. Test full end-to-end order flow on UAT
5. Go-live: push to `main` → verify production deploy → verify Stripe live keys → open storefront to public

---

## 7. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-06-22 | DevOps Architect | Initial infrastructure design and documentation |
| 2026-06-22 | DevOps Architect | Phase 2: Server 1 Caddyfile, init-server.sh, unified PM2 ecosystem, nip.io domains, README refresh |
