# PulseCommerce

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Valkey](https://img.shields.io/badge/Valkey-8.0-purple.svg)](https://valkey.io/)

PulseCommerce is an enterprise-grade Order Management System (OMS) and Multi-Warehouse Inventory Allocation platform. Designed for high-throughput fulfillment, multi-tenant B2B/B2C operations, and event-driven logistics dispatching.

---

## Architecture Overview

```
pulsecommerce/
├── apps/
│   ├── backend/           # NestJS 11 + Prisma ORM + Valkey Caching + Pino Logger
│   │   ├── src/
│   │   │   ├── common/    # Pino logger, filters, interceptors, auth guards
│   │   │   ├── cache/     # Valkey cache-aside service with TTL invalidation
│   │   │   ├── database/  # PrismaService and transaction management
│   │   │   └── modules/   # Orders, Inventory, Products, Fulfillment
│   │   └── test/          # Jest unit, integration, and e2e test suites
│   └── frontend/          # React 19 + Vite + Tailwind CSS + TanStack Query
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

---

## Quickstart

### Prerequisites
- Node.js >= 20
- Docker & Docker Compose
- npm or pnpm

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
cd apps/backend
npx prisma migrate deploy
npm run seed
cd ../..
```

### 4. Start Development Servers
```bash
npm run dev
```
- Backend API & Swagger: `http://localhost:3000/api/docs`
- Frontend Dashboard: `http://localhost:5173`

---

## Running Tests

PulseCommerce includes unit, integration, and end-to-end tests:

```bash
# Run all test suites across workspaces
npm test

# Run backend unit & integration tests
npm run test --workspace=backend

# Run backend e2e tests
npm run test:e2e --workspace=backend

# Run frontend component tests
npm run test --workspace=frontend
```

---

## Production Deployment with Docker

To build and run all services in production mode:
```bash
docker compose up --build -d
```
Services:
- **Frontend**: `http://localhost:5173` (served via production bundle)
- **Backend**: `http://localhost:3000`
- **Postgres**: `localhost:5432`
- **Valkey**: `localhost:6379`
