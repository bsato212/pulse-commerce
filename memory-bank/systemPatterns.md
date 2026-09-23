# System Architecture & Design Patterns: PulseCommerce

## Monorepo Architecture

```
pulsecommerce/
├── apps/
│   ├── backend/           # NestJS 11 + TypeORM 0.3 + Valkey 9.0 + PostgreSQL 18
│   └── frontend/          # React 19 SPA + Vite + Tailwind CSS + Lucide Icons
└── packages/
    └── shared-types/      # Canonical TypeScript DTOs, Enums, API contracts
```

## Key Architectural Patterns

### 1. Multi-Tenancy Architecture

- Schema-level shared tenancy with discriminator column (`tenantId`).
- Data access services scope all database queries and updates to the invoking user's `tenantId`.
- HTTP endpoints accept tenant identification via header (`x-tenant-id`) or authenticated token.

### 2. Transactional Outbox Pattern

- To ensure reliable event publishing without distributed 2PC transactions, state changes and event records are written atomically in the same database transaction:
  ```typescript
  await dataSource.transaction(async (manager) => {
    await manager.save(order);
    await manager.save(outboxEvent);
  });
  ```
- An asynchronous worker service periodically polls `outbox_events` where `status = PENDING`, dispatches to webhook subscribers or messaging brokers, and updates event records with processing status and timestamps.

### 3. Order Lifecycle State Machine

- Orders follow strict sequential transitions:
  `PENDING` -> `CONFIRMED` -> `ALLOCATING` -> `PACKED` -> `SHIPPED` -> `DELIVERED` (or `CANCELLED`).
- Transitions are guarded by validation logic ensuring prerequisites (such as payment completion or stock reservation) are met before progressing.

### 4. Cache-Aside Caching Strategy

- Product listings and catalog details utilize Valkey 9.0 cache-aside strategy:
  1. Check cache for key (`catalog:product:${id}`).
  2. If hit, return deserialized JSON.
  3. If miss, query database, store result in Valkey with configurable TTL (default 600s), and return.
- Mutation endpoints invalidate cached entries to maintain data consistency.

### 5. Carrier Integration Strategy Pattern

- The fulfillment domain abstracts shipping carrier logistics behind a common TypeScript interface:
  ```typescript
  export interface CarrierAdapter {
    readonly code: string;
    readonly name: string;
    quoteRates(request: ShippingRateRequest): Promise<ShippingRateQuote[]>;
    bookShipment(request: CreateShipmentRequest): Promise<BookShipmentResult>;
    getTracking(trackingNumber: string): Promise<TrackingStatusUpdate>;
    validateWebhook(payload: any, signature: string): boolean;
  }
  ```
- A centralized `CarrierRegistryService` dynamically routes logistics operations to registered carrier adapters (e.g. `MockCarrier`, `ShipBobCarrier`).

### 6. Strategy Pattern for Promotional Rules

- Discount and coupon calculations use strategy implementations conforming to `PromotionRule`:
  ```typescript
  export interface PromotionRule {
    readonly code: string;
    readonly name: string;
    isApplicable(context: PromotionContext): boolean;
    calculateDiscount(context: PromotionContext): number;
  }
  ```

### 7. End-to-End Contract Validation & Schema Safety

- Canonical schemas are authored in `packages/shared-types` using Zod (`z.object(...)`).
- Backend request DTOs extend `createZodDto(...)` from `nestjs-zod`.
- Inbound HTTP payloads are validated and parsed through `ZodValidationPipe` globally and on controllers.
- Route parameters representing database primary/foreign keys (`:id`, `:orderId`, `:warehouseId`) are strictly validated via `ParseUUIDPipe({ version: '4' })` before database queries execute, preventing invalid query syntax.

### 8. Ephemeral Infrastructure Integration Testing

- Hermetic integration testing with Testcontainers (`@testcontainers/postgresql` and `testcontainers` for Valkey 9.0).
- Automatically provisions real, isolated database and cache instances on demand for test execution with zero static environment prerequisites.
- Verifies real migrations, multi-tenant query isolation, database constraint integrity, transactions, and live Valkey cache invalidation.
