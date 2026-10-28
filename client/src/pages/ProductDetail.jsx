import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { StatusBadge, MovementBadge } from '../components/Badge.jsx'
import { Modal } from '../components/Modal.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import {
  ArrowLeft,
  Boxes,
  AlertTriangle,
  PackagePlus,
  Sliders,
  CheckCircle2,
} from 'lucide-react'

export function ProductDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Adjust stock modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustType, setAdjustType] = useState('stock_in') // 'stock_in' | 'adjustment'
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustSubmitting, setAdjustSubmitting] = useState(false)
  const [adjustError, setAdjustError] = useState('')
  const [successBanner, setSuccessBanner] = useState('')

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getProduct(id)
      setProduct(res)
    } catch (err) {
      setError(err.message || 'Product not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    setAdjustError('')
    setAdjustSubmitting(true)

    try {
      const delta = adjustType === 'stock_in' ? Math.abs(parseInt(adjustQty, 10)) : parseInt(adjustQty, 10)
      if (isNaN(delta) || delta === 0) {
        throw new Error('Please enter a valid non-zero quantity')
      }

      await api.adjustStock(id, {
        quantityDelta: delta,
        reason: adjustReason,
        movementType: adjustType,
      })

      setAdjustModalOpen(false)
      setAdjustQty('')
      setAdjustReason('')
      setSuccessBanner('Stock level updated and transaction audit logged.')
      setTimeout(() => setSuccessBanner(''), 4000)
      fetchProduct()
    } catch (err) {
      setAdjustError(err.message || 'Failed to adjust stock')
    } finally {
      setAdjustSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner text="Fetching product specs & history..." />

  if (error || !product) {
    return (
      <div className="p-6 bg-white rounded-xl border border-rose-200 text-center">
        <p className="text-rose-600 font-semibold">{error || 'Product not found'}</p>
        <Link to="/products" className="mt-4 inline-flex items-center text-xs text-indigo-600 font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Link>
      </div>
    )
  }

  const isLowStock = product.quantity <= product.reorder_threshold

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/products"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Product Catalog
        </Link>

        {isAdmin && product.status === 'active' && (
          <Button variant="primary" onClick={() => setAdjustModalOpen(true)}>
            <Sliders className="w-4 h-4 mr-1.5" /> Adjust / Restock Stock
          </Button>
        )}
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Product Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {product.sku}
                  </span>
                  <StatusBadge status={product.status} />
                  <span className="text-xs text-slate-500 font-medium">{product.category_name}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{product.name}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase">Unit Price</span>
                <p className="text-2xl font-extrabold text-slate-900">${Number(product.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.description || 'No description provided for this SKU.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Product ID</span>
                  <span className="font-mono text-slate-800 font-bold">#{product.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Created Timestamp</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Last Updated</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Inventory Status Card */}
        <div className="space-y-6">
          <Card title="Warehouse Stock Health">
            <div className="text-center py-4">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 ${
                  isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                <Boxes className="w-8 h-8" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{product.quantity} units</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Available for order allocation</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Reorder Alert Threshold:</span>
                <span className="font-bold text-slate-800">{product.reorder_threshold} units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Inventory Status:</span>
                {isLowStock ? (
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700">Healthy Stock</span>
                )}
              </div>
            </div>

            {isAdmin && product.status === 'active' && (
              <div className="mt-5">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setAdjustType('stock_in')
                    setAdjustModalOpen(true)
                  }}
                  className="w-full"
                >
                  <PackagePlus className="w-4 h-4 mr-1.5 text-emerald-600" /> Quick Stock-In
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Stock Movement Audit Log for this product */}
      <Card
        title="Stock Movement Audit Trail"
        subtitle="Complete chronological transaction log for this product"
      >
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-5">Type</th>
                <th className="py-2.5 px-4 text-right">Delta</th>
                <th className="py-2.5 px-4 text-right">Balance After</th>
                <th className="py-2.5 px-4">Reason / Notes</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {product.recentMovements && product.recentMovements.length > 0 ? (
                product.recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5">
                      <MovementBadge type={m.movement_type} />
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        m.quantity_delta > 0 ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">{m.balance_after}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {m.reason}
                      {m.related_order_id && (
                        <Link
                          to={`/orders/${m.related_order_id}`}
                          className="ml-2 font-mono text-indigo-600 hover:underline"
                        >
                          (View Order #{m.related_order_id})
                        </Link>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{m.actor_name}</td>
                    <td className="py-3 px-5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No movement events recorded for this product
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Inventory: ${product.sku}`}
        maxWidth="max-w-md"
      >
        {adjustError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {adjustError}
          </div>
        )}

        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('stock_in')}
                className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                  adjustType === 'stock_in'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Stock In (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('adjustment')}
                className={`py-2 px-3 rounded-lg font-semibold border text-center transition-colors cursor-pointer ${
                  adjustType === 'adjustment'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Manual Adjustment (+/-)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {adjustType === 'stock_in' ? 'Quantity to Add (+)' : 'Quantity Delta (Use negative to reduce)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder={adjustType === 'stock_in' ? 'e.g. 20' : 'e.g. -5 or 10'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Current Stock: {product.quantity} units</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Audit Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Vendor delivery PO #592, warehouse count correction, or damaged items disposal"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setAdjustModalOpen(false)} disabled={adjustSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={adjustSubmitting}>
              Commit Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
