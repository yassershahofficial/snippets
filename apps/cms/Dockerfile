# Payload CMS — production image (GHCR)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

FROM base AS deps
COPY package.json ./
RUN printf '%s\n' 'node-linker=hoisted' > .npmrc \
  && printf '%s\n' 'onlyBuiltDependencies:' '  - sharp' '  - esbuild' > pnpm-workspace.yaml \
  && pnpm install --no-frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.npmrc ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY . .

# Next/Payload need env present at build time (values unused for static generation here)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PAYLOAD_SECRET=build-time-only-not-used-at-runtime
ENV DATABASE_URL=mongodb://127.0.0.1:27017/snippets
ENV PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--no-deprecation
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Avoid pnpm interactive prompts if anything still invokes it
ENV CI=true

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs \
  && mkdir -p /app/media \
  && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.npmrc ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

USER nextjs
EXPOSE 3000
# Run Next directly — `pnpm start` triggers corepack/pnpm install in non-TTY containers
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
