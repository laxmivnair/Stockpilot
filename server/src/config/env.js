import { config } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

// In production, the hosting platform supplies these values directly.
config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true })

const schema = z.object({
  DATABASE_URL: z.url().startsWith('postgresql://').or(z.url().startsWith('postgres://')),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  throw new Error('Invalid server configuration. Check DATABASE_URL, DATABASE_SSL and PORT in .env.')
}

export const env = result.data
