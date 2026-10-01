'use client'

import { useEffect } from 'react'
import { isCapacitorNative } from '@/lib/capacitor'

/**
 * Manages keyboard behavior for Capacitor Android.
 * 
 * When the soft keyboard appears on Android WebView, this component:
 * - Adds a CSS class to the document so styles can adapt
 * - Scrolls the focused input into view
 * 
 * On web browsers, this component renders nothing and does nothing.
 */
export function CapacitorKeyboard() {
  useEffect(() => {
    if (!isCapacitorNative()) return

    let cleanup: (() => void) | undefined

    async function setup() {
      try {
        const { Keyboard } = await import('@capacitor/keyboard')

        const showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
          document.documentElement.classList.add('keyboard-open')
          document.documentElement.style.setProperty(
            '--keyboard-height',
            `${info.keyboardHeight}px`
          )

          // Ensure the focused element is visible above the keyboard
          requestAnimationFrame(() => {
            const focused = document.activeElement
            if (focused instanceof HTMLElement) {
              focused.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          })
        })

        const hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
          document.documentElement.classList.remove('keyboard-open')
          document.documentElement.style.removeProperty('--keyboard-height')
        })

        cleanup = () => {
          showHandle.remove()
          hideHandle.remove()
        }
      } catch {
        // @capacitor/keyboard not available — silently skip
      }
    }

    setup()

    return () => {
      cleanup?.()
    }
  }, [])

  return null
}
