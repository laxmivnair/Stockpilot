import { productService } from '../services/productService.js'

export const productController = {
  async listProducts(req, res, next) {
    try {
      const { page, limit, search, categoryId, status, lowStockOnly } = req.query
      const result = await productService.listProducts({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        status: status || 'all',
        lowStockOnly: lowStockOnly === 'true',
      })
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },

  async getProduct(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const product = await productService.getProduct(id)
      res.status(200).json(product)
    } catch (error) {
      next(error)
    }
  },

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body, req.user.id)
      res.status(201).json(product)
    } catch (error) {
      next(error)
    }
  },

  async updateProduct(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const product = await productService.updateProduct(id, req.body)
      res.status(200).json(product)
    } catch (error) {
      next(error)
    }
  },

  async archiveProduct(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const product = await productService.archiveProduct(id)
      res.status(200).json({ message: 'Product archived successfully', product })
    } catch (error) {
      next(error)
    }
  },

  async adjustStock(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10)
      const result = await productService.adjustStock(id, req.body, req.user.id)
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  },
}
