# Guia de Contribuição — Wally

Obrigado por contribuir com o Wally. Este guia descreve o fluxo de trabalho, os
padrões de código e os critérios de qualidade que mantêm o produto consistente e
seguro. O planejamento é conduzido no **GitHub Projects**; o código, no fluxo de
Pull Requests descrito abaixo.

---

## 1. Estrutura do repositório

```
wally/            # App mobile (Expo / React Native + TypeScript)
wally-backend/    # API (Node.js / Fastify / Drizzle ORM / PostgreSQL)
docs/             # Documentação de produto e engenharia
```

> **Wally 2.0.** A persistência usa **Drizzle ORM**; o schema/migrations vivem em
> `wally-backend/src/db/`. Código, schema e API são em **inglês**; documentação em
> **PT-BR** (ver _Convenção de idioma_ abaixo).

Cada projeto (`wally/`, `wally-backend/`) tem seu próprio `package.json` e é
executado de forma independente.

---

## 2. Fluxo de trabalho (Git)

Adotamos um fluxo baseado em _trunk_ com branches de curta duração.

- **`main`** — sempre estável e implantável. Protegida: recebe código apenas via
  Pull Request aprovado e com CI verde.
- **`feat/*`, `fix/*`, `chore/*`, `docs/*`** — branches de trabalho, criadas a
  partir de `main` e integradas de volta por PR.

```bash
git switch -c feat/divisao-de-despesas
# ... commits ...
git push -u origin feat/divisao-de-despesas
# abrir Pull Request para main
```

> Não há branches datadas ou por "etapa/sprint". O acompanhamento de escopo e
> prioridade acontece no **GitHub Projects** (board, labels e milestones).

---

## 3. Convenção de commits

Usamos **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<tipo>(escopo opcional): descrição no imperativo

feat(grupos): calcular saldo por participante
fix(auth): retornar 401 ao token expirado
docs(security): adicionar diretrizes de LGPD
```

Tipos comuns: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.

---

## 4. Padrões de código

- **Convenção de idioma (restrição 10).** Identificadores de **código, schema de
  banco e API em inglês** (`users`, `groupExpenses`, `/api/v1/groups`);
  **documentação em PT-BR**; textos de UI externalizados via **i18n** (PT-BR
  padrão). Não misturar PT/EN em identificadores.
- **TypeScript** em todo o código; `any` é **proibido** (typecheck estrito na CI).
- **Back-end** — respeitar a arquitetura em camadas
  (`controller → use-case → repository → schema (Drizzle)`). Regra de negócio vive
  nos _use-cases_, nunca no controller. Toda mutação de saldo roda em transação com
  controle de concorrência. Ver [docs/05-Arquitetura.md](docs/05-Arquitetura.md) e
  [docs/12-Especificacao-Tecnica.md](docs/12-Especificacao-Tecnica.md).
- **Mobile** — respeitar o padrão MVVM (`view` em `app/` e `components/`,
  lógica em `viewModels/`, estado em `store/`).
- **Lint/format** — o código deve passar no ESLint antes do commit:

  ```bash
  cd wally-backend && npx eslint .
  cd wally && npm run lint
  ```

- **Segurança** — nunca versionar segredos; usar `.env` (ver `.env.example`).
  Toda entrada de rota deve ser validada. Ler [SECURITY.md](SECURITY.md).

---

## 5. Testes

- Novas regras de negócio exigem **testes unitários**; fluxos de API exigem
  **testes de integração**. Ver [docs/08-Estrategia-de-Testes.md](docs/08-Estrategia-de-Testes.md).
- Rode a suíte localmente antes de abrir o PR:

  ```bash
  cd wally && npm test
  # backend: adicionar runner de teste (Vitest/Jest) — ver backlog
  ```

---

## 6. Pull Request

Um PR só é integrado quando:

1. **CI está verde** — testes, lint, SAST (CodeQL) e secret scanning
   (ver [docs/09-CICD.md](docs/09-CICD.md)).
2. Tem **descrição clara** e vincula a issue/item do GitHub Projects.
3. Recebeu **pelo menos uma aprovação** em code review.
4. Não introduz segredos, credenciais ou dados pessoais reais.

### Checklist do autor

- [ ] O código segue a arquitetura da camada correspondente.
- [ ] Lint e testes passam localmente.
- [ ] Cobri as mudanças com testes quando aplicável.
- [ ] Atualizei a documentação afetada.
- [ ] Não há segredos, tokens ou PII no diff.

---

## 7. Definition of Done (DoD)

Um item é considerado concluído quando:

- Atende ao critério de aceite descrito na issue.
- Passou em code review e na CI.
- Está coberto por testes proporcionais ao risco.
- A documentação relevante foi atualizada.
- Não introduziu regressões de segurança conhecidas.

---

## 8. Reporte de segurança

Vulnerabilidades **não** devem ser abertas como issue pública. Siga o processo
descrito em [SECURITY.md](SECURITY.md).
