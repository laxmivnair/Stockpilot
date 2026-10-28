import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { Search, Plus, ShoppingCart, Eye } from 'lucide-react'

export function Orders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getOrders({
        page,
        limit: 15,
        search,
        status: status || undefined,
      })
      setOrders(res.orders)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load orders', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track fulfillment status, line totals, and order records</p>
        </div>

        <Link to="/orders/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" /> Create New Order
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="placed">Placed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>

            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <Card className="p-0">
        {loading ? (
          <LoadingSpinner text="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="No customer orders match your query."
            icon={ShoppingCart}
            action={
              <Link to="/orders/new">
                <Button variant="primary" size="sm">
                  Create First Order
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Order #</th>
                  <th className="py-3 px-4">Date Placed</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4 text-center">Items / Units</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      <Link to={`/orders/${ord.id}`} className="hover:text-indigo-600">
                        #{ord.id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(ord.created_at).toLocaleDateString()}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{ord.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{ord.customer_email || 'No email'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{ord.created_by_name}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700">
                      <span className="font-semibold">{ord.items_count}</span> SKUs{' '}
                      <span className="text-slate-400">({ord.total_units} units)</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ${Number(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} limit={15} total={total} onPageChange={(p) => setPage(p)} />
      </Card>
    </div>
  )
}
