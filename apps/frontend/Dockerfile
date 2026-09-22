# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm ci

COPY packages/shared-types ./packages/shared-types
COPY apps/frontend ./apps/frontend

RUN npm run build --workspace=@pulsecommerce/shared-types

WORKDIR /app/apps/frontend
RUN npm run build

# Production serve stage using Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Custom nginx config for SPA fallback
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
