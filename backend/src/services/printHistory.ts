interface PrintJob {
  id: string
  timestamp: number
  type: 'test-label' | 'test-pattern' | 'pdf'
  carrier?: string
  filename?: string
  status: 'success' | 'failed'
  error?: string
}

const history: PrintJob[] = []
const MAX_HISTORY = 50

export function addJob(job: Omit<PrintJob, 'id' | 'timestamp'>): PrintJob {
  const newJob: PrintJob = {
    ...job,
    id: Math.random().toString(36).slice(2, 10),
    timestamp: Date.now(),
  }

  history.unshift(newJob)

  if (history.length > MAX_HISTORY) {
    history.pop()
  }

  return newJob
}

export function getHistory(limit: number = 10): PrintJob[] {
  return history.slice(0, limit)
}
