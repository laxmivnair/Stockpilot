import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { createOrderSchema } from '../schemas/index.js'

const router = Router()

router.use(authenticate)

router.get('/', orderController.listOrders)
router.get('/:id', orderController.getOrder)
router.post('/', validate(createOrderSchema), orderController.createOrder)
router.post('/:id/cancel', requireRole('admin'), orderController.cancelOrder)

export default router
