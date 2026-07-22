# Especificação Técnica — Wally 2.0

Este documento consolida o **escopo técnico transversal** do Wally 2.0: os padrões
de correção sob concorrência financeira e a fundação de dados para o roadmap de
Inteligência Artificial. Complementa a [Especificação](02-Especificacao.md) (RFs,
RNFs e restrições) e a [Arquitetura](05-Arquitetura.md) (stack e schema).

> **Convenção de idioma (restrição 10).** Prosa em PT-BR; identificadores de código,
> schema e API em inglês. Nomes como `group_expenses` referem-se ao schema em
> [05-Arquitetura.md](05-Arquitetura.md).

---

## 1. Princípios de correção financeira

1. **Dinheiro é inteiro** (RNF-010). Todo valor é `amount_cents` (inteiro de
   centavos). `float`/`double` é proibido — evita erro de ponto flutuante em somas e
   divisões.
2. **Toda mutação de saldo é transacional** (RNF-007). Nunca em múltiplas escritas
   soltas; ou tudo é aplicado, ou nada.
3. **O servidor é a autoridade.** O cliente é otimista, mas o saldo de grupo é
   sempre reconciliado contra o servidor (restrição 08).
4. **Escrita idempotente** (RNF-009). Um mesmo `Idempotency-Key` produz no máximo um
   efeito, independentemente de _retries_.
5. **Invariantes verificadas antes do commit.** Ex.: `Σ expense_shares == amount` e
   `Σ saldos do grupo == 0`.

---

## 2. Casos extremos de concorrência (obrigatórios)

Três cenários críticos que a arquitetura **deve** resolver, com a defesa e a
invariante de cada um.

### 2.1 Despesa duplicada por _double-submit_ / _retry_ de rede

**Cenário.** O usuário toca "adicionar despesa" duas vezes, ou o cliente refaz um
`POST` cuja resposta expirou por timeout — resultando em duas linhas em
`group_expenses` e saldo inflado.

**Defesa.**

- Cliente gera um **`Idempotency-Key`** (UUID) por intenção de escrita e o reenvia
  em _retries_ (RNF-009).
- O servidor persiste a chave em `idempotency_keys` com _unique constraint_; a
  segunda chegada **retorna a resposta original** em vez de reprocessar.
- UI otimista aplica localmente e faz _rollback_ se o servidor recusar.

**Invariante.** Uma intenção de escrita ⇒ no máximo um `group_expense`.

### 2.2 Divisão/liquidação concorrente no mesmo saldo (_lost update_)

**Cenário.** Dois membros adicionam despesas e/ou acertam contas (`settle up`) no
mesmo grupo simultaneamente. Ambos leem o saldo antigo e gravam por cima → totais
inconsistentes (a última escrita "vence" e perde a outra).

**Defesa.**

- Uma única **transação** (RNF-007) que aplica **bloqueio pessimista**
  `SELECT … FOR UPDATE` no agregado `groups` (RNF-008), serializando as operações
  concorrentes sobre aquele grupo.
- Os saldos são **relidos e recalculados dentro da transação**, nunca a partir de um
  valor lido antes dela.
- Alternativa de baixa contenção: coluna `version` (concorrência otimista) + _retry_
  no conflito.

**Invariante.** Após cada transação, `Σ saldos do grupo == 0` (o que uns devem, os
outros têm a receber).

### 2.3 Resto de arredondamento em divisão não exata

**Cenário.** R$ 10,00 divididos por 3 = R$ 3,3333…. Arredondamento ingênuo faz a
soma das cotas dar R$ 9,99 ou R$ 10,01 — some/cria um centavo. Liquidações parciais
concorrentes agravam o desvio.

**Defesa.**

- Trabalhar em **centavos inteiros** (RNF-010): 1000 centavos / 3.
- Distribuir o resto por **maior resto** (_largest remainder_): as cotas base são
  `floor`, e o(s) centavo(s) residual(is) vão para os participantes de forma
  determinística (ordem estável), de modo que a soma feche exatamente.
- A verificação `Σ expense_shares == amount_cents` roda **dentro da transação**,
  antes do commit.

**Invariante.** `Σ expense_shares == group_expenses.amount_cents` (exato, sempre).

### 2.4 (Bônus) Membro removido durante criação de despesa

Um membro é removido/soft-deleted (`group_members.deleted_at`) enquanto uma despesa
que o referencia está sendo criada. **Defesa:** reler a associação de _membership_
sob a mesma trava (`FOR UPDATE`) da transação 2.2; se o membro não estiver mais
ativo, a operação é rejeitada de forma consistente (não parcial).

---

## 3. Fundação para Inteligência Artificial

O roadmap prevê insights por IA (RF-021). A estratégia é **fundação de dados
primeiro, LLM depois** — garantindo privacidade (LGPD) desde a concepção.

### 3.1 Categorização (RF-017) — dado rotulado

`categories` fornece o rótulo estruturado que dá sentido a transações e despesas.
A sugestão inicial é **determinística** (regras sobre a descrição), editável pelo
usuário. Esse histórico rotulado é o insumo de qualidade para qualquer modelo
futuro — sem categorização, não há insight confiável.

### 3.2 Event log (RF-020) — histórico imutável

`financial_events` registra cada mutação de saldo como evento imutável
(`actor_id, entity_type, entity_id, event_type, before, after, occurred_at`). Serve
a três propósitos: **auditoria/rastreabilidade LGPD**, **observabilidade** e
**fonte temporal** para detecção de padrões/anomalias pela IA.

### 3.3 Camada de anonimização e consentimento (RNF-014)

Barreira obrigatória antes de qualquer processamento por IA:

- **Consentimento explícito** do usuário (opt-in), revogável, registrado.
- **Anonimização/pseudonimização**: remover/pseudonimizar PII (nome, e-mail,
  identificadores) antes de enviar dados a qualquer serviço de IA.
- **Minimização**: enviar apenas o necessário (ex.: valores agregados e categorias,
  não descrições livres com dados sensíveis).

### 3.4 Insight por LLM (RF-021) — roadmap

Com a fundação pronta, os insights (resumo mensal, detecção de gasto atípico) podem
ser gerados por um LLM (ex.: **Claude API**) consumindo **exclusivamente** dados que
passaram pela camada da seção 3.3. A escolha do provedor é um detalhe substituível
atrás dessa fronteira, não um acoplamento do domínio.

---

## 4. Rastreabilidade

| Tema                | Requisitos/Restrições                                 |
| ------------------- | ----------------------------------------------------- |
| Correção financeira | RNF-007, RNF-008, RNF-009, RNF-010; restrições 06, 07 |
| Offline             | RNF-012; restrições 05, 08                            |
| Fundação de IA      | RF-017, RF-020, RF-021, RNF-014; restrição 09         |
| Idioma              | Restrição 10                                          |

Ver também: [02-Especificacao.md](02-Especificacao.md),
[05-Arquitetura.md](05-Arquitetura.md), [SECURITY.md](../SECURITY.md),
[08-Estrategia-de-Testes.md](08-Estrategia-de-Testes.md).
