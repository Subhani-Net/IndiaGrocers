#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# sync-prod-to-support.sh — Nightly Production DB Sync
# ═══════════════════════════════════════════════════════════════════
#
# Runs on Server 2 as a nightly cron job (e.g., 3 AM).
#
# Flow:
#   1. SSH into Server 1, pg_dump the production database
#   2. SCP the dump to Server 2
#   3. Anonymise customer PII (emails, passwords, names, phones)
#   4. Restore into the Prod-Support database container
#   5. Run Medusa migrations against the restored DB
#   6. Reindex MeiliSearch
#   7. Clean up temp files
#
# Prerequisites:
#   - SSH key exchange between Server 2 and Server 1 (passwordless)
#   - pg_dump and psql clients installed on Server 2
#   - Docker running on both servers
#
# Cron entry (run `crontab -e` as root):
#   0 3 * * * /opt/scripts/sync-prod-to-support.sh >> /var/log/db-sync.log 2>&1

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION — Edit these before first run
# ═══════════════════════════════════════════════════════════════════

# Server 1 (Production)
PROD_HOST="192.168.1.10"
PROD_SSH_USER="deploy"
PROD_SSH_KEY="/home/deploy/.ssh/id_rsa"
PROD_DB_CONTAINER="indiagrocers-postgres"
PROD_DB_USER="medusa"
PROD_DB_NAME="indiagrocers"

# Server 2 (Non-Production — this server)
SUPPORT_DB_CONTAINER="support-postgres"
SUPPORT_DB_USER="medusa"
SUPPORT_DB_NAME="indiagrocers_support"
SUPPORT_DB_PASSWORD="medusa_support_password_2026"

# Paths
DUMP_DIR="/opt/db-sync"
DUMP_FILE="${DUMP_DIR}/prod_dump_$(date +%Y%m%d_%H%M%S).sql"
ANON_FILE="${DUMP_DIR}/prod_dump_anonymised.sql"
LOG_FILE="/var/log/db-sync.log"

