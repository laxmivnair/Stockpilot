import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Layers,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/Button.jsx'

export function Login() {
  // Portal Bifurcation: 'admin' vs 'employee'
  const [selectedPortal, setSelectedPortal] = useState('admin')
  const [isRegister, setIsRegister] = useState(false)

  const [email, setEmail] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  // Handle switching portals
  const handleSelectPortal = (portal) => {
    setSelectedPortal(portal)
    setError('')
    if (portal === 'admin') {
      setEmail('admin')
      setPassword('admin')
    } else {
      setEmail('employee')
      setPassword('employee')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let loggedInUser
      if (isRegister) {
        loggedInUser = await register({
          email,
          password,
          fullName,
          role: selectedPortal,
        })
      } else {
        // Log in, or automatically create account with the chosen role if new!
        loggedInUser = await login(email, password, selectedPortal)
      }

      if (loggedInUser.role === 'admin') {
        navigate('/dashboard')
      } else {
        navigate('/products')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = selectedPortal === 'admin'

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">StockPilot</h2>
        <p className="mt-2 text-sm text-slate-400">
          Full-Stack Inventory & Order Management System
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* PRIMARY ROLE BIFURCATION TABS */}
          <div className="mb-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Select Your Portal Role
            </p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleSelectPortal('admin')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isAdmin
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Administrator
              </button>
              <button
                type="button"
                onClick={() => handleSelectPortal('employee')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isAdmin
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Employee Staff
              </button>
            </div>
          </div>

          {/* Portal Context Banner */}
          <div
            className={`mb-5 p-3 rounded-xl border text-xs flex items-center justify-between ${
              isAdmin
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <p className="font-bold flex items-center gap-1.5">
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                {isAdmin ? 'Administrator Portal' : 'Employee Terminal'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isAdmin
                  ? 'Access dashboard analytics, stock adjustments & user management'
                  : 'Access product catalog, check stock & process customer orders'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAdmin ? 'e.g. Alex Administrator' : 'e.g. Emma Employee'}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdmin ? 'admin or any admin email' : 'employee or any staff email'}
                autoComplete="username"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              variant={isAdmin ? 'primary' : 'success'}
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {isRegister
                ? `Create ${isAdmin ? 'Admin' : 'Employee'} Account`
                : `Sign In as ${isAdmin ? 'Administrator' : 'Employee'}`}{' '}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Pre-Fill Action */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  setEmail('admin')
                  setPassword('admin')
                } else {
                  setEmail('employee')
                  setPassword('employee')
                }
              }}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Reset to Default {isAdmin ? 'Admin' : 'Employee'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              {isRegister ? 'Already have account? Sign in' : '+ Register new account'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Powered by PostgreSQL Concurrency Locks &bull; Express.js &bull; React Vite
        </p>
      </div>
    </div>
  )
}
