import type { FocusPreferences } from './types'

export const DEFAULT_FOCUS_PREFERENCES: FocusPreferences = {
  strictMode: false,
  blockSplitScreen: false,
}

const PREFERENCES_STORAGE_KEY = 'nuzigo_focus_preferences'

/**
 * Loads stored user preferences for Focus Mode (strict mode, block split-screen).
 * Safe to call on Web, Android, SSR.
 */
export function loadFocusPreferences(): FocusPreferences {
  if (typeof window === 'undefined') return DEFAULT_FOCUS_PREFERENCES
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return DEFAULT_FOCUS_PREFERENCES
    const parsed = JSON.parse(raw)
    return {
      strictMode: Boolean(parsed.strictMode),
      blockSplitScreen: Boolean(parsed.blockSplitScreen),
    }
  } catch (err) {
    console.warn('[FocusSettings] Failed to load preferences from storage:', err)
    return DEFAULT_FOCUS_PREFERENCES
  }
}

/**
 * Saves updated user preferences for Focus Mode.
 */
export function saveFocusPreferences(prefs: Partial<FocusPreferences>): FocusPreferences {
  if (typeof window === 'undefined') return DEFAULT_FOCUS_PREFERENCES
  try {
    const current = loadFocusPreferences()
    const updated: FocusPreferences = {
      ...current,
      ...prefs,
    }
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('[FocusSettings] Failed to save preferences to storage:', err)
    return DEFAULT_FOCUS_PREFERENCES
  }
}
