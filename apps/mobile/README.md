# Wally — App Mobile

Aplicativo mobile do Wally para gestão financeira pessoal e de grupos, construído
com **Expo / React Native** e **TypeScript**, seguindo o padrão **MVVM**.

---

## Pré-requisitos

- **Node.js 20+** e **pnpm 9** (`corepack enable`)
- **Expo Go** no smartphone **ou** um emulador Android (AVD) / simulador iOS (Xcode)
- Uma instância da API do Wally em execução (ver [`../wally-backend`](../wally-backend/README.md))

---

## Configuração

```bash
# na pasta apps/mobile/
pnpm install -w          # dependências de todo o monorepo (pode rodar daqui)
cp .env.example .env     # defina EXPO_PUBLIC_API_URL apontando para a sua API
pnpm start
```

Variáveis de ambiente:

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | Host base da API do Wally, **sem** o prefixo de rota — o cliente acrescenta `/api/v1`. Ex.: `http://localhost:3333` em desenvolvimento ou `https://api.seu-dominio` em produção. |

> Em dispositivo físico com Expo Go, `localhost` aponta para o próprio aparelho.
> Use o IP da sua máquina na LAN (ex.: `http://192.168.0.10:3333`).

> Nunca versione o arquivo `.env`. Segredos e URLs de produção não devem ser
> commitados (ver [SECURITY.md](../SECURITY.md)).

Ao rodar `pnpm start`:

- **Expo Go**: escaneie o QR Code exibido no terminal/navegador de dev.
- **Emulador Android**: pressione `a`.
- **Simulador iOS** (macOS + Xcode): pressione `i`.

---

## Estrutura (MVVM)

```
app/            # Telas e rotas (expo-router): (auth), (tabs), grupo, add-despesa...
components/     # Componentes de UI reutilizáveis (+ __tests__)
viewModels/     # Lógica de apresentação (use...ViewModel)
store/          # Estado global (Zustand) e sessão (expo-secure-store)
hooks/          # Hooks compartilhados
constants/      # Tokens de tema, cores, tipografia
enums/          # Enumerações de domínio
```

Camadas: **View** (`app/`, `components/`) → **ViewModel** (`viewModels/`) →
**Store/serviços** (`store/`, chamadas à API via TanStack Query). A regra de
apresentação vive nos view models, mantendo as telas declarativas.

---

## Stack

- **React Native** + **Expo** (expo-router para navegação file-based)
- **TypeScript**
- **Zustand** (estado) · **TanStack Query** (data fetching/cache)
- **React Hook Form** (formulários) · **React Native Paper** (UI)
- **react-native-chart-kit** (gráficos) · **expo-secure-store** (token seguro)

---

## Scripts

```bash
pnpm start      # inicia o servidor Expo
pnpm android    # abre no emulador Android
pnpm ios        # abre no simulador iOS
pnpm web        # executa a versão web
pnpm typecheck  # tsc --noEmit
pnpm lint       # ESLint (expo lint)
pnpm test       # testes (jest-expo)
```

---

## Qualidade e testes

Testes com `jest-expo`. Consulte a
[Estratégia de Testes](../docs/08-Estrategia-de-Testes.md) para metas de cobertura
e integração com a CI.
