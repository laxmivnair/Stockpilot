import { pool } from '../config/db.js'

export const productsRepository = {
  async list({ page = 1, limit = 20, search = '', categoryId = null, status = 'active', lowStockOnly = false }) {
    const offset = (page - 1) * limit
    const searchFilter = search ? `%${search}%` : null

    let whereClauses = []
    let params = []
    let paramIndex = 1

    if (searchFilter) {
      whereClauses.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`)
      params.push(searchFilter)
      paramIndex++
    }

    if (categoryId) {
      whereClauses.push(`p.category_id = $${paramIndex}`)
      params.push(categoryId)
      paramIndex++
    }

    if (status && status !== 'all') {
      whereClauses.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (lowStockOnly) {
      whereClauses.push(`p.quantity <= p.reorder_threshold`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const dataQuery = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.description,
        p.price,
        p.quantity,
        p.reorder_threshold,
        p.status,
        (p.quantity <= p.reorder_threshold) AS is_low_stock,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const countQuery = `
      SELECT count(*) AS total
      FROM products p
      ${whereSql}
    `

    const dataParams = [...params, limit, offset]
    const countParams = [...params]

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, dataParams),
      pool.query(countQuery, countParams),
    ])

    return {
      products: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page,
      limit,
    }
  },

  async findById(id, client = pool) {
    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category_id,
        c.name AS category_name,
        p.description,
        p.price,
        p.quantity,
        p.reorder_threshold,
        p.status,
        (p.quantity <= p.reorder_threshold) AS is_low_stock,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `
    const { rows } = await client.query(query, [id])
    return rows[0] || null
  },

  async findBySku(sku) {
    const query = `
      SELECT id, sku, name
      FROM products
      WHERE upper(sku) = upper($1)
    `
    const { rows } = await pool.query(query, [sku])
    return rows[0] || null
  },

  async create({ sku, name, categoryId, description = '', price, quantity = 0, reorderThreshold = 0, status = 'active' }, client = pool) {
    const query = `
      INSERT INTO products (sku, name, category_id, description, price, quantity, reorder_threshold, status)
      VALUES (upper($1), $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, sku, name, category_id, description, price, quantity, reorder_threshold, status, created_at, updated_at
    `
    const { rows } = await client.query(query, [sku, name, categoryId, description, price, quantity, reorderThreshold, status])
    return rows[0]
  },

  async update(id, fields, client = pool) {
    const updates = []
    const values = []
    let index = 1

    if (fields.name !== undefined) {
      updates.push(`name = $${index++}`)
      values.push(fields.name)
    }
    if (fields.categoryId !== undefined) {
      updates.push(`category_id = $${index++}`)
      values.push(fields.categoryId)
    }
    if (fields.description !== undefined) {
      updates.push(`description = $${index++}`)
      values.push(fields.description)
    }
    if (fields.price !== undefined) {
      updates.push(`price = $${index++}`)
      values.push(fields.price)
    }
    if (fields.reorderThreshold !== undefined) {
      updates.push(`reorder_threshold = $${index++}`)
      values.push(fields.reorderThreshold)
    }
    if (fields.status !== undefined) {
      updates.push(`status = $${index++}`)
      values.push(fields.status)
    }

    if (updates.length === 0) return this.findById(id, client)

    updates.push(`updated_at = now()`)
    values.push(id)

    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${index}
      RETURNING id, sku, name, category_id, description, price, quantity, reorder_threshold, status, updated_at
    `
    const { rows } = await client.query(query, values)
    return rows[0] || null
  },

  async updateQuantity(id, newQuantity, client = pool) {
    const query = `
      UPDATE products
      SET quantity = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, sku, name, quantity, reorder_threshold
    `
    const { rows } = await client.query(query, [newQuantity, id])
    return rows[0] || null
  },

  /**
   * Acquire pessimistic row-level exclusive locks (FOR UPDATE)
   * on specific products in ascending ID order to prevent race conditions and deadlocks!
   */
  async lockProductsForUpdate(client, productIds) {
    // Sort IDs in ascending order to prevent deadlocks across concurrent transactions
    const sortedIds = [...new Set(productIds)].sort((a, b) => a - b)
    const query = `
      SELECT id, sku, name, price, quantity, status, reorder_threshold
      FROM products
      WHERE id = ANY($1::int[])
      ORDER BY id ASC
      FOR UPDATE
    `
    const { rows } = await client.query(query, [sortedIds])
    return rows
  },

  async archive(id, client = pool) {
    const query = `
      UPDATE products
      SET status = 'archived', updated_at = now()
      WHERE id = $1
      RETURNING id, sku, name, status, updated_at
    `
    const { rows } = await client.query(query, [id])
    return rows[0] || null
  },
}
