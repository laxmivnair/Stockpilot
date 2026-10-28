export function Badge({ variant = 'default', children, className = '' }) {
  const styles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
        styles[variant] || styles.default
      } ${className}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'archived':
      return <Badge variant="default">Archived</Badge>
    case 'placed':
      return <Badge variant="success">Placed</Badge>
    case 'cancelled':
      return <Badge variant="danger">Cancelled</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export function MovementBadge({ type }) {
  switch (type) {
    case 'stock_in':
      return <Badge variant="success">Stock In</Badge>
    case 'order_deduction':
      return <Badge variant="blue">Order Deduction</Badge>
    case 'adjustment':
      return <Badge variant="warning">Adjustment</Badge>
    case 'order_cancellation':
      return <Badge variant="purple">Restock / Cancel</Badge>
    default:
      return <Badge>{type}</Badge>
  }
}
