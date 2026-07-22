# Security Policy — Wally

Wally processes its users' financial data and personal information. Security and
privacy are first-class product requirements, not an afterthought. This document
defines the security guidelines the product follows, the current state of the
implementation, and the vulnerability reporting process.

> **Transparency note.** Some guidelines below describe the **target** (what the
> product must guarantee) and are marked with their current state: **Implemented** ·
> **Partial** · **Pending** (backlog). We do not claim controls that do not exist yet.

---

## 1. Principles

- **Security by design and by default.**
- **Least privilege.** Every component and credential gets only the access it strictly
  needs.
- **Defence in depth.** Multiple layers of protection (network, application, data)
  rather than a single control point.
- **No secrets in code.** No credential, token or key is ever committed.
- **Privacy by design.** Data minimisation and explicit purpose when collecting
  personal data (LGPD).

---

## 2. Authentication and sessions

| Guideline              | Target                                                               | State                    |
| ---------------------- | -------------------------------------------------------------------- | ------------------------ |
| Password hashing       | **Argon2id**                                                         | Implemented              |
| Login verification     | Library `verify`, with a timing guard against user enumeration       | Implemented              |
| Access token           | Short-lived JWT (15 min) + rotating **refresh token**                | Implemented              |
| Signing secret         | Mandatory variable (≥ 32 chars); boot fails if absent                | Implemented              |
| Brute-force protection | Rate limiting on login and reset                                     | Implemented — 10 req/min |
| Password reset         | Single-use token, short expiry, no account-existence leak            | Implemented              |
| Client-side storage    | Token in `expo-secure-store` (Keychain/Keystore)                     | Implemented              |
| MFA/2FA                | Optional TOTP for users, mandatory for administrative accounts       | Pending                  |
| Progressive lockout    | Escalating back-off after repeated failures, on top of rate limiting | Pending                  |

### How it works today

1. **Argon2id password hashing.** Sign-up hashes the password before persisting it;
   login uses `argon2.verify`, never a string comparison. When the email does not
   exist, the service still verifies against a **dummy hash** so the response time does
   not reveal whether the account exists.

2. **Mandatory JWT secrets, no fallback.** `src/config/env.ts` validates the
   environment with Zod and **aborts the boot** if any required variable is missing or
   invalid. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters
   and unique per environment — generate them with `openssl rand -hex 32`.

3. **Short-lived JWT + rotating refresh token with reuse detection.** A short access
   token (~15 min) plus a long-lived refresh token **rotated on every use**. The refresh
   token is **hashed server-side** (`refresh_tokens` table, never in plain text) and
   belongs to a **family** (`family_id`): if an already-rotated refresh token is
   presented again, that is evidence of a leak and **the whole family is revoked**.
   Logging out revokes the family as well.

4. **Single-use password reset.** The reset token is opaque, stored hashed, expires
   (`RESET_TOKEN_TTL`) and is marked `used_at` on redemption. `forgotPassword` returns
   the same response whether or not the email exists.

---

## 3. Data encryption

| Layer          | Guideline                                                                                          | State                             |
| -------------- | -------------------------------------------------------------------------------------------------- | --------------------------------- |
| **In transit** | **TLS 1.2+** mandatory (HTTPS/HSTS); no plain HTTP traffic                                         | Pending — deployment-time control |
| **At rest**    | Volume/disk encryption on the database; column-level encryption for sensitive fields when relevant | Pending                           |
| **Secrets**    | Managed through environment variables and a vault (AWS Secrets Manager / SSM), never in the repo   | Partial — `.env` kept out of Git  |
| **Backups**    | Encrypted and periodically restore-tested                                                          | Pending                           |

- The public endpoint must not be served over HTTP by IP/port. Publish it behind a
  domain with TLS terminated at a load balancer or reverse proxy, with **HSTS** on
  (`helmet` already emits the header).
- `CORS` restricts origins: the API defaults to **deny** and only allows what
  `CORS_ORIGIN` lists. `*` is for local development only.

