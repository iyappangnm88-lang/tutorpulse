'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import {
  focusAudioManager,
  FOCUS_TRACKS,
  type FocusAudioTrack,
  type FocusAudioState,
} from '@/lib/focus/focus-audio'

interface FocusMusicContextValue {
  tracks: FocusAudioTrack[]
  currentTrack: FocusAudioTrack | null
  currentTrackId: string | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  error: string | null
  playTrack: (trackId: string) => Promise<boolean>
  togglePlay: () => Promise<void>
  pause: () => void
  stop: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
}

const FocusMusicContext = createContext<FocusMusicContextValue | null>(null)

export function FocusMusicProvider({ children }: { children: React.ReactNode }) {
  const [audioState, setAudioState] = useState<FocusAudioState>(() => focusAudioManager.getState())

  useEffect(() => {
    const unsubscribe = focusAudioManager.subscribe((newState) => {
      setAudioState(newState)
    })
    return unsubscribe
  }, [])

  const currentTrack = useMemo(() => {
    if (!audioState.currentTrackId) return null
    return FOCUS_TRACKS.find((t) => t.id === audioState.currentTrackId) || null
  }, [audioState.currentTrackId])

  const value = useMemo<FocusMusicContextValue>(() => ({
    tracks: FOCUS_TRACKS,
    currentTrack,
    currentTrackId: audioState.currentTrackId,
    isPlaying: audioState.isPlaying,
    volume: audioState.volume,
    isMuted: audioState.isMuted,
    error: audioState.error,
    playTrack: (trackId: string) => focusAudioManager.playTrack(trackId),
    togglePlay: () => focusAudioManager.togglePlay(),
    pause: () => focusAudioManager.pause(),
    stop: () => focusAudioManager.stop(),
    setVolume: (v: number) => focusAudioManager.setVolume(v),
    toggleMute: () => focusAudioManager.toggleMute(),
  }), [audioState, currentTrack])

  return (
    <FocusMusicContext.Provider value={value}>
      {children}
    </FocusMusicContext.Provider>
  )
}

export function useFocusMusic() {
  const ctx = useContext(FocusMusicContext)
  if (!ctx) {
    throw new Error('useFocusMusic must be used within a FocusMusicProvider')
  }
  return ctx
}
