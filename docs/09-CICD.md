# CI/CD e Automação (GitHub Actions)

O Wally adota uma cultura de automação baseada em **GitHub Actions**. Toda alteração
de código passa por verificação automática antes da integração, e as entregas são
empacotadas por pipelines reproduzíveis. Este documento descreve os pipelines
previstos e fornece os workflows de referência.

> Estado atual: o repositório **ainda não possui** `.github/workflows/`. Os
> workflows abaixo são o desenho-alvo a ser implementado (backlog P1).

## Visão geral dos pipelines

| Gatilho | Pipeline | Objetivo |
|---|---|---|
| Pull Request → `main` | **CI** | Lint, testes (unit + integração), build de verificação |
| Pull Request → `main` | **SAST (CodeQL)** | Análise estática de segurança |
| Pull Request / push | **Secret Scanning (Gitleaks)** | Impedir segredos no histórico |
| Agendado / PR | **Dependências (Dependabot / npm audit)** | Detectar CVEs |
| Push em `main` / tag | **Build Mobile (EAS)** | Gerar artefatos do app |
| Push em `main` | **Build & Push da imagem da API** | Empacotar a API (Docker) |

Recomenda-se proteger a branch `main` exigindo: CI verde, revisão aprovada e
ausência de segredos detectados.

## Workflow de referência — CI (lint + testes)

`.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: wally_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    defaults:
      run:
        working-directory: wally-backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: wally-backend/package-lock.json }
      - run: npm ci
      - run: npx eslint .
      - run: npm test --if-present
      - run: npm run build

  mobile:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: wally
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: wally/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci --watchAll=false
```

## Workflow de referência — SAST (CodeQL)

`.github/workflows/codeql.yml`

```yaml
name: CodeQL
on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 3 * * 1'   # varredura semanal

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: javascript-typescript }
      - uses: github/codeql-action/analyze@v3
```

## Workflow de referência — Secret Scanning (Gitleaks)

`.github/workflows/secret-scan.yml`

```yaml
name: Secret Scan
on: [pull_request, push]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

> Habilitar também o **GitHub Secret Scanning** e o **Dependabot** nas
> configurações do repositório para cobertura nativa.

## Workflow de referência — Build do app mobile (EAS)

`.github/workflows/build-mobile.yml`

```yaml
name: Build Mobile
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: wally
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: wally/package-lock.json }
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive --no-wait
```

## Workflow de referência — Imagem da API (Docker)

`.github/workflows/build-api.yml`

```yaml
name: Build API Image
on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v6
        with:
          context: ./wally-backend
          push: false   # defina true + login no registry quando houver ambiente
          tags: wally-backend:latest
```

## Gestão de segredos

- Segredos (tokens, chaves) ficam em **GitHub Actions Secrets** / **Environments**,
  nunca no código ou nos workflows em texto claro.
- Variáveis de ambiente de execução seguem os `.env.example` de cada projeto e, em
  produção, um cofre gerenciado (ex.: AWS Secrets Manager). Ver [SECURITY.md](../SECURITY.md).

## Próximos passos (backlog)

- [ ] Criar `.github/workflows/` com os pipelines acima.
- [ ] Adicionar runner de testes ao back-end para habilitar `npm test`.
- [ ] Proteger `main` (required checks: CI, CodeQL, Gitleaks + review).
- [ ] Adicionar `PULL_REQUEST_TEMPLATE.md` e `ISSUE_TEMPLATE/` em `.github/`.
