# Hotel Offer Orchestrator

A production-ready REST API built with **Node.js**, **TypeScript**, **Redis**, and **Express** that aggregates hotel offers from multiple suppliers, deduplicates by hotel name, and returns the best-priced offer per hotel with optional price-range filtering. Includes a client UI for interactive testing.

---

## Requirements

- **Node.js LTS** — https://nodejs.org
- **Git** — https://git-scm.com
- **Redis for Windows** — Memurai: https://www.memurai.com/get-memurai
- **Redis for macOS** — via Homebrew: https://brew.sh

> Redis must be installed before running the server. See the [Redis Setup](#redis-setup) section below for instructions per OS.

---

## Getting Started

Follow the steps below in order. The client UI must be built before starting the server.

### Step 1 — Clone the Repository

```bash
git clone https://github.com/SohanR09/hotel-orchestrator.git
cd hotel-offer-orchestrator
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

This installs all client dependencies and produces a production build served by the API server.

### Step 3 — Install & Build the Server

Go back to the project root and run the server installer:

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

This installs all server npm packages and compiles the TypeScript source into `dist/`.

### Step 4 — Start the Server

**Windows**
```cmd
start.bat
```

**macOS / Linux**
```bash
chmod +x start.sh
./start.sh
```

The server will start at **http://localhost:3000**

The start script automatically:
- Detects your operating system
- Checks and starts Redis / Memurai
- Installs dependencies if not already present
- Builds the project
- Launches the API server

---

## Redis Setup

Redis is required for caching. Install it once for your OS — the start script manages it automatically on subsequent runs.

### Windows — Memurai

1. Download the free Developer edition from https://www.memurai.com/get-memurai
2. Run the installer — Memurai registers itself as a Windows service and starts automatically
3. Verify it is working:
```cmd
memurai-cli ping
```
Expected response: `PONG`

### macOS — Homebrew

1. Install Homebrew if not already installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
2. Install and start Redis:
```bash
brew install redis
brew services start redis
```
3. Verify it is working:
```bash
redis-cli ping
```
Expected response: `PONG`

### Linux

```bash
sudo apt update && sudo apt install redis-server -y
sudo service redis-server start
```

Verify:
```bash
redis-cli ping
```
Expected response: `PONG`

---

## Testing the API

There are two ways to test the API:

### Option 1 — Client UI

Once the server is running, open your browser and go to:

```
http://localhost:3000
```

The UI allows you to:
- Select a city and apply price filters
- View deduplicated hotel results in a clean interface
- Check supplier responses individually
- Monitor cache and health status

### Option 2 — Manual API Testing

Use a browser, Postman, or any HTTP client to call the endpoints directly. See the [API Endpoints](#api-endpoints) section below.

You can also import `postman/Hotel_Orchestrator.postman_collection.json` into Postman to run the full test suite.

---

## API Endpoints

### Hotels

- `GET /api/hotels?city=delhi` — Best-priced hotels for a city
- `GET /api/hotels?city=delhi&minPrice=5000&maxPrice=9000` — Price-filtered hotels

### Suppliers

- `GET /supplierA/hotels` — Raw Supplier A data (all cities)
- `GET /supplierA/hotels?city=delhi` — Supplier A data filtered by city
- `GET /supplierB/hotels` — Raw Supplier B data (all cities)
- `GET /supplierB/hotels?city=delhi` — Supplier B data filtered by city

### Health

- `GET /health` — Health status of suppliers and Redis cache

**Available cities:** `delhi`, `mumbai`, `bangalore`

### Example Response — `GET /api/hotels?city=delhi`

```json
[
  { "name": "Park Hotel",   "price": 4800,  "supplier": "Supplier B", "commissionPct": 9  },
  { "name": "Holtin",       "price": 5340,  "supplier": "Supplier B", "commissionPct": 20 },
  { "name": "Radison",      "price": 5900,  "supplier": "Supplier A", "commissionPct": 13 },
  { "name": "Crowne Plaza", "price": 6800,  "supplier": "Supplier B", "commissionPct": 14 },
  { "name": "The Lalit",    "price": 7200,  "supplier": "Supplier A", "commissionPct": 11 },
  { "name": "ITC Maurya",   "price": 9500,  "supplier": "Supplier A", "commissionPct": 12 },
  { "name": "Grand Hyatt",  "price": 11500, "supplier": "Supplier B", "commissionPct": 18 }
]
```

Hotels appearing in both suppliers are automatically deduplicated — the cheaper offer is returned.

---

## Caching

Results are cached in Redis for 5 minutes. On a cache hit, the response is served instantly without calling the suppliers again. The `/health` endpoint reports live cache connectivity status.

---

## Environment Variables

### Server

Copy `.env.example` to `.env` to override defaults:

- `PORT` — API server port (default: `3000`)
- `REDIS_URL` — Redis connection URL (default: `redis://localhost:6379`)
- `CACHE_TTL` — Cache time-to-live in seconds (default: `300`)
- `BASE_URL` — Base URL for internal supplier calls (default: `http://localhost:3000`)
- `USE_TEMPORAL` — Set `true` if a Temporal server is running (default: `false`)
- `LOG_LEVEL` — Winston log level (default: `info`)

### Client

The `client/.env` file is pre-configured with the following values — no changes are required:

```dotenv
SKIP_PREFLIGHT_CHECK=true
GENERATE_SOURCEMAP=false
```

- `SKIP_PREFLIGHT_CHECK` — Bypasses the Create React App dependency version check, which may conflict with the server's `node_modules`
- `GENERATE_SOURCEMAP` — Disabled to reduce build size and avoid exposing source code in production

---

## Project Structure

```
client/
├── src/                        Client UI source
├── build/                      Production build (served by server)
└── install-and-build.bat       Client installer (Windows)

src/
├── index.ts                    Entry point — Express app setup
├── types.ts                    Shared TypeScript interfaces
├── routes/
│   ├── hotels.ts               GET /api/hotels
│   └── health.ts               GET /health
├── suppliers/
│   ├── supplierA.ts            Mock Supplier A
│   └── supplierB.ts            Mock Supplier B
├── temporal/
│   ├── activities.ts           Fetch + deduplication logic
│   ├── workflow.ts             Temporal workflow definition
│   ├── worker.ts               Temporal worker (optional)
│   └── client.ts               Temporal client (optional)
├── redis/
│   └── client.ts               Redis cache helpers
└── middleware/
    └── logger.ts               Winston request logging
```

---

## Postman Collection

Import `postman/Hotel_Orchestrator.postman_collection.json` into Postman to run the full test suite, including:

- Delhi hotels with deduplication validation
- Price range filtering
- Empty result for a city with no hotels — returns `[]`
- Missing city parameter — returns `400` error
- Health check

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
npm install
npm run build
```

---

## Git Workflow

```bash
# Check status
git status

# Stage all changes
git add .

# Commit
git commit -m "your message here"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Merge a branch into main
git checkout main
git merge feature/your-feature-name
```