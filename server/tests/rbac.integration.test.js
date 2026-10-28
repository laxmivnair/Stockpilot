import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { loginAsEmployee, generateSku } from './helpers.js'

describe('Role-Based Access Control (RBAC)', () => {
  it('rejects unauthenticated requests to protected routes with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('forbids an employee from creating a product with 403 Forbidden', async () => {
    const { headers } = await loginAsEmployee()
    const sku = generateSku('EMP-PROD')

    const res = await request(app)
      .post('/api/products')
      .set(headers)
      .send({
        sku,
        name: 'Unauthorized Product',
        categoryId: 1,
        price: 40,
        quantity: 5,
      })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('forbids an employee from adjusting stock with 403 Forbidden', async () => {
    const { headers } = await loginAsEmployee()

    const res = await request(app)
      .post('/api/products/1/adjust-stock')
      .set(headers)
      .send({
        quantityDelta: 10,
        reason: 'Employee trying to adjust stock',
      })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('forbids an employee from accessing user administration with 403 Forbidden', async () => {
    const { headers } = await loginAsEmployee()

    const res = await request(app)
      .get('/api/users')
      .set(headers)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('allows an employee to view products (200 OK)', async () => {
    const { headers } = await loginAsEmployee()

    const res = await request(app)
      .get('/api/products')
      .set(headers)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('products')
  })
})
