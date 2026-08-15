import sharp from 'sharp'

const LABEL_WIDTH = 812
const LABEL_HEIGHT = 1218

interface LabelData {
  carrier: string
  service: string
  fromName: string
  fromAddress: string
  fromCity: string
  toName: string
  toAddress: string
  toCity: string
  trackingNumber: string
}

const sampleData: Record<string, LabelData> = {
  usps: {
    carrier: 'USPS',
    service: 'PRIORITY MAIL',
    fromName: 'THERMALDECK TEST',
    fromAddress: '123 SENDER STREET',
    fromCity: 'ANYTOWN CA 90210',
    toName: 'JOHN DOE',
    toAddress: '456 RECEIVER AVE APT 7',
    toCity: 'SAMPLE CITY NY 10001',
    trackingNumber: '9400111899223334445566',
  },
  ups: {
    carrier: 'UPS',
    service: 'GROUND',
    fromName: 'THERMALDECK TEST',
    fromAddress: '123 SENDER STREET',
    fromCity: 'ANYTOWN CA 90210',
    toName: 'JANE SMITH',
    toAddress: '789 DELIVERY BLVD',
    toCity: 'TEST TOWN TX 75001',
    trackingNumber: '1Z999AA10123456784',
  },
  fedex: {
    carrier: 'FedEx',
    service: 'GROUND',
    fromName: 'THERMALDECK TEST',
    fromAddress: '123 SENDER STREET',
    fromCity: 'ANYTOWN CA 90210',
    toName: 'BOB JOHNSON',
    toAddress: '321 PACKAGE LANE',
    toCity: 'SHIPPING CITY FL 33101',
    trackingNumber: '794644790301',
  },
}

function generateLabelSvg(data: LabelData): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })

  return `<svg width="${LABEL_WIDTH}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>

  <!-- Border -->
  <rect x="10" y="10" width="${LABEL_WIDTH - 20}" height="${LABEL_HEIGHT - 20}" fill="none" stroke="black" stroke-width="3"/>

  <!-- Carrier Header -->
  <rect x="10" y="10" width="${LABEL_WIDTH - 20}" height="120" fill="black"/>
  <text x="50" y="90" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">${data.carrier}</text>
  <text x="400" y="80" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">${data.service}</text>

  <!-- From Section -->
  <text x="40" y="170" font-family="Arial, sans-serif" font-size="20" fill="black">FROM:</text>
  <text x="40" y="200" font-family="Arial, sans-serif" font-size="24" fill="black">${data.fromName}</text>
  <text x="40" y="230" font-family="Arial, sans-serif" font-size="24" fill="black">${data.fromAddress}</text>
  <text x="40" y="260" font-family="Arial, sans-serif" font-size="24" fill="black">${data.fromCity}</text>

  <!-- Divider -->
  <line x1="20" y1="290" x2="${LABEL_WIDTH - 20}" y2="290" stroke="black" stroke-width="2"/>

  <!-- To Section -->
  <text x="40" y="340" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="black">SHIP TO:</text>
  <text x="40" y="400" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="black">${data.toName}</text>
  <text x="40" y="460" font-family="Arial, sans-serif" font-size="40" fill="black">${data.toAddress}</text>
  <text x="40" y="520" font-family="Arial, sans-serif" font-size="40" fill="black">${data.toCity}</text>

  <!-- Divider -->
  <line x1="20" y1="570" x2="${LABEL_WIDTH - 20}" y2="570" stroke="black" stroke-width="2"/>

  <!-- Test Label Warning -->
  <rect x="40" y="600" width="${LABEL_WIDTH - 80}" height="60" fill="black"/>
  <text x="${LABEL_WIDTH / 2}" y="645" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">TEST LABEL - DO NOT MAIL</text>

  <!-- Tracking Section -->
  <text x="${LABEL_WIDTH / 2}" y="720" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="black" text-anchor="middle">TRACKING #</text>

  <!-- Barcode placeholder (vertical lines) -->
  <g transform="translate(80, 760)">
    ${generateBarcodeLines(data.trackingNumber)}
  </g>

  <!-- Tracking Number Text -->
  <text x="${LABEL_WIDTH / 2}" y="980" font-family="Arial, sans-serif" font-size="32" fill="black" text-anchor="middle">${formatTracking(data.trackingNumber)}</text>

  <!-- Footer -->
  <line x1="20" y1="1020" x2="${LABEL_WIDTH - 20}" y2="1020" stroke="black" stroke-width="2"/>
  <text x="40" y="1060" font-family="Arial, sans-serif" font-size="20" fill="black">Printed: ${date}</text>
  <text x="40" y="1090" font-family="Arial, sans-serif" font-size="20" fill="black">ThermalDeck Sample Label</text>

  <!-- Service icon in corner -->
  <rect x="${LABEL_WIDTH - 150}" y="150" width="120" height="80" fill="none" stroke="black" stroke-width="2"/>
  <text x="${LABEL_WIDTH - 90}" y="200" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="black" text-anchor="middle">PKG</text>
</svg>`
}

function generateBarcodeLines(tracking: string): string {
  let lines = ''
  const totalWidth = 650
  const numBars = tracking.length * 4
  const barWidth = totalWidth / numBars

  for (let i = 0; i < numBars; i++) {
    const isBar = (i % 2 === 0) || (i % 3 === 0)
    if (isBar) {
      const width = (i % 5 === 0) ? barWidth * 2 : barWidth
      lines += `<rect x="${i * barWidth}" y="0" width="${width}" height="180" fill="black"/>`
    }
  }
  return lines
}

function formatTracking(tracking: string): string {
  // Add spaces every 4 characters
  return tracking.replace(/(.{4})/g, '$1 ').trim()
}

export async function generateSampleLabelImage(carrierId: string): Promise<Buffer> {
  const data = sampleData[carrierId.toLowerCase()]
  if (!data) {
    throw new Error(`Unknown carrier: ${carrierId}`)
  }

  const svg = generateLabelSvg(data)

  const image = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()

  return image
}
