import type { VideoProvider } from './types'
import { WebRtcVideoProvider } from './providers/webrtc'

let activeProvider: VideoProvider | null = null

/**
 * Returns the currently active video provider instance.
 * Defaults to WebRtcVideoProvider (free, browser-native WebRTC).
 */
export function getVideoProvider(): VideoProvider {
  if (!activeProvider) {
    activeProvider = new WebRtcVideoProvider()
  }
  return activeProvider
}

/**
 * Utility for tests or alternate future providers (e.g. SFU, LiveKit).
 */
export function setVideoProvider(provider: VideoProvider): void {
  activeProvider = provider
}
