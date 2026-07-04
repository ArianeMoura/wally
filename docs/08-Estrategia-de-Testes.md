# Estratégia de Testes

A qualidade do Wally é garantida por uma estratégia de testes automatizados,
integrada à CI, complementada por validação manual de usabilidade. Este documento
define os níveis de teste, as metas e a integração com os pipelines.

## Pirâmide de testes

```
        ▲  E2E (poucos, fluxos críticos ponta a ponta)
       ─── Integração (API + banco; contratos entre camadas)
      ─────  Unitários (muitos, rápidos; use-cases e regras)
```

| Nível | Escopo | Ferramenta |
|---|---|---|
| **Unitário** | Casos de uso e regras de negócio isoladas | Vitest/Jest (backend); jest-expo (mobile) |
| **Integração** | Rotas da API contra banco de teste; view models × API | Fastify inject + Testcontainers/DB de teste |
| **E2E** | Fluxos críticos no app (login, transação, divisão em grupo) | Detox/Maestro (mobile) |

## Estado atual e metas

- **Estado atual:** cobertura mínima — há um teste de snapshot no mobile
  (`components/__tests__/ThemedText-test.tsx`) e **nenhum** teste no back-end. Não
  há runner de teste instalado no back-end.
- **Metas (backlog):**
  - Adicionar runner ao back-end (Vitest/Jest) e cobrir os use-cases de `auth`,
    `transactions`, `groups`, `groupExpenses` e `settlements`.
  - Testes de integração para as rotas da API (Fastify `inject` + Testcontainers).
  - Elevar a cobertura de forma incremental; medir cobertura na CI e não permitir
    regressão.

### Gates de cobertura (Wally 2.0)

Cobertura é um *gate* bloqueante na CI (RNF-013), com piso reforçado onde o risco é
financeiro:

| Escopo | Piso de cobertura |
|---|---|
| Global (backend + mobile) | ~70% linhas |
| Use-cases financeiros (`transactions`, `groupExpenses`, `settlements`, `budgets`) | ~90% linhas |

### Teste de concorrência (obrigatório)

Os casos extremos de [12-Especificacao-Tecnica.md](12-Especificacao-Tecnica.md) exigem
testes específicos, além dos unitários/integração:

- **Divisão/liquidação concorrente:** disparar N requisições paralelas de
  `split`/`settle` no mesmo grupo e assertar a invariante `Σ saldos == 0` e ausência
  de *lost update* (valida o `FOR UPDATE`/transação — RNF-007/008).
- **Idempotência:** reenviar a mesma requisição com o mesmo `Idempotency-Key` e
  assertar **um único** efeito (RNF-009).
- **Arredondamento:** dividir valores não exatos (ex.: 1000 centavos / 3) e assertar
  `Σ expense_shares == amount_cents` (RNF-010).

## Casos de teste funcionais (referência)

Os fluxos abaixo servem de base para automação e verificação manual:

| ID | Requisito | Objetivo |
|---|---|---|
| CT-01 | RF-001 | Autenticar com e-mail e senha |
| CT-02 | RF-002 | Enviar link e redefinir senha |
| CT-03 | RF-003 | Registrar novo usuário |
| CT-04 | RF-004 | Editar perfil (nome, foto, senha) |
| CT-05 | RF-005 | Adicionar receita/despesa |
| CT-06 | RF-006 | Exibir extrato completo |
| CT-07 | RF-007 | Filtrar transações |
| CT-08 | RF-008 | Calcular saldo, receitas e despesas |
| CT-09 | RF-009 | Selecionar mês/ano |
| CT-10 | RF-010 | Criar grupo |
| CT-11 | RF-011 | Adicionar despesa ao grupo com divisão |
| CT-12 | RF-012 | Calcular saldo por participante |
| CT-13 | RF-013 | Exibir histórico do grupo |
| CT-14 | RF-014 | Adicionar membros |
| CT-15 | RF-015 | Listar grupos |
| CT-16 | RF-016 | Exibir tela inicial |
| CT-17 | RF-017 | Categorizar transação (sugestão automática + edição) |
| CT-18 | RF-018 | Acertar contas no grupo e recalcular saldos |
| CT-19 | RF-019 | Alertar ao estourar orçamento por categoria |
| CT-20 | RF-020 | Registrar evento financeiro em mutação de saldo |
| CT-21 | RF-021 | Gerar insight de IA sobre dados anonimizados (com consentimento) |

## Testes de usabilidade

Além dos testes automatizados, o Wally realiza avaliações de usabilidade com
usuários reais para medir eficiência, satisfação e taxa de sucesso por tarefa
(base: SUS — *System Usability Scale*). **Todos os dados coletados em avaliações de
usabilidade são tratados de forma anônima**, em conformidade com a LGPD (ver
[SECURITY.md](../SECURITY.md)).

Roteiro típico:

- **Seleção de participantes** representando os perfis do público-alvo.
- **Tarefas** cobrindo os fluxos principais (cadastro, registro de transação,
  criação de grupo, divisão de despesa).
- **Métricas** de tempo por tarefa, taxa de conclusão, erros e satisfação.

## Integração com a CI

Os testes de unidade e integração rodam automaticamente a cada Pull Request
(ver [09-CICD.md](09-CICD.md)). Um PR só é integrado com a suíte verde.
