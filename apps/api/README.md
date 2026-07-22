# Wally — API

Wally's API, built with **Node.js + Fastify + Drizzle ORM + PostgreSQL** in
**TypeScript**, following a **layered architecture** (Clean Architecture):
`controller → use-case → repository → schema (Drizzle)`.

> **Language (constraint 10):** code, schema and API in **English**. See
> [ARCHITECTURE.md](../../docs/ARCHITECTURE.md).

---

## Prerequisites

- **Node.js 20+** and **pnpm 9** (`corepack enable`)
- **Docker** (to run PostgreSQL locally through `docker compose`)

---

## Setup

```bash
pnpm install -w               # installs the whole monorepo (fine to run from here)
cp .env.example .env          # fill in the secrets (see below)
docker compose up -d db       # PostgreSQL on localhost:5432
pnpm db:migrate               # migrations + RLS policies + the wally_app role
pnpm db:seed                  # 15 default categories — required by the test suite
pnpm dev                      # API on http://localhost:3333
```

Generate the JWT secrets with `openssl rand -hex 32`.

> If port 5432 is already taken on your machine, create a `docker-compose.override.yml`
> (Git-ignored) with `services: { db: { ports: !override ["5433:5432"] } }` and adjust
> the port in `DATABASE_URL`/`APP_DATABASE_URL`. The `!override` tag is required:
> without it Compose concatenates the `ports` lists and tries to publish 5432 as well.

### Environment variables

| Variable                                 | Description                                                       |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`                               | `development` \| `test` \| `production`                           |
| `HOST` / `PORT`                          | API bind address (defaults to `0.0.0.0:3333`)                     |
| `DATABASE_URL`                           | Owner connection — used by migrations and the seed (bypasses RLS) |
| `APP_DATABASE_URL`                       | Runtime connection as `wally_app` — **subject to RLS**            |
| `JWT_ACCESS_SECRET`                      | Access token secret (≥ 32 chars) — **required**                   |
| `JWT_REFRESH_SECRET`                     | Refresh token secret (≥ 32 chars) — **required**                  |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | Token lifetimes (`15m`, `30d`)                                    |
| `RESET_TOKEN_TTL`                        | Password reset token lifetime (`1h`)                              |
| `CORS_ORIGIN`                            | Allowed origin(s), comma-separated; `*` in development only       |

> Configuration is validated at boot with **fail-fast**
> ([`src/config/env.ts`](src/config/env.ts)): the API aborts if any required variable is
> missing. There are no insecure fallbacks.

---

## Migrations and database

The schema is managed by **Drizzle ORM**; the **drizzle-kit** migrations are the source
of truth ([`src/db/schema/`](src/db/schema/) → [`src/db/migrations/`](src/db/migrations/)).

```bash
pnpm db:generate        # generate a migration from the typed schema
pnpm db:migrate         # apply pending migrations
pnpm db:migrate:check   # validate migration consistency (CI)
pnpm db:seed            # insert the default categories
pnpm db:studio          # visual database explorer
```

Migration `0002_rls_policies.sql` creates the **`wally_app`** role that the server uses
at runtime, subject to Row-Level Security. Migrations and the seed run as the owner.

---

## API documentation (Swagger)

While the API is running: `/wally/documentation` (OpenAPI generated from the Zod
schemas). Routes are served under `/api/v1`.

---

## Structure

```
src/
  config/           # env (fail-fast) and logger (pino, with redaction)
  db/
    schema/         # Drizzle tables (source of truth)
    migrations/     # drizzle-kit generated migrations
    client.ts       # pg pool + Drizzle client (owner and runtime roles)
    seed.ts         # default categories
  http/routes/      # cross-cutting routes (e.g. health)
  modules/          # domains: auth, categories, transactions, budgets, groups, audit
  lib/              # shared helpers (idempotency, tokens)
  plugins/          # Fastify plugins (auth, request correlation)
  app.ts            # buildApp() — plugins, Zod, Swagger (no listen)
  server.ts         # bootstrap: loads env, starts the server, graceful shutdown
```

---

## Scripts

```bash
pnpm dev         # development (tsx watch)
pnpm start       # run the build (node dist/server.js)
pnpm build       # build (tsup → dist/)
pnpm typecheck   # tsc --noEmit (`any` is banned)
pnpm test        # tests (vitest)
pnpm lint        # ESLint
```

---

## Docker

```bash
docker compose up --build   # PostgreSQL (db) + API (app) on port 3333
```
