import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { Layout } from './components/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Products } from './pages/Products.jsx'
import { ProductDetail } from './pages/ProductDetail.jsx'
import { Orders } from './pages/Orders.jsx'
import { CreateOrder } from './pages/CreateOrder.jsx'
import { OrderDetail } from './pages/OrderDetail.jsx'
import { StockMovements } from './pages/StockMovements.jsx'
import { Users } from './pages/Users.jsx'

function HomeRedirect() {
  const { isAdmin } = useAuth()
  return <Navigate to={isAdmin ? '/dashboard' : '/products'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            
            {/* Admin-only Dashboard */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Product Management */}
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />

            {/* Order Processing */}
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<CreateOrder />} />
            <Route path="orders/:id" element={<OrderDetail />} />

            {/* Admin-only Audit Trail & Account Management */}
            <Route
              path="movements"
              element={
                <ProtectedRoute adminOnly={true}>
                  <StockMovements />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
