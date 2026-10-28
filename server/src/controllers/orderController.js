import { orderService } from '../services/orderService.js'

export const orderController = {
  async listOrders(req, res, next) {
    try {
      const { page, limit, search, status } = req.query
      // Employees can only view orders or all orders depending on business rule;
      // here employees and admins can view orders, but admins can filter by creator
      const result = await orderService.listOrders({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        status: status || null,
      })
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getOrder(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const order = await orderService.getOrder(id)
      res.status(200).json(order)
    } catch (error) {
      next(error)
    }
  },

  async createOrder(req, res, next) {
    try {
      const order = await orderService.createOrder(req.body, req.user.id)
      res.status(201).json(order)
    } catch (error) {
      next(error)
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const order = await orderService.cancelOrder(id, req.user.id)
      res.status(200).json({ message: 'Order cancelled and stock restored successfully', order })
    } catch (error) {
      next(error)
    }
  },
}
