# Design de Interface

A interface do Wally foi projetada para oferecer uma experiência intuitiva e
eficiente na gestão financeira pessoal e em grupo, priorizando usabilidade, clareza
e acessibilidade. As diretrizes de qualidade seguem a norma **ISO/IEC 25010**
(ver [10-Qualidade-e-Observabilidade.md](10-Qualidade-e-Observabilidade.md)).

> **Protótipo interativo:** [Wally no Figma](https://www.figma.com/proto/MiuZNsY107HDiJqKnMdyIm/Projeto-Wally?page-id=0%3A1&node-id=1-14&starting-point-node-id=1%3A14)

## User Flow

![User Flow do Wally](https://github.com/user-attachments/assets/613c3a40-5d50-4cab-b758-9e3ebc6d2960)

## Diagrama de fluxo

![Fluxograma do Wally](https://github.com/user-attachments/assets/0317ce81-dbef-4f85-80f3-790c1e2beeda)

## Wireframes

### Tela Inicial
Ponto de partida do app: apresenta a proposta e conduz o usuário ao cadastro ou login.

<div align="center"><img width="320" alt="Tela Inicial" src="https://github.com/user-attachments/assets/24126883-7ced-4881-81d2-bb1444c52a54" /></div>

### Login
Acesso à conta com e-mail e senha, com atalho para recuperação de senha.

<div align="center"><img width="320" alt="Login" src="https://github.com/user-attachments/assets/74b28720-dc3e-440a-833e-26a0d6347ba1" /></div>

### Recuperação de Senha
Envio de link de redefinição a partir do e-mail cadastrado.

<div align="center"><img width="320" alt="Recuperação de Senha" src="https://github.com/user-attachments/assets/fb6bd812-2c76-4505-95ed-b27eb5d6ad34" /></div>

### Cadastro
Criação de conta com nome, e-mail e senha (telefone opcional).

<div align="center"><img width="320" alt="Cadastro" src="https://github.com/user-attachments/assets/a5197bc0-16b5-4f4b-89b5-45a6dac4d7a8" /></div>

### Dashboard (Wallet)
Visão geral da carteira: saldo, extrato, adição de transações, filtros e gráficos.

<div align="center"><img width="320" alt="Dashboard" src="https://github.com/user-attachments/assets/9a12aa25-9497-429e-887d-d4ea9905312c" /></div>

### Adicionar Receita / Despesa
Registro de entradas e saídas com valor, data e descrição; o saldo é atualizado
automaticamente.

<div align="center">
<img width="240" alt="Adicionar Receita" src="https://github.com/user-attachments/assets/48630eb8-0145-4410-93f1-84d48d2f1961" />
<img width="240" alt="Adicionar Despesa" src="https://github.com/user-attachments/assets/07d4313f-332e-4e77-84cf-468cba13adf1" />
</div>

### Grupos
Lista dos grupos do usuário e criação de novos grupos para despesas compartilhadas.

<div align="center"><img width="320" alt="Grupos" src="https://github.com/user-attachments/assets/5eec7a21-1b46-49d0-9ac8-b65bda87b63f" /></div>

### Criação de Grupo e Adicionar Membros
Definição de nome, tipo, foto e participantes; inclusão de membros por busca.

<div align="center">
<img width="240" alt="Criar Grupo" src="https://github.com/user-attachments/assets/ceada2ea-9d9b-425e-9ebe-ce355ddefb51" />
<img width="240" alt="Adicionar Membros" src="https://github.com/user-attachments/assets/09e0bd50-7e7a-4d2f-ba75-cdc6388de599" />
</div>

### Tela do Grupo e Adicionar Despesa
Gestão do grupo: extrato, registro de despesas, quitação e configurações; a divisão
é calculada automaticamente entre os participantes.

<div align="center">
<img width="240" alt="Tela do Grupo" src="https://github.com/user-attachments/assets/79b18f2e-e4c8-4436-87b7-17684fb54145" />
<img width="240" alt="Adicionar Despesa do Grupo" src="https://github.com/user-attachments/assets/40f2a8a6-1130-4594-afe4-5f3348741c8b" />
</div>

### Perfil
Gestão de informações pessoais, preferências da conta e exclusão de conta.

<div align="center"><img width="320" alt="Perfil" src="https://github.com/user-attachments/assets/681d22ec-b494-444f-b852-cb0eeaeb58da" /></div>
