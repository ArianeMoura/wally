# Testing Strategy

Wally's quality is backed by an automated test suite wired into CI and complemented by
manual usability validation. This document defines the test levels, the targets and how
they plug into the pipelines.

## Test pyramid

```
        ▲  E2E (few, critical end-to-end journeys)
       ─── Integration (API + database; contracts between layers)
      ─────  Unit (many, fast; use cases and domain rules)
```

| Level           | Scope                                                   | Tooling                                    |
| --------------- | ------------------------------------------------------- | ------------------------------------------ |
| **Unit**        | Use cases and isolated business rules                   | Vitest (API, packages); jest-expo (mobile) |
| **Integration** | API routes against a real database; view models × API   | Fastify `inject` + PostgreSQL              |
| **E2E**         | Critical app journeys (login, transaction, group split) | Detox/Maestro (mobile) — planned           |

## Current state

The suite currently holds **71 tests**, all green:

| Package            | Tests | Coverage                                                          |
| ------------------ | ----- | ----------------------------------------------------------------- |
| `@wally/api`       | 31    | health, auth, personal finance, groups/ledger and the audit trail |
| `@wally/core`      | 30    | money, split and balance rules                                    |
| `@wally/contracts` | 10    | Zod schemas shared end to end                                     |

API tests run against a real PostgreSQL instance (a service container in CI), so the
migrations, the RLS policies and the concurrency controls are exercised for real rather
than mocked.

```bash
pnpm test        # whole monorepo, through Turborepo
pnpm typecheck   # strict tsc --noEmit; `any` is banned
```

> The API suite requires the database to be migrated **and seeded** —
> `categories.test.ts` asserts the 15 default categories exist. Run
> `pnpm --filter @wally/api db:migrate && pnpm --filter @wally/api db:seed` first.

### Backlog

- Raise mobile coverage: only `src/lib/money.test.ts` exists today.
- Add E2E journeys (Detox/Maestro) for login, recording a transaction and splitting a
  group expense.
- Publish the coverage report in CI and enforce the floors below as a blocking gate.

### Coverage gates (Wally 2.0)

Coverage is meant to be a blocking CI gate (RNF-013), with a higher floor wherever the
risk is financial:

| Scope                                                                           | Coverage floor |
| ------------------------------------------------------------------------------- | -------------- |
| Global (API + mobile)                                                           | ~70% of lines  |
| Financial use cases (`transactions`, `groupExpenses`, `settlements`, `budgets`) | ~90% of lines  |

### Concurrency testing (mandatory)

Financial edge cases demand dedicated tests on top of the unit and integration ones:

- **Concurrent split/settlement:** fire N parallel `split`/`settle` requests against the
  same group and assert the `Σ balances == 0` invariant and the absence of lost
  updates (this is what validates the `FOR UPDATE` transaction — RNF-007/008).
- **Idempotency:** replay the same request with the same `Idempotency-Key` and assert a
  **single** effect (RNF-009).
- **Rounding:** split values that do not divide evenly (e.g. 1000 cents across 3) and
  assert `Σ expense_shares == amount_cents` (RNF-010).

## Functional test cases (reference)

The journeys below are the baseline for automation and manual verification:

| ID    | Requirement | Goal                                                       |
| ----- | ----------- | ---------------------------------------------------------- |
| CT-01 | RF-001      | Authenticate with email and password                       |
| CT-02 | RF-002      | Send a reset link and change the password                  |
| CT-03 | RF-003      | Register a new user                                        |
| CT-04 | RF-004      | Edit the profile (name, picture, password)                 |
| CT-05 | RF-005      | Add income/expense                                         |
| CT-06 | RF-006      | Show the full statement                                    |
| CT-07 | RF-007      | Filter transactions                                        |
| CT-08 | RF-008      | Compute balance, income and expenses                       |
| CT-09 | RF-009      | Select month/year                                          |
| CT-10 | RF-010      | Create a group                                             |
| CT-11 | RF-011      | Add a group expense with a split                           |
| CT-12 | RF-012      | Compute each participant's balance                         |
| CT-13 | RF-013      | Show the group history                                     |
| CT-14 | RF-014      | Add members                                                |
| CT-15 | RF-015      | List groups                                                |
| CT-16 | RF-016      | Show the home screen                                       |
| CT-17 | RF-017      | Categorise a transaction (auto-suggestion + editing)       |
| CT-18 | RF-018      | Settle up within a group and recompute balances            |
| CT-19 | RF-019      | Alert when a category budget is exceeded                   |
| CT-20 | RF-020      | Record a financial event on every balance mutation         |
| CT-21 | RF-021      | Generate an AI insight over anonymised data (with consent) |

## Usability testing

Beyond automated tests, Wally runs usability sessions with real users to measure
efficiency, satisfaction and per-task success rate (based on the SUS — System Usability
Scale). **All data collected during usability sessions is handled anonymously**, in
line with the LGPD (see [SECURITY](../SECURITY.md)).

A typical script:

- **Participant selection** representing the target audience profiles.
- **Tasks** covering the main journeys (sign-up, recording a transaction, creating a
  group, splitting an expense).
- **Metrics** for time on task, completion rate, errors and satisfaction.

## CI integration

Unit and integration tests run automatically on every push and Pull Request against
`main` (see [CICD](CICD.md)). A PR is only merged with a green suite.
