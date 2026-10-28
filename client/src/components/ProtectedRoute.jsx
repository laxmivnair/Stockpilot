import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingSpinner } from './LoadingSpinner.jsx'
import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-rose-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-600">
            This module requires <span className="font-semibold text-rose-600">Administrator privileges</span>. Your
            account is currently registered as <span className="font-semibold">{user.role}</span>.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return children
}
