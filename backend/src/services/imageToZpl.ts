import sharp from 'sharp'
import * as tls from 'tls'

const PRINTER_PORT = 9100

interface PrintResult {
  success: boolean
  error?: string
}

export async function imageToZplGraphic(
  imageBuffer: Buffer,
  targetWidth: number = 812,
  targetHeight: number = 1218
): Promise<string> {
  // Convert image to monochrome bitmap with better quality
  const { data, info } = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'fill',
      kernel: 'lanczos3'
    })
    .greyscale()
    .normalize()
    .sharpen({ sigma: 2, m1: 1.5, m2: 1.0 }) // Stronger sharpening for text clarity
    .threshold(140)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const width = info.width
  const height = info.height
  const bytesPerRow = Math.ceil(width / 8)
  const totalBytes = bytesPerRow * height

  // Convert to hex
  let hexData = ''
  for (let y = 0; y < height; y++) {
    for (let byteX = 0; byteX < bytesPerRow; byteX++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = byteX * 8 + bit
        if (x < width) {
          const srcIdx = y * width + x
          const pixel = data[srcIdx]
          // ZPL: 1 = black (print), 0 = white
          if (pixel < 128) {
            byte |= (1 << (7 - bit))
          }
        }
      }
      hexData += byte.toString(16).padStart(2, '0').toUpperCase()
    }
  }

  // Build ZPL
  const zpl = `^XA
^FO0,0
^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}
^FS
^XZ`

  return zpl
}

export async function printImageViaZpl(
  host: string,
  imageBuffer: Buffer,
  targetWidth: number = 812,
  targetHeight: number = 1218
): Promise<PrintResult> {
  try {
    console.log(`Converting image to ZPL (${targetWidth}x${targetHeight})...`)
    const zpl = await imageToZplGraphic(imageBuffer, targetWidth, targetHeight)
    console.log(`ZPL size: ${zpl.length} bytes`)

    return await sendZplViaTls(host, zpl)
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function sendZplViaTls(host: string, zpl: string): Promise<PrintResult> {
  return new Promise((resolve) => {
    let resolved = false

    const cleanup = (result: PrintResult) => {
      if (!resolved) {
        resolved = true
        resolve(result)
      }
    }

    const options = {
      host,
      port: PRINTER_PORT,
      rejectUnauthorized: false,
    }

    console.log(`Connecting to ${host}:${PRINTER_PORT} with TLS...`)

    const socket = tls.connect(options, () => {
      console.log(`TLS connected, sending ${zpl.length} bytes...`)

      socket.write(zpl, 'ascii', () => {
        console.log('Data sent')
        setTimeout(() => {
          socket.end()
          cleanup({ success: true })
        }, 3000)
      })
    })

    socket.setTimeout(120000)

    socket.on('error', (err) => {
      console.log(`TLS error: ${err.message}`)
      cleanup({ success: false, error: err.message })
    })

    socket.on('timeout', () => {
      socket.destroy()
      cleanup({ success: false, error: 'Connection timeout' })
    })

    socket.on('close', () => {
      if (!resolved) {
        cleanup({ success: true })
      }
    })
  })
}
