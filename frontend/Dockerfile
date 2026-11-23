# ==============================================================================
# No Tre(ou)ble Frontend - Production Multi-Stage Dockerfile
# Vite React Build + Hardened High-Performance Nginx Static Server
# ==============================================================================

# Stage 1: Build SPA Assets
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.25-alpine

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy standalone frontend nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
