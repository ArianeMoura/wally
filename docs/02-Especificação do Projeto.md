# Especificação do Projeto

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

| Indicador                   | Descrição                                    | Objetivo                      |
| --------------------------- | -------------------------------------------- | ----------------------------- |
| Usuários ativos             | Usuários que acessam o app diariamente       | Medir engajamento             |
| Taxa de retenção            | % de usuários que permanecem após um período | Avaliar fidelidade            |
| Despesas em grupo criadas   | Volume de despesas compartilhadas            | Medir uso da gestão de grupos |
| Metas financeiras atingidas | % de metas alcançadas pelos usuários         | Avaliar impacto financeiro    |
| Taxa de erros/falhas        | Erros ocorridos durante o uso                | Monitorar estabilidade        |
| Satisfação do usuário       | % de avaliações positivas                    | Medir aceitação               |

## Requisitos funcionais

| ID     | Requisito                                                                                                                                                    | Prioridade      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| RF-001 | Login com e-mail e senha.                                                                                                                                    | Alta            |
| RF-002 | Recuperação de senha.                                                                                                                                        | Alta            |
| RF-003 | Cadastro com nome, e-mail e senha.                                                                                                                           | Alta            |
| RF-004 | Edição de perfil (nome, foto, senha).                                                                                                                        | Média           |
| RF-005 | Adicionar receitas e despesas (valor, data, nome).                                                                                                           | Alta            |
| RF-006 | Exibir extrato com todas as transações do usuário.                                                                                                           | Alta            |
| RF-007 | Filtrar transações por nome, valor ou tipo.                                                                                                                  | Alta            |
| RF-008 | Calcular automaticamente saldo, receitas e despesas.                                                                                                         | Alta            |
| RF-009 | Selecionar mês e ano na tela inicial.                                                                                                                        | Alta            |
| RF-010 | Criar grupos para divisão de despesas.                                                                                                                       | Alta            |
| RF-011 | Adicionar despesas ao grupo com divisão entre participantes.                                                                                                 | Alta            |
| RF-012 | Calcular automaticamente o saldo de cada participante.                                                                                                       | Alta            |
| RF-013 | Exibir histórico de despesas do grupo.                                                                                                                       | Alta            |
| RF-014 | Adicionar membros ao grupo.                                                                                                                                  | Alta            |
| RF-015 | Exibir a lista de grupos do usuário.                                                                                                                         | Alta            |
| RF-016 | Exibir a tela inicial.                                                                                                                                       | Alta            |
| RF-017 | Categorizar transações (`categories`): categoria com ícone/cor, com sugestão automática determinística a partir da descrição e edição pelo usuário.          | Alta            |
| RF-018 | Acertar contas no grupo — _settle up_ (`settlements`): registrar a liquidação de saldo entre membros e recalcular quem é devedor/credor.                     | Alta            |
| RF-019 | Definir orçamentos/metas por categoria (`budgets`) com alerta ao ultrapassar o teto do período.                                                              | Média           |
| RF-020 | Registrar trilha de auditoria financeira imutável (`financial_events`): toda mutação de saldo emite um evento (ator, tipo, estado anterior/posterior, data). | Média           |
| RF-021 | Gerar insights financeiros assistidos por IA (resumo mensal e detecção de gastos atípicos) sobre dados anonimizados e mediante consentimento explícito.      | Baixa (roadmap) |

> Nota de saneamento: o requisito "exibir a tela inicial" aparecia duplicado como
> RF-016 e RF-017 em versões anteriores da documentação. Foi consolidado em
> **RF-016**; o identificador **RF-017** foi reatribuído acima, no contexto do
> Wally 2.0 (ver [12-Especificacao-Tecnica.md](12-Especificacao-Tecnica.md)).

> **Nota de idioma (restrição 10).** Requisitos e documentação são redigidos em
> PT-BR; os identificadores de código, schema e API são em inglês. Os nomes entre
> parênteses acima (`categories`, `settlements`, …) referenciam as entidades do
> novo schema descrito em [05-Arquitetura.md](05-Arquitetura.md).

## Requisitos não funcionais

| ID      | Requisito                                                                                                                                                                              | Prioridade |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| RNF-001 | Compatível com Android e iOS.                                                                                                                                                          | Alta       |
| RNF-002 | Interface simples e intuitiva, seguindo boas práticas de UX/UI.                                                                                                                        | Alta       |
| RNF-003 | Bom desempenho sob acesso concorrente de múltiplos usuários.                                                                                                                           | Alta       |
| RNF-004 | Segurança conforme [SECURITY.md](../SECURITY.md): TLS em trânsito, hashing de senha (Argon2id/bcrypt), autenticação JWT e conformidade com a LGPD.                                     | Alta       |
| RNF-005 | Front-end em React Native e back-end em Node.js.                                                                                                                                       | Alta       |
| RNF-006 | Testado em dispositivos de baixo e alto desempenho.                                                                                                                                    | Média      |
| RNF-007 | Consistência transacional (ACID): toda operação que altera saldo executa em uma transação de banco atômica e isolada.                                                                  | Alta       |
| RNF-008 | Controle de concorrência: operações de divisão/liquidação usam bloqueio pessimista (`FOR UPDATE`) no agregado do grupo, ou versionamento otimista com _retry_, evitando _lost update_. | Alta       |
| RNF-009 | Idempotência: endpoints de escrita financeira aceitam `Idempotency-Key`; _retries_ de rede não geram registros duplicados.                                                             | Alta       |
| RNF-010 | Precisão monetária: valores em inteiros de centavos (`float` proibido); divisões usam distribuição por maior resto (soma das cotas == total).                                          | Alta       |
| RNF-011 | Autenticação moderna: Argon2id; _access token_ JWT curto (~15 min) + _refresh token_ rotativo hasheado no servidor com detecção de reúso; rate limiting em login/reset.                | Alta       |
| RNF-012 | Offline: leitura _cache-first_ com cache persistido + escrita online otimista com reconciliação _server-authoritative_.                                                                | Alta       |
| RNF-013 | Qualidade em CI como _gate_: lint + typecheck estrito + testes + build verdes obrigatórios para _merge_, com piso de cobertura reforçado nos use-cases financeiros.                    | Alta       |
| RNF-014 | Privacidade para IA: nenhum dado pessoal identificável trafega para serviços de IA sem anonimização/pseudonimização e consentimento explícito (LGPD).                                  | Alta       |
| RNF-015 | Observabilidade: logs estruturados (pino), métricas e tracing por correlação em toda requisição; SLOs de latência/erro.                                                                | Média      |
| RNF-016 | Internacionalização: textos de UI externalizados (`i18next`), PT-BR como padrão e prontos para inglês.                                                                                 | Média      |

