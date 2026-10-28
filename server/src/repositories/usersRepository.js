import { pool } from '../config/db.js'

export const usersRepository = {
  async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE lower(email) = lower($1)
    `
    const { rows } = await pool.query(query, [email])
    return rows[0] || null
  },

  async findById(id) {
    const query = `
      SELECT id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `
    const { rows } = await pool.query(query, [id])
    return rows[0] || null
  },

  async create({ email, passwordHash, fullName, role = 'employee' }) {
    const query = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, is_active, created_at, updated_at
    `
    const { rows } = await pool.query(query, [email, passwordHash, fullName, role])
    return rows[0]
  },

  async list({ page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit
    const searchFilter = search ? `%${search}%` : null

    const dataQuery = `
      SELECT id, email, full_name, role, is_active, created_at, updated_at
      FROM users
      WHERE ($1::text IS NULL OR full_name ILIKE $1 OR email ILIKE $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `
    const countQuery = `
      SELECT count(*) AS total
      FROM users
      WHERE ($1::text IS NULL OR full_name ILIKE $1 OR email ILIKE $1)
    `

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, [searchFilter, limit, offset]),
      pool.query(countQuery, [searchFilter]),
    ])

    return {
      users: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page,
      limit,
    }
  },

  async toggleActive(id, isActive) {
    const query = `
      UPDATE users
      SET is_active = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, email, full_name, role, is_active, updated_at
    `
    const { rows } = await pool.query(query, [isActive, id])
    return rows[0] || null
  },
}
