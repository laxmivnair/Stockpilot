import { useState, useEffect } from 'react'
import { Modal } from '../components/Modal.jsx'
import { Button } from '../components/Button.jsx'
import { api } from '../services/api.js'

export function ProductFormModal({ isOpen, onClose, product = null, categories = [], onSave }) {
  const isEdit = !!product

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    categoryId: '',
    description: '',
    price: '',
    quantity: 0,
    reorderThreshold: 5,
    status: 'active',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        categoryId: product.category_id || '',
        description: product.description || '',
        price: product.price || '',
        quantity: product.quantity || 0,
        reorderThreshold: product.reorder_threshold ?? 5,
        status: product.status || 'active',
      })
    } else {
      setFormData({
        sku: '',
        name: '',
        categoryId: categories[0]?.id || '',
        description: '',
        price: '',
        quantity: 0,
        reorderThreshold: 5,
        status: 'active',
      })
    }
    setError('')
  }, [product, categories, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await api.updateProduct(product.id, {
          name: formData.name,
          categoryId: parseInt(formData.categoryId, 10),
          description: formData.description,
          price: parseFloat(formData.price),
          reorderThreshold: parseInt(formData.reorderThreshold, 10),
          status: formData.status,
        })
      } else {
        await api.createProduct({
          sku: formData.sku,
          name: formData.name,
          categoryId: parseInt(formData.categoryId, 10),
          description: formData.description,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity, 10),
          reorderThreshold: parseInt(formData.reorderThreshold, 10),
        })
      }
      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Product: ${product.sku}` : 'Add New Inventory Product'}
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* SKU */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              SKU <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. ELEC-KB-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="" disabled>Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ergonomic Mechanical Keyboard"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed specs, switch types, dimensions..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Price */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Price ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Initial Quantity (Only when adding) */}
          {!isEdit ? (
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Reorder Threshold */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reorder Alert Level
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.reorderThreshold}
              onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
