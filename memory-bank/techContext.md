# Technical Context: PulseCommerce

## Core Technologies & Versions

| Layer                  | Technology     | Version           | Purpose                                                      |
| ---------------------- | -------------- | ----------------- | ------------------------------------------------------------ |
| **Runtime**            | Node.js        | >= 24.x           | Unified execution runtime for backend and tooling            |
| **Backend Framework**  | NestJS         | 11.x              | Modular dependency-injected server architecture              |
| **ORM**                | TypeORM        | 0.3.x             | Object-relational mapping, migrations, and transactions      |
| **Database**           | PostgreSQL     | 18                | Primary relational data store with ACID guarantees           |
| **Cache Engine**       | Valkey         | 9.0               | High-performance memory-first key-value store                |
| **Logging**            | Pino           | 9.x               | High-throughput structured JSON logging with correlation IDs |
| **Frontend Framework** | React          | 19.x              | Declarative component UI                                     |
| **Frontend Tooling**   | Vite           | 6.x               | Fast dev server and optimized production bundling            |
| **Styling**            | Tailwind CSS   | 3.4.x             | Utility-first responsive CSS styling                         |
| **Icons**              | Lucide React   | 0.475.x           | Modern iconography across dashboard and tables               |
| **Linter**             | ESLint         | 9.x (flat config) | Code quality, consistency, and syntax validation             |
| **Formatter**          | Prettier       | 3.x               | Automated opinionated code formatting                        |
| **Testing**            | Jest & Vitest  | Latest            | Backend unit/e2e and frontend component testing              |
| **Containerization**   | Docker Compose | v2                | Declarative multi-container orchestration                    |

## Database Schema Model (TypeORM Entities)

- `tenants`: Multi-tenant organization identity and settings.
- `users`: User credentials, tenant association, and role assignments (`ADMIN`, `OPERATOR`, `CUSTOMER`).
- `categories`: Hierarchical catalog classification.
- `products`: SKU, pricing, cost basis, description, active status.
- `warehouses`: Regional distribution centers and fulfillment facilities.
- `warehouse_stocks`: Stock on hand, allocated quantity, reserved quantity.
- `stock_reservations`: Hold records linked to checkout sessions or pending orders.
- `orders`: Order header, customer email, status, financial totals (subtotal, tax, discount, shipping, grand total).
- `order_items`: Order line items with SKU, unit price, and quantity.
- `shipments`: Tracking number, carrier code, shipping label, dispatch timestamp.
- `outbox_events`: Transactional event payload, status (`PENDING`, `PROCESSED`, `FAILED`), retry count.
- `webhook_subscriptions`: Outbound tenant webhook URLs, subscribed events, HMAC secret keys.

## Development & Build Environment

- **Workspace Tooling**: npm workspaces managing `@pulsecommerce/shared-types`, `pulsecommerce-backend`, and `pulsecommerce-frontend`.
- **Docker Environment**: Multi-stage Dockerfiles for both backend and frontend based on `node:24-alpine`.
- **Environment Configuration**: `.env.example` provides template variables for database connection, Valkey host/port, JWT secrets, and API prefix.
