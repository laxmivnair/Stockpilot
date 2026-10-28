import { categoryService } from '../services/categoryService.js'

export const categoryController = {
  async listCategories(_req, res, next) {
    try {
      const categories = await categoryService.listCategories()
      res.status(200).json(categories)
    } catch (error) {
      next(error)
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name } = req.body
      const category = await categoryService.createCategory(name)
      res.status(201).json(category)
    } catch (error) {
      next(error)
    }
  },
}
