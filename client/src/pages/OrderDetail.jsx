import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import {
  ArrowLeft,
  User,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  Package,
} from 'lucide-react'

export function OrderDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getOrder(id)
      setOrder(res)
    } catch (err) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleCancelOrder = async () => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this order? This will restock all inventory items and record transaction cancellations.'
      )
    ) {
      return
    }

    setCancelling(true)
    setError('')
    try {
      await api.cancelOrder(id)
      setSuccess('Order has been cancelled and warehouse stock has been restored.')
      fetchOrder()
    } catch (err) {
      setError(err.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <LoadingSpinner text="Retrieving order breakdown..." />

  if (error && !order) {
    return (
      <div className="p-6 bg-white rounded-xl border border-rose-200 text-center">
        <p className="text-rose-600 font-semibold">{error}</p>
        <Link to="/orders" className="mt-4 inline-flex items-center text-xs text-indigo-600 font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled'

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/orders"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Customer Orders
        </Link>

        {isAdmin && !isCancelled && (
          <Button variant="danger" loading={cancelling} onClick={handleCancelOrder}>
            <AlertOctagon className="w-4 h-4 mr-1.5" /> Cancel Order & Restock Inventory
          </Button>
        )}
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Order Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-mono text-sm font-bold text-slate-900">Order #{order.id}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.created_at).toLocaleString()} by{' '}
              <span className="font-semibold text-slate-700">{order.created_by_name}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase">Order Grand Total</span>
            <p className="text-2xl font-extrabold text-indigo-600">${Number(order.total_amount).toFixed(2)}</p>
          </div>
        </div>

        {/* Customer & Processing Details */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Customer Details
            </h4>
            <p className="font-bold text-slate-800 text-sm">{order.customer_name}</p>
            <p className="text-slate-500 mt-0.5">{order.customer_email || 'No contact email provided'}</p>
          </div>

          <div>
            <h4 className="font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Placed Timestamp
            </h4>
            <p className="font-medium text-slate-800">{new Date(order.created_at).toLocaleString()}</p>
            <p className="text-slate-400 text-[11px]">Staff Operator ID: #{order.created_by}</p>
          </div>

          <div>
            <h4 className="font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Order Status
            </h4>
            {isCancelled ? (
              <div>
                <p className="font-bold text-rose-600">Cancelled</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Cancelled by {order.cancelled_by_name || 'Admin'} on{' '}
                  {order.cancelled_at ? new Date(order.cancelled_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            ) : (
              <p className="font-bold text-emerald-600">Active / Fulfilled</p>
            )}
          </div>
        </div>
      </Card>

      {/* Line Items Table with Price/SKU Snapshots */}
      <Card
        title="Purchased Products & Snapshots"
        subtitle="Historical snapshots of SKU, product title, and price at the exact moment of order placement"
      >
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-5">Snapshot SKU</th>
                <th className="py-2.5 px-4">Snapshot Product Title</th>
                <th className="py-2.5 px-4 text-right">Locked Unit Price</th>
                <th className="py-2.5 px-4 text-center">Allocated Quantity</th>
                <th className="py-2.5 px-5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items &&
                order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-mono font-bold text-slate-800">
                      <Link to={`/products/${item.product_id}`} className="hover:text-indigo-600">
                        {item.sku_snapshot}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <Link to={`/products/${item.product_id}`} className="hover:text-indigo-600">
                        {item.product_name_snapshot}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-5 text-right font-extrabold text-slate-900">
                      ${Number(item.line_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={4} className="py-3 px-5 text-right text-slate-700 uppercase">
                  Grand Total
                </td>
                <td className="py-3 px-5 text-right text-base text-indigo-600 font-extrabold">
                  ${Number(order.total_amount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
