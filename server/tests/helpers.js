import request from 'supertest'
import { app } from '../src/app.js'

export async function loginAsAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@stockpilot.local', password: 'Admin123456!' })
  return {
    token: res.body.token,
    user: res.body.user,
    headers: { Authorization: `Bearer ${res.body.token}` },
  }
}

export async function loginAsEmployee() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee@stockpilot.local', password: 'Employee123456!' })
  return {
    token: res.body.token,
    user: res.body.user,
    headers: { Authorization: `Bearer ${res.body.token}` },
  }
}

export function generateSku(prefix = 'TEST') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}
