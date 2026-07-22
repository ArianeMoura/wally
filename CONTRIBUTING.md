# Contributing to Wally

Thanks for contributing to Wally. This guide describes the workflow, the coding
standards and the quality bar that keep the product consistent and safe. Planning
happens in **GitHub Projects**; code lands through the Pull Request flow described
below.

---

## 1. Repository layout

```
apps/api/            # API (Node.js / Fastify / Drizzle ORM / PostgreSQL)
apps/mobile/         # Mobile app (Expo / React Native + TypeScript)
packages/core/       # Domain rules (money, split, balances)
packages/contracts/  # Zod schemas shared end to end
packages/config/     # Shared configuration
docs/                # Product and engineering documentation
```

This is a **pnpm + Turborepo** monorepo: one lockfile at the root, and workspaces wired
together through the `workspace:*` protocol. Run `pnpm install` once from the root and
every package is installed.

> **Wally 2.0.** Persistence uses **Drizzle ORM**; the schema and migrations live in
> `apps/api/src/db/`. Code, schema and API are in **English** (see _Language
> convention_ below).

---

## 2. Git workflow

We follow a trunk-based flow with short-lived branches.

- **`main`** — always stable and deployable. Protected: it only takes code through an
  approved Pull Request with green CI.
- **`feat/*`, `fix/*`, `chore/*`, `docs/*`** — working branches, cut from `main` and
  merged back through a PR.

```bash
git switch -c feat/expense-splitting
# ... commits ...
git push -u origin feat/expense-splitting
# open a Pull Request against main
```

> There are no date-based or "sprint" branches. Scope and priority are tracked in
> **GitHub Projects** (board, labels and milestones).

---

## 3. Commit convention

We use **[Conventional Commits](https://www.conventionalcommits.org/)**, written in
English, as a single line with no body:

```
<type>(optional scope): imperative description

feat(groups): calculate balance per participant
fix(auth): return 401 on expired token
docs(security): add LGPD guidelines
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.

---

## 4. Coding standards

- **Language convention (constraint 10).** Identifiers in **code, database schema and
  API are in English** (`users`, `groupExpenses`, `/api/v1/groups`); engineering
  documentation is in English, while the product documents `01`–`04` stay in PT-BR; UI
  copy is externalised through **i18n** (PT-BR by default). Never mix PT and EN inside
  an identifier.
- **TypeScript** everywhere; `any` is **banned** (strict typecheck in CI).
- **Back end** — respect the layered architecture
  (`controller → use-case → repository → schema (Drizzle)`). Business rules live in the
  _use cases_, never in a controller. Every balance mutation runs inside a transaction
  with concurrency control. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Mobile** — respect MVVM (views in `app/` and `components/`, logic in `viewModels/`,
  state in `store/`).
- **Lint and formatting** — code must pass before you commit:

  ```bash
  pnpm typecheck
  pnpm --filter @wally/api lint
  pnpm format          # Prettier (pnpm format:check to verify only)
  ```

- **Security** — never commit secrets; use `.env` (see `.env.example`). Every route
  input must be validated. Read [SECURITY.md](SECURITY.md).

---

## 5. Tests

- New business rules require **unit tests**; API journeys require **integration
  tests**. See [docs/TESTING.md](docs/TESTING.md).
- Run the suite locally before opening a PR. The API tests need a migrated **and
  seeded** database:

  ```bash
  cd apps/api && docker compose up -d db
  pnpm db:migrate && pnpm db:seed
  cd ../.. && pnpm test
  ```

---

## 6. Pull Requests

A PR is only merged when:

1. **CI is green** — tests, lint, typecheck, SAST (CodeQL) and secret scanning (see
   [docs/CICD.md](docs/CICD.md)).
2. It has a **clear description** and links to the issue / GitHub Projects item.
3. It got **at least one approval** in code review.
4. It introduces no secrets, credentials or real personal data.

### Author checklist

- [ ] The code follows the architecture of its layer.
- [ ] Lint and tests pass locally.
- [ ] Changes are covered by tests where applicable.
- [ ] Affected documentation is updated.
- [ ] No secrets, tokens or PII in the diff.

---

## 7. Definition of Done

An item is done when:

- It meets the acceptance criteria described in the issue.
- It passed code review and CI.
- It is covered by tests proportional to its risk.
- The relevant documentation was updated.
- It introduces no known security regressions.

---

## 8. Reporting security issues

Vulnerabilities must **not** be filed as public issues. Follow the process described in
[SECURITY.md](SECURITY.md).
