import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PrinterStatus } from '../components/printer/PrinterStatus'
import { printerApi, type PrintJob } from '../api/client'

export function Dashboard() {
  const [history, setHistory] = useState<PrintJob[]>([])

  useEffect(() => {
    printerApi.getHistory()
      .then(({ data }) => setHistory(data))
      .catch(() => {})

    const interval = setInterval(() => {
      printerApi.getHistory()
        .then(({ data }) => setHistory(data))
        .catch(() => {})
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatType = (job: PrintJob) => {
    if (job.type === 'test-label' && job.carrier) {
      return job.carrier
    }
    if (job.type === 'test-pattern') {
      return 'Test Pattern'
    }
    if (job.type === 'pdf' && job.filename) {
      return job.filename
    }
    return job.type
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-mono text-2xl font-bold mb-6">Dashboard</h1>

      <PrinterStatus />

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Link
          to="/test-labels"
          className="bg-surface border border-border rounded p-4 hover:border-accent transition-colors"
        >
          <span className="text-2xl mb-2 block">▤</span>
          <h3 className="font-mono text-sm font-bold">Test Labels</h3>
          <p className="font-mono text-xs text-text-muted mt-1">
            Print sample carrier labels
          </p>
        </Link>

        <Link
          to="/print"
          className="bg-surface border border-border rounded p-4 hover:border-accent transition-colors"
        >
          <span className="text-2xl mb-2 block">↑</span>
          <h3 className="font-mono text-sm font-bold">Upload & Print</h3>
          <p className="font-mono text-xs text-text-muted mt-1">
            Upload PDF label to print
          </p>
        </Link>

        <Link
          to="/settings"
          className="bg-surface border border-border rounded p-4 hover:border-accent transition-colors"
        >
          <span className="text-2xl mb-2 block">⚙</span>
          <h3 className="font-mono text-sm font-bold">Settings</h3>
          <p className="font-mono text-xs text-text-muted mt-1">
            Configure printer connection
          </p>
        </Link>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="font-mono text-lg font-bold mb-4">Recent Jobs</h2>
          <div className="bg-surface border border-border rounded">
            {history.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      job.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-mono text-sm">{formatType(job)}</span>
                </div>
                <span className="font-mono text-xs text-text-muted">
                  {formatTime(job.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
