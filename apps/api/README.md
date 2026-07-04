# Wally — API Backend (Wally 2.0)

API do Wally construída com **Node.js + Fastify + Drizzle ORM + PostgreSQL** em
**TypeScript**, seguindo uma **arquitetura em camadas** (Clean Architecture):
`controller → use-case → repository → schema (Drizzle)`.

> **Idioma (restrição 10):** código, schema e API em **inglês**; documentação em
> **PT-BR**. Ver [../docs/05-Arquitetura.md](../docs/05-Arquitetura.md) e
> [../docs/12-Especificacao-Tecnica.md](../docs/12-Especificacao-Tecnica.md).

---

## Pré-requisitos

- **Node.js 20+** e **npm**
- **Docker** (para subir o PostgreSQL local via `docker-compose`)

---

## Configuração

```bash
cp .env.example .env          # preencha os segredos (ver abaixo)
docker compose up -d db       # sobe o PostgreSQL em localhost:5432
npm install
npm run db:migrate            # aplica as migrations
npm run dev                   # API em http://localhost:3333
```

Gere os segredos JWT com `openssl rand -hex 32`.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `HOST` / `PORT` | Bind da API (padrão `0.0.0.0:3333`) |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `JWT_ACCESS_SECRET` | Segredo do *access token* (≥ 32 chars) — **obrigatório** |
| `JWT_REFRESH_SECRET` | Segredo do *refresh token* (≥ 32 chars) — **obrigatório** |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | Validade dos tokens (`15m`, `30d`) |
| `CORS_ORIGIN` | Origem(ns) permitida(s); `*` apenas em desenvolvimento |

> A configuração é validada no boot com **fail-fast** ([`src/config/env.ts`](src/config/env.ts)):
> a API aborta se qualquer variável obrigatória faltar. Sem fallback inseguro.

---

## Migrations e banco

Schema gerido por **Drizzle ORM**; as migrations do **drizzle-kit** são a fonte da
verdade ([`src/db/schema/`](src/db/schema/) → [`src/db/migrations/`](src/db/migrations/)).

```bash
npm run db:generate        # gera migration a partir do schema tipado
npm run db:migrate         # aplica as migrations pendentes
npm run db:migrate:check   # valida consistência das migrations (CI)
npm run db:studio          # explorador visual do banco
```

---

## Documentação da API (Swagger)

Com a API no ar: `/wally/documentation` (OpenAPI gerado a partir dos esquemas Zod).

---

## Estrutura

```
src/
  config/           # env (fail-fast) e logger (pino)
  db/
    schema/         # tabelas Drizzle (fonte da verdade)
    migrations/     # migrations geradas pelo drizzle-kit
    client.ts       # pool pg + cliente Drizzle
  http/routes/      # rotas Fastify (ex.: health)
  app.ts            # buildApp() — plugins, Zod, Swagger (sem listen)
  server.ts         # bootstrap: carrega env, sobe o servidor, graceful shutdown
```

> **Código legado (backlog de migração).** As pastas `controllers/`, `entity/`,
> `repositorios/`, `use-cases/`, `routes/`, `migration/` e `data-source.ts` são da
> versão TypeORM anterior. Estão **excluídas do build** (`tsconfig.json`) e serão
> reimplementadas em inglês nas fases F1–F7, sendo removidas à medida que cada
> domínio for migrado.

---

## Scripts

```bash
npm run dev         # desenvolvimento (tsx watch)
npm start           # execução (node dist/server.js)
npm run build       # build (tsc → dist/)
npm run typecheck   # tsc --noEmit (any proibido)
npm test            # testes (vitest)
npm run lint        # ESLint
```

---

## Docker

```bash
docker compose up --build   # sobe PostgreSQL (db) + API (app) na porta 3333
```
