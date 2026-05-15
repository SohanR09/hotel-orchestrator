#!/usr/bin/env node

/**
 * Cross-platform installer for Hotel Offer Orchestrator.
 * Works on Windows, macOS, and Linux.
 *
 * Usage:
 *   Windows   ->  double-click install.bat  (which calls this file)
 *   Mac/Linux ->  ./install.sh              (which calls this file)
 *   Direct    ->  node install.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";
const isMac = os.platform() === "darwin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(tag, msg) {
  const tags = { OK: "[OK]   ", WARN: "[WARN] ", ERROR: "[ERROR]", INFO: "[INFO] ", SETUP: "[SETUP]", BUILD: "[BUILD]" };
  console.log(`${tags[tag] || tag}  ${msg}`);
}

function runVisible(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

console.log();
console.log("==========================================");
console.log("  Hotel Orchestrator - Installer");
console.log(`  Platform: ${isWindows ? "Windows" : isMac ? "macOS" : "Linux"}`);
console.log("==========================================");
console.log();

// ─── 1. Check Node.js ────────────────────────────────────────────────────────

try {
  const version = execSync("node -v", { stdio: "pipe" }).toString().trim();
  log("OK", `Node.js ${version}`);
} catch {
  log("ERROR", "Node.js is not installed.");
  console.log();
  console.log("  Download from: https://nodejs.org  (choose LTS)");
  console.log();
  process.exit(1);
}

// ─── 2. Install npm dependencies ─────────────────────────────────────────────

console.log();
log("INFO", "Step 1/2 — Installing npm packages...");

if (fs.existsSync(path.join(__dirname, "node_modules"))) {
  log("OK", "node_modules already exists. Skipping install.");
} else {
  const ok = runVisible("npm install --no-audit --force");
  if (!ok) {
    log("ERROR", "npm install failed. Check your internet connection.");
    process.exit(1);
  }
  log("OK", "Dependencies installed.");
}

// ─── 3. Build TypeScript ──────────────────────────────────────────────────────

console.log();
log("BUILD", "Step 2/2 — Compiling TypeScript...");

const buildOk = runVisible("npm run build");
if (!buildOk) {
  log("ERROR", "Build failed. Run the following command for details:");
  console.log();
  console.log("  npx tsc --noEmit");
  console.log();
  process.exit(1);
}
log("OK", "Build successful.");

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log();
console.log("==========================================");
if (isWindows) {
  console.log("  Install complete. Run start.bat to launch.");
} else {
  console.log("  Install complete. Run ./start.sh to launch.");
}
console.log("==========================================");
console.log();