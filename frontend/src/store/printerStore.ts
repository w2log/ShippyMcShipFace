import { create } from 'zustand'
import { printerApi, type PrinterSettings, type PrinterStatus } from '../api/client'

interface PrinterState {
  status: PrinterStatus | null
  settings: PrinterSettings | null
  loading: boolean
  error: string | null
  fetchStatus: () => Promise<void>
  fetchSettings: () => Promise<void>
  saveSettings: (settings: PrinterSettings) => Promise<void>
}

export const usePrinterStore = create<PrinterState>((set) => ({
  status: null,
  settings: null,
  loading: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await printerApi.getStatus()
      set({ status: data, loading: false })
    } catch (err) {
      set({ error: 'Failed to fetch printer status', loading: false })
    }
  },

  fetchSettings: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await printerApi.getSettings()
      set({ settings: data, loading: false })
    } catch (err) {
      set({ error: 'Failed to fetch settings', loading: false })
    }
  },

  saveSettings: async (settings) => {
    set({ loading: true, error: null })
    try {
      const { data } = await printerApi.saveSettings(settings)
      set({ settings: data, loading: false })
    } catch (err) {
      set({ error: 'Failed to save settings', loading: false })
      throw err
    }
  },
}))
