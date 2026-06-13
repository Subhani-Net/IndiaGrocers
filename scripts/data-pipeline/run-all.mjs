#!/usr/bin/env node

/**
 * DATA PIPELINE MASTER ORCHESTRATOR
 *
 * Runs the complete data pipeline in order with phase gates.
 * Stops at each phase if verification fails (per QA-GATES.md).
 *
 * Usage:
 *   node scripts/data-pipeline/run-all.mjs              # Dry run — list what would run
 *   node scripts/data-pipeline/run-all.mjs --phase 1    # Run phase 1 only
 *   node scripts/data-pipeline/run-all.mjs --phase 1-3  # Run phases 1 through 3
 *   node scripts/data-pipeline/run-all.mjs --apply      # Run ALL phases
 *   node scripts/data-pipeline/run-all.mjs --from 4     # Run from phase 4 onwards
 *
 * Prerequisites:
 *   - Docker running (Postgres, Redis, MeiliSearch)
 *   - Backend running on http://localhost:9000
 *   - Admin credentials: admin@example.com / password123
 */

import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..", "..")
const BACKEND_SEED = resolve(ROOT, "apps", "backend", "src", "seed")
const SCRIPTS = resolve(ROOT, "scripts")
const MVC = resolve(SCRIPTS, "mvc")
const MEILI = resolve(ROOT, "apps", "meilisearch")
const APPLY = process.argv.includes("--apply")
const DRY = !APPLY

const phaseArg = process.argv.indexOf("--phase")
const fromArg = process.argv.indexOf("--from")
let selectedPhase = null
let fromPhase = null

if (phaseArg !== -1) {
  const val = process.argv[phaseArg + 1]
  if (val.includes("-")) {
    selectedPhase = val.split("-").map(Number)
  } else {
    selectedPhase = [Number(val), Number(val)]
  }
}
if (fromArg !== -1) fromPhase = Number(process.argv[fromArg + 1])

// ────────────────────────────────────────────────────────────
// Pipeline phases — each step calls an existing script by path
// ────────────────────────────────────────────────────────────

const PHASES = {
  "1-product-import": {
    title: "Phase 1: Product Import",
    gate: { script: "verify-data-health.mjs", check: "Product count" },
    steps: [
      { name: "Import Natco from Shopify", cmd: `node ${SCRIPTS}/import-from-shopify.mjs`, skip: !existsSync(`${SCRIPTS}/import-from-shopify.mjs`) },
      { name: "Merge Natco weight variants", cmd: `node ${BACKEND_SEED}/merge-product-variants.mjs` },
      { name: "Import TRS products", cmd: `node ${SCRIPTS}/import-trs-products.mjs`, skip: !existsSync(`${SCRIPTS}/import-trs-products.mjs`) },
      { name: "Create MVC categories", cmd: `node ${MVC}/create-categories.mjs` },
      { name: "Import MVC Round 1", cmd: `node ${MVC}/import-round1.mjs` },
      { name: "Import MVC missing variants", cmd: `node ${MVC}/import-missing-variants.mjs` },
    ],
  },
  "2-category-assignment": {
    title: "Phase 2: Category Assignment",
    steps: [
      { name: "Migrate to Natco category tree", cmd: `node ${BACKEND_SEED}/migrate-to-natco-categories.mjs` },
      { name: "Assign by title keywords", cmd: `node ${BACKEND_SEED}/assign-categories-from-titles.mjs` },
      { name: "Assign to children", cmd: `node ${BACKEND_SEED}/assign-categories-to-children.mjs` },
      { name: "Fix category handles", cmd: `node ${BACKEND_SEED}/fix-category-handles.mjs` },
      { name: "Fix tinned products", cmd: `node ${SCRIPTS}/fix-tinned-products.mjs` },
    ],
  },
  "3-enrichment": {
    title: "Phase 3: Enrichment (MVC Pipeline)",
    steps: [
      { name: "MVC enrichment pipeline", cmd: `node ${MVC}/pipeline.mjs${APPLY ? " --apply" : ""}` },
    ],
  },
  "4-images": {
    title: "Phase 4: Images",
    steps: [
      { name: "Download Natco images", cmd: `node ${SCRIPTS}/download-natco-images.mjs`, skip: !existsSync(`${SCRIPTS}/download-natco-images.mjs`) },
      { name: "Rename TRS images", cmd: `node ${SCRIPTS}/rename-trs-images.mjs` },
      { name: "Fix TRS images", cmd: `node ${SCRIPTS}/fix-trs-images.mjs` },
      { name: "Assign MVC images", cmd: `node ${MVC}/assign-images.mjs` },
      { name: "Set thumbnails", cmd: `node ${BACKEND_SEED}/set-thumbnails.mjs` },
    ],
  },
  "5-inventory": {
    title: "Phase 5: Inventory & Descriptions",
    steps: [
      { name: "Enable inventory", cmd: `node ${BACKEND_SEED}/set-inventory.mjs` },
      { name: "Set descriptions", cmd: `node ${BACKEND_SEED}/set-descriptions.mjs` },
    ],
  },
  "6-search": {
    title: "Phase 6: Search Index",
    cwd: MEILI,
    steps: [
      { name: "Configure MeiliSearch", cmd: "npm run configure" },
      { name: "Reindex products", cmd: "npm run reindex" },
    ],
  },
  "7-verify": {
    title: "Phase 7: Verification",
    steps: [
      { name: "Verify data health", cmd: `node ${SCRIPTS}/verify-data-health.mjs` },
      { name: "MVC audit", cmd: `node ${MVC}/audit.mjs` },
    ],
  },
}

