# Hotel Offer Orchestrator

A production-ready REST API built with **Node.js**, **TypeScript**, **Redis**, **Temporal**, and **Express** that aggregates hotel offers from multiple suppliers, deduplicates by hotel name, and returns the best-priced offer per hotel with optional price-range filtering. Includes a full React + Material UI client for interactive testing.

---

## Requirements

- **Node.js LTS** — https://nodejs.org
- **Git** — https://git-scm.com
- **Redis for Windows** — Memurai: https://www.memurai.com/get-memurai
- **Redis for macOS** — via Homebrew: https://brew.sh
- **Temporal CLI** — https://github.com/temporalio/cli/releases

> Both Redis and Temporal must be installed and running before starting the server. See the [Redis Setup](#redis-setup) and [Temporal Setup](#temporal-setup) sections below.

---

## Getting Started

Follow the steps below in order. The client UI must be built before starting the server.

### Step 1 — Clone the Repository

```bash
git clone https://github.com/SohanR09/hotel-orchestrator.git
cd hotel-orchestrator
```

### Step 2 — Install & Build the Client

Navigate into the `client` folder and run the installer:

**Windows**

```cmd
cd client
install-and-build.bat
```

**macOS / Linux**

```bash
cd client
chmod +x install-and-build.sh
./install-and-build.sh
```

This installs all client dependencies and produces a production build in `client/build/` which the API server serves automatically.

### Step 3 — Install & Build the Server

Go back to the project root:

**Windows**

```cmd
cd ..
install.bat
```

**macOS / Linux**

```bash
cd ..
chmod +x install.sh
./install.sh
```

This installs all server npm packages and compiles TypeScript into `dist/`.

### Step 4 — Start Temporal Server + Worker

Temporal must be running before the API server starts. Open a dedicated terminal window and run:

**Windows**

```cmd
start-worker.bat
```

**macOS / Linux**

```bash
chmod +x start-worker.sh
./start-worker.sh
```

This single script:

1. Starts the Temporal dev server on port `7233` in a background window
2. Waits 5 seconds for it to be ready
3. Starts the Temporal worker in the foreground — listens on `hotel-task-queue`

You should see:

```
[Worker] Connecting to Temporal at localhost:7233
[Worker] Started — listening on task queue: hotel-task-queue
```

### Step 5 — Start the API Server

Open a new terminal window and run:

**Windows**

```cmd
start.bat
```

**macOS / Linux**

```bash
chmod +x start.sh
./start.sh
```

Open your browser at **http://localhost:3000** — the full UI will load.

---

## Redis Setup

Redis is required for caching. The server will not start correctly without a running Redis instance.

### Windows — Memurai

1. Download the free Developer edition (LTS) from https://www.memurai.com/get-memurai
2. Run the installer — Memurai registers as a Windows service and starts automatically
3. Verify:

```cmd
memurai-cli ping
```

Expected: `PONG`

### macOS — Homebrew

```bash
brew install redis
brew services start redis
redis-cli ping
```

Expected: `PONG`

### Linux

```bash
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
redis-cli ping
```

Expected: `PONG`

---

## Temporal Setup

Temporal is required for workflow orchestration. It runs supplier calls in parallel with automatic retry. The server will not start correctly without a running Temporal instance.

### Step 1 — Install Temporal CLI

**Windows**

```cmd
winget install Temporal.tctl
```

Or download the binary from https://github.com/temporalio/cli/releases — extract and add to your PATH.

**macOS — Homebrew**

```bash
brew install temporal
```

**Linux**

Download the binary from https://github.com/temporalio/cli/releases, extract it, and add it to your PATH.

Verify the installation:

```bash
temporal --version
```

### Step 2 — Configure Environment

Copy `.env.example` to `.env` and ensure the following is set:

```dotenv
USE_TEMPORAL=true
```

### Step 3 — Start Temporal Server + Worker

Open a dedicated terminal and run:

**Windows**

```cmd
start-worker.bat
```

**macOS / Linux**

```bash
./start-worker.sh
```

**Temporal UI** — http://localhost:8080 — shows live workflow executions once the server is running.

---

## How It Works

### Request flow

1. `GET /api/hotels?city=delhi` hits the Express route
2. Redis is checked — if cached, returns instantly (under 1ms)
3. On cache miss, a Temporal workflow is started with a unique `workflowId`
4. The workflow calls `fetchSupplierA` and `fetchSupplierB` in parallel via `Promise.all`
5. Each activity has automatic retry (up to 3 times with exponential backoff)
6. Results are deduplicated — the cheaper price wins for overlapping hotels
7. Final list is saved to Redis with a 5-minute TTL
8. Response is returned to the client

### What you will see (on API call)

**Worker window:**

```
[Worker] Connecting to Temporal at localhost:7233
[Worker] Started — listening on task queue: hotel-task-queue
```

**Server window:**

```
[API] Starting Temporal workflow...
[Temporal Client] Connected successfully
[API] Temporal workflow done: 7 hotels (id: hotel-delhi-xxxx)
[Redis] Cached 7 hotels for "delhi"
```

### Caching

- Cache key: `hotels:{city}` (e.g. `hotels:delhi`)
- TTL: 300 seconds (5 minutes) — configurable via `CACHE_TTL`
- Price filtering reads from the cache and filters in memory — no extra supplier calls

---

## Testing the API

### Option 1 — Client UI

Open **http://localhost:3000** in your browser. The UI provides:

- **Hotels page** — search by city, apply min/max price filters, view deduplicated results ranked by price
- **Suppliers page** — side-by-side raw data from Supplier A and B, overlap detection
- **Health page** — live status of Supplier A, Supplier B, and Redis with latency, auto-refresh
- **Docs page** — this README rendered from the server at `/docs/readme`

### Option 2 — Postman

Import `postman/Hotel_Orchestrator.postman_collection.json`. Includes pre-written tests for all endpoints.

### Option 3 — Direct HTTP

```bash
curl http://localhost:3000/api/hotels?city=delhi
curl http://localhost:3000/api/hotels?city=delhi&minPrice=5000&maxPrice=9000
curl http://localhost:3000/health
```

---

## API Endpoints

### Hotels

| Method | Endpoint                                             | Description                                |
| ------ | ---------------------------------------------------- | ------------------------------------------ |
| GET    | `/api/hotels?city=delhi`                             | Best-priced deduplicated hotels for a city |
| GET    | `/api/hotels?city=delhi&minPrice=5000&maxPrice=9000` | Price-filtered hotels                      |

### Suppliers

| Method | Endpoint                       | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/supplierA/hotels`            | Raw Supplier A data (all cities) |
| GET    | `/supplierA/hotels?city=delhi` | Supplier A filtered by city      |
| GET    | `/supplierB/hotels`            | Raw Supplier B data (all cities) |
| GET    | `/supplierB/hotels?city=delhi` | Supplier B filtered by city      |

### Health & Docs

| Method | Endpoint       | Description                                               |
| ------ | -------------- | --------------------------------------------------------- |
| GET    | `/health`      | Health status of suppliers, Redis, and Temporal           |
| GET    | `/docs/readme` | Server README.md as plain text (used by client Docs page) |

**Available cities:** `delhi`, `mumbai`, `bangalore`

### Example Response — `GET /api/hotels?city=delhi`

```json
[
  {
    "name": "Park Hotel",
    "price": 4800,
    "supplier": "Supplier B",
    "commissionPct": 9
  },
  {
    "name": "Holtin",
    "price": 5340,
    "supplier": "Supplier B",
    "commissionPct": 20
  },
  {
    "name": "Radison",
    "price": 5900,
    "supplier": "Supplier A",
    "commissionPct": 13
  },
  {
    "name": "Crowne Plaza",
    "price": 6800,
    "supplier": "Supplier B",
    "commissionPct": 14
  },
  {
    "name": "The Lalit",
    "price": 7200,
    "supplier": "Supplier A",
    "commissionPct": 11
  },
  {
    "name": "ITC Maurya",
    "price": 9500,
    "supplier": "Supplier A",
    "commissionPct": 12
  },
  {
    "name": "Grand Hyatt",
    "price": 11500,
    "supplier": "Supplier B",
    "commissionPct": 18
  }
]
```

Hotels present in both suppliers are automatically deduplicated — the cheaper offer is returned.

---

## Environment Variables

Copy `.env.example` to `.env` to override defaults:

| Variable           | Default                  | Description                                          |
| ------------------ | ------------------------ | ---------------------------------------------------- |
| `PORT`             | `3000`                   | API server port                                      |
| `REDIS_URL`        | `redis://localhost:6379` | Redis connection URL                                 |
| `CACHE_TTL`        | `300`                    | Cache TTL in seconds                                 |
| `BASE_URL`         | `http://localhost:3000`  | Internal URL for supplier activity calls             |
| `USE_TEMPORAL`     | `true`                   | Must be `true` — Temporal is required                |
| `TEMPORAL_ADDRESS` | `localhost:7233`          | Temporal server address                              |
| `LOG_LEVEL`        | `info`                   | Winston log level (`debug`, `info`, `warn`, `error`) |

### Client environment (`client/.env`)

Pre-configured — no changes needed:

```dotenv
SKIP_PREFLIGHT_CHECK=true
GENERATE_SOURCEMAP=false
```

---

## Project Structure

```
hotel-orchestrator/
├── src/
│   ├── index.ts                Entry point — serves API + React build + /docs/readme
│   ├── types.ts                Shared TypeScript interfaces
│   ├── routes/
│   │   ├── hotels.ts           GET /api/hotels — Temporal + Redis
│   │   └── health.ts           GET /health — supplier, Redis, and Temporal status
│   ├── suppliers/
│   │   ├── supplierA.ts        Mock Supplier A (delhi, mumbai, bangalore)
│   │   └── supplierB.ts        Mock Supplier B (overlapping hotel names)
│   ├── temporal/
│   │   ├── activities.ts       fetchSupplierA, fetchSupplierB, deduplicateAndSelectBest
│   │   ├── workflow.ts         hotelAggregationWorkflow — parallel + dedup
│   │   ├── worker.ts           Temporal worker — listens on hotel-task-queue
│   │   └── client.ts           Temporal client singleton
│   ├── redis/
│   │   └── client.ts           Cache save, get, filter, health check
│   └── middleware/
│       └── logger.ts           Winston structured logging
├── client/
│   ├── src/
│   │   ├── pages/              Hotels, Suppliers, Health, Docs
│   │   ├── components/         Navbar
│   │   ├── hooks/useApi.ts     All API calls
│   │   └── types.ts            Shared interfaces
│   └── build/                  Production build (served by Express)
├── postman/
│   └── Hotel_Orchestrator.postman_collection.json
├── install.bat                 Server: install + build (Windows, first time)
├── start.bat                   Start the API server (Windows)
├── start-worker.bat            Start Temporal dev server + worker together (Windows)
├── .env.example                Environment variable template
└── README.md
```

---

## Windows Bat File Reference

| File               | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `install.bat`      | First-time install — installs server npm packages + compiles TypeScript |
| `build.bat`        | Rebuild after code changes — recompiles server + rebuilds React client  |
| `start.bat`        | Start the API server                                                    |
| `start-worker.bat` | Start Temporal dev server + worker together (**must run before API**)   |

---

## Manual Commands

If you prefer to run steps individually:

```bash
# Server
npm install
npm run build
node dist/index.js

# Client
cd client
npm install --legacy-peer-deps
node_modules/.bin/react-scripts build

# Temporal worker (run in a separate terminal before the API server)
npx ts-node src/temporal/worker.ts
```

---

## Git Workflow

```bash
git status
git add .
git commit -m "your message"
git push origin main
git pull origin main
git checkout -b feature/your-feature-name
git checkout main
git merge feature/your-feature-name
```