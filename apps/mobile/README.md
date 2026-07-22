# Wally — Mobile App

Wally's mobile app for personal and group finance, built with **Expo / React Native**
and **TypeScript**, following the **MVVM** pattern.

---

## Prerequisites

- **Node.js 20+** and **pnpm 9** (`corepack enable`)
- **Expo Go** on your phone **or** an Android emulator (AVD) / iOS simulator (Xcode)
- A running Wally API instance (see [`../api`](../api/README.md))

---

## Setup

```bash
# from apps/mobile/
pnpm install -w          # installs the whole monorepo (fine to run from here)
cp .env.example .env     # set EXPO_PUBLIC_API_URL to point at your API
pnpm start
```

Environment variables:

| Variable              | Description                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | Base host of the Wally API, **without** the route prefix — the client appends `/api/v1`. E.g. `http://localhost:3333` in development or `https://api.your-domain` in production. |

> On a physical device with Expo Go, `localhost` resolves to the device itself. Use your
> machine's LAN IP instead (e.g. `http://192.168.0.10:3333`).

> Never commit the `.env` file. Secrets and production URLs stay out of Git (see
> [SECURITY.md](../../SECURITY.md)).

When you run `pnpm start`:

- **Expo Go**: scan the QR code shown in the terminal or dev browser.
- **Android emulator**: press `a`.
- **iOS simulator** (macOS + Xcode): press `i`.

---

## Structure (MVVM)

```
app/                # Screens and routes (expo-router): (auth), (tabs), grupo, add-despesa…
src/
  components/       # Reusable UI components (+ ui/)
  features/         # Domain logic by feature: auth, groups, transactions
  store/            # Global state (Zustand) and session (expo-secure-store)
  lib/              # Query client, helpers and formatters
  theme/            # Theme tokens, colours, typography
  locales/          # i18n resources (i18next)
```

Layers: **View** (`app/`, `src/components/`) → **ViewModel/feature hooks**
(`src/features/`) → **Store & services** (`src/store/`, API calls through TanStack
Query). Presentation logic lives in the feature hooks, keeping screens declarative.

---

## Stack

- **React Native** + **Expo** (expo-router for file-based navigation)
- **TypeScript**
- **Zustand** (state) · **TanStack Query** (data fetching and cache, persisted through
  AsyncStorage)
- **React Hook Form + Zod** (forms) · **React Native Paper** (UI)
- **react-native-chart-kit** (charts) · **expo-secure-store** (secure token storage)
- **i18next** (internationalisation, PT-BR by default)

---

## Scripts

```bash
pnpm start      # start the Expo dev server
pnpm android    # open on the Android emulator
pnpm ios        # open on the iOS simulator
pnpm web        # run the web build
pnpm typecheck  # tsc --noEmit
pnpm lint       # ESLint (expo lint)
pnpm test       # tests (jest-expo)
```

---

## Quality and testing

Tests run on `jest-expo`. See the [Testing Strategy](../../docs/TESTING.md) for coverage
targets and CI integration.