// ────────────────────────────────────────────────────────────
// Execution
// ────────────────────────────────────────────────────────────

console.log("=" .repeat(60))
console.log("  IndiaGrocers — Data Pipeline Orchestrator")
console.log("  Mode:", DRY ? "DRY RUN (list only)" : "APPLY (execute)")
console.log("  Root:", ROOT)
console.log("=" .repeat(60))

let phaseNum = 1
let skipped = 0
let run = 0

for (const [key, phase] of Object.entries(PHASES)) {
  const currentPhase = phaseNum

  // Phase filtering
  if (selectedPhase) {
    if (currentPhase < selectedPhase[0] || currentPhase > selectedPhase[1]) {
      phaseNum++
      continue
    }
  }
  if (fromPhase && currentPhase < fromPhase) { phaseNum++; continue }

  console.log(`\n${"-".repeat(60)}`)
  console.log(`${phase.title} [${key}]`)

  if (phase.gate && !DRY) {
    console.log(`  Gate: ${phase.gate.script}`)
    try {
      execSync(`node ${SCRIPTS}/${phase.gate.script}`, { cwd: ROOT, stdio: "pipe", timeout: 30000 })
      console.log(`  ✓ Gate passed`)
    } catch {
      console.log(`  ✗ Gate FAILED — stopping pipeline per QA-GATES.md`)
      break
    }
  }

  const cwd = phase.cwd || ROOT
  for (const step of phase.steps) {
    if (step.skip) {
      console.log(`  ○ SKIP (unavailable): ${step.name}`)
      skipped++
      continue
    }

    if (DRY) {
      console.log(`  → WOULD RUN: ${step.name}`)
      console.log(`    cwd: ${cwd}`)
      console.log(`    cmd: ${step.cmd}`)
      run++
    } else {
      console.log(`  ▶ RUNNING: ${step.name}`)
      try {
        execSync(step.cmd, { cwd, stdio: "inherit", timeout: 300000 })
        console.log(`  ✓ DONE: ${step.name}`)
        run++
      } catch (e) {
        console.log(`  ✗ FAILED: ${step.name} — ${e.message}`)
        process.exit(1)
      }
    }
  }

  phaseNum++
}

console.log(`\n${"=".repeat(60)}`)
if (DRY) {
  console.log(`  DRY RUN: ${run} steps would run, ${skipped} skipped`)
  console.log(`  Run with --apply to execute`)
} else {
  console.log(`  COMPLETE: ${run} steps executed`)
}
console.log(`  Next: node scripts/verify-data-health.mjs`)
console.log(`{"=".repeat(60)}`)
