import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Only the constant test secrets live here. The database URLs come from the
    // real environment — CI job env (via turbo passThroughEnv) or the local .env
    // (loaded by dotenv in config/env.ts) — so tests hit the migrated database
    // instead of a hardcoded one that nothing provisions.
    env: {
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test-access-secret-0000000000000000000000',
      JWT_REFRESH_SECRET: 'test-refresh-secret-000000000000000000000',
    },
    coverage: { provider: 'v8', reportsDirectory: './coverage' },
  },
})
