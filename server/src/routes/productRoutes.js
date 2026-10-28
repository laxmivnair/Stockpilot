import { Router } from 'express'
import { productController } from '../controllers/productController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { createProductSchema, updateProductSchema, adjustStockSchema } from '../schemas/index.js'

const router = Router()

router.use(authenticate)

// All authenticated users (Admin & Employee) can search and view products
router.get('/', productController.listProducts)
router.get('/:id', productController.getProduct)

// Admin-only operations
router.post('/', requireRole('admin'), validate(createProductSchema), productController.createProduct)
router.put('/:id', requireRole('admin'), validate(updateProductSchema), productController.updateProduct)
router.delete('/:id', requireRole('admin'), productController.archiveProduct)
router.post('/:id/adjust-stock', requireRole('admin'), validate(adjustStockSchema), productController.adjustStock)

export default router
