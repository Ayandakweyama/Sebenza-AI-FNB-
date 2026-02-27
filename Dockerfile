# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL is needed by Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js needs these vars at build time for static page generation / prerendering.
# Railway automatically injects service env vars as Docker build args.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
# Generate Prisma client and build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install ALL system dependencies required by Puppeteer's bundled Chromium
# AND openssl for Prisma. node:20-slim is Debian-based.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    openssl \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    wget \
    xdg-utils \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy the standalone Next.js output (includes server.js + node_modules subset)
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy Prisma schema (needed by @prisma/client at runtime)
COPY --from=builder /app/prisma ./prisma

# The standalone output only bundles a minimal node_modules subset.
# Puppeteer, Prisma CLI, and their deep transitive deps are missing.
# Copy the FULL node_modules on top — overlays what standalone already has.
COPY --from=deps /app/node_modules ./node_modules
# Ensure generated Prisma client is present (created during build stage)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Puppeteer's cached Chromium binary (downloaded during npm ci)
COPY --from=deps /root/.cache/puppeteer /root/.cache/puppeteer

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Push schema at startup (internal DB only reachable at runtime, not build time)
CMD node ./node_modules/prisma/build/index.js db push --skip-generate && node server.js
