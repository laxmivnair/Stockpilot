import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { Card } from '../components/Card.jsx'
import { MovementBadge, StatusBadge } from '../components/Badge.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import {
  Boxes,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'

export function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const res = await api.getDashboard()
        setData(res)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <LoadingSpinner text="Aggregating warehouse metrics..." />

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="mt-1">{error}</p>
      </div>
    )
  }

  const { metrics, inventoryByCategory, recentOrders, recentMovements, lowStockAlerts, salesTrend } = data

  const statCards = [
    {
      title: 'Active Products',
      value: metrics.total_active_products,
      icon: Boxes,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      description: 'SKUs actively managed',
    },
    {
      title: 'Total Stock Units',
      value: metrics.total_inventory_units,
      icon: PackageCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Physical units in warehouse',
    },
    {
      title: 'Low Stock Alerts',
      value: metrics.low_stock_products_count,
      icon: AlertTriangle,
      color: metrics.low_stock_products_count > 0 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-50 border-slate-100',
      description: 'At or below threshold',
      highlight: metrics.low_stock_products_count > 0,
    },
    {
      title: 'Total Orders',
      value: metrics.total_orders,
      icon: ShoppingCart,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
      description: 'All recorded customer orders',
    },
    {
      title: 'Total Revenue',
      value: `$${Number(metrics.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      description: 'Gross completed orders',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className={`bg-white rounded-xl border p-4.5 shadow-2xs transition-all ${
                stat.highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</span>
                <div className={`p-2 rounded-lg border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
            </div>
          )
        })}
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Units by Category */}
        <Card
          title="Warehouse Stock by Category"
          subtitle="Physical inventory distribution across product groups"
        >
          <div className="h-64 w-full pt-2">
            {inventoryByCategory && inventoryByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="category_name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val) => [`${val} units`, 'Stock']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="total_units" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No categories data</div>
            )}
          </div>
        </Card>

        {/* Revenue Trend Area Chart */}
        <Card
          title="Revenue & Order Trend"
          subtitle="Recent 14-day sales performance"
        >
          <div className="h-64 w-full pt-2">
            {salesTrend && salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="order_date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="daily_revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No orders recorded in recent period
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Low Stock Items Action Card */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <Card
          title="Low Stock Warning Items"
          subtitle="Products currently at or below their designated reorder threshold"
          action={
            <Link
              to="/products?lowStockOnly=true"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View All Low Stock <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-5">SKU</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Available Stock</th>
                  <th className="py-2.5 px-4 text-right">Threshold</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockAlerts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-slate-700">{prod.sku}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{prod.name}</td>
                    <td className="py-3 px-4 text-slate-500">{prod.category_name}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{prod.quantity} units</td>
                    <td className="py-3 px-4 text-right text-slate-500">{prod.reorder_threshold} units</td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        to={`/products/${prod.id}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                      >
                        Adjust / Restock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Two-Column Grid: Recent Orders & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card
          title="Recent Orders"
          subtitle="Latest client orders processed in the system"
          action={
            <Link
              to="/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              All Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-5">Order #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono font-bold text-slate-900">#{ord.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{ord.customer_name}</p>
                        <p className="text-[11px] text-slate-400">by {ord.created_by_name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ${Number(ord.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No orders placed yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Stock Activity */}
        <Card
          title="Stock Movement Activity"
          subtitle="Live warehouse inventory change events"
          action={
            <Link
              to="/movements"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Full Log <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-5">Type</th>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4 text-right">Delta</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                  <th className="py-2.5 px-5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMovements && recentMovements.length > 0 ? (
                  recentMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5">
                        <MovementBadge type={m.movement_type} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate max-w-[140px]">{m.product_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.product_sku}</span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          m.quantity_delta > 0 ? 'text-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">{m.balance_after}</td>
                      <td className="py-3 px-5 text-slate-500 truncate max-w-[160px]">{m.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No stock movements recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
