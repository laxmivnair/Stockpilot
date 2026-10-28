import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

describe('Authentication & Session Management', () => {
  it('logs in with valid credentials and returns session token and safe user payload', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@stockpilot.local', password: 'Admin123456!' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toMatchObject({
      email: 'admin@stockpilot.local',
      role: 'admin',
    })
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  it('rejects invalid password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@stockpilot.local', password: 'WrongPassword123!' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects nonexistent user email with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@stockpilot.local', password: 'Password123!' })

    expect(res.status).toBe(401)
  })

  it('allows authenticated session verification via GET /api/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@stockpilot.local', password: 'Employee123456!' })

    const token = loginRes.body.token

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(meRes.status).toBe(200)
    expect(meRes.body.user.email).toBe('employee@stockpilot.local')
    expect(meRes.body.user.role).toBe('employee')
  })

  it('revokes session on logout so subsequent requests fail with 401', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@stockpilot.local', password: 'Employee123456!' })

    const token = loginRes.body.token

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)

    expect(logoutRes.status).toBe(200)

    const meAfterLogout = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(meAfterLogout.status).toBe(401)
  })
})
