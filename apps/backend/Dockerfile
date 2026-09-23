# Development & base builder stage
FROM node:24-alpine AS dev

WORKDIR /app

# Copy root workspace configs
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies (including devDependencies for ts-node and nest cli)
RUN npm ci

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend

# Build shared package
RUN npm run build --workspace=@pulsecommerce/shared-types

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "npm run db:seed && npm run start:dev"]

# Production builder
FROM dev AS builder

WORKDIR /app/apps/backend
RUN npm run build

# Production runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci --omit=dev

# Copy compiled dist files
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "node dist/database/seeds/seed.js && node dist/main.js"]
