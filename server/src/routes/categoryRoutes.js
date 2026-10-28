import { Router } from 'express'
import { categoryController } from '../controllers/categoryController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'

const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(100),
})

const router = Router()

router.use(authenticate)

router.get('/', categoryController.listCategories)
router.post('/', requireRole('admin'), validate(createCategorySchema), categoryController.createCategory)

export default router
