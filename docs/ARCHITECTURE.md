# Architecture

Wally is a **pnpm + Turborepo monorepo** written entirely in **TypeScript**: a mobile
app (Expo / React Native), an API (Node.js / Fastify) and shared packages, persisted
in **PostgreSQL**. The architecture prioritises **separation of concerns**,
**testability** and **scalability**.

> **Wally 2.0 — a product in progress.** Wally grew from an academic project into a
> personal product, with a **brand new database**, its own API, hosting and
> continuous evolution. Taking advantage of the greenfield database, persistence
> moved from TypeORM to **Drizzle ORM** (SQL-first) and the **schema, code and API
> were written in English from the start**. The product documents `01`–`04` remain in
> PT-BR — see constraint 10 in
> [02-Especificação do Projeto](02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md).

## Repository layout

```
apps/api/         # API — Fastify + Drizzle ORM + PostgreSQL
apps/mobile/      # Mobile app — Expo / React Native (MVVM)
packages/core/        # Domain rules (money, split, balances)
packages/contracts/   # Zod schemas shared end to end
packages/config/      # Shared configuration
```

Shared packages are consumed straight from source through the `workspace:*` protocol,
so there is no build step between them and the apps.

## Overview (C4 — container level)

```
┌──────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   Mobile app         │  ───────────────────▶    │      API (Fastify)       │
│   Expo / RN (MVVM)   │  ◀───────────────────    │   Clean Architecture     │
└──────────────────────┘        JWT (Bearer)      └───────────┬──────────────┘
                                                              │ Drizzle ORM
                                                              ▼
                                                   ┌──────────────────────────┐
                                                   │        PostgreSQL        │
                                                   └──────────────────────────┘
```

## Design principles

The codebase follows **SOLID** and well-established patterns:

- **Single Responsibility** — every layer and class has one job (routes dispatch, use
  cases decide, repositories reach for data).
- **Dependency Inversion** — outer layers depend on abstractions; business rules know
  nothing about the framework or about HTTP.
- **Repository Pattern** — data access is isolated behind repositories.
- **Use Case / Interactor** — every business operation is an explicit use case.
- **DTOs** — input/output contracts decoupled from persistence entities.

## Back end — layered architecture (Clean Architecture)

Request flow:

```
routes/ ─▶ controllers/ ─▶ use-cases/ ─▶ repositories/ ─▶ schema/ (Drizzle) ─▶ PostgreSQL
   │            │              │              │
   │            │              │              └─ isolated data access
   │            │              └─ BUSINESS RULES (the single place decisions are made)
   │            └─ adapts HTTP ↔ use case; holds no business rules
   └─ declares endpoints and the auth (JWT) middleware
```

- **`routes/`** — endpoint declarations (`/api/v1/...`) and their binding to the
  authentication middleware. Input and output are validated with Zod through
  `fastify-type-provider-zod`.
- **`controllers/`** — translate the HTTP request into use case calls and shape the
  response. No business rules.
- **`use-cases/`** — the heart of the application, organised by domain (`auth`,
  `users`, `transactions`, `categories`, `groups`, `groupExpenses`, `settlements`,
  `budgets`). Each use case is a testable unit; the ones that change balances run
  inside a transaction (see _Transactional consistency and concurrency_).
- **`repositories/`** — wrap data access through **Drizzle ORM**.
- **`db/schema/`** — typed Drizzle tables (the source of truth for the schema).
- **`dtos/` (Zod schemas)** — input/output data contracts, shared with the mobile app
  through `@wally/contracts`.
- **`middleware.ts`** — JWT (Bearer token) authentication and RBAC checks.

The payoff: business rules are independent of Fastify and of Drizzle, which makes use
cases straightforward to unit test and lets the infrastructure evolve without touching
the domain.

## Mobile — MVVM

```
View (app/, components/) ─▶ ViewModel (viewModels/) ─▶ Store/API (store/, TanStack Query)
```

- **View** — screens (`app/`, file-based routing with expo-router) and components
  (`components/`), kept declarative.
- **ViewModel** — presentation logic (`useLoginViewModel`, `useWalletViewModel`,
  `useGruposViewModel`, …), shielding screens from state and request details.
- **Local / session / UI state** — `store/` with **Zustand** (session, theme,
  ephemeral state); the token is kept in **expo-secure-store** (Keychain/Keystore).
- **Remote (server) state** — **TanStack Query v5** for caching, synchronisation and
  loading/error states. The cache is **persisted** through
  `@tanstack/query-async-storage-persister` on top of **AsyncStorage** (chosen for
  Expo Go compatibility) for cache-first offline reads. Financial mutations are
  **optimistic** (`onMutate` + rollback) and reconcile with the server through
  invalidation. See _Offline strategy_.
- **Forms** — **React Hook Form + Zod** (`@hookform/resolvers`), reusing the very same
  Zod schema the API validates against (end-to-end contracts).
