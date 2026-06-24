# TaskFlow

Monorepo **pnpm + Turborepo** : backend **NestJS** + frontend **Nuxt 3** + **PostgreSQL** (Prisma).

## Stack

| Couche     | Techno                                   |
| ---------- | ---------------------------------------- |
| Backend    | NestJS 11, Prisma 6, Swagger             |
| Frontend   | Nuxt 3, Vue 3                            |
| Base       | PostgreSQL 16                            |
| Qualité    | ESLint 9 (flat), Prettier                |
| Tests      | Vitest (+ coverage v8), Playwright (e2e) |
| Conteneurs | Docker (multi-stage) + docker-compose    |

## Arborescence

```
apps/
  backend/   NestJS + Prisma (schema User/List/Task)
  web/       Nuxt 3
```

## Démarrage

### Avec Docker (recommandé)

```bash
cp .env.example .env
docker compose up --build
```

3 services démarrent : `postgres` (healthcheck), `backend` (migration Prisma appliquée au boot), `web`.

- API : http://localhost:3001
- Healthcheck : http://localhost:3001/health
- Swagger : http://localhost:3001/docs
- Frontend : http://localhost:3000

### En local (sans Docker)

```bash
pnpm install
cp .env.example .env   # mettre DATABASE_URL sur localhost:5432
pnpm --filter @taskflow/backend prisma:migrate
pnpm dev               # lance back + front via turbo
```

## Scripts (racine, via Turborepo)

| Script               | Effet                                 |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | Démarre backend + frontend en watch   |
| `pnpm build`         | Build les deux apps                   |
| `pnpm lint`          | ESLint sur back + front               |
| `pnpm format`        | Prettier `--write` sur tout le repo   |
| `pnpm test`          | Tests unitaires Vitest (back + front) |
| `pnpm test:coverage` | Tests + couverture v8                 |
| `pnpm test:e2e`      | Tests Playwright (frontend)           |

> `test:e2e` requiert les navigateurs Playwright : `pnpm --filter @taskflow/web exec playwright install chromium`.

## Base de données (Prisma)

Schéma : `apps/backend/prisma/schema.prisma` — `User → List → Task` avec suppression en cascade.

```bash
pnpm --filter @taskflow/backend prisma:migrate     # migration de dev
pnpm --filter @taskflow/backend prisma:generate    # (re)génère le client
```
