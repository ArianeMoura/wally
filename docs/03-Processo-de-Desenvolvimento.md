# Processo de Desenvolvimento

Este documento descreve como o trabalho é organizado, versionado e integrado. O
planejamento é dinâmico e conduzido no **GitHub Projects** — não há cronogramas
estáticos, datas fixas ou sprints datadas.

## Planejamento no GitHub Projects

O backlog e a priorização vivem em um board do **GitHub Projects**, integrado a
issues e Pull Requests.

- **Issues** descrevem trabalho (bug, feature, melhoria, dívida técnica) com
  critério de aceite.
- **Labels** categorizam: `bug`, `feature`, `enhancement`, `documentation`,
  `security`, `tech-debt`.
- **Milestones** agrupam entregas por objetivo de produto (não por data acadêmica).
- O board acompanha o fluxo por colunas: **Backlog → To Do → In Progress →
  In Review → Done**.

Cada issue é vinculada aos Pull Requests que a implementam, garantindo
rastreabilidade entre planejamento e código.

## Controle de versão (Git flow)

Fluxo baseado em _trunk_ com branches de curta duração:

- **`main`** — sempre estável e implantável; protegida por revisão + CI verde.
- **`feat/*`, `fix/*`, `chore/*`, `docs/*`** — branches de trabalho a partir de
  `main`, integradas por Pull Request.

Commits seguem **Conventional Commits**. Detalhes de fluxo, PR e Definition of Done
em [CONTRIBUTING.md](../CONTRIBUTING.md).

## Qualidade contínua (CI/CD)

Toda alteração passa por automação no GitHub Actions antes do merge:

- Testes unitários e de integração.
- Lint e formatação (ESLint).
- Análise estática de segurança (SAST/CodeQL) e _secret scanning_.
- Build do app mobile e da imagem da API.

O desenho completo dos pipelines está em [09-CICD.md](09-CICD.md).

## Ambientes de trabalho

| Finalidade             | Ferramenta                                  |
| ---------------------- | ------------------------------------------- |
| Código e versionamento | Git + GitHub                                |
| Planejamento           | GitHub Projects (board, issues, milestones) |
| Design e prototipação  | Figma                                       |
| Documentação da API    | Swagger (OpenAPI)                           |
| Banco de dados         | PostgreSQL                                  |

## Ferramentas de desenvolvimento

- **GitHub** — versionamento, revisão de código, automação (Actions) e
  planejamento (Projects).
- **Node.js / Fastify** — back-end.
- **React Native / Expo** — app mobile.
- **TypeScript** — linguagem única em toda a base.
- **Docker** — empacotamento da API.
- **Figma** — interfaces, wireframes e protótipos.

## Definition of Done

Um item só é concluído quando atende ao critério de aceite, passa em code review e
CI, está coberto por testes proporcionais ao risco e teve a documentação relevante
atualizada — conforme [CONTRIBUTING.md](../CONTRIBUTING.md).
