# Mapa de Funcionalidades

Relaciona cada tela do app aos requisitos funcionais e aos artefatos de código que
os implementam. Os caminhos são relativos à raiz do repositório.

## Telas × Requisitos × Código

| Tela                            | Requisito                      | Artefato (mobile)                                                                                                              |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Tela Inicial                    | RF-016                         | [`wally/app/index.tsx`](../wally/app/index.tsx)                                                                                |
| Login                           | RF-001                         | [`wally/app/(auth)/login.tsx`](../wally/app/%28auth%29/login.tsx)                                                              |
| Recuperação de Senha            | RF-002                         | [`wally/app/(auth)/recuperarsenha.tsx`](../wally/app/%28auth%29/recuperarsenha.tsx)                                            |
| Cadastro                        | RF-003                         | [`wally/app/(auth)/cadastro.tsx`](../wally/app/%28auth%29/cadastro.tsx)                                                        |
| Dashboard (Wallet)              | RF-006, RF-007, RF-008, RF-009 | [`wally/app/(tabs)/index.tsx`](../wally/app/%28tabs%29/index.tsx) + componentes em [`wally/components/`](../wally/components/) |
| Adicionar Receita/Despesa       | RF-005                         | [`wally/components/AddTransactionDialog.tsx`](../wally/components/AddTransactionDialog.tsx)                                    |
| Grupos (lista)                  | RF-015                         | [`wally/app/(tabs)/grupos.tsx`](../wally/app/%28tabs%29/grupos.tsx)                                                            |
| Criar Grupo / Adicionar Membros | RF-010, RF-014                 | [`wally/app/criar-grupo.tsx`](../wally/app/criar-grupo.tsx)                                                                    |
| Tela do Grupo                   | RF-012, RF-013                 | [`wally/app/grupo.tsx`](../wally/app/grupo.tsx)                                                                                |
| Adicionar Despesa do Grupo      | RF-011                         | [`wally/app/add-despesa.tsx`](../wally/app/add-despesa.tsx)                                                                    |
| Perfil                          | RF-004                         | [`wally/app/(tabs)/perfil.tsx`](../wally/app/%28tabs%29/perfil.tsx)                                                            |

## Componentes reutilizáveis (Dashboard)

`Header`, `ActionButtons`, `BalanceCard`, `DatePickerModal`, `EmptyState`,
`MonthSelector`, `TransactionDatePicker`, `TransactionItem`, `TransactionList` — em
[`wally/components/`](../wally/components/). Tipos em
[`wally/app/types.ts`](../wally/app/types.ts).

## Back-end

Cada funcionalidade é atendida por um caso de uso no back-end, organizado por
domínio em [`wally-backend/src/use-cases/`](../wally-backend/src/use-cases/):

| Domínio         | Casos de uso                                                         |
| --------------- | -------------------------------------------------------------------- |
| `auth`          | SignUp, SignIn, ForgotPassword, ResetPassword                        |
| `usuarios`      | CriarUsuario                                                         |
| `transacoes`    | CriarTransacaoUsuario, GetTransacoesUsuario, DeletarTransacaoUsuario |
| `grupos`        | CreateGrupo, GetGruposByUsuarioId, DeleteGrupo                       |
| `despesasGrupo` | CriarDespesaGrupo, GetDespesasGrupo                                  |
| `status`        | GetUsuarioBalanco, GetGrupoBalanco                                   |

A documentação interativa da API (Swagger) está disponível em `/wally/documentation`
quando a API está em execução (ver [`../wally-backend/README.md`](../wally-backend/README.md)).
