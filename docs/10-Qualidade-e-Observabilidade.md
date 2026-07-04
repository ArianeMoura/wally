# Qualidade e Observabilidade

A qualidade do Wally é orientada pela norma **ISO/IEC 25010** e sustentada por
métricas mensuráveis e por observabilidade em produção. Este documento define as
características de qualidade priorizadas, as métricas de acompanhamento e a
estratégia de monitoramento.

## Características de qualidade (ISO/IEC 25010)

| Característica | Subcaracterísticas priorizadas | Aplicação no Wally |
|---|---|---|
| **Adequação funcional** | Completude, correção | Cálculos financeiros exatos; requisitos atendidos |
| **Segurança** | Confidencialidade, integridade, autenticidade | Ver [SECURITY.md](../SECURITY.md) |
| **Confiabilidade** | Maturidade, disponibilidade, tolerância a falhas | Alta disponibilidade e recuperação de falhas |
| **Usabilidade** | Apreensibilidade, operabilidade, acessibilidade | Interface intuitiva e acessível |
| **Eficiência de desempenho** | Tempo de resposta, uso de recursos | Respostas rápidas e app leve |
| **Manutenibilidade** | Modularidade, reusabilidade, analisabilidade | Arquitetura em camadas e MVVM ([05-Arquitetura.md](05-Arquitetura.md)) |
| **Portabilidade** | Adaptabilidade, instalabilidade | Android e iOS a partir de uma base única |

## Métricas de acompanhamento

| Métrica | O que mede |
|---|---|
| Satisfação do usuário (SUS) | Experiência percebida em testes de usabilidade |
| Taxa de erros/falhas | Frequência de falhas críticas reportadas |
| Tempo médio de resposta | Latência de telas e chamadas de API |
| MTBF / MTTR | Estabilidade e tempo de recuperação após falhas |
| Cobertura de testes | Proporção de código coberto por testes automatizados |
| Incidentes de segurança | Tentativas de acesso não autorizado e vulnerabilidades |
| Conformidade de acessibilidade | Aderência às diretrizes de acessibilidade |

## Observabilidade

Para operar como produto, o Wally deve instrumentar (backlog):

- **Logs estruturados** — o Fastify já expõe logger; padronizar formato JSON e
  correlação por request-id. **Nunca** registrar senha, token ou PII.
- **Métricas** — expor métricas de aplicação (latência, throughput, erros) para um
  coletor (ex.: Prometheus) e dashboards.
- **Rastreamento (tracing)** — propagar contexto entre app → API → banco para
  diagnosticar gargalos.
- **Alertas** — definir SLOs e alertar sobre erros e latência acima do limite.
- **Monitoramento de erros no cliente** — captura de exceções no app mobile.

## Padrões de codificação

- **TypeScript** em toda a base, com ESLint como guarda de estilo e qualidade.
- Regras de negócio isoladas em use-cases (back-end) e view models (mobile),
  facilitando testes e análise.
- Revisão de código obrigatória e CI verde antes do merge
  (ver [CONTRIBUTING.md](../CONTRIBUTING.md) e [09-CICD.md](09-CICD.md)).
