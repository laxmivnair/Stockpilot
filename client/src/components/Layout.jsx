import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Navbar } from './Navbar.jsx'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Executive Dashboard'
    if (pathname.startsWith('/products/new')) return 'Add New Product'
    if (pathname.startsWith('/products/') && pathname !== '/products') return 'Product Details & Stock History'
    if (pathname.startsWith('/products')) return 'Inventory & Products'
    if (pathname.startsWith('/orders/new')) return 'Create Customer Order'
    if (pathname.startsWith('/orders/') && pathname !== '/orders') return 'Order Breakdown'
    if (pathname.startsWith('/orders')) return 'Customer Orders'
    if (pathname.startsWith('/movements')) return 'Stock Movement Audit Log'
    if (pathname.startsWith('/users')) return 'User Administration'
    return 'StockPilot'
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMobileMenuClick={() => setMobileOpen(true)} title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
