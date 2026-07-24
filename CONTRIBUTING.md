# Contributing to Wally

The conventions that keep the codebase consistent. Wally is a **pnpm + Turborepo**
monorepo — one lockfile at the root, workspaces wired through `workspace:*`.

```
apps/api/            # API (Node.js / Fastify / Drizzle ORM / PostgreSQL)
apps/mobile/         # Mobile app (Expo / React Native)
packages/core/       # Domain rules (money, split, balances)
packages/contracts/  # Zod schemas shared end to end
packages/config/     # Shared configuration
docs/                # Product and engineering documentation
```

## Getting set up

`pnpm install` from the root installs every package. To run the API tests you need a
migrated **and seeded** database (`categories.test.ts` asserts the default categories):

```bash
cd apps/api && docker compose up -d db
pnpm db:migrate && pnpm db:seed
cd ../.. && pnpm test
```

Full setup lives in the [main README](README.md) and [apps/api/README.md](apps/api/README.md).

## Conventions

- **Language.** Code, database schema and API identifiers are in **English**
  (`users`, `groupExpenses`, `/api/v1/groups`); engineering docs are in English; the
  product documents `01`–`04` stay in PT-BR; UI copy is externalised through i18n
  (PT-BR by default). Never mix languages inside an identifier.
- **TypeScript everywhere;** `any` is banned (strict typecheck in CI).
- **Back end** — keep the layered flow `controller → use-case → repository → schema`.
  Business rules live in use cases, and every balance mutation runs in a transaction
  with concurrency control. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Mobile** — MVVM: views in `app/` and `components/`, logic in feature hooks, state
  in `store/`.
- **Security** — never commit secrets; validate every route input. See
  [SECURITY.md](SECURITY.md). Report vulnerabilities privately, not as public issues.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), a single line in English,
no body:

```
feat(groups): calculate balance per participant
fix(auth): return 401 on expired token
```

Before committing, the code must pass:

```bash
pnpm typecheck
pnpm --filter @wally/api lint
pnpm format          # pnpm format:check to verify only
```

CI (typecheck, lint, tests, build, CodeQL, secret scanning) must be green before
anything lands on `main` — see [docs/CICD.md](docs/CICD.md).
