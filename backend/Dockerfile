# ==============================================================================
# No Tre(ou)ble Backend - Production Multi-Stage Dockerfile
# Hardened, Minimalist, Non-Root User Execution (OWASP Container Security)
# ==============================================================================

# Stage 1: Dependency resolution and production prune
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production Distroless-style Alpine Runtime
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=5000

# Install lightweight diagnostic probe
RUN apk add --no-cache wget

# Create necessary upload storage directories with non-root ownership
RUN mkdir -p /usr/src/app/uploads/cms \
             /usr/src/app/uploads/audio \
             /usr/src/app/uploads/videos \
             /usr/src/app/uploads/recordings \
    && chown -R node:node /usr/src/app

# Copy production node_modules from builder
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Switch to non-root user (Principle of Least Privilege)
USER node

EXPOSE 5000

# Container Healthcheck (Liveness / Readiness probe)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
