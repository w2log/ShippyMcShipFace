import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_API_KEY
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`
  }
  return config
})

export interface PrinterSettings {
  ip: string
  port: number
  language: 'ZPL' | 'IPL' | 'DPL' | 'Fingerprint'
  dpi: 203 | 300 | 600
  darkness: number
}

export interface PrinterStatus {
  online: boolean
  ip: string
  language: string
  dpi: number
  darkness: number
  status?: string
}

export interface TestLabel {
  id: string
  carrier: string
  name: string
  description: string
}

export interface PrintJob {
  id: string
  timestamp: number
  type: 'test-label' | 'test-pattern' | 'pdf'
  carrier?: string
  filename?: string
  status: 'success' | 'failed'
  error?: string
}

export const printerApi = {
  getStatus: () => api.get<PrinterStatus>('/printer/status'),
  getSettings: () => api.get<PrinterSettings>('/printer/settings'),
  saveSettings: (settings: PrinterSettings) =>
    api.post<PrinterSettings>('/printer/settings', settings),
  printTestPattern: () => api.post<{ success: boolean }>('/printer/test-pattern'),
  getHistory: () => api.get<PrintJob[]>('/printer/history'),
  printLabelImage: (imageData: string, filename?: string) =>
    api.post<{ success: boolean; method: string }>('/printer/print-label-image', {
      imageData,
      filename,
    }),
}

export const testLabelsApi = {
  getAll: () => api.get<TestLabel[]>('/test-labels'),
  print: (carrier: string) => api.post<{ success: boolean }>(`/test-labels/${carrier}/print`),
}

export default api
