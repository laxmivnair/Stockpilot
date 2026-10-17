import { useEffect, useState } from 'react'

function App() {
  const [connection, setConnection] = useState('checking')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true

    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error('API or database unavailable')
        return response.json()
      })
      .then((data) => {
        if (active) setConnection(data.database === 'connected' ? 'connected' : 'unavailable')
      })
      .catch(() => {
        if (active) setConnection('unavailable')
      })

    return () => { active = false }
  }, [retry])

  function checkAgain() {
    setConnection('checking')
    setRetry((value) => value + 1)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-14 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xl font-bold text-white">S</div>
          <div>
            <p className="text-lg font-bold leading-tight">StockPilot</p>
            <p className="text-sm text-slate-500">Inventory and order management</p>
          </div>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">Phase 2 · Project setup</span>
        <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">The foundation is ready.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          This screen confirms that the React app can reach the Express API and PostgreSQL.
          Product and order workflows will be added in their planned phases.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Setup status">
          <StatusCard title="React app" status="Ready" description="Vite and Tailwind are configured." />
          <StatusCard title="Express API" status={connection === 'connected' ? 'Ready' : connection === 'checking' ? 'Checking' : 'Unavailable'} description="Requests use the local /api proxy." />
          <StatusCard title="PostgreSQL" status={connection === 'connected' ? 'Connected' : connection === 'checking' ? 'Checking' : 'Unavailable'} description="The health endpoint checks the database." />
        </section>

        {connection === 'unavailable' && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            Start the database and API, then check again. The setup steps are in the README.
          </div>
        )}

        <button className="mt-7 rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" onClick={checkAgain} type="button">
          Check connection
        </button>
      </div>
    </main>
  )
}

function StatusCard({ title, status, description }) {
  const good = status === 'Ready' || status === 'Connected'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-3 text-xl font-semibold ${good ? 'text-emerald-700' : 'text-slate-700'}`}>{status}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

export default App
