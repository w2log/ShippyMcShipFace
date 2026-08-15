import { Router } from 'express'
import { getSettings } from '../config/db.js'
import * as printHistory from '../services/printHistory.js'
import { printImageViaZpl } from '../services/imageToZpl.js'
import { generateSampleLabelImage } from '../services/sampleLabels.js'

const router = Router()

interface TestLabel {
  id: string
  carrier: string
  name: string
  description: string
}

const testLabels: TestLabel[] = [
  {
    id: 'usps',
    carrier: 'USPS',
    name: 'Priority Mail',
    description: 'Standard 4x6 Priority Mail label',
  },
  {
    id: 'ups',
    carrier: 'UPS',
    name: 'UPS Ground',
    description: 'UPS Ground sample with tracking',
  },
  {
    id: 'fedex',
    carrier: 'FedEx',
    name: 'FedEx Ground',
    description: 'FedEx Ground sample label',
  },
]

router.get('/', (_req, res) => {
  res.json(testLabels)
})

router.post('/:carrier/print', async (req, res) => {
  try {
    const { carrier } = req.params
    const label = testLabels.find((l) => l.id === carrier.toLowerCase())

    if (!label) {
      res.status(404).json({ error: 'Test label not found' })
      return
    }

    const settings = await getSettings()
    if (!settings.ip) {
      res.status(400).json({ error: 'No printer configured' })
      return
    }

    // Generate sample label image
    const imageBuffer = await generateSampleLabelImage(carrier)

    // Print via ZPL image
    const result = await printImageViaZpl(settings.ip, imageBuffer)

    if (result.success) {
      printHistory.addJob({ type: 'test-label', carrier: label.carrier, status: 'success' })
      res.json({ success: true, carrier: label.carrier })
    } else {
      printHistory.addJob({ type: 'test-label', carrier: label.carrier, status: 'failed', error: result.error })
      res.status(500).json({ error: result.error || 'Print failed' })
    }
  } catch (err) {
    console.error('Test label print error:', err)
    printHistory.addJob({ type: 'test-label', carrier: req.params.carrier, status: 'failed', error: 'Exception' })
    res.status(500).json({ error: 'Failed to print test label' })
  }
})

export default router
