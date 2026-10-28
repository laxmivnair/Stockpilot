import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().trim().min(2, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  fullName: z.string().trim().optional(),
  role: z.enum(['admin', 'employee']).default('admin'),
})

export const createUserSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'employee'], { errorMap: () => ({ message: "Role must be 'admin' or 'employee'" }) }),
})

export const createProductSchema = z.object({
  sku: z.string().trim().min(2, 'SKU must be at least 2 characters').max(64, 'SKU must be at most 64 characters'),
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(160, 'Product name must be at most 160 characters'),
  categoryId: z.coerce.number().int().positive('Category ID must be a positive integer'),
  description: z.string().trim().default(''),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  quantity: z.coerce.number().int().min(0, 'Initial quantity must be greater than or equal to 0').default(0),
  reorderThreshold: z.coerce.number().int().min(0, 'Reorder threshold must be greater than or equal to 0').default(0),
})

export const updateProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(160, 'Product name must be at most 160 characters').optional(),
  categoryId: z.coerce.number().int().positive('Category ID must be a positive integer').optional(),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0').optional(),
  reorderThreshold: z.coerce.number().int().min(0, 'Reorder threshold must be greater than or equal to 0').optional(),
  status: z.enum(['active', 'archived']).optional(),
})

export const adjustStockSchema = z.object({
  quantityDelta: z.coerce.number().int().refine((val) => val !== 0, {
    message: 'Stock adjustment delta cannot be zero',
  }),
  reason: z.string().trim().min(3, 'Adjustment reason must be at least 3 characters long'),
  movementType: z.enum(['stock_in', 'adjustment']).default('adjustment'),
})

export const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
})

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name must be at least 2 characters'),
  customerEmail: z.string().trim().email('Invalid customer email address').optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
})
