import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Minimal environment so the app boots in tests, with no real database.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://wally:wally@localhost:5432/wally_test',
      JWT_ACCESS_SECRET: 'test-access-secret-0000000000000000000000',
      JWT_REFRESH_SECRET: 'test-refresh-secret-000000000000000000000',
    },
    coverage: { provider: 'v8', reportsDirectory: './coverage' },
  },
})
