# Wally — API Backend

API do Wally construída com **Node.js + Fastify + TypeORM + PostgreSQL** em
**TypeScript**, seguindo uma **arquitetura em camadas** (Clean Architecture):
`controller → use-case → repositório → entity`.

---

## Pré-requisitos

- **Node.js 20+** e **npm**
- **PostgreSQL** acessível (local, Docker ou gerenciado)
- **Docker** (opcional, para empacotar a API)

---

## Configuração

```bash
cp .env.example .env      # preencha as variáveis abaixo
npm install
npm run dev               # API em http://localhost:3333/wally
```

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NODE_ENV` | Ambiente (`development`, `production`) |
| `JWT_SECRET` | Segredo de assinatura do JWT — **obrigatório**, sem valor padrão |
| `ORIGIN_URL` | Origem permitida para CORS (evitar `*` fora de desenvolvimento) |
| `POSTGRESQL_HOST` | Host do PostgreSQL |
| `POSTGRESQL_PORT` | Porta do PostgreSQL |
| `POSTGRESQL_USER` | Usuário do banco |
| `POSTGRESQL_PASSWORD` | Senha do banco |
| `POSTGRESQL_DATABASE` | Nome do banco |

> **Atenção (backlog de segurança):** hoje o código lê `JWT_SECRET`, mas o
> `.env.example` define `API_SECRET` — os nomes precisam ser unificados e o
> fallback inseguro removido. Detalhes em [SECURITY.md](../SECURITY.md).

---

## Migrations e banco

O schema é gerido por **migrations do TypeORM** (fonte única de verdade):

```bash
npm run typeorm migration:run       # aplica as migrations
npm run typeorm migration:generate  # gera nova migration a partir das entities
```

O arquivo [`../src/bd/banco.sql`](../src/bd/banco.sql) é um **snapshot** do schema
para consulta/prototipagem — não deve divergir das migrations.

---

## Documentação da API (Swagger)

Com a API no ar, a documentação interativa fica em:

```
/wally/documentation
```

Autenticação por **JWT (Bearer token)** — envie `Authorization: Bearer <token>`.

---

## Estrutura

```
src/
  app.ts            # bootstrap do Fastify (Swagger, CORS, rotas)
  data-source.ts    # conexão TypeORM (migrations, synchronize: false)
  middleware.ts     # autenticação JWT
  routes/           # definição de rotas por domínio
  controllers/      # entrada HTTP; delega para use-cases
  use-cases/        # regra de negócio (auth, grupos, transacoes, ...)
  repositorios/     # acesso a dados (TypeORM)
  entity/           # entidades/tabelas
  migration/        # migrations versionadas
dtos/               # contratos de entrada/saída
```

---

## Docker

```bash
docker compose up --build   # sobe a API (porta 3333)
```

> O `docker-compose.yml` atual **não** provê um container de PostgreSQL — a API
> espera um banco externo via variáveis `POSTGRESQL_*`. Para desenvolvimento local
> completo, considere adicionar um serviço `db` (backlog de DX).

---

## Scripts

```bash
npm run dev      # desenvolvimento (tsx watch)
npm start        # execução (ts-node)
npm run build    # build (babel → dist/)
```
