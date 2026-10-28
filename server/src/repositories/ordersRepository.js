import { pool } from '../config/db.js'

export const ordersRepository = {
  async createOrderWithClient(client, { createdBy, customerName, customerEmail = null, totalAmount }) {
    const query = `
      INSERT INTO orders (created_by, customer_name, customer_email, total_amount)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_by, customer_name, customer_email, status, total_amount, created_at
    `
    const { rows } = await client.query(query, [createdBy, customerName, customerEmail || null, totalAmount])
    return rows[0]
  },

  async createOrderItemWithClient(client, { orderId, productId, skuSnapshot, productNameSnapshot, unitPrice, quantity, lineTotal }) {
    const query = `
      INSERT INTO order_items (order_id, product_id, sku_snapshot, product_name_snapshot, unit_price, quantity, line_total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, order_id, product_id, sku_snapshot, product_name_snapshot, unit_price, quantity, line_total
    `
    const { rows } = await client.query(query, [
      orderId,
      productId,
      skuSnapshot,
      productNameSnapshot,
      unitPrice,
      quantity,
      lineTotal,
    ])
    return rows[0]
  },

  async listOrders({ page = 1, limit = 20, search = '', status = null, createdBy = null }) {
    const offset = (page - 1) * limit
    const searchFilter = search ? `%${search}%` : null

    let whereClauses = []
    let params = []
    let index = 1

    if (searchFilter) {
      whereClauses.push(`(o.customer_name ILIKE $${index} OR o.customer_email ILIKE $${index} OR CAST(o.id AS TEXT) ILIKE $${index})`)
      params.push(searchFilter)
      index++
    }

    if (status) {
      whereClauses.push(`o.status = $${index}`)
      params.push(status)
      index++
    }

    if (createdBy) {
      whereClauses.push(`o.created_by = $${index}`)
      params.push(createdBy)
      index++
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const dataQuery = `
      SELECT 
        o.id,
        o.customer_name,
        o.customer_email,
        o.status,
        o.total_amount,
        o.created_at,
        o.cancelled_at,
        u.full_name AS created_by_name,
        cu.full_name AS cancelled_by_name,
        count(oi.id)::int AS items_count,
        coalesce(sum(oi.quantity), 0)::int AS total_units
      FROM orders o
      JOIN users u ON o.created_by = u.id
      LEFT JOIN users cu ON o.cancelled_by = cu.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereSql}
      GROUP BY o.id, u.full_name, cu.full_name
      ORDER BY o.created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
    `
    const countQuery = `
      SELECT count(*) AS total
      FROM orders o
      ${whereSql}
    `

    const dataParams = [...params, limit, offset]
    const countParams = [...params]

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams),
    ])

    return {
      orders: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page,
      limit,
    }
  },

  async findById(id, client = pool) {
    const orderQuery = `
      SELECT 
        o.id,
        o.customer_name,
        o.customer_email,
        o.status,
        o.total_amount,
        o.created_by,
        u.full_name AS created_by_name,
        u.email AS created_by_email,
        o.cancelled_by,
        cu.full_name AS cancelled_by_name,
        o.cancelled_at,
        o.created_at
      FROM orders o
      JOIN users u ON o.created_by = u.id
      LEFT JOIN users cu ON o.cancelled_by = cu.id
      WHERE o.id = $1
    `
    const { rows: orderRows } = await client.query(orderQuery, [id])
    if (!orderRows.length) return null

    const order = orderRows[0]

    const itemsQuery = `
      SELECT 
        oi.id,
        oi.product_id,
        oi.sku_snapshot,
        oi.product_name_snapshot,
        oi.unit_price,
        oi.quantity,
        oi.line_total,
        p.status AS current_product_status,
        p.quantity AS current_product_stock
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `
    const { rows: itemRows } = await client.query(itemsQuery, [id])
    order.items = itemRows

    return order
  },

  async lockOrderForUpdate(client, orderId) {
    const query = `
      SELECT id, status, total_amount, created_by
      FROM orders
      WHERE id = $1
      FOR UPDATE
    `
    const { rows } = await client.query(query, [orderId])
    return rows[0] || null
  },

  async updateStatusWithClient(client, orderId, status, cancelledBy = null) {
    const query = `
      UPDATE orders
      SET status = $1, cancelled_by = $2, cancelled_at = CASE WHEN $1 = 'cancelled' THEN now() ELSE NULL END
      WHERE id = $3
      RETURNING id, status, cancelled_by, cancelled_at
    `
    const { rows } = await client.query(query, [status, cancelledBy, orderId])
    return rows[0] || null
  },
}
