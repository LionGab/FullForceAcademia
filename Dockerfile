# ================================================================
# Full Force Academia WhatsApp Bot - Production Dockerfile
# ================================================================

# Use Node.js 18 LTS Alpine for smaller image size and security
FROM node:18-alpine AS base

# Set production environment
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Install system dependencies and security tools
RUN apk add --no-cache \
    # Core system tools
    curl \
    ca-certificates \
    tzdata \
    dumb-init \
    # Security tools
    openssl \
    # Browser dependencies for Baileys
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ttf-freefont \
    # Development tools for native modules
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

# Configure timezone
ENV TZ=America/Sao_Paulo
RUN cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime

# ================================================================
# Dependencies Stage
# ================================================================
FROM base AS dependencies

WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies with optimizations
RUN npm ci --only=production --no-optional --no-fund --no-audit && \
    npm cache clean --force && \
    # Remove unnecessary files
    find node_modules -name "*.md" -delete && \
    find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "*.test.js" -delete && \
    find node_modules -name "*.spec.js" -delete

# ================================================================
# Production Stage
# ================================================================
FROM base AS production

WORKDIR /app

# Copy user from dependencies stage
COPY --from=dependencies /etc/passwd /etc/passwd
COPY --from=dependencies /etc/group /etc/group

# Copy optimized node_modules
COPY --from=dependencies --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Set environment variables for Puppeteer and Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/bin/chromium-browser

# Copy application code with proper ownership
COPY --chown=nodeuser:nodejs package*.json ./
COPY --chown=nodeuser:nodejs src/ ./src/
COPY --chown=nodeuser:nodejs scripts/ ./scripts/
COPY --chown=nodeuser:nodejs .env.example ./

# Create necessary directories with proper permissions
RUN mkdir -p \
    /app/logs \
    /app/sessions \
    /app/sessions/baileys_auth_info \
    /app/uploads \
    /app/backups \
    /app/config \
    && chown -R nodeuser:nodejs /app

# Set proper permissions for directories
RUN chmod 755 /app && \
    chmod -R 750 /app/logs /app/sessions /app/uploads /app/backups /app/config && \
    chmod -R 644 /app/src /app/scripts && \
    chmod 644 /app/package*.json /app/.env.example

# Create volume mount points
VOLUME ["/app/logs", "/app/sessions", "/app/backups"]

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3001/health || exit 1

# Security: Switch to non-root user
USER nodeuser

# Expose application port
EXPOSE 3001

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

# Production optimization: Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index-baileys.js"]

# ================================================================
# Image Metadata
# ================================================================
LABEL maintainer="Full Force Academia <contato@fullforceacademia.com>"
LABEL version="3.0.0"
LABEL description="Full Force Academia WhatsApp Bot - Hybrid Edition"
LABEL org.opencontainers.image.title="Full Force Academia WhatsApp Bot"
LABEL org.opencontainers.image.description="Production WhatsApp automation bot with Baileys and WAHA integration"
LABEL org.opencontainers.image.version="3.0.0"
LABEL org.opencontainers.image.vendor="Full Force Academia"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/fullforce/academia-whatsapp-bot"