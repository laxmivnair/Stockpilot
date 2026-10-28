import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  Package,
} from 'lucide-react'

export function CreateOrder() {
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [items, setItems] = useState([]) // array of { product, quantity, lineTotal }

  // Available catalog to choose from
  const [catalog, setCatalog] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [addQty, setAddQty] = useState(1)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true)
        // Fetch active products with reasonable limit
        const res = await api.getProducts({ limit: 100, status: 'active' })
        setCatalog(res.products)
        if (res.products.length > 0) {
          setSelectedProductId(String(res.products[0].id))
        }
      } catch (err) {
        setError(err.message || 'Failed to load catalog products')
      } finally {
        setLoading(false)
      }
    }
    loadCatalog()
  }, [])

  const handleAddItem = (e) => {
    e.preventDefault()
    setError('')
    const prod = catalog.find((p) => p.id === parseInt(selectedProductId, 10))
    if (!prod) return

    const qty = parseInt(addQty, 10)
    if (isNaN(qty) || qty <= 0) {
      setError('Please specify a positive quantity')
      return
    }

    // Check existing in list
    const existingIndex = items.findIndex((i) => i.productId === prod.id)
    if (existingIndex > -1) {
      const currentListQty = items[existingIndex].quantity
      const newTotalQty = currentListQty + qty
      if (newTotalQty > prod.quantity) {
        setError(`Cannot add ${qty} more. Available warehouse stock is ${prod.quantity} (already added: ${currentListQty})`)
        return
      }
      const updated = [...items]
      updated[existingIndex].quantity = newTotalQty
      updated[existingIndex].lineTotal = (newTotalQty * parseFloat(prod.price)).toFixed(2)
      setItems(updated)
    } else {
      if (qty > prod.quantity) {
        setError(`Requested quantity (${qty}) exceeds available warehouse stock (${prod.quantity})`)
        return
      }
      setItems([
        ...items,
        {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          price: parseFloat(prod.price),
          available: prod.quantity,
          quantity: qty,
          lineTotal: (qty * parseFloat(prod.price)).toFixed(2),
        },
      ])
    }

    setAddQty(1)
  }

  const handleQuantityChange = (productId, newQty) => {
    const qty = parseInt(newQty, 10)
    if (isNaN(qty) || qty <= 0) return

    const updated = items.map((item) => {
      if (item.productId === productId) {
        if (qty > item.available) {
          setError(`Max available stock for ${item.name} is ${item.available}`)
          return item
        }
        return {
          ...item,
          quantity: qty,
          lineTotal: (qty * item.price).toFixed(2),
        }
      }
      return item
    })
    setItems(updated)
  }

  const handleRemoveItem = (productId) => {
    setItems(items.filter((i) => i.productId !== productId))
  }

  const orderTotal = items.reduce((acc, curr) => acc + parseFloat(curr.lineTotal), 0).toFixed(2)
  const totalUnits = items.reduce((acc, curr) => acc + curr.quantity, 0)

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    setError('')

    if (!customerName.trim()) {
      setError('Please enter a customer name')
      return
    }

    if (items.length === 0) {
      setError('Please add at least one product item to the order')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }

      const res = await api.createOrder(payload)
      navigate(`/orders/${res.id}`)
    } catch (err) {
      setError(err.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading product inventory..." />

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Customer Order</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Atomic order fulfillment with real-time stock allocation and transaction logs
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Item Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <Card title="Customer Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="purchasing@acme.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Add Product To Order Card */}
          <Card title="Select Products">
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-8">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select SKU / Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {catalog.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.sku} — {p.name} (${Number(p.price).toFixed(2)}) [{p.quantity} in stock]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button type="submit" variant="secondary" className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Order Items Table */}
          <Card title={`Order Line Items (${items.length})`}>
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No products added yet. Select a product above to add to this order.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 -mb-5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-5">Product</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-center">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Line Total</th>
                      <th className="py-2.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50/60">
                        <td className="py-3 px-5">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{item.sku}</p>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-700 font-medium">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.available}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">${item.lineTotal}</td>
                        <td className="py-3 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-6">
          <Card title="Order Summary">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Unique Items:</span>
                <span className="font-semibold text-slate-800">{items.length} SKUs</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Units:</span>
                <span className="font-semibold text-slate-800">{totalUnits} units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax & Shipping:</span>
                <span className="font-semibold text-slate-500">$0.00 (Standard)</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Grand Total:</span>
                <span className="text-2xl font-extrabold text-indigo-600">${orderTotal}</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={items.length === 0 || !customerName.trim()}
                onClick={handleSubmitOrder}
                className="w-full"
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" /> Place & Commit Order
              </Button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-normal">
              <strong>Atomic Transaction:</strong> Upon submission, row-level locks are acquired, stock is deducted,
              and stock movements are recorded. If any item is out of stock, all changes roll back safely.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
