import { stockMovementsRepository } from '../repositories/stockMovementsRepository.js'

export const stockMovementService = {
  async listMovements(filters) {
    return stockMovementsRepository.list(filters)
  },

  async getProductMovements(productId, limit) {
    return stockMovementsRepository.getByProductId(productId, limit)
  },
}
