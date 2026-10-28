import { userService } from '../services/userService.js'

export const userController = {
  async listUsers(req, res, next) {
    try {
      const { page, limit, search } = req.query
      const result = await userService.listUsers({ page, limit, search })
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body)
      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  },

  async toggleActive(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const { isActive } = req.body
      const user = await userService.toggleUserActive(id, isActive)
      res.status(200).json(user)
    } catch (error) {
      next(error)
    }
  },
}
