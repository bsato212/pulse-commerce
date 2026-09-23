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
- **Agent Operating Standards**:
  - `agents.md` established as canonical developer reference for AI agents.
  - `claude.md` and `gemini.md` created to point agents directly to `agents.md`.
  - `memory-bank/` directory initialized for structured context preservation.

## Active Decisions & Considerations

- **TypeORM Migrations**: Migrations use TypeORM's CLI and programmatic DataSource (`AppDataSource`).
- **Seeding Strategy**: Programmatic TypeScript script (`src/database/seeds/seed.ts`) utilizing the TypeORM DataSource for multi-tenant bootstrapping.
- **Docker Compose Networking**: Internal service communication via bridge network (`pulse_network`) with container health checks.
