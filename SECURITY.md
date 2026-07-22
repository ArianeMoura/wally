# Política de Segurança — Wally

O Wally processa dados financeiros e informações pessoais de seus usuários.
Segurança e privacidade são requisitos de primeira classe do produto, não uma
etapa posterior. Este documento define as diretrizes de segurança que o produto
deve seguir, o estado atual da implementação e o processo de reporte de
vulnerabilidades.

> **Nota de transparência.** Algumas diretrizes abaixo descrevem o **alvo**
> (o que o produto deve garantir) e estão sinalizadas com o estado atual:
> **Implementado** · **Parcial** · **Pendente** (backlog). Não afirmamos ter
> controles que ainda não existem.

---

## 1. Princípios

- **Segurança por padrão e por design (Security by Design & by Default).**
- **Menor privilégio.** Cada componente e credencial recebe apenas o acesso
  estritamente necessário.
- **Defesa em profundidade.** Múltiplas camadas de proteção (rede, aplicação,
  dados) em vez de um único ponto de controle.
- **Zero segredo no código.** Nenhuma credencial, token ou chave é versionada.
- **Privacidade desde a concepção (Privacy by Design).** Minimização e
  finalidade explícita na coleta de dados pessoais (LGPD).

---

## 2. Autenticação e Sessão

| Diretriz                 | Alvo                                                                   | Estado                         |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------ |
| Hashing de senha         | **Argon2id** (preferencial) ou **bcrypt** (custo ≥ 12)                 | Pendente                       |
| Verificação de login     | Comparação por hash com verificação em tempo constante                 | Pendente                       |
| Token de acesso          | JWT curto (15 min) + **refresh token** rotativo                        | Parcial — JWT 24h, sem refresh |
| Segredo de assinatura    | Variável obrigatória; falha no boot se ausente                         | Pendente — fallback inseguro   |
| MFA/2FA                  | TOTP opcional para o usuário e obrigatório para contas administrativas | Pendente                       |
| Proteção de força bruta  | Rate limiting + bloqueio progressivo no login e no reset               | Pendente                       |
| Reset de senha           | Token de uso único, com expiração curta, sem vazar existência de conta | Parcial — revisar              |
| Armazenamento no cliente | Token em `expo-secure-store` (Keychain/Keystore)                       | Implementado                   |

### Requisitos de implementação (backlog P0)

1. **Hashing de senha com Argon2id.** No cadastro, a senha deve ser transformada
   em hash antes de persistir. No login, usar a verificação da biblioteca
   (`verify`), nunca comparação de string.

   ```ts
   // Alvo — cadastro
   import argon2 from 'argon2'
   const senhaHash = await argon2.hash(senha, { type: argon2.argon2id })

   // Alvo — login
   const ok = await argon2.verify(usuario.senha, senhaInformada)
   ```

   > Estado atual: as senhas são gravadas em texto plano e o login compara
   > `senha === usuario.senha`. **Corrigir antes de qualquer exposição pública.**

2. **Segredo do JWT obrigatório e único por ambiente.** A aplicação deve abortar
   a inicialização se o segredo não estiver definido — sem valores padrão.

   ```ts
   const JWT_SECRET = process.env.JWT_SECRET
   if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')
   ```

   > Estado atual: o código usa `process.env.JWT_SECRET ?? 'secret'`, enquanto o
   > `.env.example` só define `API_SECRET`. Resultado: o segredo real **nunca é
   > carregado** e o fallback `'secret'` é sempre usado. Padronizar o nome da
   > variável e remover o fallback.

3. **JWT de curta duração + refresh token rotativo com detecção de reúso.**
   _Access token_ curto (~15 min) + _refresh token_ de longa duração **rotacionado a
   cada uso**. O refresh é **hasheado no servidor** (tabela `refresh_tokens`, nunca
   em texto claro) e pertence a uma **família** (`family_id`): se um refresh já
   usado/rotacionado for reapresentado, trata-se de indício de vazamento e **toda a
   família é revogada**. Reduz a janela de um token vazado e permite revogação de
   sessão.

4. **MFA/2FA (TOTP).** Segundo fator opcional para usuários e **obrigatório para
   contas administrativas**.

---

## 3. Criptografia de Dados

| Camada          | Diretriz                                                                                                      | Estado                         |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Em trânsito** | **TLS 1.2+** obrigatório (HTTPS/HSTS); nenhum tráfego em HTTP                                                 | Pendente — API exposta em HTTP |
| **Em repouso**  | Criptografia de volume/disco no banco; criptografia em nível de coluna para campos sensíveis quando aplicável | Pendente                       |
| **Segredos**    | Gestão via variáveis de ambiente e cofre (AWS Secrets Manager / SSM), nunca em repositório                    | Parcial — `.env` fora do git   |
| **Backups**     | Criptografados e testados periodicamente                                                                      | Pendente                       |

