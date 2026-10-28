import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export function Navbar({ onMobileMenuClick, title }) {
  const { user, isAdmin, login, logout } = useAuth()

  const handleQuickSwitch = async () => {
    await logout()
    if (isAdmin) {
      await login('employee', 'employee')
    } else {
      await login('admin', 'admin')
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Bifurcation Indicator & Quick Switcher */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Admin Portal
            </span>
            <button
              type="button"
              onClick={handleQuickSwitch}
              className="hidden sm:inline-flex items-center text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="Switch session to Employee mode"
            >
              ⇄ Test as Employee
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Employee Terminal
            </span>
            <button
              type="button"
              onClick={handleQuickSwitch}
              className="hidden sm:inline-flex items-center text-[11px] font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="Switch session to Admin mode"
            >
              ⇄ Test as Admin
            </button>
          </div>
        )}

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
          <p className="text-[11px] text-slate-500 leading-tight">{user?.email}</p>
        </div>
      </div>
    </header>
  )
}