- **i18n** — copy is externalised with **i18next** (PT-BR by default, ready for EN).

## Data model

Wally 2.0 schema — **UUID** primary keys, **soft delete** (`deleted_at`), timestamps,
and monetary values stored as **integer cents** (`amount_cents`):

| Table              | Role               | Key fields                                                                                 |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------ |
| `users`            | accounts           | `id, name, email (unique), password_hash, avatar_url`                                      |
| `categories`       | RF-017             | `id, user_id?, name, icon, color, kind (income \| expense)`                                |
| `transactions`     | personal finances  | `id, user_id, category_id, type, amount_cents, description, occurred_at`                   |
| `groups`           | groups             | `id, name, owner_id` — **aggregate locked during split/settlement**                        |
| `group_members`    | membership         | `id, group_id, user_id, role` · `unique(group_id, user_id)`                                |
| `group_expenses`   | group expenses     | `id, group_id, payer_id, amount_cents, category_id, description`                           |
| `expense_shares`   | split shares       | `id, group_expense_id, user_id, share_cents` · invariant `Σ share_cents == amount_cents`   |
| `settlements`      | RF-018 (settle up) | `id, group_id, from_user_id, to_user_id, amount_cents, settled_at`                         |
| `budgets`          | RF-019             | `id, user_id, category_id, period, limit_cents`                                            |
| `financial_events` | RF-020 (event log) | `id, actor_id, entity_type, entity_id, event_type, before jsonb, after jsonb, occurred_at` |
| `refresh_tokens`   | RNF-011            | `id, user_id, token_hash, family_id, expires_at, revoked_at`                               |
| `idempotency_keys` | RNF-009            | `key (pk), user_id, request_hash, response jsonb, created_at`                              |

**Single source of truth:** the **drizzle-kit migrations** (`db/migrations/`),
generated from the typed schema in `db/schema/`. The `password_hash` column is sized
for **Argon2id** hashes (≥ 255).

### Row-Level Security

Migration `0002_rls_policies.sql` creates two roles: the **owner** (`wally`), used by
migrations and by the seed, and **`wally_app`**, the role the server actually connects
with at runtime and which is **subject to RLS**. Tenant isolation is therefore enforced
by the database itself, not only by application code.

## Transactional consistency and concurrency

Operations that change balances (RF-011/012/018) are where financial correctness is
won or lost. The mandatory pattern: **a single transaction** that locks the group
aggregate, re-reads the state, applies the mutation, recomputes balances and writes the
`financial_event` — all or nothing (RNF-007/008).

```ts
await db.transaction(async (tx) => {
  const group = await tx
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .for('update') // pessimistic lock on the aggregate
  // re-read balances → apply mutation → recompute (Σ balances == 0) → write financial_event
}) // atomic commit
```

An alternative for low-contention scenarios: a `version` column (optimistic
concurrency) plus retry on conflict. Writes carry an `Idempotency-Key` (RNF-009) so
network retries never double-apply.

## Offline strategy

Wally follows the industry default (constraint 08) rather than full offline-first with
a write queue, which is a poor fit for a shared group ledger:

- **Reads:** cache-first, with the TanStack Query cache persisted in **AsyncStorage**;
  already-synced data stays available offline. Moving to `react-native-mmkv` is on the
  backlog and requires a development build (it does not run inside Expo Go).
- **Writes:** require connectivity, but the UI is **optimistic** (apply locally, send,
  roll back if the server refuses). **The server is the authority** over group
  balances; reconciliation happens through invalidation and refetch on reconnect.

## Interaction flow

1. The user interacts with the mobile app (browsing data, recording transactions).
2. The View calls the ViewModel, which reaches the API through TanStack Query.
3. The API authenticates (JWT), runs the use case and reaches PostgreSQL via Drizzle ORM.
4. The response returns to the app, which updates the UI reactively.

## Technology stack

| Layer  | Technologies                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile | React Native, Expo, expo-router, Zustand, TanStack Query v5 (+ AsyncStorage persistence), React Hook Form + Zod, React Native Paper, i18next, expo-secure-store |
| API    | Node.js, Fastify, Drizzle ORM (+ drizzle-kit), Zod (`fastify-type-provider-zod`), `@fastify/jwt` / `helmet` / `rate-limit`, JWT, Swagger (OpenAPI), Pino        |
| Data   | PostgreSQL 16 with Row-Level Security                                                                                                                           |
| Infra  | Docker + docker compose; pnpm + Turborepo; deployed behind HTTPS/TLS + HSTS (see [CICD](CICD.md) and [SECURITY](../SECURITY.md))                                |

## Security and quality

Security guidelines (hashing, TLS, JWT, LGPD) live in [SECURITY](../SECURITY.md).
Test strategy and coverage gates live in [TESTING](TESTING.md).
