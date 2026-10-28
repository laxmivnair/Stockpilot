const API_BASE = '/api'

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('stockpilot_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 204 No Content
  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.error?.message || 'An unexpected error occurred')
    error.code = data?.error?.code || 'UNKNOWN_ERROR'
    error.details = data?.error?.details || null
    error.status = response.status
    throw error
  }

  return data
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Categories
  getCategories: () => apiRequest('/categories'),
  createCategory: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val)
      }
    })
    return apiRequest(`/products?${query.toString()}`)
  },
  getProduct: (id) => apiRequest(`/products/${id}`),
  createProduct: (data) => apiRequest('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveProduct: (id) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  adjustStock: (id, data) => apiRequest(`/products/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify(data) }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val)
      }
    })
    return apiRequest(`/orders?${query.toString()}`)
  },
  getOrder: (id) => apiRequest(`/orders/${id}`),
  createOrder: (data) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id) => apiRequest(`/orders/${id}/cancel`, { method: 'POST' }),

  // Stock Movements
  getStockMovements: (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val)
      }
    })
    return apiRequest(`/stock-movements?${query.toString()}`)
  },

  // Dashboard
  getDashboard: () => apiRequest('/dashboard'),

  // Users
  getUsers: (params = {}) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val)
      }
    })
    return apiRequest(`/users?${query.toString()}`)
  },
  createUser: (data) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUserStatus: (id, isActive) => apiRequest(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
}
