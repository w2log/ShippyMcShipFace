import { Router } from 'express'
import { getSettings, saveSettings, type PrinterSettings } from '../config/db.js'
import * as printerHttp from '../services/printerHttp.js'
import * as printHistory from '../services/printHistory.js'
import * as imageToZpl from '../services/imageToZpl.js'

const router = Router()

const VALID_LANGUAGES = new Set(['ZPL', 'IPL', 'DPL', 'Fingerprint'])
const VALID_DPI = new Set([203, 300, 600])

router.get('/status', async (_req, res) => {
  try {
    const settings = await getSettings()
    if (!settings.ip) {
      res.json({
        online: false,
        ip: '',
        language: settings.language,
        dpi: settings.dpi,
        darkness: settings.darkness,
        status: 'Not configured',
      })
      return
    }

    const { online, status } = await printerHttp.getStatus(settings.ip)

    res.json({
      online,
      ip: settings.ip,
      language: settings.language,
      dpi: settings.dpi,
      darkness: settings.darkness,
      status,
    })
  } catch {
    res.status(500).json({ error: 'Failed to get printer status' })
  }
})

router.get('/settings', async (_req, res) => {
  try {
    res.json(await getSettings())
  } catch {
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

router.post('/settings', async (req, res) => {
  try {
    const { ip, port, language, dpi, darkness } = req.body as Partial<PrinterSettings>

    if (!ip || typeof ip !== 'string') {
      res.status(400).json({ error: 'Invalid IP address' })
      return
    }

    const nextLanguage = language && VALID_LANGUAGES.has(language) ? language : 'ZPL'
    const nextDpi = typeof dpi === 'number' && VALID_DPI.has(dpi) ? dpi : 203

    const settings: PrinterSettings = {
      ip: ip.trim(),
      port: typeof port === 'number' && port > 0 ? port : 9100,
      language: nextLanguage,
      dpi: nextDpi,
      darkness: typeof darkness === 'number' ? Math.min(30, Math.max(0, darkness)) : 15,
    }

    res.json(await saveSettings(settings))
  } catch {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

router.post('/test-pattern', async (_req, res) => {
  try {
    const settings = await getSettings()
    if (!settings.ip) {
      res.status(400).json({ error: 'No printer IP configured' })
      return
    }

    const result = await printerHttp.printViaWeb(settings.ip, {
      zName_1: 'TEST PATTERN',
      zPhone_1: 'ThermalDeck',
      zEmail_1: `DPI: ${settings.dpi}`,
      zComments_1: new Date().toLocaleTimeString(),
    })

    if (result.success) {
      printHistory.addJob({ type: 'test-pattern', status: 'success' })
      res.json({ success: true, language: settings.language })
    } else {
      printHistory.addJob({ type: 'test-pattern', status: 'failed', error: result.error })
      res.status(500).json({ error: result.error || 'Print failed' })
    }
  } catch {
    printHistory.addJob({ type: 'test-pattern', status: 'failed', error: 'Exception' })
    res.status(500).json({ error: 'Failed to print test pattern' })
  }
})

router.get('/history', (_req, res) => {
  res.json(printHistory.getHistory(20))
})

router.post('/print-label-image', async (req, res) => {
  try {
    const settings = await getSettings()
    if (!settings.ip) {
      res.status(400).json({ error: 'No printer IP configured' })
      return
    }

    const { imageData, filename } = req.body as { imageData: string; filename?: string }
    if (!imageData) {
      res.status(400).json({ error: 'No image data provided' })
      return
    }

    const imageBuffer = Buffer.from(imageData, 'base64')
    const width = settings.dpi === 300 ? 1200 : settings.dpi === 600 ? 2400 : 812
    const height = settings.dpi === 300 ? 1800 : settings.dpi === 600 ? 3600 : 1218

    const result = await imageToZpl.printImageViaZpl(settings.ip, imageBuffer, width, height)

    if (result.success) {
      printHistory.addJob({ type: 'pdf', status: 'success', filename })
      res.json({ success: true, method: 'ZPL Image' })
    } else {
      printHistory.addJob({ type: 'pdf', status: 'failed', error: result.error, filename })
      res.status(500).json({ error: result.error || 'Print failed' })
    }
  } catch (err) {
    console.error('Print label image error:', err)
    printHistory.addJob({ type: 'pdf', status: 'failed', error: 'Exception' })
    res.status(500).json({ error: 'Failed to print label image' })
  }
})

export default router
