#!/usr/bin/env node

/**
 * Cross-platform client installer and builder for Hotel Offer Orchestrator.
 * Works on Windows, macOS, and Linux.
 *
 * Usage:
 *   Windows   ->  double-click install-and-build.bat  (which calls this file)
 *   Mac/Linux ->  ./install-and-build.sh              (which calls this file)
 *   Direct    ->  node install-and-build.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const isWindows = os.platform() === "win32";
const isMac = os.platform() === "darwin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(tag, msg) {
  const tags = { OK: "[OK]   ", WARN: "[WARN] ", ERROR: "[ERROR]", INFO: "[INFO] ", BUILD: "[BUILD]" };
  console.log(`${tags[tag] || tag}  ${msg}`);
}

function runVisible(cmd, env = {}) {
  try {
    execSync(cmd, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Banner ───────────────────────────────────────────────────────────────────

console.log();
console.log("==========================================");
console.log("  Hotel Client - Install and Build");
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

// ─── 2. Install dependencies ──────────────────────────────────────────────────

console.log();
log("INFO", "Step 1/2 — Installing packages...");

if (fs.existsSync(path.join(__dirname, "node_modules"))) {
  log("OK", "node_modules already exists. Skipping install.");
} else {
  const ok = runVisible("npm install --legacy-peer-deps");
  if (!ok) {
    log("ERROR", "npm install failed. Check your internet connection.");
    process.exit(1);
  }
  log("OK", "Packages installed.");
}

// Fix: ajv-keywords requires ajv v8 (ajv/dist/compile/codegen)
// react-scripts installs ajv v6 which is missing that path — force install ajv v8
log("INFO", "Patching ajv dependency for Node compatibility...");
const ajvOk = runVisible("npm install ajv@^8 --legacy-peer-deps --no-save");
if (!ajvOk) {
  log("WARN", "ajv patch failed — build may still work, continuing...");
} else {
  log("OK", "ajv patched successfully.");
}

// ─── 3. Build ────────────────────────────────────────────────────────────────

console.log();
log("BUILD", "Step 2/2 — Building client...");

// resolve react-scripts path cross-platform
const reactScripts = isWindows
  ? path.join("node_modules", ".bin", "react-scripts.cmd")
  : path.join("node_modules", ".bin", "react-scripts");

// NODE_OPTIONS fixes OpenSSL + ajv compatibility issues on Node 18/20/22/24
const buildEnv = {
  NODE_OPTIONS: "--openssl-legacy-provider",
  SKIP_PREFLIGHT_CHECK: "true",
  GENERATE_SOURCEMAP: "false",
  CI: "false",
};

let buildOk = runVisible(`"${reactScripts}" build`, buildEnv);

// fallback: try with just the legacy openssl flag if first attempt fails
if (!buildOk) {
  log("WARN", "First build attempt failed. Trying fallback...");
  buildEnv.NODE_OPTIONS = "--openssl-legacy-provider";
  buildOk = runVisible(`"${reactScripts}" build`, buildEnv);
}

// second fallback: try without NODE_OPTIONS entirely
if (!buildOk) {
  log("WARN", "Trying build without NODE_OPTIONS...");
  delete buildEnv.NODE_OPTIONS;
  buildOk = runVisible(`"${reactScripts}" build`, buildEnv);
}

if (!buildOk) {
  log("ERROR", "Build failed. Check the errors above.");
  process.exit(1);
}

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log();
console.log("==========================================");
console.log("  Done! Build is in the 'build' folder.");
console.log("  Copy 'build' contents to server/client/build");
console.log("==========================================");
console.log();