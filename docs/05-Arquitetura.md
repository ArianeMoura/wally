# Arquitetura

O Wally é composto por dois aplicativos independentes em **TypeScript**: um app
mobile (Expo/React Native) e uma API (Node.js/Fastify), com persistência em
**PostgreSQL**. A arquitetura prioriza **separação de responsabilidades**,
**testabilidade** e **escalabilidade**.

> **Wally 2.0 — produto em evolução.** O Wally passou de projeto acadêmico a
> produto pessoal, com **banco de dados novo**, API própria, hospedagem e evolução
> contínua. Aproveitando a janela do banco _greenfield_, a persistência migrou de
> TypeORM para **Drizzle ORM** (SQL-first) e o **schema/código/API nasceram em
> inglês** (documentação permanece em PT-BR — restrição 10 em
> [02-Especificacao.md](02-Especificacao.md)). Os casos de concorrência financeira
> e a fundação de IA estão detalhados em
> [12-Especificacao-Tecnica.md](12-Especificacao-Tecnica.md).

## Visão geral (C4 — nível de contêiner)

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   App Mobile         │  ───────────────────▶   │        API (Fastify)      │
│   Expo / RN (MVVM)   │  ◀───────────────────   │  Clean Architecture       │
└─────────────────────┘        JWT (Bearer)      └───────────┬──────────────┘
                                                             │ Drizzle ORM
                                                             ▼
                                                  ┌──────────────────────────┐
                                                  │      PostgreSQL           │
                                                  └──────────────────────────┘
```

## Princípios de projeto

O código adere aos princípios **SOLID** e a padrões consolidados:

- **Single Responsibility** — cada camada e classe tem uma responsabilidade única
  (controllers roteiam, use-cases decidem, repositórios acessam dados).
- **Dependency Inversion** — camadas externas dependem de abstrações; a regra de
  negócio não conhece detalhes de framework/HTTP.
- **Repository Pattern** — acesso a dados isolado atrás de repositórios.
- **Use Case / Interactor** — cada operação de negócio é um caso de uso explícito.
- **DTOs** — contratos de entrada/saída desacoplados das entidades de persistência.

## Back-end — Arquitetura em camadas (Clean Architecture)

Fluxo de uma requisição:

```
routes/ ─▶ controllers/ ─▶ use-cases/ ─▶ repositories/ ─▶ schema/ (Drizzle) ─▶ PostgreSQL
   │            │              │              │
   │            │              │              └─ acesso a dados isolado
   │            │              └─ REGRA DE NEGÓCIO (única fonte de decisão)
   │            └─ adapta HTTP ↔ caso de uso; sem regra de negócio
   └─ define endpoints, middleware de auth (JWT)
