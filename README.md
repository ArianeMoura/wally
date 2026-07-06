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

Dois aplicativos independentes, ambos em **TypeScript**:

| Camada | Stack | Padrão |
|---|---|---|
| **Mobile** — `wally/` | Expo, React Native, expo-router, Zustand, TanStack Query (+ persist/MMKV), React Hook Form + Zod, i18next | MVVM |
| **API** — `wally-backend/` | Node.js, Fastify, Drizzle ORM, PostgreSQL, Zod, JWT, Swagger | Arquitetura em camadas (Clean Architecture) |
| **Infraestrutura** | Docker, PostgreSQL | Migrations versionadas (drizzle-kit) |

> **Wally 2.0.** Produto em evolução com banco novo: persistência em **Drizzle ORM**
> e **código/schema/API em inglês** (docs em PT-BR). Ver
> [docs/12-Especificacao-Tecnica.md](docs/12-Especificacao-Tecnica.md).

Detalhes em [docs/05-Arquitetura.md](docs/05-Arquitetura.md).

## Começando

Pré-requisitos: **Node.js 20+**, **npm**, **Docker** (opcional, para o banco) e o
app **Expo Go** ou um emulador Android/iOS.

```bash
# 1. Backend (API)
cd wally-backend
cp .env.example .env         # preencha as variáveis (banco, segredo do JWT)
npm install
npm run dev                  # sobe a API em http://localhost:3333/wally

# 2. Mobile
cd ../wally
cp .env.example .env         # defina API_URL apontando para a API
npm install
npx expo start               # abra no Expo Go ou emulador
```

A documentação da API (Swagger) fica em `/wally/documentation` com a API no ar.
Guias completos: [`wally/README.md`](wally/README.md) e
[`wally-backend/README.md`](wally-backend/README.md).

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
