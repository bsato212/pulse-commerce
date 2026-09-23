# Project Brief: PulseCommerce

## Overview

PulseCommerce is a full-stack, enterprise-grade Order Management System (OMS) and Multi-Warehouse Inventory Allocation platform. It delivers real-time inventory management, checkout state-machine handling, 3PL logistics dispatching, and asynchronous event notifications across multi-tenant organizations.

## Core Goals

1. **Multi-Tenant Isolation**: Enable B2B and B2C organizations to manage products, inventory, orders, and customer data independently under isolated tenant identifiers.
2. **Multi-Warehouse Allocation**: Manage distributed stock across regional fulfillment centers, supporting reservations, backorders, and allocation strategies.
3. **Resilient Order Lifecycle**: Enforce deterministic order transitions (`PENDING` -> `CONFIRMED` -> `ALLOCATING` -> `PACKED` -> `SHIPPED` -> `DELIVERED`) with pricing, discount, and tax calculations.
4. **Performance & Reliability**: Utilize Valkey 9.0 for cache-aside catalog acceleration, PostgreSQL 18 for ACID persistence via TypeORM, and a transactional outbox pattern for decoupled event publishing.
5. **Modern Developer Experience**: Full-stack TypeScript monorepo with Node.js 24, NestJS 11, React 19, Tailwind CSS, ESLint 9, Prettier 3, and containerized Docker Compose infrastructure.
