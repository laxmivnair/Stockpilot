import { PackageOpen } from 'lucide-react'

export function EmptyState({
  title = 'No records found',
  description = 'There are no items matching your current filters or criteria.',
  icon: Icon = PackageOpen,
  action,
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
