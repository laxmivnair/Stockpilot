import { Router } from 'express'
import { userController } from '../controllers/userController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { createUserSchema, paginationSchema } from '../schemas/index.js'

const router = Router()

// All user management routes require admin role
router.use(authenticate, requireRole('admin'))

router.get('/', validate(paginationSchema, 'query'), userController.listUsers)
router.post('/', validate(createUserSchema), userController.createUser)
router.patch('/:id/status', userController.toggleActive)

export default router
