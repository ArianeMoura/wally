# Arquitetura

O Wally é composto por dois aplicativos independentes em **TypeScript**: um app
mobile (Expo/React Native) e uma API (Node.js/Fastify), com persistência em
**PostgreSQL**. A arquitetura prioriza **separação de responsabilidades**,
**testabilidade** e **escalabilidade**.

## Visão geral (C4 — nível de contêiner)

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   App Mobile         │  ───────────────────▶   │        API (Fastify)      │
│   Expo / RN (MVVM)   │  ◀───────────────────   │  Clean Architecture       │
└─────────────────────┘        JWT (Bearer)      └───────────┬──────────────┘
                                                             │ TypeORM
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
routes/ ─▶ controllers/ ─▶ use-cases/ ─▶ repositorios/ ─▶ entity/ (TypeORM) ─▶ PostgreSQL
   │            │              │              │
   │            │              │              └─ acesso a dados isolado
   │            │              └─ REGRA DE NEGÓCIO (única fonte de decisão)
   │            └─ adapta HTTP ↔ caso de uso; sem regra de negócio
   └─ define endpoints, middleware de auth (JWT)
```

- **`routes/`** — declaração dos endpoints e associação ao middleware de
  autenticação.
- **`controllers/`** — traduzem a requisição HTTP em chamadas de use-case e
  formatam a resposta. Sem regra de negócio.
- **`use-cases/`** — o coração da aplicação, organizados por domínio (`auth`,
  `grupos`, `transacoes`, `despesasGrupo`, `status`, `usuarios`). Cada caso de uso
  é uma unidade testável.
- **`repositorios/`** — encapsulam o acesso a dados via TypeORM.
- **`entity/`** — entidades mapeadas para tabelas.
- **`dtos/`** — contratos de dados de entrada/saída.
- **`middleware.ts`** — autenticação via JWT (Bearer token).

Benefícios: a regra de negócio é independente de Fastify e de TypeORM, o que
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
- **Estado e sessão** — `store/` com **Zustand**; o token é guardado com
  **expo-secure-store** (Keychain/Keystore).
- **Dados remotos** — **TanStack Query** para cache, sincronização e estados de
  carregamento/erro.

## Modelo de dados

Diagramas (classes, ER e esquema relacional):

![Diagrama de Classes](https://github.com/user-attachments/assets/1fa1fc4c-37c0-47b6-a367-aa2106713611)

![Modelo Entidade-Relacionamento](https://github.com/user-attachments/assets/89748024-49b9-4ec0-9a31-7755a1d77b2a)

![Esquema Relacional](https://github.com/user-attachments/assets/df6e22bc-06a5-4170-aeee-da422e4e660d)

Entidades principais: `usuarios`, `transacoes`, `grupos`, `grupos_membros`,
`despesas_grupo`, `pagamentos_despesa`. Chaves primárias em **UUID**, exclusão via
*soft delete* (`data_exclusao`) e integridade referencial com `ON DELETE CASCADE`.

**Fonte única de verdade:** as **migrations do TypeORM** (`src/migration/`). O
arquivo [`src/bd/banco.sql`](../src/bd/banco.sql) é um snapshot de consulta e não
deve divergir das migrations.

> **Inconsistência a corrigir (backlog):** a coluna `senha` está como
> `VARCHAR(100)` no `banco.sql` e `varchar(255)` na entidade. Com a adoção de hash
> **Argon2id** (ver [SECURITY.md](../SECURITY.md)), a coluna precisa de **≥ 255**
> caracteres; padronizar em ambos.

## Fluxo de interação

1. O usuário interage com o app mobile (consultas, registro de transações).
2. A View aciona a ViewModel, que chama a API via TanStack Query.
3. A API autentica (JWT), executa o caso de uso e acessa o PostgreSQL via TypeORM.
4. A resposta retorna ao app, que atualiza a interface de forma reativa.

![Fluxo de interação](https://github.com/user-attachments/assets/b79e5a70-9259-4bfd-ba69-af17519786ef)

## Stack tecnológica

| Camada | Tecnologias |
|---|---|
| Mobile | React Native, Expo, expo-router, Zustand, TanStack Query, React Hook Form, React Native Paper |
| API | Node.js, Fastify, TypeORM, JWT, Swagger (OpenAPI) |
| Dados | PostgreSQL |
| Infra | Docker; deploy sob HTTPS/TLS (ver [09-CICD.md](09-CICD.md) e [SECURITY.md](../SECURITY.md)) |

## Segurança e qualidade

Diretrizes de segurança (hashing, TLS, JWT/MFA, LGPD) estão em
[SECURITY.md](../SECURITY.md). Métricas de qualidade (ISO/IEC 25010) e
observabilidade estão em [10-Qualidade-e-Observabilidade.md](10-Qualidade-e-Observabilidade.md).
