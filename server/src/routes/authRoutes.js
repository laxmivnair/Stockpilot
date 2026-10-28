import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, registerSchema } from '../schemas/index.js'

const router = Router()

router.post('/login', validate(loginSchema), authController.login)
router.post('/register', validate(registerSchema), authController.register)
router.get('/me', authenticate, authController.getMe)
router.post('/logout', authenticate, authController.logout)

export default router
