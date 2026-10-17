import express from 'express'
import { pool } from './config/db.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch {
    response.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is unavailable.' } })
  }
})

app.use((_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } })
})
