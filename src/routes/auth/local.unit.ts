import { vi, describe, it, expect, beforeEach, onTestFinished } from 'vitest'
import { Conflict } from '../../core/errors/index.js'
import Fastify from 'fastify'
import request from 'supertest'
import localAuthRoutes from './local.js'

vi.mock('../../modules/auth/services/register.js')
vi.mock('../../modules/auth/services/login.js')

import { register } from '../../modules/auth/services/register.js'
import { login } from '../../modules/auth/services/login.js'
import type { User } from '../../modules/user/type.js'

const mockUser: User = {
  id: 'uuid-1',
  email: 'alice@example.com',
  emailVerified: false,
  firstName: 'Alice',
  lastName: null,
  userName: null,
  mobilePhone: null,
  mobilePhoneVerified: false,
  role: 'User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

async function setup() {
  const app = Fastify({ logger: false })

  // Provide passport methods that the route handlers call
  app.decorateRequest('logIn', async function () {})
  app.decorateRequest('logOut', async function () {})
  app.decorateRequest('isAuthenticated', function () {
    return false
  })

  await app.register(localAuthRoutes, { prefix: '/auth' })
  await app.ready()
  onTestFinished(() => app.close())
  return request(app.server)
}

beforeEach(() => vi.clearAllMocks())

describe('routes -> auth -> local', () => {
  describe('POST /auth/register', () => {
    it('should register a user and return 201', async () => {
      vi.mocked(register).mockResolvedValue(mockUser)
      const api = await setup()

      const res = await api
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'Password1!' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ id: 'uuid-1', email: 'alice@example.com' })
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@example.com', password: 'Password1!' }),
      )
    })

    it('should return 400 when email is missing', async () => {
      const api = await setup()

      const res = await api.post('/auth/register').send({ password: 'Password1!' })

      expect(res.status).toBe(400)
      expect(register).not.toHaveBeenCalled()
    })

    it('should return 400 when email is invalid', async () => {
      const api = await setup()

      const res = await api
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'Password1!' })

      expect(res.status).toBe(400)
      expect(register).not.toHaveBeenCalled()
    })

    it('should return 400 when password is too short', async () => {
      const api = await setup()

      const res = await api
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'short' })

      expect(res.status).toBe(400)
      expect(register).not.toHaveBeenCalled()
    })

    it('should propagate errors thrown by the register service', async () => {
      vi.mocked(register).mockRejectedValue(
        new Conflict('Email already in use'),
      )
      const api = await setup()

      const res = await api
        .post('/auth/register')
        .send({ email: 'alice@example.com', password: 'Password1!' })

      expect(res.status).toBe(409)
    })
  })

  describe('POST /auth/login', () => {
    it('should return 200 with user data on valid credentials', async () => {
      vi.mocked(login).mockResolvedValue({ twoFactorRequired: false, user: mockUser })
      const api = await setup()

      const res = await api
        .post('/auth/login')
        .send({ email: 'alice@example.com', password: 'Password1!' })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 'uuid-1', email: 'alice@example.com' })
      expect(login).toHaveBeenCalledWith('alice@example.com', 'Password1!')
    })

    it('should return 401 when credentials are invalid', async () => {
      vi.mocked(login).mockResolvedValue(null)
      const api = await setup()

      const res = await api
        .post('/auth/login')
        .send({ email: 'alice@example.com', password: 'WrongPass1!' })

      expect(res.status).toBe(401)
    })

    it('should return 400 when body is missing required fields', async () => {
      const api = await setup()

      const res = await api.post('/auth/login').send({ email: 'alice@example.com' })

      expect(res.status).toBe(400)
      expect(login).not.toHaveBeenCalled()
    })
  })

  describe('POST /auth/logout', () => {
    it('should return 204', async () => {
      const api = await setup()

      const res = await api.post('/auth/logout')

      expect(res.status).toBe(204)
    })
  })
})
