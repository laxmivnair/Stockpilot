import { pool } from '../config/db.js'

export const categoriesRepository = {
  async list() {
    const query = `
      SELECT c.id, c.name, c.created_at, count(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `
    const { rows } = await pool.query(query)
    return rows
  },

  async findById(id) {
    const query = `
      SELECT id, name, created_at, updated_at
      FROM categories
      WHERE id = $1
    `
    const { rows } = await pool.query(query, [id])
    return rows[0] || null
  },

  async findByName(name) {
    const query = `
      SELECT id, name, created_at, updated_at
      FROM categories
      WHERE lower(name) = lower($1)
    `
    const { rows } = await pool.query(query, [name])
    return rows[0] || null
  },

  async create(name) {
    const query = `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING id, name, created_at, updated_at
    `
    const { rows } = await pool.query(query, [name])
    return rows[0]
  },
}
