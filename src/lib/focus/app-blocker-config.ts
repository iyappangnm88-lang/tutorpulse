export interface BlockedApp {
  packageName: string
  appName: string
  category?: 'social' | 'entertainment' | 'games' | 'other'
  isSystem?: boolean
  iconEmoji?: string
}

export interface AppBlockerConfig {
  enabled: boolean
  selectedPackages: string[]
  blockNotifications?: boolean
  lastUpdated?: number
}

export const PRESET_DISTRACTING_APPS: BlockedApp[] = [
  // Social Media
  { packageName: 'com.instagram.android', appName: 'Instagram', category: 'social', iconEmoji: '📸' },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', category: 'social', iconEmoji: '🎵' },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', category: 'social', iconEmoji: '👻' },
  { packageName: 'com.facebook.katana', appName: 'Facebook', category: 'social', iconEmoji: '📘' },
  { packageName: 'com.twitter.android', appName: 'X / Twitter', category: 'social', iconEmoji: '🐦' },
  { packageName: 'com.reddit.frontpage', appName: 'Reddit', category: 'social', iconEmoji: '🤖' },
  { packageName: 'com.discord', appName: 'Discord', category: 'social', iconEmoji: '💬' },
  { packageName: 'com.instagram.barcelona', appName: 'Threads', category: 'social', iconEmoji: '🧵' },
  { packageName: 'com.pinterest', appName: 'Pinterest', category: 'social', iconEmoji: '📌' },

  // Entertainment & Streaming
  { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'entertainment', iconEmoji: '▶️' },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', category: 'entertainment', iconEmoji: '🍿' },
  { packageName: 'com.amazon.avod.thirdpartyclient', appName: 'Prime Video', category: 'entertainment', iconEmoji: '🎬' },
  { packageName: 'tv.twitch.android.app', appName: 'Twitch', category: 'entertainment', iconEmoji: '🎮' },
  { packageName: 'com.disney.disneyplus', appName: 'Disney+', category: 'entertainment', iconEmoji: '✨' },

  // Mobile Games
  { packageName: 'com.roblox.client', appName: 'Roblox', category: 'games', iconEmoji: '🧱' },
  { packageName: 'com.king.candycrushsaga', appName: 'Candy Crush', category: 'games', iconEmoji: '🍬' },
  { packageName: 'com.kiloo.subwaysurf', appName: 'Subway Surfers', category: 'games', iconEmoji: '🏄' },
  { packageName: 'com.tencent.ig', appName: 'PUBG Mobile', category: 'games', iconEmoji: '🎯' },
  { packageName: 'com.supercell.brawlstars', appName: 'Brawl Stars', category: 'games', iconEmoji: '⭐' },
  { packageName: 'com.supercell.clashofclans', appName: 'Clash of Clans', category: 'games', iconEmoji: '⚔️' },
  { packageName: 'com.dts.freefireth', appName: 'Free Fire', category: 'games', iconEmoji: '🔥' },
]

export const DEFAULT_BLOCKED_PACKAGES: string[] = [
  'com.instagram.android',
  'com.zhiliaoapp.musically',
  'com.snapchat.android',
  'com.google.android.youtube',
  'com.reddit.frontpage',
  'com.facebook.katana',
  'com.twitter.android',
]

const STORAGE_KEY = 'nuzigo_app_blocker_config'

/**
 * Loads the stored app blocker configuration or returns intelligent defaults.
 */
export function loadAppBlockerConfig(): AppBlockerConfig {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      selectedPackages: DEFAULT_BLOCKED_PACKAGES,
      blockNotifications: true,
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        enabled: Boolean(parsed.enabled),
        selectedPackages: Array.isArray(parsed.selectedPackages) ? parsed.selectedPackages : DEFAULT_BLOCKED_PACKAGES,
        blockNotifications: parsed.blockNotifications !== false,
        lastUpdated: parsed.lastUpdated,
      }
    }
  } catch (err) {
    console.warn('[AppBlocker] Failed to load config from storage:', err)
  }

  return {
    enabled: false,
    selectedPackages: DEFAULT_BLOCKED_PACKAGES,
    blockNotifications: true,
  }
}

/**
 * Saves app blocker configuration to local storage.
 */
export function saveAppBlockerConfig(config: AppBlockerConfig): void {
  if (typeof window === 'undefined') return
  try {
    const data: AppBlockerConfig = {
      ...config,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('[AppBlocker] Failed to save config to storage:', err)
  }
}
