import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { testLabelsApi, type TestLabel } from '../api/client'

const carrierLogos: Record<string, string> = {
  USPS: '📦',
  UPS: '📤',
  FedEx: '✈',
}

export function TestLabels() {
  const [labels, setLabels] = useState<TestLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState<string | null>(null)

  useEffect(() => {
    testLabelsApi.getAll()
      .then(({ data }) => setLabels(data))
      .catch(() => toast.error('Failed to load test labels'))
      .finally(() => setLoading(false))
  }, [])

  const handlePrint = async (label: TestLabel) => {
    setPrinting(label.id)
    try {
      await testLabelsApi.print(label.id)
      toast.success(`${label.carrier} label sent to printer`)
    } catch {
      toast.error('Failed to print label')
    } finally {
      setPrinting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="font-mono text-text-muted">Loading test labels...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-mono text-2xl font-bold mb-2">Test Labels</h1>
      <p className="font-mono text-sm text-text-muted mb-6">
        Print sample carrier labels to verify printer configuration
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {labels.map((label) => (
          <div
            key={label.id}
            className="bg-surface border border-border rounded p-5 flex flex-col"
          >
            <div className="text-3xl mb-3">{carrierLogos[label.carrier] || '📄'}</div>
            <h3 className="font-mono text-lg font-bold">{label.carrier}</h3>
            <p className="font-mono text-sm text-text-secondary mt-1">{label.name}</p>
            <p className="font-mono text-xs text-text-muted mt-2 flex-1">
              {label.description}
            </p>
            <button
              onClick={() => handlePrint(label)}
              disabled={printing === label.id}
              className="mt-4 w-full bg-accent text-bg font-mono text-sm font-bold py-2 rounded hover:bg-text-secondary transition-colors disabled:opacity-50"
            >
              {printing === label.id ? 'Printing...' : 'Print'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
