import { categoriesRepository } from '../repositories/categoriesRepository.js'
import { ConflictError, NotFoundError } from '../errors/AppError.js'

export const categoryService = {
  async listCategories() {
    return categoriesRepository.list()
  },

  async createCategory(name) {
    const trimmed = name.trim()
    const existing = await categoriesRepository.findByName(trimmed)
    if (existing) {
      throw new ConflictError(`Category '${trimmed}' already exists`)
    }
    return categoriesRepository.create(trimmed)
  },

  async getCategory(id) {
    const category = await categoriesRepository.findById(id)
    if (!category) {
      throw new NotFoundError('Category not found')
    }
    return category
  },
}
