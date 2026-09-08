// ==============================================================================
// TUTORPULSE PHASE 4: CANVAS RENDERING & GEOMETRY ENGINE
// High-DPI canvas setup, vector rendering, curve smoothing, and hit testing
// ==============================================================================

import type {
  WhiteboardElement,
  WhiteboardPoint,
  StrokeElement,
  ShapeElement,
  TextElement,
} from './types'

/**
 * Configure Canvas for High-DPI (Retina) displays without blurriness.
 */
export function setupCanvasDPI(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number
): { ctx: CanvasRenderingContext2D; dpr: number } | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  canvas.width = Math.floor(cssWidth * dpr)
  canvas.height = Math.floor(cssHeight * dpr)
  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`

  ctx.scale(dpr, dpr)
  return { ctx, dpr }
}

/**
 * Render all elements in order onto the 2D context.
 */
export function renderWhiteboardElements(
  ctx: CanvasRenderingContext2D,
  elements: WhiteboardElement[]
) {
  ctx.save()
  for (const el of elements) {
    renderElement(ctx, el)
  }
  ctx.restore()
}

/**
 * Render a single element onto the canvas context.
 */
export function renderElement(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
  ctx.save()

  ctx.strokeStyle = el.color
  ctx.fillStyle = el.color
  ctx.lineWidth = el.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (el.opacity !== undefined) {
    ctx.globalAlpha = el.opacity
  }

  if (el.type === 'stroke' || el.type === 'highlighter') {
    renderStroke(ctx, el)
  } else if (el.type === 'line') {
    renderLine(ctx, el)
  } else if (el.type === 'rectangle') {
    renderRectangle(ctx, el)
  } else if (el.type === 'ellipse') {
    renderEllipse(ctx, el)
  } else if (el.type === 'arrow') {
    renderArrow(ctx, el)
  } else if (el.type === 'text') {
    renderText(ctx, el)
  }

  ctx.restore()
}

/**
 * Render freehand stroke with quadratic curve smoothing between points.
 */
function renderStroke(ctx: CanvasRenderingContext2D, el: StrokeElement) {
  const points = el.points
  if (!points || points.length === 0) return

  if (el.type === 'highlighter') {
    ctx.globalAlpha = 0.35
    ctx.lineWidth = el.strokeWidth * 3
  }

  if (points.length === 1) {
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, el.strokeWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const midX = (p1.x + p2.x) / 2
    const midY = (p1.y + p2.y) / 2
    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY)
  }

  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

/**
 * Render straight line.
 */
function renderLine(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  ctx.beginPath()
  ctx.moveTo(el.startX, el.startY)
  ctx.lineTo(el.endX, el.endY)
  ctx.stroke()
}

/**
 * Render rectangle.
 */
function renderRectangle(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  const x = Math.min(el.startX, el.endX)
  const y = Math.min(el.startY, el.endY)
  const width = Math.abs(el.endX - el.startX)
  const height = Math.abs(el.endY - el.startY)

  ctx.beginPath()
  ctx.strokeRect(x, y, width, height)
}

/**
 * Render circle or ellipse.
 */
function renderEllipse(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  const centerX = (el.startX + el.endX) / 2
  const centerY = (el.startY + el.endY) / 2
  const radiusX = Math.abs(el.endX - el.startX) / 2
  const radiusY = Math.abs(el.endY - el.startY) / 2

  ctx.beginPath()
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Render directional arrow with arrowhead.
 */
function renderArrow(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  const { startX, startY, endX, endY } = el

  // Draw main shaft
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  // Calculate arrowhead fins
  const angle = Math.atan2(endY - startY, endX - startX)
  const headLength = Math.max(12, el.strokeWidth * 3)
  const headAngle = Math.PI / 6 // 30 degrees

  const arrowX1 = endX - headLength * Math.cos(angle - headAngle)
  const arrowY1 = endY - headLength * Math.sin(angle - headAngle)

  const arrowX2 = endX - headLength * Math.cos(angle + headAngle)
  const arrowY2 = endY - headLength * Math.sin(angle + headAngle)

  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(arrowX1, arrowY1)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(arrowX2, arrowY2)
  ctx.stroke()
}

/**
 * Render text annotation.
 */
function renderText(ctx: CanvasRenderingContext2D, el: TextElement) {
  const fontSize = el.fontSize || 18
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(el.text, el.x, el.y)
}

/**
 * Distance from point (px, py) to line segment (x1, y1)-(x2, y2).
 */
export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) {
    return Math.hypot(px - x1, py - y1)
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))

  const projX = x1 + t * dx
  const projY = y1 + t * dy

  return Math.hypot(px - projX, py - projY)
}

/**
 * Test whether a click/pointer coordinate hits a whiteboard element (for eraser or selection).
 */
export function isPointHittingElement(
  point: WhiteboardPoint,
  element: WhiteboardElement,
  hitRadius = 14
): boolean {
  const radius = Math.max(hitRadius, element.strokeWidth * 2)

  if (element.type === 'stroke' || element.type === 'highlighter') {
    const points = element.points
    if (!points || points.length === 0) return false

    if (points.length === 1) {
      return Math.hypot(point.x - points[0].x, point.y - points[0].y) <= radius
    }

    for (let i = 0; i < points.length - 1; i++) {
      const dist = pointToSegmentDistance(
        point.x,
        point.y,
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y
      )
      if (dist <= radius) return true
    }
    return false
  }

  if (element.type === 'line' || element.type === 'arrow') {
    const dist = pointToSegmentDistance(
      point.x,
      point.y,
      element.startX,
      element.startY,
      element.endX,
      element.endY
    )
    return dist <= radius
  }

  if (element.type === 'rectangle') {
    const minX = Math.min(element.startX, element.endX) - radius
    const maxX = Math.max(element.startX, element.endX) + radius
    const minY = Math.min(element.startY, element.endY) - radius
    const maxY = Math.max(element.startY, element.endY) + radius

    const inOuter = point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    if (!inOuter) return false

    // Check near 4 edges
    const dTop = pointToSegmentDistance(point.x, point.y, minX, minY, maxX, minY)
    const dBottom = pointToSegmentDistance(point.x, point.y, minX, maxY, maxX, maxY)
    const dLeft = pointToSegmentDistance(point.x, point.y, minX, minY, minX, maxY)
    const dRight = pointToSegmentDistance(point.x, point.y, maxX, minY, maxX, maxY)

    return Math.min(dTop, dBottom, dLeft, dRight) <= radius
  }

  if (element.type === 'ellipse') {
    const centerX = (element.startX + element.endX) / 2
    const centerY = (element.startY + element.endY) / 2
    const radiusX = Math.abs(element.endX - element.startX) / 2
    const radiusY = Math.abs(element.endY - element.startY) / 2

    if (radiusX === 0 || radiusY === 0) return false

    const normDist =
      Math.pow((point.x - centerX) / radiusX, 2) + Math.pow((point.y - centerY) / radiusY, 2)
    // Hit if within ring near border (0.65 to 1.35)
    return normDist >= 0.65 && normDist <= 1.35
  }

  if (element.type === 'text') {
    const fontSize = element.fontSize || 18
    const estimatedWidth = element.text.length * (fontSize * 0.6)
    const minX = element.x - 4
    const maxX = element.x + estimatedWidth + 4
    const minY = element.y - 4
    const maxY = element.y + fontSize + 4

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  }

  return false
}
