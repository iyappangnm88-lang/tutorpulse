// ==============================================================================
// TUTORPULSE PHASE 4: WHITEBOARD PNG EXPORT
// Client-side offscreen canvas export to PNG download
// ==============================================================================

import type { WhiteboardElement } from './types'
import { renderWhiteboardElements } from './canvas-engine'

/**
 * Export the current whiteboard page elements to a downloadable PNG file.
 */
export async function exportWhiteboardToPNG(
  elements: WhiteboardElement[],
  options: {
    pageNumber: number
    title?: string
    width?: number
    height?: number
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  const exportWidth = options.width || 1920
  const exportHeight = options.height || 1080

  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = exportWidth
  offscreenCanvas.height = exportHeight

  const ctx = offscreenCanvas.getContext('2d')
  if (!ctx) return false

  // 1. Fill crisp light background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, exportWidth, exportHeight)

  // 2. Draw subtle grid background lines for clean aesthetic
  ctx.strokeStyle = '#f1f5f9'
  ctx.lineWidth = 1
  const gridSize = 40
  for (let x = 0; x < exportWidth; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, exportHeight)
    ctx.stroke()
  }
  for (let y = 0; y < exportHeight; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(exportWidth, y)
    ctx.stroke()
  }

  // 3. Render all vector elements
  renderWhiteboardElements(ctx, elements)

  // 4. TutorPulse Watermark in bottom corner
  ctx.save()
  ctx.font = '600 14px system-ui, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(
    `TutorPulse Classroom · ${options.title || `Page ${options.pageNumber}`} · ${new Date().toLocaleDateString()}`,
    exportWidth - 24,
    exportHeight - 20
  )
  ctx.restore()

  // 5. Convert to Blob & download
  return new Promise((resolve) => {
    offscreenCanvas.toBlob((blob) => {
      if (!blob) {
        resolve(false)
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const sanitizedTitle = (options.title || `page-${options.pageNumber}`)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')

      a.href = url
      a.download = `whiteboard-${sanitizedTitle}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      resolve(true)
    }, 'image/png')
  })
}
