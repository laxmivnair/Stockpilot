import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { Badge } from '../components/Badge.jsx'
import { Modal } from '../components/Modal.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import {
  Users as UsersIcon,
  Plus,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Search,
} from 'lucide-react'

export function Users() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'employee',
  })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [banner, setBanner] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getUsers({ page, limit: 15, search })
      setUsers(res.users)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load users', err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setModalError('')
    setModalLoading(true)

    try {
      await api.createUser(formData)
      setModalOpen(false)
      setFormData({ fullName: '', email: '', password: '', role: 'employee' })
      setBanner('New staff account registered successfully.')
      setTimeout(() => setBanner(''), 4000)
      fetchUsers()
    } catch (err) {
      setModalError(err.message || 'Failed to create user')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.is_active
    const actionText = nextStatus ? 'activate' : 'deactivate'
    if (!window.confirm(`Are you sure you want to ${actionText} user account '${user.full_name}'?`)) {
      return
    }

    try {
      await api.toggleUserStatus(user.id, nextStatus)
      setBanner(`User '${user.full_name}' was ${actionText}d successfully.`)
      setTimeout(() => setBanner(''), 4000)
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Failed to update user status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Account Administration</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage user authorization, roles, and access credentials</p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setModalError('')
            setModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Register New Account
        </Button>
      </div>

      {banner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{banner}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff accounts by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0">
        {loading ? (
          <LoadingSpinner text="Loading staff records..." />
        ) : users.length === 0 ? (
          <EmptyState
            title="No staff users found"
            description="No user accounts match your search query."
            icon={UsersIcon}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">System Role</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5 font-mono text-slate-500">#{u.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-center">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3.5 h-3.5" /> Employee
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Deactivated</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant={u.is_active ? 'secondary' : 'success'}
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} limit={15} total={total} onPageChange={(p) => setPage(p)} />
      </Card>

      {/* Register User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register New Staff Account"
        maxWidth="max-w-md"
      >
        {modalError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {modalError}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Jane Doe"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Work Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@stockpilot.local"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role & Permissions
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="employee">Employee (View Products & Create Orders)</option>
              <option value="admin">Administrator (Full Control, Restock & User Mgmt)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Register Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
