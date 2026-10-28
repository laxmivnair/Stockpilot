import { pool } from '../src/config/db.js'

async function viewDatabase() {
  console.log('\n=============================================================')
  console.log('            STOCKPILOT LIVE DATABASE INSPECTOR               ')
  console.log('=============================================================\n')

  // 1. Orders
  console.log('--- [1] RECENT ORDERS (table: orders) ---')
  const orders = await pool.query(`
    SELECT o.id, o.customer_name, o.total_amount, o.status, 
           u.full_name AS created_by, o.created_at
    FROM orders o
    JOIN users u ON o.created_by = u.id
    ORDER BY o.id DESC
    LIMIT 5
  `)
  if (orders.rows.length === 0) {
    console.log('No orders found.')
  } else {
    console.table(orders.rows)
  }

  // 2. Order Items
  console.log('\n--- [2] ORDER LINE ITEMS (table: order_items) ---')
  const items = await pool.query(`
    SELECT oi.id, oi.order_id, oi.sku_snapshot, oi.product_name_snapshot, 
           oi.unit_price, oi.quantity, oi.line_total
    FROM order_items oi
    ORDER BY oi.id DESC
    LIMIT 8
  `)
  if (items.rows.length === 0) {
    console.log('No order items found.')
  } else {
    console.table(items.rows)
  }

  // 3. Stock Movements (The Ledger)
  console.log('\n--- [3] INVENTORY AUDIT MOVEMENTS (table: stock_movements) ---')
  const movements = await pool.query(`
    SELECT sm.id, sm.movement_type, sm.quantity_delta, sm.balance_after, 
           p.sku AS product_sku, sm.reason, sm.related_order_id, sm.created_at
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    ORDER BY sm.id DESC
    LIMIT 8
  `)
  if (movements.rows.length === 0) {
    console.log('No stock movements found.')
  } else {
    console.table(movements.rows)
  }

  // 4. Products Stock Snapshot
  console.log('\n--- [4] CURRENT WAREHOUSE STOCK (table: products) ---')
  const products = await pool.query(`
    SELECT id, sku, name, quantity, reorder_threshold, price, status
    FROM products
    ORDER BY id ASC
    LIMIT 10
  `)
  console.table(products.rows)

  console.log('\n=============================================================\n')
  await pool.end()
}

viewDatabase().catch((err) => {
  console.error('Database view error:', err)
  process.exit(1)
})