---

## 4. Application protection (API)

- **Input validation** on every route (Zod schemas through
  `fastify-type-provider-zod`), preventing injection and malformed data.
- **SQL injection prevention** through **Drizzle ORM** parameterised queries — raw SQL
  concatenation is avoided.
- **Rate limiting** globally (100 req/min) and tightened on authentication routes
  (10 req/min).
- **Security headers** via `@fastify/helmet`: `Content-Security-Policy`,
  `X-Content-Type-Options`, `Strict-Transport-Security`.
- **Row-Level Security.** The server connects as `wally_app`, a role **subject to RLS**,
  so tenant isolation is enforced by PostgreSQL itself and not only by application
  code. Migrations and the seed use a separate owner role.
- **Per-resource authorisation.** Beyond authenticating (who is this user?), every
  handler checks authorisation (may this user reach _this_ group/transaction?).
- **Idempotent writes.** Balance-changing requests carry an `Idempotency-Key` so
  network retries never double-apply.
- **Audit trail.** Every balance mutation writes an append-only `financial_events`
  record (actor, entity, before/after).
- **Logs without sensitive data.** Pino is configured with a `redact` list, so
  passwords, tokens and PII never reach the logs.

---

## 5. Privacy and LGPD

Wally handles personal and financial data and must comply with
**Brazilian Law 13.709/2018 (LGPD)**.

- **Legal basis and purpose.** Collect only what is necessary (minimisation), with an
  explicit purpose and consent where required.
- **Data subject rights.** Support access, correction, portability and **erasure**
  ("right to be forgotten"). The model already uses _soft delete_ (`deleted_at`);
  permanent deletion must be backed by a purge process.
- **Retention.** Define retention windows and a routine to purge expired data.
- **Processing records.** Keep the record of processing operations (art. 37).
- **Data Protection Officer (DPO)** and a data-subject contact channel, to be defined
  by the commercial operation.
- **Incident notification** to the ANPD and to data subjects as the law requires.

### Anonymisation and pseudonymisation for AI

Upcoming AI features (insights, automations) **must not** consume identifiable personal
data untreated:

- **Pseudonymisation** before processing: replace direct identifiers (name, email,
  phone) with tokens/hashes; prefer aggregates.
- **Anonymisation** for training/analytics: irreversibly strip PII whenever data leaves
  the transactional context.
- **Purpose segregation.** Data used for AI needs its own legal basis and must not
  recycle consent given for a different purpose.
- **No PII in prompts or telemetry** sent to external model providers.

---

## 6. Security in the development lifecycle (DevSecOps)

These checks are automated through GitHub Actions (see [docs/CICD.md](docs/CICD.md)):

- **SAST** with **CodeQL** (`security-and-quality` pack) on every push and Pull Request,
  plus a weekly scan.
- **Secret scanning** with **Gitleaks** over the full history, to keep secrets out.
- **Dependency analysis** through **Dependabot** (npm + GitHub Actions, weekly).
- **Lint, typecheck and tests** required before merge.

---

## 7. Reporting vulnerabilities

Found a vulnerability? **Do not open a public issue.**

- Send a private report through
  **[GitHub Security Advisories](../../security/advisories/new)** or to the security
  channel defined by the operation.
- Include reproduction steps, impact and, if possible, a proof of concept.
- We aim to acknowledge within **5 business days** and to coordinate a fix before any
  public disclosure (responsible disclosure).

---

## 8. Remediation backlog

- [ ] **P0** Serve the API over **HTTPS/TLS** only; remove HTTP/IP endpoints.
- [ ] **P1** Progressive lockout after repeated authentication failures.
- [ ] **P2** MFA/2FA (TOTP) — mandatory for administrative accounts.
- [ ] **P2** Encryption at rest and an encrypted backup policy.
- [ ] **P2** LGPD purge process and the anonymisation pipeline for AI.
