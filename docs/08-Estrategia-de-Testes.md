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
    `transacoes`, `grupos` e `status`.
  - Testes de integração para as rotas da API.
  - Elevar a cobertura de forma incremental; medir cobertura na CI e não permitir
    regressão.

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
