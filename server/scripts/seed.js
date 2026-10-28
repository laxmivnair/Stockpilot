import { hash } from 'argon2'
import { pool } from '../src/config/db.js'

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    console.log('Seeding StockPilot database...')

    // 1. Seed Users (Admin & Employee)
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@stockpilot.local').trim().toLowerCase()
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123456!'
    const adminName = process.env.SEED_ADMIN_NAME || 'StockPilot Admin'

    const employeeEmail = 'employee@stockpilot.local'
    const employeePassword = 'Employee123456!'
    const employeeName = 'Demo Employee'

    let adminUser = (await client.query('SELECT id FROM users WHERE lower(email) = $1', [adminEmail])).rows[0]
    if (!adminUser) {
      const adminHash = await hash(adminPassword)
      const res = await client.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [adminEmail, adminHash, adminName, 'admin']
      )
      adminUser = res.rows[0]
      console.log(`Created admin user: ${adminEmail}`)
    } else {
      console.log(`Admin user already exists: ${adminEmail}`)
    }

    let empUser = (await client.query('SELECT id FROM users WHERE lower(email) = $1', [employeeEmail])).rows[0]
    if (!empUser) {
      const empHash = await hash(employeePassword)
      const res = await client.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [employeeEmail, empHash, employeeName, 'employee']
      )
      empUser = res.rows[0]
      console.log(`Created employee user: ${employeeEmail}`)
    } else {
      console.log(`Employee user already exists: ${employeeEmail}`)
    }

    // 2. Seed Categories
    const categoriesData = [
      'Electronics',
      'Computer Accessories',
      'Office Supplies',
      'Packaging & Shipping',
      'Networking',
    ]

    const categoryMap = new Map()
    for (const catName of categoriesData) {
      let cat = (await client.query('SELECT id, name FROM categories WHERE lower(name) = lower($1)', [catName])).rows[0]
      if (!cat) {
        const res = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id, name', [catName])
        cat = res.rows[0]
        console.log(`Created category: ${catName}`)
      }
      categoryMap.set(catName, cat.id)
    }

    // 3. Seed Products
    const productsData = [
      {
        sku: 'ELEC-KB-001',
        name: 'Wireless Mechanical Keyboard',
        category: 'Computer Accessories',
        description: 'Tactile mechanical switches, dual Bluetooth/2.4G wireless connectivity',
        price: 89.99,
        quantity: 45,
        reorderThreshold: 10,
      },
      {
        sku: 'ELEC-MO-002',
        name: 'Ergonomic Vertical Mouse',
        category: 'Computer Accessories',
        description: 'Natural hand posture mouse with optical tracking and rechargeable battery',
        price: 49.5,
        quantity: 28,
        reorderThreshold: 10,
      },
      {
        sku: 'ELEC-MN-003',
        name: '27-inch 4K UHD IPS Monitor',
        category: 'Electronics',
        description: '3840x2160 resolution, USB-C 65W charging, HDR400 certified',
        price: 349.0,
        quantity: 14,
        reorderThreshold: 5,
      },
      {
        sku: 'ELEC-DK-004',
        name: '12-in-1 Thunderbolt 4 Docking Station',
        category: 'Electronics',
        description: 'Triple 4K display output, 100W PD passthrough, Gigabit Ethernet',
        price: 179.95,
        quantity: 8,
        reorderThreshold: 10, // LOW STOCK ALERT
      },
      {
        sku: 'NETW-RT-001',
        name: 'Wi-Fi 7 Tri-Band Mesh Router',
        category: 'Networking',
        description: 'Up to 9300 Mbps bandwidth, 2.5G WAN/LAN ports, ultra-low latency',
        price: 219.0,
        quantity: 12,
        reorderThreshold: 5,
      },
      {
        sku: 'NETW-CB-002',
        name: 'Cat6 Shielded Patch Cable (50ft)',
        category: 'Networking',
        description: 'Snagless RJ45 connectors, pure bare copper wire, 550MHz',
        price: 18.25,
        quantity: 65,
        reorderThreshold: 15,
      },
      {
        sku: 'OFFC-CH-001',
        name: 'High-Back Ergonomic Mesh Chair',
        category: 'Office Supplies',
        description: 'Adjustable lumbar support, 3D armrests, heavy duty class 4 cylinder',
        price: 269.0,
        quantity: 4,
        reorderThreshold: 8, // LOW STOCK ALERT
      },
      {
        sku: 'OFFC-NB-002',
        name: 'Hardcover Dot-Grid Executive Notebooks (3-Pack)',
        category: 'Office Supplies',
        description: '120gsm acid-free bleed-proof paper with ribbon bookmarks',
        price: 24.99,
        quantity: 80,
        reorderThreshold: 20,
      },
      {
        sku: 'PACK-BX-001',
        name: 'Corrugated Shipping Boxes 12x9x4 (Pack of 25)',
        category: 'Packaging & Shipping',
        description: 'ECT-32 single wall corrugated cardboard, recyclable',
        price: 32.5,
        quantity: 50,
        reorderThreshold: 15,
      },
      {
        sku: 'PACK-LB-002',
        name: 'Thermal Shipping Label Rolls 4x6 (6 Rolls)',
        category: 'Packaging & Shipping',
        description: 'Direct thermal permanent adhesive labels, perforated',
        price: 29.99,
        quantity: 6,
        reorderThreshold: 15, // LOW STOCK ALERT
      },
    ]

    const productMap = new Map()
    for (const p of productsData) {
      let prod = (await client.query('SELECT id, sku, quantity FROM products WHERE upper(sku) = upper($1)', [p.sku])).rows[0]
      if (!prod) {
        const catId = categoryMap.get(p.category)
        const res = await client.query(
          `INSERT INTO products (sku, name, category_id, description, price, quantity, reorder_threshold, status)
           VALUES (upper($1), $2, $3, $4, $5, $6, $7, 'active')
           RETURNING id, sku, quantity`,
          [p.sku, p.name, catId, p.description, p.price, p.quantity, p.reorderThreshold]
        )
        prod = res.rows[0]
        console.log(`Created product: ${p.sku} - ${p.name}`)

        // Create initial stock movement
        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity_delta, balance_after, reason, actor_user_id)
           VALUES ($1, 'stock_in', $2, $2, 'Initial warehouse inventory intake', $3)`,
          [prod.id, p.quantity, adminUser.id]
        )
      }
      productMap.set(p.sku, prod.id)
    }

    // 4. Seed Sample Orders if no orders exist yet
    const orderCountRes = await client.query('SELECT count(*)::int AS count FROM orders')
    if (orderCountRes.rows[0].count === 0) {
      console.log('Seeding initial sample orders...')

      // Sample Order 1: Acme Logistics
      const kbId = productMap.get('ELEC-KB-001')
      const moId = productMap.get('ELEC-MO-002')

      const o1Res = await client.query(
        `INSERT INTO orders (created_by, customer_name, customer_email, status, total_amount)
         VALUES ($1, 'Acme Logistics Corp', 'purchasing@acmelogistics.com', 'placed', 229.48)
         RETURNING id`,
        [empUser.id]
      )
      const order1Id = o1Res.rows[0].id

      await client.query(
        `INSERT INTO order_items (order_id, product_id, sku_snapshot, product_name_snapshot, unit_price, quantity, line_total)
         VALUES 
         ($1, $2, 'ELEC-KB-001', 'Wireless Mechanical Keyboard', 89.99, 2, 179.98),
         ($1, $3, 'ELEC-MO-002', 'Ergonomic Vertical Mouse', 49.50, 1, 49.50)`,
        [order1Id, kbId, moId]
      )

      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity_delta, balance_after, reason, actor_user_id, related_order_id)
         VALUES 
         ($1, 'order_deduction', -2, 43, 'Order #${order1Id} for Acme Logistics Corp', $3, $4),
         ($2, 'order_deduction', -1, 27, 'Order #${order1Id} for Acme Logistics Corp', $3, $4)`,
        [kbId, moId, empUser.id, order1Id]
      )

      // Sample Order 2: Apex Studio
      const dockId = productMap.get('ELEC-DK-004')
      const o2Res = await client.query(
        `INSERT INTO orders (created_by, customer_name, customer_email, status, total_amount)
         VALUES ($1, 'Apex Creative Studio', 'billing@apexstudio.io', 'placed', 179.95)
         RETURNING id`,
        [adminUser.id]
      )
      const order2Id = o2Res.rows[0].id

      await client.query(
        `INSERT INTO order_items (order_id, product_id, sku_snapshot, product_name_snapshot, unit_price, quantity, line_total)
         VALUES ($1, $2, 'ELEC-DK-004', '12-in-1 Thunderbolt 4 Docking Station', 179.95, 1, 179.95)`,
        [order2Id, dockId]
      )

      await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity_delta, balance_after, reason, actor_user_id, related_order_id)
         VALUES ($1, 'order_deduction', -1, 7, 'Order #${order2Id} for Apex Creative Studio', $2, $3)`,
        [dockId, adminUser.id, order2Id]
      )

      console.log('Sample orders seeded successfully.')
    }

    await client.query('COMMIT')
    console.log('Seeding completed successfully!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', error)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
