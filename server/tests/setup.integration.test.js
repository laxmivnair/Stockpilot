import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { pool } from '../src/config/db.js'

afterAll(async () => {
  await pool.end()
})

describe('Phase 2 setup', () => {
  it('serves a healthy API backed by the migrated PostgreSQL schema', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', database: 'connected' })

    const result = await pool.query(`
      SELECT to_regclass('public.products') AS products,
             to_regclass('public.orders') AS orders,
             to_regclass('public.stock_movements') AS stock_movements
    `)
    expect(result.rows[0]).toEqual({
      products: 'products',
      orders: 'orders',
      stock_movements: 'stock_movements',
    })
  })
})
