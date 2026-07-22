# CI/CD and Automation (GitHub Actions)

Wally relies on **GitHub Actions** for automation. Every code change is verified
automatically before it is merged, and releases are packaged by reproducible pipelines.
This document describes the pipelines that exist today and the gates they enforce.

## Pipeline overview

| Trigger                         | Workflow                                           | Purpose                                            |
| ------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Push / PR → `main`              | **CI** — `ci.yml`                                  | Migrations, seed, typecheck, lint, tests and build |
| Push / PR → `main`              | **Secret scanning** — `ci.yml` (`secret-scan` job) | Keep secrets out of the history (Gitleaks)         |
| Push / PR → `main`, weekly cron | **CodeQL** — `codeql.yml`                          | Static application security testing (SAST)         |
| Manual (`workflow_dispatch`)    | **EAS Build** — `eas-build.yml`                    | Build the mobile app artefacts                     |
| Weekly                          | **Dependabot** — `dependabot.yml`                  | npm and GitHub Actions dependency updates          |

Protecting the `main` branch is recommended, requiring: green CI, an approved review
and no detected secrets.

## CI — `ci.yml`

A single `quality` job runs the whole monorepo against a real **PostgreSQL 16** service
container, so migrations, RLS policies and concurrency controls are exercised for real:

1. `corepack enable` — pins pnpm to the version declared in `packageManager`.
2. `pnpm install --frozen-lockfile`.
3. `pnpm --filter @wally/api db:migrate` — applies the schema, the RLS policies and
   creates the `wally_app` role.
4. `pnpm --filter @wally/api db:seed` — the 15 default categories, which the API suite
   asserts against.
5. `pnpm typecheck` → `pnpm --filter @wally/api lint` → `pnpm test` → `pnpm build`.

The job exports both database URLs — the owner (`DATABASE_URL`, used by migrations and
the seed) and the runtime role (`APP_DATABASE_URL`, subject to RLS) — plus CI-only JWT
secrets that are never used outside the pipeline. Concurrency is capped per ref with
`cancel-in-progress`, so superseded runs stop early.

The `secret-scan` job runs **Gitleaks** over the full history (`fetch-depth: 0`).

## CodeQL — `codeql.yml`

SAST over JavaScript/TypeScript with the `security-and-quality` query pack, on every
push and PR to `main` plus a weekly Monday scan. Results land in the repository's
Security tab.

## EAS Build — `eas-build.yml`

Mobile builds are **manual on purpose** (`workflow_dispatch` with a `profile` input:
`development` | `preview` | `production`) so they do not burn EAS quota on every push.
Requires the `EXPO_TOKEN` secret.

## Dependency updates — `dependabot.yml`

Weekly checks for npm dependencies (grouped into `dev-dependencies` and
`production-dependencies` to keep the PR count down, capped at 10 open PRs) and for the
GitHub Actions used across the workflows.

> Enabling **GitHub Secret Scanning** in the repository settings is recommended as well,
> for native coverage on top of Gitleaks.

## Secrets management

- Secrets (tokens, keys) live in **GitHub Actions Secrets** / **Environments**, never in
  the code or in plain text inside a workflow.
- Runtime environment variables follow each app's `.env.example` and, in production, a
  managed vault (e.g. AWS Secrets Manager). See [SECURITY](../SECURITY.md).

## Blocking quality gates (Wally 2.0)

These checks are **required** to merge into `main` (RNF-013), not optional:

| Gate         | Tooling                           | Failure criterion                                                         |
| ------------ | --------------------------------- | ------------------------------------------------------------------------- |
| Typecheck    | `tsc --noEmit` (strict)           | Any type error; any use of `any`                                          |
| Lint         | ESLint                            | Any lint error                                                            |
| Tests        | Vitest + jest-expo                | Any failing test                                                          |
| Migrations   | drizzle-kit                       | A migration that does not apply cleanly / schema drift                    |
| Build        | tsup (API)                        | Any build failure                                                         |
| SAST         | CodeQL                            | A high-severity alert                                                     |
| Secrets      | Gitleaks + GitHub Secret Scanning | Any detected secret                                                       |
| Dependencies | Dependabot                        | A **high/critical** CVE                                                   |
| Coverage     | coverage report                   | Below the floor (~70% global; ~90% financial — see [TESTING](TESTING.md)) |

Local hygiene is handled by **Prettier** as the formatter (`pnpm format`), with
`pnpm format:check` available for verification.

## Backlog

- [ ] Publish the coverage report in CI and turn the floors into a blocking gate.
- [ ] Set up Husky + lint-staged + commitlint (Conventional Commits).
- [ ] Protect `main` (required checks: CI, CodeQL, Gitleaks + review).
- [ ] Add `PULL_REQUEST_TEMPLATE.md` and `ISSUE_TEMPLATE/` under `.github/`.
- [ ] Add a Docker image build & push pipeline for the API once a registry exists.
