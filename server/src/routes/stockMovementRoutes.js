import { Router } from 'express'
import { stockMovementController } from '../controllers/stockMovementController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate)

router.get('/', requireRole('admin'), stockMovementController.listMovements)
router.get('/product/:productId', stockMovementController.getProductMovements)

export default router
