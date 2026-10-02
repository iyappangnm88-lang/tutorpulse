'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'nuzigo_theme'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemeState(saved)
      }
    } catch {
      // Ignore localStorage read errors in restricted sandboxes
    }
    setMounted(true)
  }, [])

  // Apply theme to DOM and sync with system/Capacitor
  useEffect(() => {
    if (!mounted) return

    const resolved = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(resolved)

    const root = document.documentElement
    const isDark = resolved === 'dark'

    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    }

    // Update meta theme-color for browser address bar & PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0B0F0C' : '#55C832')
    }

    // Synchronize native Android status bar if running via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {})
        if (Capacitor.getPlatform() === 'android') {
          StatusBar.setBackgroundColor({ color: isDark ? '#0B0F0C' : '#55C832' }).catch(() => {})
        }
      } catch {
        // Status bar plugin call fallback
      }
    }
  }, [theme, mounted])

  // Listen to OS system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      const root = document.documentElement
      if (resolved === 'dark') {
        root.classList.add('dark')
        root.setAttribute('data-theme', 'dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.setAttribute('data-theme', 'light')
        root.style.colorScheme = 'light'
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {}
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