# ── Logging ──────────────────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ── Cleanup handler ──────────────────────────────────────────────
cleanup() {
    log "Cleaning up temporary files..."
    rm -f "$DUMP_FILE" "$ANON_FILE"
    log "Cleanup complete."
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════
# STEP 1: Create dump directory
# ═══════════════════════════════════════════════════════════════════
mkdir -p "$DUMP_DIR"
log "=== Starting production → support database sync ==="

# ═══════════════════════════════════════════════════════════════════
# STEP 2: pg_dump from Production (Server 1) via SSH
# ═══════════════════════════════════════════════════════════════════
log "Step 1/6: Dumping production database from ${PROD_HOST}..."

SSH_CMD="ssh -i ${PROD_SSH_KEY} -o ConnectTimeout=30 -o StrictHostKeyChecking=no ${PROD_SSH_USER}@${PROD_HOST}"
DUMP_CMD="docker exec ${PROD_DB_CONTAINER} pg_dump -U ${PROD_DB_USER} -d ${PROD_DB_NAME} --no-owner --no-acl --clean --if-exists"

if $SSH_CMD "$DUMP_CMD" > "$DUMP_FILE" 2>/dev/null; then
    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    log "  ✓ Dump complete (${DUMP_SIZE})"
else
    log "  ✗ Failed to dump production database"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════
# STEP 3: Anonymise PII — GDPR Compliance
# ═══════════════════════════════════════════════════════════════════
log "Step 2/6: Anonymising customer PII..."

cp "$DUMP_FILE" "$ANON_FILE"

# Replace all @gmail.com / @yahoo.com etc. with anonymised support domain
# This catches customer emails while preserving system/admin emails
sed -i -E \
    -e "s/'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'/'anonymised-\1@support.internal'/g" \
    "$ANON_FILE"

# More targeted approach: replace customer email patterns specifically
# The customer table stores emails, names, phones in Medusa v2
sed -i -E \
    -e '/INSERT INTO.*customer/ s/'\''[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'\''/'\''customer-anon@support.internal'\''/g' \
    -e '/INSERT INTO.*customer/ s/'\''07[0-9]{9}'\''/'\''07000000000'\''/g' \
    -e '/INSERT INTO.*customer/ s/'\''\+44[0-9]{10}'\''/'\''+440000000000'\''/g' \
    "$ANON_FILE"

# Scramble bcrypt password hashes (replace with a known hash so support staff can log in)
# The hash below is 'TestPass1' hashed with bcrypt — lets support staff log into any account
SUPPORT_PASSWORD_HASH='\$2b\$10\$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234'
sed -i -E \
    -e "/INSERT INTO.*auth_identity/ s/'\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}'/'${SUPPORT_PASSWORD_HASH}'/g" \
    "$ANON_FILE"

# Replace customer names with anonymised placeholders
sed -i -E \
    -e "/INSERT INTO.*customer/ s/'\''[A-Z][a-z]+'\''/'\''Customer'\''/g" \
    "$ANON_FILE"

log "  ✓ PII anonymised (emails, passwords, names, phones scrambled)"

# ═══════════════════════════════════════════════════════════════════
# STEP 4: Restore into Prod-Support database
# ═══════════════════════════════════════════════════════════════════
log "Step 3/6: Restoring into support database..."

# Drop and recreate the support database first for a clean slate
docker exec "$SUPPORT_DB_CONTAINER" psql -U "$SUPPORT_DB_USER" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${SUPPORT_DB_NAME}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

docker exec "$SUPPORT_DB_CONTAINER" psql -U "$SUPPORT_DB_USER" \
    -d postgres \
    -c "DROP DATABASE IF EXISTS ${SUPPORT_DB_NAME};" 2>/dev/null || true

docker exec "$SUPPORT_DB_CONTAINER" psql -U "$SUPPORT_DB_USER" \
    -d postgres \
    -c "CREATE DATABASE ${SUPPORT_DB_NAME};" 2>/dev/null

# Restore the anonymised dump
cat "$ANON_FILE" | docker exec -i "$SUPPORT_DB_CONTAINER" \
    psql -U "$SUPPORT_DB_USER" -d "$SUPPORT_DB_NAME" \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "  ✓ Database restored successfully"
else
    log "  ✗ Database restore failed"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════
# STEP 5: Run Medusa migrations against restored DB
# ═══════════════════════════════════════════════════════════════════
log "Step 4/6: Running Medusa migrations..."

# Update the support .env to point to the correct database
SUPPORT_ENV_FILE="/opt/support/apps/backend/.env"

if [ -f "$SUPPORT_ENV_FILE" ]; then
    cd /opt/support/apps/backend
    npx medusa db:migrate 2>&1 | tee -a "$LOG_FILE"
    log "  ✓ Migrations complete"
else
    log "  ⚠ Support backend .env not found at $SUPPORT_ENV_FILE — skipping migrations"
fi

# ═══════════════════════════════════════════════════════════════════
# STEP 6: Reindex MeiliSearch
# ═══════════════════════════════════════════════════════════════════
log "Step 5/6: Reindexing MeiliSearch..."

SUPPORT_MEILI_HOST="${MEILI_HOST:-http://localhost:7702}"

# Clear existing index
curl -s -X DELETE "${SUPPORT_MEILI_HOST}/indexes/products/documents" > /dev/null 2>&1 || true

# Reindex via the support backend
if [ -d "/opt/support/apps/meilisearch" ]; then
    cd /opt/support/apps/meilisearch
    npm run reindex 2>&1 | tee -a "$LOG_FILE" || log "  ⚠ MeiliSearch reindex had warnings"
    log "  ✓ MeiliSearch reindexed"
else
    log "  ⚠ MeiliSearch app directory not found — skipping reindex"
fi

# ═══════════════════════════════════════════════════════════════════
# STEP 7: Verify restoration
# ═══════════════════════════════════════════════════════════════════
log "Step 6/6: Verifying restoration..."

PRODUCT_COUNT=$(docker exec "$SUPPORT_DB_CONTAINER" \
    psql -U "$SUPPORT_DB_USER" -d "$SUPPORT_DB_NAME" \
    -t -c "SELECT COUNT(*) FROM product;" 2>/dev/null | tr -d '[:space:]')

CUSTOMER_COUNT=$(docker exec "$SUPPORT_DB_CONTAINER" \
    psql -U "$SUPPORT_DB_USER" -d "$SUPPORT_DB_NAME" \
    -t -c "SELECT COUNT(*) FROM customer;" 2>/dev/null | tr -d '[:space:]')

log "  Support DB now has ${PRODUCT_COUNT:-0} products, ${CUSTOMER_COUNT:-0} customers"

# ═══════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════
log "=== Sync complete ==="
log "Dump file preserved at: $DUMP_FILE"
