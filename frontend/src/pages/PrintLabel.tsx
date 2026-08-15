import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import ReactCrop, { type Crop, type PercentCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { toast } from 'sonner'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { printerApi } from '../api/client'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

interface PagePreview {
  pageNum: number
  dataUrl: string
}

const FULL_CROP: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 }

async function cropToBase64(dataUrl: string, crop: PercentCrop): Promise<string> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()

  const sx = ((crop.x ?? 0) / 100) * img.naturalWidth
  const sy = ((crop.y ?? 0) / 100) * img.naturalHeight
  const sw = ((crop.width ?? 100) / 100) * img.naturalWidth
  const sh = ((crop.height ?? 100) / 100) * img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sw))
  canvas.height = Math.max(1, Math.round(sh))

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context')

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png').split(',')[1]
}

export function PrintLabel() {
  const [loading, setLoading] = useState(false)
  const [pages, setPages] = useState<PagePreview[]>([])
  const [selectedPage, setSelectedPage] = useState(1)
  const [crop, setCrop] = useState<PercentCrop>(FULL_CROP)
  const [printing, setPrinting] = useState(false)
  const [filename, setFilename] = useState('label.pdf')
  const imgRef = useRef<HTMLImageElement>(null)

  const renderPdfToImages = async (file: File): Promise<PagePreview[]> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const previews: PagePreview[] = []
    const numPages = Math.min(pdf.numPages, 10)

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 4 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const context = canvas.getContext('2d')!
      await page.render({ canvasContext: context, viewport, canvas }).promise
      previews.push({ pageNum: i, dataUrl: canvas.toDataURL('image/png') })
    }

    return previews
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setLoading(true)
    try {
      setFilename(file.name)
      const previews = await renderPdfToImages(file)
      setPages(previews)
      setSelectedPage(1)
      setCrop(FULL_CROP)
      toast.success(`Loaded ${previews.length} page(s)`)
    } catch (err) {
      console.error('PDF render error:', err)
      toast.error(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  const handlePrint = async () => {
    const currentPageData = pages.find((p) => p.pageNum === selectedPage)
    if (!currentPageData) {
      toast.error('No page selected')
      return
    }

    setPrinting(true)
    try {
      const base64 = await cropToBase64(currentPageData.dataUrl, crop)
      const result = await printerApi.printLabelImage(base64, `${filename} - Page ${selectedPage}`)
      toast.success(`Label sent via ${result.data.method}`)
    } catch (err) {
      console.error('Print error:', err)
      toast.error('Failed to print')
    } finally {
      setPrinting(false)
    }
  }

  const handlePrintAll = async () => {
    if (pages.length === 0) {
      toast.error('No pages loaded')
      return
    }

    setPrinting(true)
    try {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        // Full page for bulk print — crop applies to selected page only
        const base64 = page.dataUrl.split(',')[1]
        await printerApi.printLabelImage(base64, `${filename} - Page ${page.pageNum}`)
        toast.success(`Page ${page.pageNum} sent`)
        if (i < pages.length - 1) {
          await new Promise((r) => setTimeout(r, 3000))
        }
      }
    } catch {
      toast.error('Failed to print')
    } finally {
      setPrinting(false)
    }
  }

  const currentPage = pages.find((p) => p.pageNum === selectedPage)

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-mono text-2xl font-bold mb-2">Upload & Print</h1>
      <p className="font-mono text-sm text-text-muted mb-4">
        Upload a PDF shipping label, crop if needed, then print via ZPL.
      </p>

      {pages.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-accent bg-surface' : 'border-border hover:border-accent'
          }`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div>
              <p className="font-mono text-text-secondary">Processing PDF...</p>
              <p className="font-mono text-xs text-text-muted mt-2">Rendering pages</p>
            </div>
          ) : isDragActive ? (
            <p className="font-mono">Drop the PDF here...</p>
          ) : (
            <div>
              <p className="font-mono text-lg mb-2">Drop a PDF here</p>
              <p className="font-mono text-sm text-text-muted">or click to select</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pages.length > 1 && (
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-text-muted">Page:</span>
              <div className="flex gap-2">
                {pages.map((page) => (
                  <button
                    key={page.pageNum}
                    onClick={() => {
                      setSelectedPage(page.pageNum)
                      setCrop(FULL_CROP)
                    }}
                    className={`w-8 h-8 font-mono text-sm rounded ${
                      selectedPage === page.pageNum
                        ? 'bg-accent text-bg'
                        : 'bg-surface border border-border hover:border-accent'
                    }`}
                  >
                    {page.pageNum}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface border border-border rounded p-4">
            <p className="font-mono text-xs text-text-muted mb-3">
              Drag to select the label area
            </p>
            {currentPage && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop as Crop}
                  onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
                  aspect={4 / 6}
                >
                  <img
                    ref={imgRef}
                    src={currentPage.dataUrl}
                    alt={`Page ${currentPage.pageNum}`}
                    className="max-h-[500px]"
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          <div className="font-mono text-xs text-text-muted">
            Crop: {Math.round(crop.x || 0)}%, {Math.round(crop.y || 0)}% —{' '}
            {Math.round(crop.width || 100)}% × {Math.round(crop.height || 100)}%
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex-1 bg-accent text-bg font-mono text-sm font-bold py-3 rounded hover:bg-text-secondary transition-colors disabled:opacity-50"
            >
              {printing ? 'Printing...' : `Print Page ${selectedPage}`}
            </button>
            {pages.length > 1 && (
              <button
                onClick={handlePrintAll}
                disabled={printing}
                className="px-6 py-3 bg-surface border border-border rounded font-mono text-sm hover:border-accent transition-colors disabled:opacity-50"
              >
                Print All ({pages.length})
              </button>
            )}
            <button
              onClick={() => {
                setPages([])
                setFilename('label.pdf')
              }}
              className="px-6 py-3 bg-surface border border-border rounded font-mono text-sm hover:border-accent transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
