import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { StatusBadge } from '../components/Badge.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { ProductFormModal } from './ProductFormModal.jsx'
import {
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  Archive,
  CheckCircle2,
  Eye,
} from 'lucide-react'

export function Products() {
  const { isAdmin } = useAuth()
  const [searchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'active')
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStockOnly') === 'true')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories()
      setCategories(res)
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getProducts({
        page,
        limit: 15,
        search,
        categoryId,
        status,
        lowStockOnly,
      })
      setProducts(res.products)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, status, lowStockOnly])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Are you sure you want to archive product '${name}'? This will prevent new orders.`)) {
      return
    }
    try {
      await api.archiveProduct(id)
      setActionSuccess(`Product '${name}' archived successfully.`)
      setTimeout(() => setActionSuccess(''), 4000)
      fetchProducts()
    } catch (err) {
      alert(err.message || 'Failed to archive product')
    }
  }

  return (
    <div className="space-y-6">
      {/* Action banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage inventory SKUs, stock levels, and alert thresholds</p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setSelectedProduct(null)
              setModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
              <option value="all">All Statuses</option>
            </select>

            {/* Low stock toggle button */}
            <button
              type="button"
              onClick={() => {
                setLowStockOnly(!lowStockOnly)
                setPage(1)
              }}
              className={`px-3 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                lowStockOnly
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Low Stock Only
            </button>

            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Product Table */}
      <Card className="p-0">
        {loading ? (
          <LoadingSpinner text="Loading product inventory..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products match your criteria"
            description="Try modifying search keywords or clearing active filters."
            action={
              (search || categoryId || lowStockOnly) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setCategoryId('')
                    setLowStockOnly(false)
                    setStatus('active')
                  }}
                >
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      <Link to={`/products/${prod.id}`} className="hover:text-indigo-600">
                        {prod.sku}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                      <Link to={`/products/${prod.id}`} className="hover:text-indigo-600 line-clamp-1">
                        {prod.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{prod.description || 'No description'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{prod.category_name}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      ${Number(prod.price).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`font-bold ${
                            prod.is_low_stock ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {prod.quantity}
                        </span>
                        <span className="text-slate-400 text-[11px]">/ {prod.reorder_threshold} min</span>
                        {prod.is_low_stock && (
                          <span title="Below reorder threshold!">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-0.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={prod.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/products/${prod.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Details & Movement Log"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedProduct(prod)
                                setModalOpen(true)
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {prod.status === 'active' && (
                              <button
                                onClick={() => handleArchive(prod.id, prod.name)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Archive Product"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} limit={15} total={total} onPageChange={(p) => setPage(p)} />
      </Card>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        categories={categories}
        onSave={() => {
          setActionSuccess(selectedProduct ? 'Product updated successfully.' : 'New product created successfully.')
          setTimeout(() => setActionSuccess(''), 4000)
          fetchProducts()
        }}
      />
    </div>
  )
}
