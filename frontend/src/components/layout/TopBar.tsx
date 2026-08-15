import { useEffect } from 'react'
import { usePrinterStore } from '../../store/printerStore'

export function TopBar() {
  const { status, fetchStatus } = usePrinterStore()

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4">
      <div className="font-mono text-sm text-text-secondary">
        {status?.ip ? `Printer: ${status.ip}` : 'No printer configured'}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            status?.online ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="font-mono text-xs text-text-secondary">
          {status?.online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
    </header>
  )
}