- O endpoint público não deve ser servido por IP/porta em HTTP. Publicar atrás de
  um domínio com TLS terminado em load balancer/reverse proxy e **HSTS** ativo.
- `CORS` deve restringir origens conhecidas. Estado atual: `origin: '*'` — ajustar
  para a lista de origens do produto.

---

## 4. Proteção da Aplicação (API)

- **Validação de entrada** em todas as rotas (esquemas Zod via
  `fastify-type-provider-zod`) para prevenir injeção e dados malformados.
- **Prevenção de SQL Injection** via consultas parametrizadas do **Drizzle ORM** —
  evitar concatenação de SQL cru.
- **Rate limiting** global e reforçado em rotas de autenticação.
- **Cabeçalhos de segurança** (`helmet`/equivalente): `Content-Security-Policy`,
  `X-Content-Type-Options`, `Strict-Transport-Security`.
- **Autorização por recurso.** Além de autenticar (quem é o usuário), verificar
  autorização (o usuário pode acessar _este_ grupo/transação?).
- **Logs sem dados sensíveis.** Nunca registrar senha, token ou PII em log.

---

## 5. Privacidade e LGPD

O Wally trata dados pessoais e financeiros e deve observar a
**Lei nº 13.709/2018 (LGPD)**.

- **Base legal e finalidade.** Coletar apenas os dados necessários (minimização),
  com finalidade explícita e consentimento quando exigido.
- **Direitos do titular.** Suportar acesso, correção, portabilidade e
  **eliminação** ("direito ao esquecimento"). O modelo já usa _soft delete_
  (`data_exclusao`); a exclusão definitiva deve ser suportada por processo de
  expurgo.
- **Retenção.** Definir prazos de retenção e rotina de expurgo de dados expirados.
- **Registro de tratamento.** Manter o registro das operações de tratamento de
  dados (art. 37).
- **Encarregado (DPO)** e canal de contato do titular a definir na operação
  comercial.
- **Notificação de incidentes** à ANPD e aos titulares conforme a lei.

### Anonimização e pseudonimização para IA

As futuras funcionalidades de IA (insights, automações) **não devem** consumir
dados pessoais identificáveis sem tratamento:

- **Pseudonimização** antes do processamento: substituir identificadores diretos
  (nome, e-mail, telefone) por tokens/hashes; agregações preferencialmente.
- **Anonimização** para treino/analytics: remover PII de forma irreversível
  quando o dado sair do contexto transacional.
- **Segregação de finalidade.** Dados usados para IA devem ter base legal própria
  e não reaproveitar consentimento de outra finalidade.
- **Sem PII em prompts/telemetria** de provedores externos de modelos.

---

## 6. Segurança no Ciclo de Desenvolvimento (DevSecOps)

Estas verificações são automatizadas via GitHub Actions (ver
[docs/09-CICD.md](docs/09-CICD.md)):

- **SAST** (Static Application Security Testing) com **CodeQL** a cada Pull Request.
- **Secret scanning** (GitHub Secret Scanning / Gitleaks) para impedir segredos no
  histórico.
- **Análise de dependências** (`npm audit` / Dependabot) para CVEs conhecidas.
- **Lint e testes** obrigatórios antes do merge.

---

## 7. Reporte de Vulnerabilidades

Encontrou uma vulnerabilidade? **Não abra uma issue pública.**

- Envie um relatório privado por **[GitHub Security Advisories](../../security/advisories/new)**
  ou para o canal de segurança definido pela operação (ex.: `security@wally.app`).
- Inclua passos de reprodução, impacto e, se possível, uma prova de conceito.
- Compromisso de resposta inicial em até **5 dias úteis** e correção coordenada
  antes de qualquer divulgação pública (_responsible disclosure_).

---

## 8. Checklist de Remediação Prioritária (backlog)

- [ ] **P0** Hashing de senha (Argon2id) no cadastro e verificação no login.
- [ ] **P0** `JWT_SECRET` obrigatório, sem fallback; padronizar nome da variável.
- [ ] **P0** Servir a API somente sob **HTTPS/TLS**; remover endpoints HTTP/IP.
- [ ] **P0** Remover quaisquer credenciais e segredos da documentação e do código.
- [ ] **P1** JWT curto + refresh token com rotação e revogação.
- [ ] **P1** Rate limiting e proteção de força bruta no login/reset.
- [ ] **P1** Restringir `CORS` a origens conhecidas; adicionar cabeçalhos de segurança.
- [ ] **P2** MFA/2FA (TOTP) — obrigatório para contas administrativas.
- [ ] **P2** Criptografia em repouso e política de backup criptografado.
- [ ] **P2** Processo de expurgo LGPD e pipeline de anonimização para IA.
