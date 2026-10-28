import { Router } from 'express'
import { dashboardController } from '../controllers/dashboardController.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(authenticate, requireRole('admin'))

router.get('/', dashboardController.getDashboardSummary)

export default router
