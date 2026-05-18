#!/usr/bin/env node

/**
 * start-worker.js
 * Cross-platform Temporal dev server + worker launcher.
 * Works on Windows, macOS, and Linux.
 *
 * Usage:
 *   node start-worker.js
 */

const { spawn, execSync } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");

// ─── Config ────────────────────────────────────────────────────────────────

const TEMPORAL_PORT = 7233;
const TEMPORAL_UI_PORT = 8080;
const TASK_QUEUE = "hotel-task-queue";
const WORKER_SCRIPT = path.join("dist", "temporal", "worker.js");
const STARTUP_WAIT_MS = 6000; // ms to wait for Temporal server to be ready

const IS_WINDOWS = os.platform() === "win32";

// ─── Helpers ───────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

function log(msg) {
  process.stdout.write(msg + "\n");
}

function info(msg) {
  log(`${CYAN}[INFO]${RESET}  ${msg}`);
}

function ok(msg) {
  log(`${GREEN}[OK]${RESET}    ${msg}`);
}

function warn(msg) {
  log(`${YELLOW}[WARN]${RESET}  ${msg}`);
}

function error(msg) {
  log(`${RED}[ERROR]${RESET} ${msg}`);
}

function banner() {
  log("");
  log(`${BOLD}=====================================================${RESET}`);
  log(`${BOLD}   Hotel Orchestrator — Temporal + Worker Launcher   ${RESET}`);
  log(`${BOLD}=====================================================${RESET}`);
  log(`  Platform  : ${os.platform()} (${os.arch()})`);
  log(`  Node      : ${process.version}`);
  log("");
}

function commandExists(cmd) {
  try {
    const check = IS_WINDOWS ? `where ${cmd}` : `command -v ${cmd}`;
    execSync(check, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Preflight checks ──────────────────────────────────────────────────────

function preflight() {
  info("Running preflight checks...");

  // Node.js (always present since we're running this file, but version check)
  const nodeVersion = process.versions.node.split(".")[0];
  if (parseInt(nodeVersion) < 16) {
    error(`Node.js v16+ required. Found: v${process.versions.node}`);
    error("Download from: https://nodejs.org");
    process.exit(1);
  }
  ok(`Node.js v${process.versions.node}`);

  // Temporal CLI
  if (!commandExists("temporal")) {
    error("Temporal CLI not found.");
    log("");
    log("  Install options:");
    if (IS_WINDOWS) {
      log("    winget install Temporal.tctl");
    } else if (os.platform() === "darwin") {
      log("    brew install temporal");
    } else {
      log("    Download from: https://github.com/temporalio/cli/releases");
      log("    Extract the binary and add it to your PATH.");
    }
    log("");
    process.exit(1);
  }

  try {
    const version = execSync("temporal --version", { encoding: "utf8" }).trim();
    ok(`Temporal CLI — ${version}`);
  } catch {
    ok("Temporal CLI found");
  }

  // Built worker
  if (!fs.existsSync(WORKER_SCRIPT)) {
    error(`Worker script not found: ${WORKER_SCRIPT}`);
    error("Run the build step first:");
    if (IS_WINDOWS) {
      log("  build.bat");
    } else {
      log("  ./build.sh   or   npm run build");
    }
    process.exit(1);
  }
  ok(`Worker script: ${WORKER_SCRIPT}`);

  log("");
}

// ─── Temporal server ──────────────────────────────────────────────────────

function startTemporalServer() {
  info(`[1/2] Starting Temporal dev server on port ${TEMPORAL_PORT}...`);

  const args = [
    "server",
    "start-dev",
    "--port",
    String(TEMPORAL_PORT),
    "--ui-port",
    String(TEMPORAL_UI_PORT),
  ];

  let proc;

  if (IS_WINDOWS) {
    // On Windows open a new visible console window so it can be closed independently
    proc = spawn("cmd", ["/c", "start", '"Temporal Server"', "cmd", "/k", `temporal ${args.join(" ")}`], {
      shell: true,
      detached: true,
      stdio: "ignore",
    });
  } else {
    // On macOS/Linux run in background, piping output to a log file
    const logFile = path.join(os.tmpdir(), "temporal-server.log");
    const out = fs.openSync(logFile, "w");
    proc = spawn("temporal", args, {
      detached: true,
      stdio: ["ignore", out, out],
    });
    info(`Temporal server log: ${logFile}`);
    proc.unref();
  }

  return proc;
}

// ─── Temporal worker ──────────────────────────────────────────────────────

function startWorker() {
  info(`[2/2] Starting Temporal worker...`);
  log("");
  log(`  ${BOLD}Temporal UI${RESET}  : http://localhost:${TEMPORAL_UI_PORT}`);
  log(`  ${BOLD}Task queue${RESET}   : ${TASK_QUEUE}`);
  log("");
  log("  Press Ctrl+C to stop the worker.");
  if (!IS_WINDOWS) {
    log("  The Temporal server process runs in the background.");
    log(`  To stop it: kill $(lsof -ti tcp:${TEMPORAL_PORT})`);
  } else {
    log("  Close the 'Temporal Server' window separately to stop the server.");
  }
  log("");

  const worker = spawn("node", [WORKER_SCRIPT], {
    stdio: "inherit",
    shell: false,
  });

  worker.on("error", (err) => {
    error(`Failed to start worker: ${err.message}`);
    process.exit(1);
  });

  worker.on("exit", (code, signal) => {
    if (signal) {
      log("");
      info(`Worker stopped (signal: ${signal})`);
    } else if (code !== 0) {
      error(`Worker exited with code ${code}`);
      process.exit(code ?? 1);
    } else {
      info("Worker stopped cleanly.");
    }
  });

  // Forward Ctrl+C to the worker
  process.on("SIGINT", () => {
    warn("Caught SIGINT — shutting down worker...");
    worker.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    warn("Caught SIGTERM — shutting down worker...");
    worker.kill("SIGTERM");
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  banner();
  preflight();
  startTemporalServer();

  info(`Waiting ${STARTUP_WAIT_MS / 1000}s for Temporal server to be ready...`);
  await sleep(STARTUP_WAIT_MS);

  startWorker();
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});