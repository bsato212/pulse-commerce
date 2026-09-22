# Base builder
FROM node:22-alpine AS builder

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

# Generate Prisma client and build backend
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci --omit=dev

# Copy generated prisma client and dist files
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
