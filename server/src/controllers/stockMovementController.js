import { stockMovementService } from '../services/stockMovementService.js'

export const stockMovementController = {
  async listMovements(req, res, next) {
    try {
      const { page, limit, productId, movementType, actorUserId, search } = req.query
      const result = await stockMovementService.listMovements({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        productId: productId ? parseInt(productId, 10) : null,
        movementType: movementType || null,
        actorUserId: actorUserId ? parseInt(actorUserId, 10) : null,
        search,
      })
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getProductMovements(req, res, next) {
    try {
      const productId = parseInt(req.params.productId, 10)
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10
      const movements = await stockMovementService.getProductMovements(productId, limit)
      res.status(200).json(movements)
    } catch (error) {
      next(error)
    }
  },
}
