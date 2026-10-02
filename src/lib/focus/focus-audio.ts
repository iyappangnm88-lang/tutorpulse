'use client'

export interface FocusAudioTrack {
  id: string
  title: string
  filename: string
  src: string
  description: string
  badge?: string
}

export const FOCUS_TRACKS: FocusAudioTrack[] = [
  {
    id: 'ambient-focus',
    title: 'Ambient Focus',
    filename: 'ambient-focus.mp3',
    src: '/audio/ambient-focus.mp3',
    description: 'Calm ambient soundscape for steady, deep concentration',
    badge: 'Ambient',
  },
  {
    id: 'deep-focus',
    title: 'Deep Focus',
    filename: 'deep-focus.mp3',
    src: '/audio/deep-focus.mp3',
    description: 'Immersive low-frequency tones for entering flow state',
    badge: 'Binaural',
  },
  {
    id: 'fantacy-focus',
    title: 'Fantasy Focus',
    filename: 'fantacy-focus.mp3',
    src: '/audio/fantacy-focus.mp3',
    description: 'Inspiring melodic harmonies for creative and reflective thinking',
    badge: 'Melodic',
  },
  {
    id: 'curious-focus',
    title: 'Curious Focus',
    filename: 'curious-focus.mp3',
    src: '/audio/curious-focus.mp3',
    description: 'Gentle uplifting rhythm for active problem-solving',
    badge: 'Rhythm',
  },
]

export interface FocusAudioState {
  currentTrackId: string | null
  isPlaying: boolean
  volume: number // 0 to 1
  isMuted: boolean
  error: string | null
}

type AudioListener = (state: FocusAudioState) => void

const STORAGE_KEY_TRACK = 'nuzigo_focus_music_track'
const STORAGE_KEY_VOLUME = 'nuzigo_focus_music_volume'
const STORAGE_KEY_MUTED = 'nuzigo_focus_music_muted'

class FocusAudioManager {
  private static instance: FocusAudioManager | null = null
  private audio: HTMLAudioElement | null = null
  private currentTrackId: string | null = null
  private isPlaying = false
  private volume = 0.7
  private isMuted = false
  private error: string | null = null
  private listeners: Set<AudioListener> = new Set()

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK)
        if (savedTrack && FOCUS_TRACKS.some((t) => t.id === savedTrack)) {
          this.currentTrackId = savedTrack
        }

        const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME)
        if (savedVol) {
          const parsed = parseFloat(savedVol)
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed
          }
        }

        const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED)
        if (savedMuted) {
          this.isMuted = savedMuted === 'true'
        }
      } catch {}
    }
  }

  public static getInstance(): FocusAudioManager {
    if (!FocusAudioManager.instance) {
      FocusAudioManager.instance = new FocusAudioManager()
    }
    return FocusAudioManager.instance
  }

  private initAudioElement(): HTMLAudioElement {
    if (!this.audio && typeof window !== 'undefined') {
      this.audio = new Audio()
      this.audio.loop = true
      this.audio.preload = 'metadata'
      this.audio.volume = this.volume
      this.audio.muted = this.isMuted

      // Loop fallback onended
      this.audio.addEventListener('ended', () => {
        if (this.isPlaying && this.audio) {
          this.audio.currentTime = 0
          this.audio.play().catch(() => {})
        }
      })

      this.audio.addEventListener('play', () => {
        this.isPlaying = true
        this.error = null
        this.notify()
      })

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false
        this.notify()
      })

      this.audio.addEventListener('error', (e) => {
        console.warn('[FocusAudio] Audio element error:', e)
        this.isPlaying = false
        this.error = 'Unable to play selected audio track.'
        this.notify()
      })
    }
    return this.audio!
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    const state = this.getState()
    this.listeners.forEach((l) => l(state))
  }

  public getState(): FocusAudioState {
    return {
      currentTrackId: this.currentTrackId,
      isPlaying: this.isPlaying,
      volume: this.volume,
      isMuted: this.isMuted,
      error: this.error,
    }
  }

  public async playTrack(trackId: string): Promise<boolean> {
    const track = FOCUS_TRACKS.find((t) => t.id === trackId)
    if (!track) return false

    const audio = this.initAudioElement()

    // If same track is already loaded
    if (this.currentTrackId === trackId && audio.src.includes(track.filename)) {
      if (!this.isPlaying) {
        try {
          await audio.play()
          this.isPlaying = true
          this.error = null
          this.notify()
          return true
        } catch (err: any) {
          console.warn('[FocusAudio] Play error:', err)
          this.error = 'Click play to start audio playback.'
          this.notify()
          return false
        }
      }
      return true
    }

    // Switch to new track
    this.currentTrackId = trackId
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TRACK, trackId)
      }
    } catch {}

    audio.src = track.src
    audio.currentTime = 0
    audio.loop = true
    audio.volume = this.volume
    audio.muted = this.isMuted

    try {
      await audio.play()
      this.isPlaying = true
      this.error = null
      this.notify()
      return true
    } catch (err: any) {
      console.warn('[FocusAudio] Play error:', err)
      this.isPlaying = false
      this.error = 'Click play to start audio playback.'
      this.notify()
      return false
    }
  }

  public async togglePlay(): Promise<void> {
    const audio = this.initAudioElement()

    if (this.isPlaying) {
      audio.pause()
      this.isPlaying = false
      this.notify()
    } else {
      if (!this.currentTrackId) {
        this.currentTrackId = FOCUS_TRACKS[0].id
      }
      await this.playTrack(this.currentTrackId)
    }
  }

  public pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause()
      this.isPlaying = false
      this.notify()
    }
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
      this.notify()
    }
  }

  public setVolume(v: number): void {
    const clamped = Math.max(0, Math.min(1, v))
    this.volume = clamped
    if (this.audio) {
      this.audio.volume = clamped
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_VOLUME, String(clamped))
      }
    } catch {}
    this.notify()
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted
    if (this.audio) {
      this.audio.muted = muted
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_MUTED, String(muted))
      }
    } catch {}
    this.notify()
  }

  public toggleMute(): void {
    this.setMuted(!this.isMuted)
  }
}

export const focusAudioManager = FocusAudioManager.getInstance()
