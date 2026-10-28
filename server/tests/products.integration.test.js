import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { loginAsAdmin, generateSku } from './helpers.js'
import { pool } from '../src/config/db.js'

describe('Product Management & Stock Adjustment', () => {
  it('creates product and records initial stock_in movement atomically', async () => {
    const { headers } = await loginAsAdmin()
    const sku = generateSku('PROD')

    const res = await request(app)
      .post('/api/products')
      .set(headers)
      .send({
        sku,
        name: 'Automated Test Product',
        categoryId: 1,
        description: 'Quality tested product',
        price: 99.99,
        quantity: 25,
        reorderThreshold: 5,
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      sku: sku.toUpperCase(),
      name: 'Automated Test Product',
      quantity: 25,
      status: 'active',
    })

    const productId = res.body.id

    // Verify stock movement was recorded
    const movementRes = await pool.query(
      'SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY id DESC LIMIT 1',
      [productId]
    )
    expect(movementRes.rows.length).toBe(1)
    expect(movementRes.rows[0].movement_type).toBe('stock_in')
    expect(movementRes.rows[0].quantity_delta).toBe(25)
    expect(movementRes.rows[0].balance_after).toBe(25)
  })

  it('rejects duplicate SKU with 409 Conflict', async () => {
    const { headers } = await loginAsAdmin()
    const sku = generateSku('DUP')

    // Create first
    await request(app)
      .post('/api/products')
      .set(headers)
      .send({
        sku,
        name: 'First Sku Item',
        categoryId: 1,
        price: 20,
        quantity: 5,
      })

    // Create duplicate
    const res = await request(app)
      .post('/api/products')
      .set(headers)
      .send({
        sku,
        name: 'Second Sku Item (Duplicate)',
        categoryId: 1,
        price: 25,
        quantity: 2,
      })

    expect(res.status).toBe(409)
  })

  it('adjusts stock transactionally and records stock movement', async () => {
    const { headers } = await loginAsAdmin()
    const sku = generateSku('ADJ')

    const createRes = await request(app)
      .post('/api/products')
      .set(headers)
      .send({
        sku,
        name: 'Adjustable Stock Item',
        categoryId: 1,
        price: 15,
        quantity: 10,
      })

    const productId = createRes.body.id

    // Adjust: add 5 units
    const addRes = await request(app)
      .post(`/api/products/${productId}/adjust-stock`)
      .set(headers)
      .send({
        quantityDelta: 5,
        reason: 'Restocking delivered shipment',
        movementType: 'stock_in',
      })

    expect(addRes.status).toBe(200)
    expect(addRes.body.product.quantity).toBe(15)

    // Adjust: remove 3 units
    const deductRes = await request(app)
      .post(`/api/products/${productId}/adjust-stock`)
      .set(headers)
      .send({
        quantityDelta: -3,
        reason: 'Damaged item removed during warehouse inspection',
      })

    expect(deductRes.status).toBe(200)
    expect(deductRes.body.product.quantity).toBe(12)

    // Attempt invalid adjustment: remove more than current stock (12)
    const invalidRes = await request(app)
      .post(`/api/products/${productId}/adjust-stock`)
      .set(headers)
      .send({
        quantityDelta: -20,
        reason: 'Excessive deduction',
      })

    expect(invalidRes.status).toBe(400)
  })

  it('archives a product without deleting records', async () => {
    const { headers } = await loginAsAdmin()
    const sku = generateSku('ARCH')

    const createRes = await request(app)
      .post('/api/products')
      .set(headers)
      .send({
        sku,
        name: 'Product to Archive',
        categoryId: 1,
        price: 50,
        quantity: 10,
      })

    const productId = createRes.body.id

    const archiveRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set(headers)

    expect(archiveRes.status).toBe(200)
    expect(archiveRes.body.product.status).toBe('archived')

    // Confirm it still exists in DB
    const dbRes = await pool.query('SELECT status FROM products WHERE id = $1', [productId])
    expect(dbRes.rows[0].status).toBe('archived')
  })
})
