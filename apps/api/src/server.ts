import { buildApp } from './app'
import { env } from './config/env'
import { pool } from './db/client'

async function main() {
  const corsOrigin =
    env.CORS_ORIGIN === '*'
      ? '*'
      : env.CORS_ORIGIN.split(',').map((o) => o.trim())

  const app = await buildApp({
    corsOrigin,
    checkDb: async () => {
      await pool.query('SELECT 1')
    },
  })

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'encerrando…')
    await app.close()
    await pool.end()
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  try {
    await app.listen({ host: env.HOST, port: env.PORT })
    app.log.info(
      `Swagger em http://${env.HOST}:${env.PORT}/wally/documentation`,
    )
  } catch (err) {
    app.log.error(err)
    await pool.end()
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
