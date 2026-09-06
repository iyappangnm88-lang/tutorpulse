import type { VideoProvider } from './types'
import { DailyVideoProvider } from './providers/daily'

let activeProvider: VideoProvider | null = null

/**
 * Returns the currently active video provider instance.
 * Defaults to DailyVideoProvider.
 */
export function getVideoProvider(): VideoProvider {
  if (!activeProvider) {
    activeProvider = new DailyVideoProvider()
  }
  return activeProvider
}

/**
 * Utility for tests or alternate providers.
 */
export function setVideoProvider(provider: VideoProvider): void {
  activeProvider = provider
}
