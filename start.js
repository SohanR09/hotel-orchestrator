#!/usr/bin/env node

/**
 * Cross-platform starter for Hotel Offer Orchestrator.
 * Detects OS, checks/starts Redis (Memurai on Windows, redis-server on Mac/Linux),
 * builds TypeScript if needed, then launches the server.
 *
 * Usage:
 *   Windows  ->  double-click start.bat  (which calls this file)
 *   Mac/Linux -> ./start.sh              (which calls this file)
 *   Direct   ->  node start.js
 */

const { execSync, spawn, spawnSync } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");

const platform = os.platform(); // 'win32' | 'darwin' | 'linux'
const isWindows = platform === "win32";
const isMac = platform === "darwin";
const isLinux = platform === "linux";

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(tag, msg) {
  const tags = { OK: "[OK]   ", WARN: "[WARN] ", ERROR: "[ERROR]", INFO: "[INFO] ", SETUP: "[SETUP]", BUILD: "[BUILD]" };
  console.log(`${tags[tag] || tag}  ${msg}`);
}

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: "pipe", ...opts });
    return true;
  } catch {
    return false;
  }
}

function runVisible(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

// ─── Banner ──────────────────────────────────────────────────────────────────

console.log();
console.log("==========================================");
console.log("  Hotel Offer Orchestrator");
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

// ─── 2. Check / Start Redis ──────────────────────────────────────────────────

console.log();
log("INFO", "Checking Redis...");

let redisRunning = false;

if (isWindows) {
  // ── Windows: use Memurai ──
  const memuraiInstalled = run("sc query Memurai");

  if (!memuraiInstalled) {
    log("WARN", "Memurai (Redis for Windows) is not installed.");
    console.log();
    console.log("  To install Memurai:");
    console.log("  1. Go to https://www.memurai.com/get-memurai");
    console.log("  2. Download and install the free Developer edition");
    console.log("  3. Re-run start.bat");
    console.log();
    console.log("  The server will start without caching for now.");
    console.log();
  } else {
    const isRunning = run('sc query Memurai | find "RUNNING"');
    if (!isRunning) {
      log("INFO", "Starting Memurai service...");
      run("net start Memurai");
      // give it a moment
      execSync("timeout /t 2 /nobreak >nul", { shell: true, stdio: "ignore" });
    }

    const pingOk = run("memurai-cli ping");
    if (pingOk) {
      log("OK", "Memurai is running and cache is responding.");
      redisRunning = true;
    } else {
      log("WARN", "Memurai is running but ping failed. Caching may be unavailable.");
    }
  }

} else if (isMac) {
  // ── macOS: use redis-server via Homebrew ──
  const redisInstalled = run("which redis-server");

  if (!redisInstalled) {
    log("WARN", "redis-server is not installed.");
    console.log();
    console.log("  To install Redis on macOS:");
    console.log("  1. Install Homebrew (if not already):  https://brew.sh");
    console.log("     /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"");
    console.log("  2. Then run:");
    console.log("     brew install redis");
    console.log("     brew services start redis");
    console.log("  3. Re-run ./start.sh");
    console.log();
    console.log("  The server will start without caching for now.");
    console.log();
  } else {
    const pingOk = run("redis-cli ping");
    if (!pingOk) {
      log("INFO", "Starting redis-server...");
      // Start in background
      const child = spawn("redis-server", [], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      // Wait briefly for it to start
      execSync("sleep 1");
    }

    const pingOk2 = run("redis-cli ping");
    if (pingOk2) {
      log("OK", "Redis is running and cache is responding.");
      redisRunning = true;
    } else {
      log("WARN", "Redis could not be started. Caching will be unavailable.");
    }
  }

} else if (isLinux) {
  // ── Linux: use redis-server ──
  const redisInstalled = run("which redis-server");

  if (!redisInstalled) {
    log("WARN", "redis-server is not installed.");
    console.log();
    console.log("  To install Redis on Linux:");
    console.log("  sudo apt update && sudo apt install redis-server -y");
    console.log("  sudo service redis-server start");
    console.log();
    console.log("  The server will start without caching for now.");
    console.log();
  } else {
    const pingOk = run("redis-cli ping");
    if (!pingOk) {
      log("INFO", "Starting redis-server...");
      run("sudo service redis-server start");
      execSync("sleep 1");
    }

    const pingOk2 = run("redis-cli ping");
    if (pingOk2) {
      log("OK", "Redis is running and cache is responding.");
      redisRunning = true;
    } else {
      log("WARN", "Redis could not be started. Caching will be unavailable.");
    }
  }

} else {
  log("WARN", `Unsupported platform: ${platform}. Redis check skipped.`);
}

if (!redisRunning) {
  log("WARN", "Server is starting WITHOUT Redis caching.");
}

// ─── 3. Install dependencies ──────────────────────────────────────────────────

if (!fs.existsSync(path.join(__dirname, "node_modules"))) {
  console.log();
  log("SETUP", "Installing npm packages - please wait...");
  const ok = runVisible("npm install --no-audit --force");
  if (!ok) {
    log("ERROR", "npm install failed. Check your internet connection.");
    process.exit(1);
  }
  log("OK", "Dependencies installed.");
}

// ─── 4. Build TypeScript ──────────────────────────────────────────────────────

console.log();
log("BUILD", "Compiling TypeScript...");
const buildOk = runVisible("npm run build");

// ─── 5. Start the server ──────────────────────────────────────────────────────

console.log();
console.log("==========================================");
console.log("  Server running at http://localhost:3000");
console.log("==========================================");
console.log();
console.log("  GET  http://localhost:3000/api/hotels?city=delhi");
console.log("  GET  http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=9000");
console.log("  GET  http://localhost:3000/supplierA/hotels");
console.log("  GET  http://localhost:3000/supplierB/hotels");
console.log("  GET  http://localhost:3000/health");
console.log();
console.log("  Press Ctrl+C to stop the server.");
console.log();

if (buildOk) {
  spawnSync("node", ["dist/index.js"], { stdio: "inherit" });
} else {
  log("WARN", "Build failed. Falling back to ts-node (slower start)...");
  console.log();
  spawnSync("npx", ["ts-node", "src/index.ts"], { stdio: "inherit" });
}