## Restrições

| ID  | Restrição                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------- |
| 01  | O front-end deve ser desenvolvido em React Native (Expo).                                                                 |
| 02  | O back-end deve ser implementado em Node.js (Fastify).                                                                    |
| 03  | O código deve seguir boas práticas e ser documentado.                                                                     |
| 04  | O aplicativo deve estar em conformidade com a LGPD.                                                                       |
| 05  | O aplicativo deve permitir visualização offline de dados já sincronizados, exigindo conexão para sincronização.           |
| 06  | Valores monetários são representados como inteiros de centavos (ou `DECIMAL`); `float`/`double` é proibido para dinheiro. |
| 07  | Toda mutação de saldo ocorre dentro de uma transação de banco com isolamento adequado e controle de concorrência.         |
| 08  | O suporte offline segue _cache-first_ na leitura e escrita online otimista (refina e substitui o escopo da restrição 05). |
| 09  | Nenhum dado identificável é enviado a serviços de IA sem anonimização e consentimento explícito (LGPD).                   |
| 10  | Idioma: código, schema de banco e API em inglês; documentação em PT-BR; textos de UI via i18n.                            |

## Diagrama de casos de uso

![Diagrama de Casos de Uso](https://github.com/user-attachments/assets/e5648d31-bdaf-470c-b64a-18f4d9e97e5a)

## Matriz de rastreabilidade

Relaciona os requisitos funcionais entre si e a artefatos do sistema, permitindo
acompanhar a cobertura de cada requisito.

| REQ    | RF-001 | RF-002 | RF-003 | RF-004 | RF-005 | RF-006 | RF-007 | RF-008 | RF-009 | RF-010 | RF-011 | RF-012 | RF-013 | RF-014 | RF-015 | RF-016 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| RF-001 | X      | X      | X      |        |        |        |        |        |        |        |        |        |        |        |        |        |
| RF-002 | X      | X      |        |        |        |        |        |        |        |        |        |        |        |        |        |        |
| RF-003 | X      |        | X      |        |        |        |        |        |        |        |        |        |        |        |        |        |
| RF-004 |        |        |        | X      |        |        |        |        |        |        |        |        |        |        |        |        |
| RF-005 |        |        |        |        | X      | X      |        |        |        |        |        |        |        |        |        |        |
| RF-006 |        |        |        |        | X      | X      |        |        |        |        |        |        |        |        |        |        |
| RF-007 |        |        |        |        |        |        | X      |        |        |        |        |        |        |        |        |        |
| RF-008 |        |        |        |        |        |        | X      | X      |        |        |        |        |        |        |        |        |
| RF-009 |        |        |        |        |        |        |        |        | X      |        |        |        |        |        |        |        |
| RF-010 |        |        |        |        |        |        |        |        |        | X      |        |        |        |        |        |        |
| RF-011 |        |        |        |        |        |        |        |        |        | X      | X      | X      |        |        |        |        |
| RF-012 |        |        |        |        |        |        |        |        |        |        | X      | X      | X      |        |        |        |
| RF-013 |        |        |        |        |        |        |        |        |        |        | X      | X      | X      |        |        |        |
| RF-014 |        |        |        |        |        |        |        |        |        |        |        |        |        | X      | X      |        |
| RF-015 |        |        |        |        |        |        |        |        |        |        |        |        |        | X      | X      |        |
| RF-016 |        |        |        |        |        |        |        |        |        |        |        |        |        |        |        | X      |

### Rastreabilidade dos requisitos do Wally 2.0 (RF-017…021)

Para manter a matriz legível, as relações dos novos requisitos são descritas em
lista (a matriz completa é expandida na implementação):

| Requisito           | Relaciona-se com               | Racional                                                                       |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| RF-017 (categorias) | RF-005, RF-011                 | Categoriza transações pessoais e despesas de grupo; base para RF-019 e RF-021. |
| RF-018 (settle up)  | RF-011, RF-012, RF-013         | Liquida os saldos calculados na divisão e alimenta o histórico do grupo.       |
| RF-019 (orçamentos) | RF-017, RF-008                 | Consome categorias e o cálculo de saldo para alertar estouro.                  |
| RF-020 (event log)  | RF-005, RF-011, RF-012, RF-018 | Registra toda mutação de saldo (pessoal e de grupo).                           |
| RF-021 (IA)         | RF-017, RF-020                 | Insights derivam de transações categorizadas e do event log anonimizado.       |

## Casos de uso × telas

O mapeamento detalhado entre requisitos, telas e artefatos de código está em
[07-Mapa-de-Funcionalidades.md](07-Mapa-de-Funcionalidades.md).
