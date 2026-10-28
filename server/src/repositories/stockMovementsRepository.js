import { pool } from '../config/db.js'

export const stockMovementsRepository = {
  async createMovementWithClient(
    client,
    { productId, movementType, quantityDelta, balanceAfter, reason, actorUserId, relatedOrderId = null },
  ) {
    const query = `
      INSERT INTO stock_movements (
        product_id, movement_type, quantity_delta, balance_after, reason, actor_user_id, related_order_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, product_id, movement_type, quantity_delta, balance_after, reason, actor_user_id, related_order_id, created_at
    `
    const { rows } = await client.query(query, [
      productId,
      movementType,
      quantityDelta,
      balanceAfter,
      reason,
      actorUserId,
      relatedOrderId || null,
    ])
    return rows[0]
  },

  async list({ page = 1, limit = 20, productId = null, movementType = null, actorUserId = null, search = '' }) {
    const offset = (page - 1) * limit
    const searchFilter = search ? `%${search}%` : null

    let whereClauses = []
    let params = []
    let index = 1

    if (productId) {
      whereClauses.push(`sm.product_id = $${index}`)
      params.push(productId)
      index++
    }

    if (movementType) {
      whereClauses.push(`sm.movement_type = $${index}`)
      params.push(movementType)
      index++
    }

    if (actorUserId) {
      whereClauses.push(`sm.actor_user_id = $${index}`)
      params.push(actorUserId)
      index++
    }

    if (searchFilter) {
      whereClauses.push(`(p.name ILIKE $${index} OR p.sku ILIKE $${index} OR sm.reason ILIKE $${index})`)
      params.push(searchFilter)
      index++
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const dataQuery = `
      SELECT 
        sm.id,
        sm.product_id,
        p.sku AS product_sku,
        p.name AS product_name,
        sm.movement_type,
        sm.quantity_delta,
        sm.balance_after,
        sm.reason,
        sm.actor_user_id,
        u.full_name AS actor_name,
        u.role AS actor_role,
        sm.related_order_id,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.actor_user_id = u.id
      ${whereSql}
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT $${index} OFFSET $${index + 1}
    `
    const countQuery = `
      SELECT count(*) AS total
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ${whereSql}
    `

    const dataParams = [...params, limit, offset]
    const countParams = [...params]

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams),
    ])

    return {
      movements: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page,
      limit,
    }
  },

  async getByProductId(productId, limit = 10) {
    const query = `
      SELECT 
        sm.id,
        sm.movement_type,
        sm.quantity_delta,
        sm.balance_after,
        sm.reason,
        sm.related_order_id,
        sm.created_at,
        u.full_name AS actor_name
      FROM stock_movements sm
      JOIN users u ON sm.actor_user_id = u.id
      WHERE sm.product_id = $1
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT $2
    `
    const { rows } = await pool.query(query, [productId, limit])
    return rows
  },
}
