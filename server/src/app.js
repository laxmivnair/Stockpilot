import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pool } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import stockMovementRoutes from './routes/stockMovementRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

export const app = express()

app.disable('x-powered-by')

app.use(
  cors({
    origin: true,
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '100kb' }))

// Health check endpoint
app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch {
    response.status(503).json({
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.' },
    })
  }
})

// Feature routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/stock-movements', stockMovementRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404 Not Found handler
app.use((_request, response) => {
  response.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found.' },
  })
})

// Centralized error handler
app.use(errorHandler)
