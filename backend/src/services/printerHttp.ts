import https from 'https'

const agent = new https.Agent({ rejectUnauthorized: false })

interface PrintResult {
  success: boolean
  error?: string
}

export async function printViaWeb(
  ip: string,
  fields: Record<string, string>,
  quantity: number = 1,
  format: string = '/system/printer/webforms/test_4x6.lbx'
): Promise<PrintResult> {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      format,
      pageid: 'Inprint',
      entryid: format.split('/').pop() || 'test_4x6.lbx',
      quantity: quantity.toString(),
      ...fields,
    })

    const url = `https://${ip}/inprint/printlabel.lua?${params.toString()}`

    const req = https.get(url, { agent }, (res) => {
      res.resume()
      res.on('end', () => {
        resolve({ success: res.statusCode === 200 })
      })
    })

    req.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({ success: false, error: 'Timeout' })
    })
  })
}

export async function getStatus(ip: string): Promise<{ online: boolean; status: string }> {
  return new Promise((resolve) => {
    const url = `https://${ip}/index.lua`

    const req = https.get(url, { agent }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        const ready = data.includes('checkmark.png') && data.includes('Ready')
        resolve({
          online: res.statusCode === 200,
          status: ready ? 'Ready' : 'Unknown',
        })
      })
    })

    req.on('error', () => {
      resolve({ online: false, status: 'Offline' })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ online: false, status: 'Timeout' })
    })
  })
}
