import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../../app'
import { pool, ownerPool } from '../../db/client'
import { AuthService } from './auth.service'

const uniqueEmail = () => `user_${randomUUID()}@wally.test`
const strongPassword = 'segredoForte123'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp({})
  await app.ready()
})

afterAll(async () => {
  await app.close()
  await pool.end()
  await ownerPool.end()
})

async function signup(email = uniqueEmail(), password = strongPassword) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/signup',
    payload: { name: 'Teste', email, password },
  })
  return { res, email, password }
}

describe('POST /auth/signup', () => {
  it('cria usuário e retorna tokens + user', async () => {
    const { res } = await signup()
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.accessToken).toBeTruthy()
    expect(body.refreshToken).toBeTruthy()
    expect(body.user.email).toMatch(/@wally\.test$/)
    expect(body.user).not.toHaveProperty('passwordHash')
  })

  it('normaliza o e-mail e rejeita duplicado (409)', async () => {
    const email = uniqueEmail()
    const first = await signup(email.toUpperCase())
    expect(first.res.statusCode).toBe(201)
    expect(first.res.json().user.email).toBe(email.toLowerCase())

    const dup = await signup(email)
    expect(dup.res.statusCode).toBe(409)
  })

  it('rejeita senha curta (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: { name: 'X', email: uniqueEmail(), password: '123' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /auth/signin', () => {
  it('autentica com credenciais corretas', async () => {
    const { email, password } = await signup()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signin',
      payload: { email, password },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().accessToken).toBeTruthy()
  })

  it('rejeita senha errada e e-mail inexistente (401)', async () => {
    const { email } = await signup()
    const wrong = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signin',
      payload: { email, password: 'senhaErrada999' },
    })
    expect(wrong.statusCode).toBe(401)

    const unknown = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signin',
      payload: { email: uniqueEmail(), password: strongPassword },
    })
    expect(unknown.statusCode).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('retorna o usuário com token válido; 401 sem token', async () => {
    const { res } = await signup()
    const { accessToken } = res.json()

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(me.statusCode).toBe(200)
    expect(me.json().id).toBeTruthy()

    const noAuth = await app.inject({ method: 'GET', url: '/api/v1/auth/me' })
    expect(noAuth.statusCode).toBe(401)
  })
})

describe('POST /auth/refresh — rotação e detecção de reúso', () => {
  it('rotaciona o refresh e detecta reúso revogando a família', async () => {
    const { res } = await signup()
    const original = res.json().refreshToken as string

    // 1ª rotação: sucesso, gera um novo refresh.
    const rot1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: original },
    })
    expect(rot1.statusCode).toBe(200)
    const rotated = rot1.json().refreshToken as string
    expect(rotated).not.toBe(original)

    // Reúso do token ORIGINAL (já rotacionado) ⇒ 401 e revoga a família.
    const reuse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: original },
    })
    expect(reuse.statusCode).toBe(401)

    // Como a família foi revogada, o refresh rotacionado também deixa de valer.
    const afterRevoke = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rotated },
    })
    expect(afterRevoke.statusCode).toBe(401)
  })
})

describe('POST /auth/logout', () => {
  it('revoga o refresh (uso posterior falha)', async () => {
    const { res } = await signup()
    const refreshToken = res.json().refreshToken as string

    const out = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken },
    })
    expect(out.statusCode).toBe(204)

    const after = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken },
    })
    expect(after.statusCode).toBe(401)
  })
})

describe('Fluxo de redefinição de senha', () => {
  it('forgot não vaza existência; reset troca a senha e invalida sessões', async () => {
    const { email, password } = await signup()

    // forgot-password responde genérico (200) mesmo para e-mail inexistente.
    const forgotUnknown = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: uniqueEmail() },
    })
    expect(forgotUnknown.statusCode).toBe(200)

    // Obtém o token diretamente do serviço (em produção iria por e-mail).
    const service = new AuthService({ signAccessToken: () => 'x' })
    const token = await service.forgotPassword(email)
    expect(token).toBeTruthy()

    const newPassword = 'novaSenhaForte456'
    const reset = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token, password: newPassword },
    })
    expect(reset.statusCode).toBe(204)

    // Senha antiga não vale mais; a nova, sim.
    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signin',
      payload: { email, password },
    })
    expect(oldLogin.statusCode).toBe(401)

    const newLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signin',
      payload: { email, password: newPassword },
    })
    expect(newLogin.statusCode).toBe(200)
  })
})
