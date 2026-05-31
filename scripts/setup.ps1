<#
.SYNOPSIS
  IndiaGrocers — full developer machine setup
  Runs Docker, migrates DB, seeds products, configures search

.PARAMETER SkipDocker
  Skip Docker container creation (assumes already running)

.PARAMETER SkipSeed
  Skip product seeding (assumes data already loaded)

.PARAMETER ProjectRoot
  Project root directory. Defaults to script's parent directory.

.EXAMPLE
  .\scripts\setup.ps1
  .\scripts\setup.ps1 -SkipDocker
  .\scripts\setup.ps1 -SkipDocker -SkipSeed
#>

param(
  [switch] $SkipDocker,
  [switch] $SkipSeed,
  [string] $ProjectRoot
)

$ErrorActionPreference = "Stop"

if (-not $ProjectRoot) {
  $ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IndiaGrocers — Developer Setup" -ForegroundColor Cyan
Write-Host "  Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── 1. Docker containers ─────────────────────────────────────
if (-not $SkipDocker) {
  Write-Host "`n[1/6] Starting Docker containers..." -ForegroundColor Yellow
  docker compose -f "$ProjectRoot\docker-compose.yml" up -d
  Write-Host "  Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
  Start-Sleep 3
}
else {
  Write-Host "`n[1/6] Docker — SKIPPED" -ForegroundColor Gray
}

# ── 2. Install dependencies ──────────────────────────────────
Write-Host "`n[2/6] Installing dependencies..." -ForegroundColor Yellow
Push-Location $ProjectRoot
npm install
Pop-Location

Push-Location "$ProjectRoot\apps\storefront"
yarn install
Pop-Location

# ── 3. Backend .env ──────────────────────────────────────────
Write-Host "`n[3/6] Configuring backend .env..." -ForegroundColor Yellow
$envFile = "$ProjectRoot\apps\backend\.env"
if (-not (Test-Path $envFile)) {
  Copy-Item "$ProjectRoot\apps\backend\.env.template" $envFile
  Write-Host "  Created .env from template" -ForegroundColor Gray
}

$envContent = Get-Content $envFile -Raw

if ($envContent -notmatch "DATABASE_URL=" -or $envContent -match "DATABASE_URL=\s*$") {
  @"
DATABASE_URL=postgres://medusa:medusa@localhost:5432/indiagrocers
REDIS_URL=redis://localhost:6379
"@ | Out-File $envFile -Append -Encoding utf8
  Write-Host "  Added DATABASE_URL and REDIS_URL" -ForegroundColor Gray
}

# ── 4. Database migration + admin user ──────────────────────
Write-Host "`n[4/6] Running database migrations..." -ForegroundColor Yellow
Push-Location "$ProjectRoot\apps\backend"

npx medusa db:migrate
if ($LASTEXITCODE -ne 0) { throw "Migration failed" }

Write-Host "  Creating admin user..." -ForegroundColor Gray
npx medusa user -e admin@example.com -p password123
if ($LASTEXITCODE -ne 0) { Write-Host "  User may already exist — continuing" -ForegroundColor Gray }

Pop-Location

# ── 5. Seed product data ─────────────────────────────────────
# NOTE: Backend must be running for steps 5-6 (npx medusa develop in another terminal)
if (-not $SkipSeed) {
  Write-Host "`n[5/7] Seeding products (backend must be running on :9000)..." -ForegroundColor Yellow
  Push-Location "$ProjectRoot\apps\backend"

  Write-Host "  Step 5.1 — Importing products (merge weight variants)..." -ForegroundColor Gray
  node src/seed/merge-product-variants.mjs

  Write-Host "  Step 5.2 — Assigning categories..." -ForegroundColor Gray
  node src/seed/reassign-natco-categories.mjs

  Write-Host "  Step 5.3 — Assigning collections..." -ForegroundColor Gray
  node src/seed/assign-collections-v2.mjs

  Write-Host "  Step 5.4 — Configuring inventory..." -ForegroundColor Gray
  node src/seed/set-inventory.mjs

  Pop-Location
}
else {
  Write-Host "`n[5/7] Seed — SKIPPED" -ForegroundColor Gray
}

# ── 6. MeiliSearch (search engine) ───────────────────────────
Write-Host "`n[6/7] Configuring MeiliSearch..." -ForegroundColor Yellow

Push-Location "$ProjectRoot\apps\meilisearch"
npm run configure
npm run reindex
Pop-Location

# ── 7. Storefront install ────────────────────────────────────
Write-Host "`n[7/7] Storefront ready" -ForegroundColor Yellow
Write-Host "  Start with: cd apps\storefront && yarn dev" -ForegroundColor Gray

# ── Done ─────────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`n  Quick start:" -ForegroundColor White
Write-Host "    Terminal 1: cd apps\backend && npx medusa develop" -ForegroundColor Gray
Write-Host "    Terminal 2: cd apps\storefront && yarn dev" -ForegroundColor Gray
Write-Host "`n  Then seed (with backend running):" -ForegroundColor White
Write-Host "    cd apps\backend" -ForegroundColor Gray
Write-Host "    node src/seed/merge-product-variants.mjs" -ForegroundColor Gray
Write-Host "    node src/seed/reassign-natco-categories.mjs" -ForegroundColor Gray
Write-Host "    node src/seed/assign-collections-v2.mjs" -ForegroundColor Gray
Write-Host "    node src/seed/set-inventory.mjs" -ForegroundColor Gray
Write-Host "`n  Configure search:" -ForegroundColor White
Write-Host "    cd apps\meilisearch && npm run configure && npm run reindex" -ForegroundColor Gray
Write-Host "`n  Open: http://localhost:8000/gb" -ForegroundColor White
Write-Host "  Admin: http://localhost:9000/app  (admin@example.com / password123)" -ForegroundColor Gray
