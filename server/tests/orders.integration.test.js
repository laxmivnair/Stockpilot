import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'
import { loginAsAdmin, loginAsEmployee, generateSku } from './helpers.js'
import { pool } from '../src/config/db.js'

describe('Order Processing & Concurrency Control', () => {
  it('creates an order, atomically deducts stock, and creates stock movements', async () => {
    const { headers: adminHeaders } = await loginAsAdmin()
    const { headers: empHeaders } = await loginAsEmployee()

    // 1. Create product with 20 units
    const sku = generateSku('ORD')
    const prodRes = await request(app)
      .post('/api/products')
      .set(adminHeaders)
      .send({
        sku,
        name: 'Order Test Widget',
        categoryId: 1,
        price: 25.5,
        quantity: 20,
        reorderThreshold: 5,
      })

    const productId = prodRes.body.id

    // 2. Employee places order for 5 units
    const orderRes = await request(app)
      .post('/api/orders')
      .set(empHeaders)
      .send({
        customerName: 'Global Corp Ltd',
        customerEmail: 'ops@globalcorp.com',
        items: [{ productId, quantity: 5 }],
      })

    expect(orderRes.status).toBe(201)
    expect(orderRes.body.status).toBe('placed')
    expect(Number(orderRes.body.total_amount)).toBe(127.5) // 25.50 * 5 = 127.50
    expect(orderRes.body.items.length).toBe(1)
    expect(orderRes.body.items[0].sku_snapshot).toBe(sku.toUpperCase())
    expect(orderRes.body.items[0].product_name_snapshot).toBe('Order Test Widget')

    // 3. Verify stock in database reduced to 15
    const checkProduct = await pool.query('SELECT quantity FROM products WHERE id = $1', [productId])
    expect(checkProduct.rows[0].quantity).toBe(15)

    // 4. Verify stock movement recorded
    const orderId = orderRes.body.id
    const movementRes = await pool.query(
      'SELECT * FROM stock_movements WHERE related_order_id = $1 AND product_id = $2',
      [orderId, productId]
    )
    expect(movementRes.rows.length).toBe(1)
    expect(movementRes.rows[0].movement_type).toBe('order_deduction')
    expect(movementRes.rows[0].quantity_delta).toBe(-5)
    expect(movementRes.rows[0].balance_after).toBe(15)
  })

  it('rejects an order when requested quantity exceeds available stock', async () => {
    const { headers: adminHeaders } = await loginAsAdmin()
    const { headers: empHeaders } = await loginAsEmployee()

    const sku = generateSku('LACK')
    const prodRes = await request(app)
      .post('/api/products')
      .set(adminHeaders)
      .send({
        sku,
        name: 'Scarce Item',
        categoryId: 1,
        price: 10,
        quantity: 3,
      })

    const productId = prodRes.body.id

    // Order 5 units when only 3 are available
    const orderRes = await request(app)
      .post('/api/orders')
      .set(empHeaders)
      .send({
        customerName: 'Eager Buyer',
        items: [{ productId, quantity: 5 }],
      })

    expect(orderRes.status).toBe(400)
    expect(orderRes.body.error.code).toBe('INSUFFICIENT_STOCK')

    // Confirm inventory remains untouched at 3
    const checkProduct = await pool.query('SELECT quantity FROM products WHERE id = $1', [productId])
    expect(checkProduct.rows[0].quantity).toBe(3)
  })

  it('prevents race conditions and overselling during concurrent competing orders', async () => {
    const { headers: adminHeaders } = await loginAsAdmin()
    const { headers: empHeaders } = await loginAsEmployee()

    // Create product with EXACTLY 10 units
    const sku = generateSku('RACE')
    const prodRes = await request(app)
      .post('/api/products')
      .set(adminHeaders)
      .send({
        sku,
        name: 'High Demand Limited Item',
        categoryId: 1,
        price: 50,
        quantity: 10,
      })

    const productId = prodRes.body.id

    // Launch 2 simultaneous order requests competing for 7 units each!
    // Total requested: 14 units. Available: 10 units.
    // Concurrency control with row-level locks must ensure EXACTLY one succeeds and one fails!
    const orderPayload1 = {
      customerName: 'Concurrent Buyer Alpha',
      items: [{ productId, quantity: 7 }],
    }
    const orderPayload2 = {
      customerName: 'Concurrent Buyer Beta',
      items: [{ productId, quantity: 7 }],
    }

    const [res1, res2] = await Promise.all([
      request(app).post('/api/orders').set(empHeaders).send(orderPayload1),
      request(app).post('/api/orders').set(empHeaders).send(orderPayload2),
    ])

    const statuses = [res1.status, res2.status].sort()
    // One must be 201 Created and the other must be 400 Bad Request (INSUFFICIENT_STOCK)
    expect(statuses).toEqual([201, 400])

    const successRes = res1.status === 201 ? res1 : res2
    const failedRes = res1.status === 400 ? res1 : res2

    expect(successRes.body.status).toBe('placed')
    expect(failedRes.body.error.code).toBe('INSUFFICIENT_STOCK')

    // Verify stock is strictly 10 - 7 = 3, never negative!
    const checkProduct = await pool.query('SELECT quantity FROM products WHERE id = $1', [productId])
    expect(checkProduct.rows[0].quantity).toBe(3)
  })

  it('cancels an order, restores inventory, and logs cancellation movement', async () => {
    const { headers: adminHeaders } = await loginAsAdmin()

    const sku = generateSku('CNCL')
    const prodRes = await request(app)
      .post('/api/products')
      .set(adminHeaders)
      .send({
        sku,
        name: 'Cancellable Item',
        categoryId: 1,
        price: 30,
        quantity: 10,
      })

    const productId = prodRes.body.id

    // Place order for 4 units
    const orderRes = await request(app)
      .post('/api/orders')
      .set(adminHeaders)
      .send({
        customerName: 'Indecisive Client',
        items: [{ productId, quantity: 4 }],
      })

    expect(orderRes.status).toBe(201)
    const orderId = orderRes.body.id

    // Balance should now be 6
    let productCheck = await pool.query('SELECT quantity FROM products WHERE id = $1', [productId])
    expect(productCheck.rows[0].quantity).toBe(6)

    // Admin cancels the order
    const cancelRes = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set(adminHeaders)

    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.order.status).toBe('cancelled')

    // Balance should be restored to 10
    productCheck = await pool.query('SELECT quantity FROM products WHERE id = $1', [productId])
    expect(productCheck.rows[0].quantity).toBe(10)

    // Stock movement should be recorded as order_cancellation with delta +4
    const cancelMovementRes = await pool.query(
      "SELECT * FROM stock_movements WHERE related_order_id = $1 AND movement_type = 'order_cancellation'",
      [orderId]
    )
    expect(cancelMovementRes.rows.length).toBe(1)
    expect(cancelMovementRes.rows[0].quantity_delta).toBe(4)
    expect(cancelMovementRes.rows[0].balance_after).toBe(10)
  })
})
