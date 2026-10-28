import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { MovementBadge } from '../components/Badge.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { Search, History } from 'lucide-react'

export function StockMovements() {
  const [movements, setMovements] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [movementType, setMovementType] = useState('')
  const [page, setPage] = useState(1)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getStockMovements({
        page,
        limit: 20,
        search,
        movementType: movementType || undefined,
      })
      setMovements(res.movements)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load stock movements', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, movementType])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchMovements()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Movement Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable ledger of all warehouse inventory balance changes, intake, and order allocations
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, reason, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Movement Types</option>
              <option value="stock_in">Stock In (+)</option>
              <option value="order_deduction">Order Deduction (-)</option>
              <option value="adjustment">Manual Adjustment (+/-)</option>
              <option value="order_cancellation">Order Cancellation Restock (+)</option>
            </select>

            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Movements Table */}
      <Card className="p-0">
        {loading ? (
          <LoadingSpinner text="Retrieving stock movement ledger..." />
        ) : movements.length === 0 ? (
          <EmptyState
            title="No movements recorded"
            description="No inventory movement records match your search criteria."
            icon={History}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-center">Movement Type</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                  <th className="py-3 px-4 text-right">Ending Balance</th>
                  <th className="py-3 px-4">Reason / Linked Order</th>
                  <th className="py-3 px-5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500">#{m.id}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(m.created_at).toLocaleDateString()}{' '}
                      <span className="text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        to={`/products/${m.product_id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block line-clamp-1"
                      >
                        {m.product_name}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">{m.product_sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <MovementBadge type={m.movement_type} />
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        m.quantity_delta > 0 ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{m.balance_after}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <p>{m.reason}</p>
                      {m.related_order_id && (
                        <Link
                          to={`/orders/${m.related_order_id}`}
                          className="font-mono text-[11px] text-indigo-600 hover:underline block mt-0.5"
                        >
                          View Order #{m.related_order_id} &rarr;
                        </Link>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      <p className="font-medium text-slate-800">{m.actor_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{m.actor_role}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} limit={20} total={total} onPageChange={(p) => setPage(p)} />
      </Card>
    </div>
  )
}
