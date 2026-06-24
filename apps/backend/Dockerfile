# ─── Backend NestJS — build multi-stage ──────────────────────
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --filter @taskflow/backend... --frozen-lockfile
COPY apps/backend apps/backend
RUN pnpm --filter @taskflow/backend exec prisma generate \
  && pnpm --filter @taskflow/backend build


FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/backend


COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/package.json ./package.json

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

# On applique les migrations avant de lancer l'application. Cela permet de s'assurer que la base de données est à jour avec le code.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
