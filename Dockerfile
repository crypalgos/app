# Stage 1: Dependencies
FROM oven/bun:latest AS deps
WORKDIR /app

# Install dependencies based on the bun lockfile
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:latest AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run tests
RUN bun run test

# Build the application
RUN bun run build

# Stage 3: Runner
# The user requested to use Bun here too.
FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Bun can run the Next.js standalone server
CMD ["bun", "server.js"]
