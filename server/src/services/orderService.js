import { pool } from '../config/db.js'
import { ordersRepository } from '../repositories/ordersRepository.js'
import { productsRepository } from '../repositories/productsRepository.js'
import { stockMovementsRepository } from '../repositories/stockMovementsRepository.js'
import { calculateLineTotal, sumAmounts } from '../utils/money.js'
import { BadRequestError, NotFoundError, InsufficientStockError } from '../errors/AppError.js'

export const orderService = {
  async listOrders(filters) {
    return ordersRepository.listOrders(filters)
  },

  async getOrder(id) {
    const order = await ordersRepository.findById(id)
    if (!order) {
      throw new NotFoundError('Order not found')
    }
    return order
  },

  /**
   * Places an order atomically with PostgreSQL transactions and pessimistic row-level locking.
   * Concurrency-safe: prevents race conditions and inventory over-allocation.
   * Deadlock-free: locks products in deterministic sorted ID order.
   */
  async createOrder({ customerName, customerEmail, items }, actorUserId) {
    if (!items || items.length === 0) {
      throw new BadRequestError('Order must contain at least one item')
    }

    // Consolidate duplicate products within the same order if user submitted duplicate rows
    const itemMap = new Map()
    for (const item of items) {
      const pid = parseInt(item.productId, 10)
      const qty = parseInt(item.quantity, 10)
      if (itemMap.has(pid)) {
        itemMap.set(pid, itemMap.get(pid) + qty)
      } else {
        itemMap.set(pid, qty)
      }
    }

    const consolidatedItems = Array.from(itemMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }))

    const productIds = consolidatedItems.map((i) => i.productId)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Lock products exclusively with FOR UPDATE in sorted ID order
      const lockedProducts = await productsRepository.lockProductsForUpdate(client, productIds)

      // 2. Verify all products exist
      const productMap = new Map(lockedProducts.map((p) => [p.id, p]))
      for (const item of consolidatedItems) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw new BadRequestError(`Product with ID ${item.productId} was not found`)
        }
        if (product.status !== 'active') {
          throw new BadRequestError(`Product '${product.name}' is archived and cannot be ordered`)
        }
        // 3. Verify sufficient stock
        if (product.quantity < item.quantity) {
          throw new InsufficientStockError(product.name, item.quantity, product.quantity)
        }
      }

      // 4. Calculate item totals and overall order total using exact money helpers
      const itemDetails = consolidatedItems.map((item) => {
        const product = productMap.get(item.productId)
        const lineTotal = calculateLineTotal(product.price, item.quantity)
        return {
          productId: product.id,
          skuSnapshot: product.sku,
          productNameSnapshot: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal,
        }
      })

      const totalAmount = sumAmounts(itemDetails.map((i) => i.lineTotal))

      // 5. Create Order header
      const order = await ordersRepository.createOrderWithClient(client, {
        createdBy: actorUserId,
        customerName,
        customerEmail: customerEmail?.trim() || null,
        totalAmount,
      })

      // 6. Create Order Items & Deduct Inventory & Record Stock Movements
      const savedItems = []
      for (const item of itemDetails) {
        // Insert order item
        const orderItem = await ordersRepository.createOrderItemWithClient(client, {
          orderId: order.id,
          productId: item.productId,
          skuSnapshot: item.skuSnapshot,
          productNameSnapshot: item.productNameSnapshot,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })
        savedItems.push(orderItem)

        // Deduct inventory
        const currentProduct = productMap.get(item.productId)
        const balanceAfter = currentProduct.quantity - item.quantity
        await productsRepository.updateQuantity(item.productId, balanceAfter, client)

        // Record stock movement (order_deduction)
        await stockMovementsRepository.createMovementWithClient(client, {
          productId: item.productId,
          movementType: 'order_deduction',
          quantityDelta: -item.quantity,
          balanceAfter,
          reason: `Order #${order.id} for ${customerName}`,
          actorUserId,
          relatedOrderId: order.id,
        })
      }

      // 7. Commit transaction
      await client.query('COMMIT')

      return {
        ...order,
        items: savedItems,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  /**
   * Cancels an order, restocks all line items, and records stock movements transactionally.
   */
  async cancelOrder(orderId, actorUserId) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Lock order for update
      const order = await ordersRepository.lockOrderForUpdate(client, orderId)
      if (!order) {
        throw new NotFoundError('Order not found')
      }
      if (order.status === 'cancelled') {
        throw new BadRequestError('This order is already cancelled')
      }

      // 2. Fetch order items
      const fullOrder = await ordersRepository.findById(orderId, client)
      const items = fullOrder.items

      // 3. Lock products in sorted order to avoid deadlocks
      const productIds = items.map((i) => i.product_id)
      const lockedProducts = await productsRepository.lockProductsForUpdate(client, productIds)
      const productMap = new Map(lockedProducts.map((p) => [p.id, p]))

      // 4. Restock each product and log order_cancellation movement
      for (const item of items) {
        const product = productMap.get(item.product_id)
        const currentQty = product ? product.quantity : 0
        const newBalance = currentQty + item.quantity

        await productsRepository.updateQuantity(item.product_id, newBalance, client)

        await stockMovementsRepository.createMovementWithClient(client, {
          productId: item.product_id,
          movementType: 'order_cancellation',
          quantityDelta: item.quantity,
          balanceAfter: newBalance,
          reason: `Restock from cancelled Order #${orderId}`,
          actorUserId,
          relatedOrderId: orderId,
        })
      }

      // 5. Update order status to cancelled
      const updatedOrder = await ordersRepository.updateStatusWithClient(client, orderId, 'cancelled', actorUserId)

      await client.query('COMMIT')

      return {
        ...fullOrder,
        ...updatedOrder,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
}
