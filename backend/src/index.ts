import express from 'express'
import cors from 'cors'
import { initDb } from './config/db.js'
import printerRoutes from './routes/printer.js'
import testLabelsRoutes from './routes/testLabels.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const API_SECRET = process.env.API_SECRET

app.use(cors())
app.use(express.json({ limit: '50mb' }))

if (API_SECRET) {
  app.use('/api', (req, res, next) => {
    const auth = req.headers.authorization
    if (auth !== `Bearer ${API_SECRET}`) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    next()
  })
}

app.use('/api/printer', printerRoutes)
app.use('/api/test-labels', testLabelsRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`ThermalDeck backend running on port ${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start backend:', err)
  process.exit(1)
})
