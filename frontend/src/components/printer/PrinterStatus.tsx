import { useEffect } from 'react'
import { usePrinterStore } from '../../store/printerStore'

export function PrinterStatus() {
  const { status, loading, error, fetchStatus } = usePrinterStore()

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading && !status) {
    return (
      <div className="bg-surface border border-border rounded p-6">
        <p className="font-mono text-text-muted">Checking printer status...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface border border-red-500/30 rounded p-6">
        <p className="font-mono text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-lg">Printer Status</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              status?.online ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="font-mono text-sm">
            {status?.online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-xs text-text-muted mb-1">IP Address</p>
          <p className="font-mono text-lg">{status?.ip || '—'}</p>
        </div>
        <div>
          <p className="font-mono text-xs text-text-muted mb-1">Language</p>
          <p className="font-mono text-lg">{status?.language || '—'}</p>
        </div>
        <div>
          <p className="font-mono text-xs text-text-muted mb-1">DPI</p>
          <p className="font-mono text-lg">{status?.dpi || '—'}</p>
        </div>
        <div>
          <p className="font-mono text-xs text-text-muted mb-1">Darkness</p>
          <p className="font-mono text-lg">{status?.darkness ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
