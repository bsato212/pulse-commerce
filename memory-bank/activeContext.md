# Active Context: PulseCommerce

## Current System State

- **Full Monorepo Operational**: All packages build without errors and test suites pass cleanly.
- **Persistence Layer Migrated**: Transition from Prisma to TypeORM 0.3 is fully complete. Database migrations and seeder scripts are implemented and verified.
- **Infrastructure Updated**:
  - PostgreSQL updated to version 18 (`postgres:18-alpine`).
  - In-memory cache updated to Valkey 9.0 (`valkey/valkey:9.0-alpine`).
  - Node.js runtime standardized on version 24 (`node:24-alpine`).
- **Code Consistency & Hygiene**:
  - All outdated ORM references removed across codebase, configuration, and documentation.
  - ESLint 9 flat configuration and Prettier 3 integrated with zero warnings and zero errors.
- **Contract & Schema Validation Hardened**:
  - Monorepo contracts authored with Zod schemas in `@pulsecommerce/shared-types`.
  - Backend request DTOs extend `createZodDto` with global `ZodValidationPipe` validation.
  - Strict `ParseUUIDPipe` validation on entity route parameters prevents invalid database queries.
- **Ephemeral Integration Testing Added**:
  - Testcontainers pipeline introduced for hermetic PostgreSQL 18 and Valkey 9.0 integration tests (`npm run test:integration`).
  - Automated verification of migrations, multi-tenant query isolation, database constraint integrity, transactions, and live cache invalidation.
- **Agent Operating Standards**:
  - `AGENTS.md` established as canonical developer reference for AI agents.
  - `CLAUDE.md` and `GEMINI.md` created to point agents directly to `AGENTS.md`.
  - `memory-bank/` directory initialized for structured context preservation.

## Active Decisions & Considerations

- **TypeORM Migrations**: Migrations use TypeORM's CLI and programmatic DataSource (`AppDataSource`).
- **Seeding Strategy**: Programmatic TypeScript script (`src/database/seeds/seed.ts`) utilizing the TypeORM DataSource for multi-tenant bootstrapping.
- **Docker Compose Networking**: Internal service communication via bridge network (`pulse_network`) with container health checks.
