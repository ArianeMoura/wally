# Especificação

## Modelagem do processo de negócio

### Situação atual

O gerenciamento financeiro pessoal e de grupos é uma necessidade cotidiana. Muitas
pessoas ainda usam planilhas, anotações ou aplicativos fragmentados, o que gera:

- Falta de centralização das informações financeiras.
- Dificuldade na divisão de despesas em grupo.
- Baixa automação na categorização de despesas.
- Ausência de relatórios e análises intuitivas.

### Proposta

O Wally endereça esses pontos com registro simplificado de transações,
automação da divisão de gastos em grupo e relatórios para tomada de decisão.

**Processo 1 — Registro de despesas**

![Fluxograma do processo de registro](https://github.com/user-attachments/assets/8edd71e6-2c87-47d0-81da-f71c67b87d6a)

**Processo 2 — Divisão de despesas em grupo**

![Fluxograma da divisão em grupo](https://github.com/user-attachments/assets/366dac5d-b72e-417c-a98d-5e21b0c354a3)

## Indicadores de desempenho

| Indicador | Descrição | Objetivo |
|---|---|---|
| Usuários ativos | Usuários que acessam o app diariamente | Medir engajamento |
| Taxa de retenção | % de usuários que permanecem após um período | Avaliar fidelidade |
| Despesas em grupo criadas | Volume de despesas compartilhadas | Medir uso da gestão de grupos |
| Metas financeiras atingidas | % de metas alcançadas pelos usuários | Avaliar impacto financeiro |
| Taxa de erros/falhas | Erros ocorridos durante o uso | Monitorar estabilidade |
| Satisfação do usuário | % de avaliações positivas | Medir aceitação |

## Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | Login com e-mail e senha. | Alta |
| RF-002 | Recuperação de senha. | Alta |
| RF-003 | Cadastro com nome, e-mail e senha. | Alta |
| RF-004 | Edição de perfil (nome, foto, senha). | Média |
| RF-005 | Adicionar receitas e despesas (valor, data, nome). | Alta |
| RF-006 | Exibir extrato com todas as transações do usuário. | Alta |
| RF-007 | Filtrar transações por nome, valor ou tipo. | Alta |
| RF-008 | Calcular automaticamente saldo, receitas e despesas. | Alta |
| RF-009 | Selecionar mês e ano na tela inicial. | Alta |
| RF-010 | Criar grupos para divisão de despesas. | Alta |
| RF-011 | Adicionar despesas ao grupo com divisão entre participantes. | Alta |
| RF-012 | Calcular automaticamente o saldo de cada participante. | Alta |
| RF-013 | Exibir histórico de despesas do grupo. | Alta |
| RF-014 | Adicionar membros ao grupo. | Alta |
| RF-015 | Exibir a lista de grupos do usuário. | Alta |
| RF-016 | Exibir a tela inicial. | Alta |

> Nota de saneamento: o requisito "exibir a tela inicial" aparecia duplicado como
> RF-016 e RF-017 em versões anteriores da documentação. Foi consolidado em
> **RF-016**.

## Requisitos não funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-001 | Compatível com Android e iOS. | Alta |
| RNF-002 | Interface simples e intuitiva, seguindo boas práticas de UX/UI. | Alta |
| RNF-003 | Bom desempenho sob acesso concorrente de múltiplos usuários. | Alta |
| RNF-004 | Segurança conforme [SECURITY.md](../SECURITY.md): TLS em trânsito, hashing de senha (Argon2id/bcrypt), autenticação JWT e conformidade com a LGPD. | Alta |
| RNF-005 | Front-end em React Native e back-end em Node.js. | Alta |
| RNF-006 | Testado em dispositivos de baixo e alto desempenho. | Média |

## Restrições

| ID | Restrição |
|----|-----------|
| 01 | O front-end deve ser desenvolvido em React Native (Expo). |
| 02 | O back-end deve ser implementado em Node.js (Fastify). |
| 03 | O código deve seguir boas práticas e ser documentado. |
| 04 | O aplicativo deve estar em conformidade com a LGPD. |
| 05 | O aplicativo deve permitir visualização offline de dados já sincronizados, exigindo conexão para sincronização. |

## Diagrama de casos de uso

![Diagrama de Casos de Uso](https://github.com/user-attachments/assets/e5648d31-bdaf-470c-b64a-18f4d9e97e5a)

## Matriz de rastreabilidade

Relaciona os requisitos funcionais entre si e a artefatos do sistema, permitindo
acompanhar a cobertura de cada requisito.

| REQ | RF-001 | RF-002 | RF-003 | RF-004 | RF-005 | RF-006 | RF-007 | RF-008 | RF-009 | RF-010 | RF-011 | RF-012 | RF-013 | RF-014 | RF-015 | RF-016 |
|-----|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
| RF-001 | X | X | X | | | | | | | | | | | | | |
| RF-002 | X | X | | | | | | | | | | | | | | |
| RF-003 | X | | X | | | | | | | | | | | | | |
| RF-004 | | | | X | | | | | | | | | | | | |
| RF-005 | | | | | X | X | | | | | | | | | | |
| RF-006 | | | | | X | X | | | | | | | | | | |
| RF-007 | | | | | | | X | | | | | | | | | |
| RF-008 | | | | | | | X | X | | | | | | | | |
| RF-009 | | | | | | | | | X | | | | | | | |
| RF-010 | | | | | | | | | | X | | | | | | |
| RF-011 | | | | | | | | | | X | X | X | | | | |
| RF-012 | | | | | | | | | | | X | X | X | | | |
| RF-013 | | | | | | | | | | | X | X | X | | | |
| RF-014 | | | | | | | | | | | | | | X | X | |
| RF-015 | | | | | | | | | | | | | | X | X | |
| RF-016 | | | | | | | | | | | | | | | | X |

## Casos de uso × telas

O mapeamento detalhado entre requisitos, telas e artefatos de código está em
[07-Mapa-de-Funcionalidades.md](07-Mapa-de-Funcionalidades.md).
