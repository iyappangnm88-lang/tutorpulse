/**
 * Device Media & Hardware Permissions Handler.
 * Provides resilient, graceful camera and microphone acquisition with fallback mechanisms
 * so users can join classes even when camera or microphone is unavailable.
 */

export interface MediaAcquisitionResult {
  stream: MediaStream | null
  audioAvailable: boolean
  videoAvailable: boolean
  error?: string
  errorCode?: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'NotSupportedError' | 'UnknownError'
}

/**
 * Requests user media with fallback logic.
 * If both camera and microphone fail together, attempts single-media acquisition (audio-only or video-only).
 */
export async function requestMediaPermissions(options?: {
  preferVideo?: boolean
  preferAudio?: boolean
}): Promise<MediaAcquisitionResult> {
  const preferVideo = options?.preferVideo !== false
  const preferAudio = options?.preferAudio !== false

  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      stream: null,
      audioAvailable: false,
      videoAvailable: false,
      error: 'WebRTC and media devices are not supported in this browser.',
      errorCode: 'NotSupportedError',
    }
  }

  // 1. Attempt dual audio + video
  if (preferVideo && preferAudio) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      return {
        stream,
        audioAvailable: stream.getAudioTracks().length > 0,
        videoAvailable: stream.getVideoTracks().length > 0,
      }
    } catch (err: any) {
      console.warn('Initial dual-media request failed, attempting single-device fallback:', err.name, err.message)

      // If user explicitly denied permission, don't nag with secondary popups immediately
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return {
          stream: null,
          audioAvailable: false,
          videoAvailable: false,
          error: 'Camera and microphone access was denied. You can still join and listen.',
          errorCode: 'NotAllowedError',
        }
      }

      // 2. Fallback: try audio-only (e.g. desktop PC without webcam)
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        })
        return {
          stream: audioStream,
          audioAvailable: true,
          videoAvailable: false,
          error: 'No camera found. Connected with microphone only.',
        }
      } catch (audioErr: any) {
        // 3. Fallback: try video-only (e.g. camera without mic)
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })
          return {
            stream: videoStream,
            audioAvailable: false,
            videoAvailable: true,
            error: 'No microphone found. Connected with camera only.',
          }
        } catch {
          return {
            stream: null,
            audioAvailable: false,
            videoAvailable: false,
            error: 'Unable to access camera or microphone. Joining in view-only mode.',
            errorCode: (err.name as any) || 'NotFoundError',
          }
        }
      }
    }
  }

  // If only audio preferred
  if (preferAudio) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      return { stream, audioAvailable: true, videoAvailable: false }
    } catch (err: any) {
      return { stream: null, audioAvailable: false, videoAvailable: false, error: err.message }
    }
  }

  // If only video preferred
  if (preferVideo) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      return { stream, audioAvailable: false, videoAvailable: true }
    } catch (err: any) {
      return { stream: null, audioAvailable: false, videoAvailable: false, error: err.message }
    }
  }

  return { stream: null, audioAvailable: false, videoAvailable: false }
}

/**
 * Requests screen sharing stream from the browser.
 * Handled gracefully if cancelled by the user.
 */
export async function requestScreenShare(): Promise<{
  stream: MediaStream | null
  error?: string
  cancelled?: boolean
}> {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    return {
      stream: null,
      error: 'Screen sharing is not supported in this browser or environment.',
    }
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
      },
      audio: false,
    })
    return { stream }
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      // User dismissed the browser screen share picker
      return { stream: null, cancelled: true }
    }
    return {
      stream: null,
      error: err.message || 'Failed to start screen sharing.',
    }
  }
}

/**
 * Stops all tracks in a MediaStream and releases hardware device locks.
 */
export function stopAllTracks(stream?: MediaStream | null): void {
  if (!stream) return
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch (err) {
        console.warn('Error stopping media track:', err)
      }
    })
  } catch (err) {
    console.warn('Error accessing stream tracks to stop:', err)
  }
}
