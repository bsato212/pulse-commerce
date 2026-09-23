# Base builder
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend

# Build shared package
RUN npm run build --workspace=@pulsecommerce/shared-types

# Build backend
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

CMD ["sh", "-c", "node dist/src/main"]
