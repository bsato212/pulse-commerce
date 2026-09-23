# AI Agent Operating Guidelines: PulseCommerce

Welcome to the **PulseCommerce** repository. This document defines the engineering standards, architecture patterns, command references, and conventions required for autonomous and semi-autonomous AI coding agents working on this codebase.

---

## 1. Project Overview & Architecture

PulseCommerce is an enterprise-grade, multi-tenant Order Management System (OMS) and Multi-Warehouse Inventory Allocation platform designed for high throughput, data integrity, and modular extensibility.

### Monorepo Structure

```
pulsecommerce/
├── apps/
│   ├── backend/                 # NestJS 11 REST API, TypeORM persistence, Valkey cache
│   │   ├── src/
│   │   │   ├── common/          # Interceptors, filters, auth decorators, Pino logger
│   │   │   ├── cache/           # ValkeyService (cache-aside, TTL, key eviction)
│   │   │   ├── database/        # TypeORM entities, AppDataSource, migrations, seeds
│   │   │   └── modules/
│   │   │       ├── products/    # Product catalog with cached queries
│   │   │       ├── inventory/   # Multi-warehouse allocation & reservation management
│   │   │       ├── orders/      # Checkout transaction, state machine, invoicing, pricing
│   │   │       ├── fulfillment/ # 3PL carrier integration & transactional outbox
│   │   │       └── hooks-pending/ # Webhook dispatching with HMAC signature verification
│   │   └── test/                # Unit tests and Jest e2e test suite
│   └── frontend/                # React 19 SPA, Tailwind CSS, Vite
│       └── src/
│           ├── api/             # Standardized fetch wrapper and error handlers
│           ├── components/      # UI components (Navbar, Sidebar, StatCard, StatusBadge)
│           └── pages/           # Dashboard, Orders, Inventory, Products, ExtensionHooks
└── packages/
    └── shared-types/            # Canonical TypeScript contracts, DTOs, and enums
```

---

## 2. Technology Stack & Runtime

- **Runtime**: Node.js >= 24 (Alpine Linux in Docker containers)
- **Backend Framework**: NestJS 11
- **Object-Relational Mapping (ORM)**: TypeORM 0.3.x with PostgreSQL driver (`pg`)
- **Database**: PostgreSQL 18
- **In-Memory Cache**: Valkey 9.0 (high-performance Redis-compatible engine)
- **Logging**: Pino structured JSON logger with request correlation
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **Code Quality**: ESLint 9 (flat config) and Prettier 3
- **Containerization**: Docker Compose v2

---

## 3. Standard Development Commands

Always run commands from the repository root unless explicitly instructed otherwise.

### Building

```bash
# Build all workspaces (shared-types, backend, frontend)
npm run build
```

### Testing

```bash
# Run all unit tests across all workspaces
npm test

# Run backend unit tests only
npm run test --workspace=pulsecommerce-backend

# Run backend end-to-end tests
npm run test:e2e --workspace=pulsecommerce-backend

# Run frontend component tests
npm run test --workspace=pulsecommerce-frontend
```

### Code Formatting & Linting

```bash
# Check code style with Prettier
npm run format:check

# Auto-format all code with Prettier
npm run format

# Run ESLint across all workspaces
npm run lint
```

### Database Operations (TypeORM)

```bash
# Run pending database migrations
npm run db:migrate --workspace=pulsecommerce-backend

# Revert the last applied migration
npm run db:migrate:revert --workspace=pulsecommerce-backend

# Seed database with sample multi-tenant data
npm run db:seed --workspace=pulsecommerce-backend
```

### Infrastructure (Docker)

```bash
# Start PostgreSQL 18 and Valkey 9.0
docker compose up -d postgres valkey

# Start the full stack with production builds
docker compose up --build -d
```

---

## 4. Engineering Principles & Conventions

### Multi-Tenancy & Authorization

- Every database entity belonging to an organization must link to a `tenantId`.
- Queries must scope records by `tenantId` to guarantee strict multi-tenant data isolation.
- Route handlers should consume `@CurrentUser()` or `@Headers('x-tenant-id')` to enforce tenant context.

### Database & TypeORM

- All relational tables must be managed through TypeORM entities under `apps/backend/src/database/entities/`.
- Schema mutations must be implemented as numbered migrations in `apps/backend/src/database/migrations/`.
- Use TypeORM query builders or repository methods rather than raw SQL strings.
- Wrap multi-table mutation workflows (such as order checkout or inventory allocation) in explicit transactions via `dataSource.transaction(...)`.

### Caching Strategy (Valkey)

- Hot query operations (catalog lookups, product details) should leverage `ValkeyService.remember(key, ttl, fetchFn)`.
- When updating or deleting an entity, invalidate all relevant cache keys using consistent key prefix schemes.
- The cache key prefix for catalog items follows the pattern `catalog:product:${id}` or `catalog:products:tenant:${tenantId}:...`.

### Structured Telemetry

- Never use `console.log` or `console.error` in backend code.
- Inject NestJS `Logger` (`private readonly logger = new Logger(ServiceName.name);`) or the global Pino logger.
- Log meaningful context objects alongside log messages.

### Frontend Patterns

- Modern functional React components with hooks.
- All API interactions should use `fetchApi<T>()` from `apps/frontend/src/api/client.ts`.
- Tailwind CSS utility classes for styling, adhering to dark slate theme palette (`slate-900`, `indigo-500`, `emerald-500`, etc.).
- Maintain clean TypeScript typing without `any` where feasible.

---

## 5. Verification Checklist for Agents

Before completing any task or pull request:

1. Ensure all code compiles cleanly: `npm run build`
2. Ensure all unit and e2e tests pass: `npm test && npm run test:e2e --workspace=pulsecommerce-backend`
3. Ensure no linting errors exist: `npm run lint`
4. Ensure all formatting adheres to Prettier: `npm run format:check`
5. Ensure Docker compose definitions remain valid: `docker compose config`
