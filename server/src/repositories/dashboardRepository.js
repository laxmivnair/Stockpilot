import { pool } from '../config/db.js'

export const dashboardRepository = {
  async getMetrics() {
    const query = `
      SELECT
        (SELECT count(*)::int FROM products WHERE status = 'active') AS total_active_products,
        (SELECT coalesce(sum(quantity), 0)::int FROM products WHERE status = 'active') AS total_inventory_units,
        (SELECT count(*)::int FROM products WHERE status = 'active' AND quantity <= reorder_threshold) AS low_stock_products_count,
        (SELECT count(*)::int FROM orders) AS total_orders,
        (SELECT coalesce(sum(total_amount), 0)::numeric(12,2) FROM orders WHERE status = 'placed') AS total_revenue
    `
    const { rows } = await pool.query(query)
    return rows[0]
  },

  async getInventoryByCategory() {
    const query = `
      SELECT 
        c.id,
        c.name AS category_name,
        count(p.id)::int AS product_count,
        coalesce(sum(p.quantity), 0)::int AS total_units
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY total_units DESC, c.name ASC
    `
    const { rows } = await pool.query(query)
    return rows
  },

  async getRecentOrders(limit = 5) {
    const query = `
      SELECT 
        o.id,
        o.customer_name,
        o.status,
        o.total_amount,
        o.created_at,
        u.full_name AS created_by_name
      FROM orders o
      JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `
    const { rows } = await pool.query(query, [limit])
    return rows
  },

  async getRecentMovements(limit = 6) {
    const query = `
      SELECT 
        sm.id,
        sm.movement_type,
        sm.quantity_delta,
        sm.balance_after,
        sm.reason,
        sm.created_at,
        p.name AS product_name,
        p.sku AS product_sku,
        u.full_name AS actor_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.actor_user_id = u.id
      ORDER BY sm.created_at DESC, sm.id DESC
      LIMIT $1
    `
    const { rows } = await pool.query(query, [limit])
    return rows
  },

  async getLowStockAlerts(limit = 8) {
    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        c.name AS category_name,
        p.quantity,
        p.reorder_threshold,
        (p.reorder_threshold - p.quantity) AS deficit
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.quantity <= p.reorder_threshold
      ORDER BY p.quantity ASC, deficit DESC
      LIMIT $1
    `
    const { rows } = await pool.query(query, [limit])
    return rows
  },

  async getSalesTrend() {
    // Group placed orders by date for the last 7 days or recent orders
    const query = `
      SELECT 
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS order_date,
        count(*)::int AS orders_count,
        coalesce(sum(total_amount), 0)::numeric(12,2) AS daily_revenue
      FROM orders
      WHERE status = 'placed' AND created_at >= now() - INTERVAL '14 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at) ASC
    `
    const { rows } = await pool.query(query)
    return rows
  },
}
