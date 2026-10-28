import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  PlusCircle,
  History,
  Users,
  LogOut,
  Layers,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, isAdmin, logout } = useAuth()

  const navItems = [
    ...(isAdmin
      ? [
          {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
        ]
      : []),
    {
      name: 'Products',
      path: '/products',
      icon: Boxes,
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: ShoppingCart,
    },
    {
      name: 'New Order',
      path: '/orders/new',
      icon: PlusCircle,
    },
    ...(isAdmin
      ? [
          {
            name: 'Stock Movements',
            path: '/movements',
            icon: History,
          },
          {
            name: 'User Management',
            path: '/users',
            icon: Users,
          },
        ]
      : []),
  ]

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">StockPilot</span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-indigo-400">Inventory Engine</span>
        </div>
      </div>

      {/* User Badge */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-xs">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <UserCheck className="w-3 h-3" /> Employee
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen?.(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Logout button */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-800 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  )
}
