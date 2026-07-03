# Programação de Funcionalidades

## Instruções de Acesso

`🔗 Link de Acesso:`

**Documentação da API:** http://ec2-18-231-92-232.sa-east-1.compute.amazonaws.com:3333/wally/documentation

**API URL:** http://ec2-18-231-92-232.sa-east-1.compute.amazonaws.com:3333/wally

`🔐 Credenciais de Acesso (Administrador):`

**E-mail:** admin@email.com

**Senha:** wallyadm

## Artefatos Criados:

### Tela Inicial

`Artefato:`

[index.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/index.tsx)

**Requisito:**

RF-017 | O aplicativo deve exibir uma tela incial. 

### Tela de Login

`Artefato:`

[login.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(auth)/login.tsx)

**Requisito:**

RF-001 | O aplicativo deve permitir que os usuários realizem login com e-mail e senha.

### Tela de Recuperação de Senha

`Artefato:`

[recuperarsenha.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(auth)/recuperarsenha.tsx)

**Requisito:**

RF-002 | O aplicativo deve possibilitar a recuperação de senha.

### Tela de Cadastro

`Artefato:`

[cadastro.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(auth)/cadastro.tsx)

**Requisito:**

RF-003 | O aplicativo deve permitir que os usuários se cadastrem fornecendo nome, e-mail e senha.

### Dashboard Principal (Wallet)

`Artefatos:`

[index.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(tabs)/index.tsx)

[layout.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(tabs)/_layout.tsx)

`Componentes:`

[Header.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/Header.tsx)

[ActionButtons.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/ActionButtons.tsx)

[BalanceCard.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/BalanceCard.tsx)

[DatePickerModal.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/DatePickerModal.tsx)

[EmptyState.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/EmptyState.tsx)

[MonthSelector.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/MonthSelector.tsx)

[TransactionDatePicker.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/TransactionDatePicker.tsx)

[TransactionItem.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/TransactionItem.tsx)

[TransactionList.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/TransactionList.tsx)

`Types:`

[types.ts](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/types.ts)

**Requisitos:**

RF-006 | O aplicativo deve exibir um extrato financeiro com todas as transações do usuário.

RF-007 | O aplicativo deve permitir filtrar transações por nome, valor ou tipo de transação.

RF-009 | O aplicativo deve calcular automaticamene o saldo total, as receitas e as despesas do usuário. 

RF-010 | O aplicativo deve permitir que os usuários escolham o mês e ano na tela incial.

### Dialog - Adicionar Receitas Pessoais

`Artefato:`

[AddTransactionDialog.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/AddTransactionDialog.tsx)

**Requisito:**

RF-005 | O aplicativo deve permitir que os usuários adicionem receitas e despesas, informando valor, data e nome da transação.

### Dialog - Adicionar Despesas Pessoais

`Artefato:`

[AddTransactionDialog.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/components/AddTransactionDialog.tsx)

**Requisito:**

RF-005 | O aplicativo deve permitir que os usuários adicionem receitas e despesas, informando valor, data e nome da transação.

### Tela Grupos

`Artefato:`

[grupos.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(tabs)/grupos.tsx)

**Requisito:**

RF-016 | O aplicativo deve exibir uma tela com a lista de grupos do usuário.

### Tela de Criação de Grupo

`Artefato:`

[criar-grupo.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/criar-grupo.tsx)

**Requisito:**

RF-011 | O aplicativo deve permitir a criação de grupos para divisão de despesas. 

### Modal – Adicionar Membros

`Artefato:`

[criar-grupo.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/criar-grupo.tsx)

**Requisito:**

RF-015 | O aplicativo deve permitir que os usuários adicionem membros aos grupo. 

### Tela do Grupo

`Artefato:`

[grupo.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/grupo.tsx)

**Requisitos:**

RF-013 | O aplicativo deve calcular automaticamente o saldo de cada participante do grupo.

RF-014 | O aplicativo deve exibir um histórico de despesas do grupo.

### Tela de Adicionar Despesa do Grupo

`Artefato:`

[add-despesa.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/add-despesa.tsx)

**Requisito:**

RF-012 | O aplicativo deve permitir que os usuários adicionem despesas ao grupo, informando valor, nome da despesa e divisão entre participantes. 

### Tela de Perfil

`Artefato:`

[perfil.tsx](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/blob/main/wally/app/(tabs)/perfil.tsx)

**Requisito:**

RF-004 | O aplicativo deve permitir que os usuários editem seu perfil (nome, foto, senha).

### Banco de Dados e Back-End (Node.js):

`Artefato:`

[Back-end - Wally](https://github.com/ICEI-PUC-Minas-PMV-ADS/pmv-ads-2025-1-e3-proj-mov-t2-wally/tree/main/wally-backend)

