# PulseCommerce

[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-orange.svg)](https://typeorm.io/)
[![Zod](https://img.shields.io/badge/Zod-4.6-blueviolet.svg)](https://zod.dev/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org/)
[![Valkey](https://img.shields.io/badge/Valkey-9.0-purple.svg)](https://valkey.io/)
[![Testcontainers](https://img.shields.io/badge/Testcontainers-12.1-darkgreen.svg)](https://testcontainers.com/)

PulseCommerce is an enterprise-grade Order Management System (OMS) and Multi-Warehouse Inventory Allocation platform. Designed for high-throughput fulfillment, multi-tenant B2B/B2C operations, and event-driven logistics dispatching.

---

## Architecture Overview

```
pulsecommerce/
├── apps/
│   ├── backend/           # NestJS 11 + TypeORM 0.3 + Valkey Caching + Pino Logger (Node 24)
│   │   ├── src/
│   │   │   ├── common/    # Pino logger, filters, interceptors, auth guards
│   │   │   ├── cache/     # Valkey cache-aside service with TTL invalidation
│   │   │   ├── database/  # TypeORM entities, data source, migrations, and seeds
│   │   │   └── modules/   # Orders, Inventory, Products, Fulfillment, Webhooks
│   │   └── test/          # Jest unit, integration, and e2e test suites
│   └── frontend/          # React 19 + Vite + Tailwind CSS + TanStack Query (Node 24)
│       └── src/           # Real-time dashboard, orders, inventory, products
└── packages/
    └── shared-types/      # Shared DTO contracts, enums, and API interfaces
```

---

## Core Capabilities

1. **Multi-Warehouse Inventory Allocation**:
   - Real-time stock balancing across regional fulfillment centers.
   - Atomic reservation state transitions (`AVAILABLE` -> `RESERVED` -> `ALLOCATED` -> `FULFILLED`).
2. **Order Lifecycle State Machine**:
   - Strict transition graph: `PENDING` -> `CONFIRMED` -> `ALLOCATING` -> `PACKED` -> `SHIPPED` -> `DELIVERED`.
   - Comprehensive pricing engine with tax calculation, discounts, and currency representation.
3. **High-Performance Caching Layer**:
   - Valkey (Redis-compatible) cache-aside pattern for hot catalog queries and inventory lookups.
4. **Structured JSON Telemetry**:
   - Structured JSON logging via Pino with correlation/request ID propagation across services.
5. **Transactional Outbox Event Pipeline**:
   - Decoupled domain event dispatching for logistics notifications and downstream integration.
6. **Contract Validation & Schema Safety**:
   - Monorepo-wide Zod validation schemas enforcing strict UUID and payload integrity at API boundaries.

---

## Quickstart

### Prerequisites

- Node.js >= 24
- Docker & Docker Compose
- npm

### 1. Start Infrastructure with Docker

```bash
docker compose up -d postgres valkey
```

### 2. Install Dependencies & Build Packages

```bash
npm install
npm run build
```

### 3. Run Database Migrations & Seed Data

```bash
# Execute TypeORM migrations
npm run db:migrate --workspace=pulsecommerce-backend

# Populate initial multi-tenant seed data
npm run db:seed --workspace=pulsecommerce-backend
```

### 4. Start Development Servers

```bash
npm run dev
```

- Backend API: `http://localhost:3000/api/v1`
- Frontend Dashboard: `http://localhost:5173`

---

## Code Quality & Linting

The repository is configured with ESLint 9 (flat config) and Prettier:

```bash
# Lint all workspaces
npm run lint

# Check formatting
npm run format:check

# Auto-format all files
npm run format
```

---

## Running Tests

PulseCommerce includes unit, integration, and end-to-end tests:

```bash
# Run all test suites across workspaces
npm test

# Run backend unit tests
npm run test --workspace=pulsecommerce-backend

# Run backend e2e tests
npm run test:e2e --workspace=pulsecommerce-backend

# Run backend integration tests (ephemeral PostgreSQL 18 & Valkey 9.0 via Testcontainers)
npm run test:integration

# Run frontend component tests
npm run test --workspace=pulsecommerce-frontend
```

---

## Full-Stack Docker Setup (Local Dev)

To build and run all services with live logs streaming directly in your terminal:

```bash
npm run docker:up
# or: docker compose up --build
```

Services:

- **Frontend**: `http://localhost:5173` (served via production Nginx bundle)
- **Backend**: `http://localhost:3000`
- **Postgres**: `localhost:5432`
- **Valkey**: `localhost:6379`

---

## Continuous Integration (GitHub Actions)

PulseCommerce includes a GitHub Actions CI pipeline (`.github/workflows/ci.yml`) triggered on pushes and pull requests to `master` and `main`:

1. **Lint & Code Formatting**: Runs Prettier format checks (`npm run format:check`), ESLint (`npm run lint`), and verifies Docker Compose configuration (`docker compose config`).
2. **Test Suite**: Executes workspace builds (`npm run build`), unit tests (`npm test`), backend end-to-end tests (`npm run test:e2e`), and integration tests (`npm run test:integration` via Testcontainers with PostgreSQL 18 & Valkey 9.0).
3. **Docker Build (No Push)**: Sets up Docker Buildx with GitHub Actions layer caching (`type=gha`) and builds production container images for both `pulsecommerce-backend` and `pulsecommerce-frontend` without pushing to a registry.
