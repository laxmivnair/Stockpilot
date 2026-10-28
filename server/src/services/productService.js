import { pool } from '../config/db.js'
import { productsRepository } from '../repositories/productsRepository.js'
import { categoriesRepository } from '../repositories/categoriesRepository.js'
import { stockMovementsRepository } from '../repositories/stockMovementsRepository.js'
import { ConflictError, NotFoundError, BadRequestError } from '../errors/AppError.js'

export const productService = {
  async listProducts(filters) {
    return productsRepository.list(filters)
  },

  async getProduct(id) {
    const product = await productsRepository.findById(id)
    if (!product) {
      throw new NotFoundError('Product not found')
    }
    const recentMovements = await stockMovementsRepository.getByProductId(id, 10)
    return {
      ...product,
      recentMovements,
    }
  },

  async createProduct(data, actorUserId) {
    const existingSku = await productsRepository.findBySku(data.sku)
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${data.sku.toUpperCase()}' already exists`)
    }

    const category = await categoriesRepository.findById(data.categoryId)
    if (!category) {
      throw new BadRequestError(`Category with ID ${data.categoryId} does not exist`)
    }

    const initialQuantity = parseInt(data.quantity || 0, 10)

    // If initial quantity is 0, simple insert
    if (initialQuantity === 0) {
      return productsRepository.create(data)
    }

    // If initial quantity > 0, record product and initial stock_in movement atomically
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const product = await productsRepository.create(data, client)

      await stockMovementsRepository.createMovementWithClient(client, {
        productId: product.id,
        movementType: 'stock_in',
        quantityDelta: initialQuantity,
        balanceAfter: initialQuantity,
        reason: 'Initial stock on product creation',
        actorUserId,
      })

      await client.query('COMMIT')
      return product
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  async updateProduct(id, fields) {
    const product = await productsRepository.findById(id)
    if (!product) {
      throw new NotFoundError('Product not found')
    }

    if (fields.categoryId) {
      const category = await categoriesRepository.findById(fields.categoryId)
      if (!category) {
        throw new BadRequestError(`Category with ID ${fields.categoryId} does not exist`)
      }
    }

    return productsRepository.update(id, fields)
  },

  async archiveProduct(id) {
    const product = await productsRepository.findById(id)
    if (!product) {
      throw new NotFoundError('Product not found')
    }
    return productsRepository.archive(id)
  },

  /**
   * Adjust product stock with transactional consistency and row-level locking.
   */
  async adjustStock(productId, { quantityDelta, reason, movementType = 'adjustment' }, actorUserId) {
    const delta = parseInt(quantityDelta, 10)
    if (delta === 0) {
      throw new BadRequestError('Adjustment delta cannot be 0')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Acquire exclusive row lock on product to prevent concurrent modifications
      const lockedProducts = await productsRepository.lockProductsForUpdate(client, [productId])
      if (lockedProducts.length === 0) {
        throw new NotFoundError('Product not found')
      }

      const product = lockedProducts[0]
      const currentStock = parseInt(product.quantity, 10)
      const newStock = currentStock + delta

      if (newStock < 0) {
        throw new BadRequestError(
          `Cannot adjust stock: resulting stock cannot be negative (current: ${currentStock}, adjustment: ${delta})`
        )
      }

      // Check movement type constraints based on DB schema:
      // stock_in requires delta > 0.
      let effectiveType = movementType
      if (effectiveType === 'stock_in' && delta < 0) {
        effectiveType = 'adjustment'
      }

      // 1. Update product quantity
      await productsRepository.updateQuantity(productId, newStock, client)

      // 2. Insert stock movement log
      const movement = await stockMovementsRepository.createMovementWithClient(client, {
        productId,
        movementType: effectiveType,
        quantityDelta: delta,
        balanceAfter: newStock,
        reason,
        actorUserId,
      })

      await client.query('COMMIT')

      return {
        product: { ...product, quantity: newStock },
        movement,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
}
