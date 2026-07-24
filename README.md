<div align="center">

<img width="186" height="186" alt="wally-icon-mint" src="https://github.com/user-attachments/assets/b0ccdbbf-0646-41c6-927d-c934f9474eaa" />

<!-- CI badges will be added once the workflows are public (see docs/CICD.md)
![CI](https://img.shields.io/badge/CI-pending-lightgrey)
![CodeQL](https://img.shields.io/badge/CodeQL-pending-lightgrey)
-->

</div>

## About

Wally works on two complementary fronts:

- **Personal finance** — recording and categorising income and expenses in real time,
  with smart balance tracking.
- **Group finance** — splitting shared expenses with a focus on transparency and
  practicality, for friends, family and colleagues.

## Features

| Area                 | Capabilities                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Personal finance** | Income and expenses with amount, date and description; automatic balance calculation; statement filtering by name, amount and type; month/year period selection. |
| **Groups**           | Group creation and management; expenses split automatically across participants; per-member balance (debtor/creditor); expense history.                          |
| **Account**          | Email and password authentication; account recovery; profile editing.                                                                                            |

## Architecture and stack

A **pnpm + Turborepo** monorepo, entirely in **TypeScript**:

| Layer                                       | Stack                                                                                                      | Pattern                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Mobile** — [`apps/mobile/`](apps/mobile/) | Expo, React Native, expo-router, Zustand, TanStack Query (persisted cache), React Hook Form + Zod, i18next | MVVM                                             |
| **API** — [`apps/api/`](apps/api/)          | Node.js, Fastify, Drizzle ORM, PostgreSQL, Zod, JWT, Swagger                                               | Layered (Clean Architecture)                     |
| **Shared** — [`packages/`](packages/)       | `@wally/core` (domain rules), `@wally/contracts` (Zod schemas), `@wally/config`                            | Consumed via `workspace:*`, straight from source |
| **Infrastructure**                          | Docker, PostgreSQL 16 with Row-Level Security                                                              | Versioned migrations (drizzle-kit)               |

> **Wally 2.0.** A product in progress on a brand new database: persistence through
> **Drizzle ORM**, with **code, schema and API in English**. The product documents
> `01`–`04` under [docs/](docs/) are academic deliverables kept in PT-BR.

Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting started

Prerequisites: **Node.js 20+**, **pnpm 9** (`corepack enable`), **Docker** (for the
database) and either **Expo Go** or an Android/iOS emulator.

```bash
# 1. Dependencies (from the root — installs every workspace)
pnpm install

# 2. Database + API
cd apps/api
cp .env.example .env          # generate the JWT secrets with: openssl rand -hex 32
docker compose up -d db       # PostgreSQL on localhost:5432
pnpm db:migrate               # schema, RLS policies and the wally_app role
pnpm db:seed                  # 15 default categories — required by the test suite
cd ../.. && pnpm dev          # API on http://localhost:3333

# 3. Mobile (in another terminal)
cd apps/mobile
cp .env.example .env          # EXPO_PUBLIC_API_URL pointing at the API
pnpm start                    # open in Expo Go or an emulator
```

`pnpm dev` at the root only starts the API — the mobile app is started with
`pnpm start` inside [`apps/mobile/`](apps/mobile/).

> If port 5432 is already taken on your machine, create an
> `apps/api/docker-compose.override.yml` (Git-ignored) with
> `services: { db: { ports: !override ["5433:5432"] } }` and adjust the port in
> `DATABASE_URL`/`APP_DATABASE_URL` in your `.env`. The `!override` tag is required:
> without it Compose concatenates the lists and tries to publish 5432 as well.

The API docs (Swagger) live at `/wally/documentation` while the API is running; routes
are served under `/api/v1`. Full guides:
[`apps/api/README.md`](apps/api/README.md) and
[`apps/mobile/README.md`](apps/mobile/README.md).

## Documentation

| Document                                                                                   | Contents                                                       |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| [Overview](docs/README.md)                                                                 | Index and map of the documentation                             |
| [Architecture](docs/ARCHITECTURE.md)                                                       | Layers, SOLID, MVVM, data model, concurrency, offline strategy |
| [Testing](docs/TESTING.md)                                                                 | Test pyramid, coverage gates and concurrency testing           |
| [CI/CD](docs/CICD.md)                                                                      | GitHub Actions pipelines and blocking quality gates            |
| [Design System](docs/DESIGN-SYSTEM.md)                                                     | Visual identity, palette and typography                        |
| [01 — Visão de Produto](docs/01-Vis%C3%A3o%20de%20Produto.md) · PT-BR                      | Problem, goals and target audience                             |
| [02 — Especificação do Projeto](docs/02-Especifica%C3%A7%C3%A3o%20do%20Projeto.md) · PT-BR | Requirements, use cases and traceability                       |
| [03 — Projeto de Interface](docs/03-Projeto%20de%20Interface.md) · PT-BR                   | User flow and wireframes                                       |
| [04 — Referências](docs/04-Refer%C3%AAncias.md) · PT-BR                                    | Cited sources and standards                                    |

**Governance:** [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md)

## Roadmap

Planning and prioritisation happen in **GitHub Projects**. Directions under
consideration:

- AI-driven financial insights and automations over anonymised data
  (see [SECURITY.md](SECURITY.md)).
- Responsive web dashboard.
- Group notifications and chat.
- Financial education, goals and gamification.

## Contributing

Read the [Contributing Guide](CONTRIBUTING.md) before opening a Pull Request. Every
contribution goes through CI (tests, lint, SAST) and code review.
