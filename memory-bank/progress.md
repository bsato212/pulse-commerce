# Progress & Roadmap: PulseCommerce

## What Works

### Backend

- **Catalog Management (`products` module)**:
  - Product catalog CRUD and search via TypeORM query builder.
  - Caching layer using Valkey 9.0 cache-aside strategy.
  - Category relationships and price update endpoints.
- **Inventory Allocation (`inventory` module)**:
  - Multi-warehouse stock tracking across facilities.
  - Stock adjustment and reservation capabilities.
- **Order Processing (`orders` module)**:
  - Atomic checkout transaction recording orders and items.
  - Pricing calculation engine computing subtotals, tax, discounts, and shipping.
  - Order state machine transitions and invoice PDF metadata generation.
- **Fulfillment & Logistics (`fulfillment` module)**:
  - Carrier adapter abstraction (`CarrierAdapter`).
  - Mock carrier and ShipBob integration skeletons.
  - Transactional outbox event creation and dispatching.
- **Extensibility & Webhooks (`hooks-pending` module)**:
  - Webhook dispatch service with HMAC-SHA256 signature calculation.
  - Webhook subscription data entities.

### Frontend

- Responsive dark-theme dashboard built with React 19 and Tailwind CSS.
- Real-time KPI summary stat cards.
- Interactive catalog browser with pricing modal.
- Multi-warehouse inventory balancing views.
- Order management table with status filtering and invoice viewer.
- Extension hooks management page for monitoring transactional outbox events.

### Testing & Verification

- Jest unit test suites for pricing, caching, inventory, and order processing.
- Jest end-to-end (e2e) tests for products and order invoice API endpoints.
- Vitest component tests for frontend UI and rendering.
- ESLint 9 and Prettier 3 verification scripts.

## Pending Extension Hooks

1. **ShipBob 3PL Carrier Implementation**: Complete integration adhering to `CarrierAdapter` for live quotes, booking, and webhook validation.
2. **Advanced Promotional Coupon Engine**: Implementation of tiered promo rules (BOGO, minimum spend threshold, category discounts).
3. **Outbound Webhook Delivery Engine**: Scheduled cron worker with exponential backoff and persistent delivery attempt logs.
