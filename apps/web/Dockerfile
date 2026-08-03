# Astro web — production image (GHCR)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

FROM base AS deps
COPY package.json ./
RUN printf '%s\n' 'node-linker=hoisted' > .npmrc \
  && printf '%s\n' 'onlyBuiltDependencies:' "  - '@tailwindcss/oxide'" '  - esbuild' > pnpm-workspace.yaml \
  && pnpm install --no-frozen-lockfile

FROM base AS builder
ARG PUBLIC_SITE_URL=http://localhost:4321
ARG PUBLIC_PAYLOAD_URL=http://localhost:3000
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_PAYLOAD_URL=$PUBLIC_PAYLOAD_URL
ENV PAYLOAD_URL=http://cms:3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.npmrc ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY . .

ENV NODE_ENV=production
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
# Server-side Payload fetch (Compose service name). Override via compose if needed.
ENV PAYLOAD_URL=http://cms:3000

RUN addgroup -S nodejs && adduser -S astro -G nodejs \
  && chown -R astro:nodejs /app

COPY --from=builder --chown=astro:nodejs /app/package.json ./
COPY --from=builder --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=astro:nodejs /app/dist ./dist

USER astro
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
