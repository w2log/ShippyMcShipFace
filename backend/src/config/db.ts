import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface PrinterSettings {
  ip: string
  port: number
  language: 'ZPL' | 'IPL' | 'DPL' | 'Fingerprint'
  dpi: 203 | 300 | 600
  darkness: number
}

interface DbData {
  settings: PrinterSettings
}

const defaultData: DbData = {
  settings: {
    ip: '',
    port: 9100,
    language: 'ZPL',
    dpi: 203,
    darkness: 15,
  },
}

function resolveDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR
  }
  // src/config → ../../data  |  dist/config → ../../data
  return join(__dirname, '../../data')
}

const dataDir = resolveDataDir()
const file = join(dataDir, 'config.json')
const adapter = new JSONFile<DbData>(file)
export const db = new Low<DbData>(adapter, defaultData)

export async function initDb() {
  await mkdir(dataDir, { recursive: true })
  await db.read()
  db.data ||= defaultData
  await db.write()
}

export async function getSettings(): Promise<PrinterSettings> {
  await db.read()
  return db.data?.settings || defaultData.settings
}

export async function saveSettings(settings: PrinterSettings): Promise<PrinterSettings> {
  await db.read()
  db.data ||= defaultData
  db.data.settings = settings
  await db.write()
  return settings
}
