<div align="center">

<img width="186" height="186" alt="wally-icon-mint" src="https://github.com/user-attachments/assets/b0ccdbbf-0646-41c6-927d-c934f9474eaa" />

<!-- Badges de CI serão adicionados quando os workflows forem implementados (ver docs/09-CICD.md)
![CI](https://img.shields.io/badge/CI-pending-lightgrey)
![CodeQL](https://img.shields.io/badge/CodeQL-pending-lightgrey)
-->

</div>

## Sobre

O Wally atua em duas frentes complementares:

- **Gestão pessoal** — registro e categorização de receitas e despesas em tempo
  real, com acompanhamento inteligente de saldo.
- **Gestão de grupos** — divisão de despesas compartilhadas com foco em
  transparência e praticidade para amigos, familiares e colegas.

## Funcionalidades

| Área | Recursos |
|---|---|
| **Finanças pessoais** | Receitas e despesas com valor, data e descrição; cálculo automático de saldo; extrato com filtro por nome, valor e tipo; seleção de período (mês/ano). |
| **Grupos** | Criação e gestão de grupos; despesas com divisão automática entre participantes; saldo individual (devedor/credor); histórico de despesas. |
| **Conta** | Autenticação com e-mail e senha; recuperação de acesso; edição de perfil. |

## Arquitetura e stack

Monorepo **pnpm + Turborepo**, todo em **TypeScript**:

| Camada | Stack | Padrão |
|---|---|---|
| **Mobile** — [`apps/mobile/`](apps/mobile/) | Expo, React Native, expo-router, Zustand, TanStack Query (+ persist/MMKV), React Hook Form + Zod, i18next | MVVM |
| **API** — [`apps/api/`](apps/api/) | Node.js, Fastify, Drizzle ORM, PostgreSQL, Zod, JWT, Swagger | Arquitetura em camadas (Clean Architecture) |
| **Compartilhado** — [`packages/`](packages/) | `@wally/core` (regras de domínio), `@wally/contracts` (esquemas Zod), `@wally/config` | Consumidos via `workspace:*`, direto do fonte |
| **Infraestrutura** | Docker, PostgreSQL | Migrations versionadas (drizzle-kit) |

> **Wally 2.0.** Produto em evolução com banco novo: persistência em **Drizzle ORM**
> e **código/schema/API em inglês** (docs em PT-BR). Ver
> [docs/12-Especificacao-Tecnica.md](docs/12-Especificacao-Tecnica.md).

Detalhes em [docs/05-Arquitetura.md](docs/05-Arquitetura.md).

## Começando

Pré-requisitos: **Node.js 20+**, **pnpm 9** (`corepack enable`), **Docker** (para o
banco) e o app **Expo Go** ou um emulador Android/iOS.

```bash
# 1. Dependências (na raiz — instala todos os workspaces)
pnpm install

# 2. Banco + API
cd apps/api
cp .env.example .env          # gere os segredos JWT com: openssl rand -hex 32
docker compose up -d db       # PostgreSQL em localhost:5432
pnpm db:migrate               # cria o schema, as políticas de RLS e o papel wally_app
pnpm db:seed                  # 15 categorias padrão — necessário para a suíte de testes
cd ../.. && pnpm dev          # API em http://localhost:3333

# 3. Mobile (outro terminal)
cd apps/mobile
cp .env.example .env          # EXPO_PUBLIC_API_URL apontando para a API
pnpm start                    # abra no Expo Go ou emulador
```

`pnpm dev` na raiz sobe apenas a API — o app mobile é iniciado com `pnpm start`
dentro de [`apps/mobile/`](apps/mobile/).

> Se a porta 5432 já estiver ocupada na sua máquina, crie um
> `apps/api/docker-compose.override.yml` (ignorado pelo Git) com
> `services: { db: { ports: !override ["5433:5432"] } }` e ajuste a porta em
> `DATABASE_URL`/`APP_DATABASE_URL` no `.env`. A tag `!override` é necessária:
> sem ela o Compose concatena as listas e tenta publicar a 5432 também.

A documentação da API (Swagger) fica em `/wally/documentation` com a API no ar;
as rotas ficam sob `/api/v1`. Guias completos:
[`apps/mobile/README.md`](apps/mobile/README.md) e
[`apps/api/README.md`](apps/api/README.md).

## Documentação

| # | Documento | Conteúdo |
|---|---|---|
| — | [Visão geral](docs/README.md) | Índice e mapa dos documentos |
| 01 | [Contexto](docs/01-Contexto.md) | Problema, objetivos, público-alvo |
| 02 | [Especificação](docs/02-Especificacao.md) | Requisitos, casos de uso, rastreabilidade |
| 03 | [Processo de Desenvolvimento](docs/03-Processo-de-Desenvolvimento.md) | Git flow, GitHub Projects, DoD |
| 04 | [Design de Interface](docs/04-Design-de-Interface.md) | User flow e wireframes |
| 05 | [Arquitetura](docs/05-Arquitetura.md) | Camadas, SOLID, MVVM, modelo de dados |
| 06 | [Design System](docs/06-Design-System.md) | Identidade visual e tokens |
| 07 | [Mapa de Funcionalidades](docs/07-Mapa-de-Funcionalidades.md) | Telas, requisitos e código |
| 08 | [Estratégia de Testes](docs/08-Estrategia-de-Testes.md) | Pirâmide de testes e automação |
| 09 | [CI/CD](docs/09-CICD.md) | Pipelines GitHub Actions |
| 10 | [Qualidade e Observabilidade](docs/10-Qualidade-e-Observabilidade.md) | ISO/IEC 25010, métricas, monitoramento |
| 11 | [Referências](docs/11-Referencias.md) | Fontes citadas |
| 12 | [Especificação Técnica](docs/12-Especificacao-Tecnica.md) | Concorrência financeira, edge cases e fundação de IA |

**Governança:** [CONTRIBUTING.md](CONTRIBUTING.md) ·
[SECURITY.md](SECURITY.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## Roadmap

Planejamento e priorização são conduzidos no **GitHub Projects**. Direções em
avaliação:

- Insights e automações financeiras com **IA**, com anonimização de dados
  (ver [SECURITY.md](SECURITY.md)).
- Dashboard web responsivo.
- Notificações e chat nos grupos.
- Educação financeira, metas e gamificação.

## Contribuindo

Leia o [Guia de Contribuição](CONTRIBUTING.md) antes de abrir um Pull Request.
Toda contribuição passa por CI (testes, lint, SAST) e code review.
