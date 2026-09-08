// ==============================================================================
// TUTORPULSE PHASE 4: DIGITAL WHITEBOARD & ONLINE TEACHING WORKSPACE TYPES
// Strict session-bound vector model, pointer coordinates, and Realtime events
// ==============================================================================

export type WhiteboardTool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'

export type WhiteboardColor = string

export const WHITEBOARD_PALETTE: { label: string; value: string; bgClass: string }[] = [
  { label: 'Dark Slate', value: '#1e293b', bgClass: 'bg-slate-800' },
  { label: 'Indigo', value: '#4f46e5', bgClass: 'bg-indigo-600' },
  { label: 'Emerald Green', value: '#10b981', bgClass: 'bg-emerald-500' },
  { label: 'Amber Orange', value: '#f59e0b', bgClass: 'bg-amber-500' },
  { label: 'Rose Red', value: '#ef4444', bgClass: 'bg-rose-500' },
  { label: 'Purple', value: '#8b5cf6', bgClass: 'bg-purple-500' },
  { label: 'Sky Blue', value: '#0ea5e9', bgClass: 'bg-sky-500' },
  { label: 'Pure White', value: '#ffffff', bgClass: 'bg-white border border-gray-300' },
]

export const STROKE_WIDTHS: { label: string; value: number }[] = [
  { label: 'Fine (2px)', value: 2 },
  { label: 'Medium (4px)', value: 4 },
  { label: 'Thick (8px)', value: 8 },
]

export interface WhiteboardPoint {
  x: number
  y: number
  pressure?: number
}

export type WhiteboardElementType =
  | 'stroke'
  | 'highlighter'
  | 'text'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'

export interface BaseWhiteboardElement {
  id: string
  type: WhiteboardElementType
  color: string
  strokeWidth: number
  opacity?: number
  createdAt: number
}

export interface StrokeElement extends BaseWhiteboardElement {
  type: 'stroke' | 'highlighter'
  points: WhiteboardPoint[]
}

export interface ShapeElement extends BaseWhiteboardElement {
  type: 'line' | 'rectangle' | 'ellipse' | 'arrow'
  startX: number
  startY: number
  endX: number
  endY: number
}

export interface TextElement extends BaseWhiteboardElement {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
}

export type WhiteboardElement = StrokeElement | ShapeElement | TextElement

export interface WhiteboardPageData {
  id?: string
  pageNumber: number
  title: string
  elements: WhiteboardElement[]
}

export interface WhiteboardSessionState {
  whiteboardId: string
  sessionId: string
  workspaceId: string
  tutorId: string
  studentsCanDraw: boolean
  activePageNumber: number
  pages: WhiteboardPageData[]
}

// Supabase Realtime Broadcast Event Types
export type WhiteboardRealtimeEvent =
  | { type: 'DRAW_STROKE'; payload: { pageNumber: number; stroke: StrokeElement } }
  | { type: 'ADD_ELEMENT'; payload: { pageNumber: number; element: WhiteboardElement } }
  | { type: 'UPDATE_ELEMENT'; payload: { pageNumber: number; element: WhiteboardElement } }
  | { type: 'DELETE_ELEMENT'; payload: { pageNumber: number; elementId: string } }
  | { type: 'CLEAR_PAGE'; payload: { pageNumber: number } }
  | { type: 'PAGE_CHANGE'; payload: { pageNumber: number } }
  | { type: 'PAGE_CREATE'; payload: { page: WhiteboardPageData } }
  | { type: 'PAGE_DELETE'; payload: { pageNumber: number } }
  | { type: 'STUDENTS_DRAW_TOGGLE'; payload: { allowed: boolean } }
  | { type: 'LIVE_DRAW_POINT'; payload: { pageNumber: number; elementId: string; point: WhiteboardPoint } }