```

- **`routes/`** — declaração dos endpoints (`/api/v1/...`) e associação ao
  middleware de autenticação. Validação de entrada/saída via Zod
  (`fastify-type-provider-zod`).
- **`controllers/`** — traduzem a requisição HTTP em chamadas de use-case e
  formatam a resposta. Sem regra de negócio.
- **`use-cases/`** — o coração da aplicação, organizados por domínio (`auth`,
  `users`, `transactions`, `categories`, `groups`, `groupExpenses`, `settlements`,
  `budgets`). Cada caso de uso é uma unidade testável; os que alteram saldo rodam
  em transação (ver _Consistência transacional e concorrência_).
- **`repositories/`** — encapsulam o acesso a dados via **Drizzle ORM**.
- **`db/schema/`** — tabelas tipadas do Drizzle (fonte da verdade do schema).
- **`dtos/` (esquemas Zod)** — contratos de dados de entrada/saída, compartilháveis
  com o mobile.
- **`middleware.ts`** — autenticação via JWT (Bearer token) e checagem de RBAC.

Benefícios: a regra de negócio é independente de Fastify e de Drizzle, o que
facilita testes unitários dos use-cases e a evolução de infraestrutura sem tocar no
domínio.

## Mobile — Padrão MVVM

```
View (app/, components/) ─▶ ViewModel (viewModels/) ─▶ Store/API (store/, TanStack Query)
```

- **View** — telas (`app/`, roteamento file-based com expo-router) e componentes
  (`components/`), declarativas.
- **ViewModel** — lógica de apresentação (`useLoginViewModel`,
  `useWalletViewModel`, `useGruposViewModel`, ...), isolando as telas dos detalhes
  de estado e chamadas.
- **Estado local/sessão/UI** — `store/` com **Zustand** (sessão, tema, estado
  efêmero); o token é guardado com **expo-secure-store** (Keychain/Keystore).
- **Estado remoto (servidor)** — **TanStack Query v5** para cache, sincronização e
  estados de carregamento/erro. O cache é **persistido** (via
  `@tanstack/query-persist-client-core` sobre **react-native-mmkv**) para leitura
  _offline cache-first_; `onlineManager`/`focusManager` integram-se ao
  **NetInfo**. Mutações financeiras são **otimistas** (`onMutate` + _rollback_),
  reconciliando com o servidor por invalidação. Ver _Estratégia offline_.
- **Formulários** — **React Hook Form + Zod** (`@hookform/resolvers`), com o mesmo
  esquema Zod usado pela API (contratos ponta-a-ponta).
- **i18n** — textos externalizados com **i18next** (PT-BR padrão, pronto para EN).

## Modelo de dados

Diagramas (classes, ER e esquema relacional):

![Diagrama de Classes](https://github.com/user-attachments/assets/1fa1fc4c-37c0-47b6-a367-aa2106713611)

![Modelo Entidade-Relacionamento](https://github.com/user-attachments/assets/89748024-49b9-4ec0-9a31-7755a1d77b2a)

![Esquema Relacional](https://github.com/user-attachments/assets/df6e22bc-06a5-4170-aeee-da422e4e660d)

> Os diagramas acima refletem o schema legado (PT-BR). O **schema do Wally 2.0**
> abaixo é o vigente: nomes em inglês, banco novo, sem migração de dados legados.

Schema do Wally 2.0 — chaves primárias em **UUID**, _soft delete_ (`deleted_at`),
timestamps e valores monetários em **inteiros de centavos** (`amount_cents`):

| Tabela             | Papel              | Campos-chave                                                                               |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------ |
| `users`            | contas             | `id, name, email (unique), password_hash, avatar_url`                                      |
| `categories`       | RF-017             | `id, user_id?, name, icon, color, kind (income \| expense)`                                |
| `transactions`     | finanças pessoais  | `id, user_id, category_id, type, amount_cents, description, occurred_at`                   |
| `groups`           | grupos             | `id, name, owner_id` — **agregado travado em divisão/liquidação**                          |
| `group_members`    | membros            | `id, group_id, user_id, role` · `unique(group_id, user_id)`                                |
| `group_expenses`   | despesas de grupo  | `id, group_id, payer_id, amount_cents, category_id, description`                           |
| `expense_shares`   | cotas da divisão   | `id, group_expense_id, user_id, share_cents` · invariante `Σ share_cents == amount_cents`  |
| `settlements`      | RF-018 (settle up) | `id, group_id, from_user_id, to_user_id, amount_cents, settled_at`                         |
| `budgets`          | RF-019             | `id, user_id, category_id, period, limit_cents`                                            |
| `financial_events` | RF-020 (event log) | `id, actor_id, entity_type, entity_id, event_type, before jsonb, after jsonb, occurred_at` |
| `refresh_tokens`   | RNF-011            | `id, user_id, token_hash, family_id, expires_at, revoked_at`                               |
| `idempotency_keys` | RNF-009            | `key (pk), user_id, request_hash, response jsonb, created_at`                              |

**Fonte única de verdade:** as **migrations do drizzle-kit** (`db/migrations/`),
geradas a partir do schema tipado em `db/schema/`. Não há mais `banco.sql` de
referência. A coluna `password_hash` é dimensionada para hashes **Argon2id** (≥ 255).

## Consistência transacional e concorrência

Operações que alteram saldo (RF-011/012/018) são o ponto crítico de correção
financeira. O padrão obrigatório: **uma única transação** que trava o agregado do
grupo, relê o estado, aplica a mutação, recalcula os saldos e grava o
`financial_event` — tudo ou nada (RNF-007/008).

```ts
await db.transaction(async (tx) => {
  const group = await tx
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .for('update') // bloqueio pessimista do agregado
  // relê saldos → aplica mutação → recalcula (Σ saldos == 0) → grava financial_event
}) // commit atômico
```

Alternativa para baixa contenção: coluna `version` (concorrência otimista) + _retry_
em conflito. Escritas usam `Idempotency-Key` (RNF-009) para tolerar _retries_ de
rede sem duplicar. Detalhes e casos extremos em
[12-Especificacao-Tecnica.md](12-Especificacao-Tecnica.md).

## Estratégia offline

Segue a melhor prática de mercado (restrição 08), **não** offline-first pleno com
fila de escrita — inadequado para um livro-razão de grupo compartilhado:

- **Leitura:** _cache-first_ com o cache do TanStack Query persistido no
  **react-native-mmkv**; dados já sincronizados ficam disponíveis offline.
- **Escrita:** exige conexão, porém com **UI otimista** (aplica localmente, envia,
  faz _rollback_ se o servidor recusar). O **servidor é a autoridade** sobre saldos
  de grupo; a reconciliação ocorre por invalidação/refetch ao reconectar.

## Fluxo de interação

1. O usuário interage com o app mobile (consultas, registro de transações).
2. A View aciona a ViewModel, que chama a API via TanStack Query.
3. A API autentica (JWT), executa o caso de uso e acessa o PostgreSQL via Drizzle ORM.
4. A resposta retorna ao app, que atualiza a interface de forma reativa.

![Fluxo de interação](https://github.com/user-attachments/assets/b79e5a70-9259-4bfd-ba69-af17519786ef)

## Stack tecnológica

| Camada | Tecnologias                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile | React Native, Expo, expo-router, Zustand, TanStack Query v5 (+ persist/MMKV), NetInfo, React Hook Form + Zod, React Native Paper, i18next, expo-secure-store |
| API    | Node.js, Fastify, Drizzle ORM (+ drizzle-kit), Zod (`fastify-type-provider-zod`), `@fastify/jwt` / `helmet` / `rate-limit`, JWT, Swagger (OpenAPI)           |
| Dados  | PostgreSQL 16                                                                                                                                                |
| Infra  | Docker + docker-compose (com Postgres); deploy sob HTTPS/TLS+HSTS (ver [09-CICD.md](09-CICD.md) e [SECURITY.md](../SECURITY.md))                             |

## Segurança e qualidade

Diretrizes de segurança (hashing, TLS, JWT/MFA, LGPD) estão em
[SECURITY.md](../SECURITY.md). Métricas de qualidade (ISO/IEC 25010) e
observabilidade estão em [10-Qualidade-e-Observabilidade.md](10-Qualidade-e-Observabilidade.md).
