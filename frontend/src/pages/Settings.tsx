import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePrinterStore } from '../store/printerStore'
import { printerApi, type PrinterSettings } from '../api/client'

const defaultSettings: PrinterSettings = {
  ip: '',
  port: 9100,
  language: 'ZPL',
  dpi: 203,
  darkness: 15,
}

export function Settings() {
  const { settings, loading, fetchSettings, saveSettings } = usePrinterStore()
  const [form, setForm] = useState<PrinterSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSettings(form)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestPattern = async () => {
    setPrinting(true)
    try {
      await printerApi.printTestPattern()
      toast.success('Test pattern sent')
    } catch {
      toast.error('Failed to print test pattern')
    } finally {
      setPrinting(false)
    }
  }

  const handleCalibrate = () => {
    if (form.ip) {
      window.open(
        `https://${form.ip}/service/testfeed.lua?pageid=Services&pagename=Media%20Calibration`,
        '_blank'
      )
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-mono text-2xl font-bold mb-6">Printer Settings</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded p-6">
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-text-muted mb-1">
              Printer IP Address
            </label>
            <input
              type="text"
              value={form.ip}
              onChange={(e) => setForm({ ...form, ip: e.target.value })}
              placeholder="192.168.1.100"
              className="w-full bg-bg border border-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-text-muted mb-1">Port</label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 9100 })}
              className="w-full bg-bg border border-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-text-muted mb-1">
              Printer Language
            </label>
            <select
              value={form.language}
              onChange={(e) =>
                setForm({
                  ...form,
                  language: e.target.value as PrinterSettings['language'],
                })
              }
              className="w-full bg-bg border border-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
            >
              <option value="ZPL">ZPL (label images)</option>
              <option value="Fingerprint">Fingerprint (Intermec)</option>
              <option value="IPL">IPL (legacy)</option>
              <option value="DPL">DPL (legacy)</option>
            </select>
            <p className="font-mono text-xs text-text-muted mt-1">
              Label printing currently sends ZPL graphics over TLS:9100.
            </p>
          </div>

          <div>
            <label className="block font-mono text-xs text-text-muted mb-1">DPI</label>
            <select
              value={form.dpi}
              onChange={(e) =>
                setForm({ ...form, dpi: parseInt(e.target.value) as 203 | 300 | 600 })
              }
              className="w-full bg-bg border border-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
            >
              <option value={203}>203 DPI</option>
              <option value={300}>300 DPI</option>
              <option value={600}>600 DPI</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs text-text-muted mb-1">
              Darkness (0-30)
            </label>
            <input
              type="range"
              min={0}
              max={30}
              value={form.darkness}
              onChange={(e) => setForm({ ...form, darkness: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="font-mono text-sm text-text-secondary mt-1">{form.darkness}</div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={saving || loading}
            className="flex-1 bg-accent text-bg font-mono text-sm font-bold py-2 rounded hover:bg-text-secondary transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            type="button"
            onClick={handleTestPattern}
            disabled={printing || !form.ip}
            className="px-4 py-2 bg-surface border border-border rounded font-mono text-sm hover:border-accent transition-colors disabled:opacity-50"
          >
            {printing ? 'Printing...' : 'Test Print'}
          </button>
          <button
            type="button"
            onClick={handleCalibrate}
            disabled={!form.ip}
            className="px-4 py-2 bg-surface border border-border rounded font-mono text-sm hover:border-accent transition-colors disabled:opacity-50"
          >
            Calibrate
          </button>
        </div>
      </form>
    </div>
  )
}
