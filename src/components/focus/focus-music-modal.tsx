'use client'

import React from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  X,
  Music,
  Disc,
  Headphones,
  Square,
  Sparkles,
  Check,
} from 'lucide-react'
import { useFocusMusic } from '@/contexts/focus-music-context'
import { Button } from '@/components/ui/button'

interface FocusMusicModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FocusMusicModal({ isOpen, onClose }: FocusMusicModalProps) {
  const {
    tracks,
    currentTrack,
    currentTrackId,
    isPlaying,
    volume,
    isMuted,
    error,
    playTrack,
    togglePlay,
    stop,
    setVolume,
    toggleMute,
  } = useFocusMusic()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#161D16] border border-[#293329] text-[#F4F7F2] max-w-xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#293329] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center border border-[#6BEA45]/30">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Focus Music & Soundscapes</h3>
              <p className="text-xs text-[#A8B3A5]">Continuous looping study audio for uninterrupted focus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-[#1C261C] hover:bg-[#253325] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#293329]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Currently Active Player Banner */}
        {currentTrack && (
          <div className="p-4 rounded-2xl bg-[#0F140F] border border-[#293329] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-inner">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="relative h-12 w-12 rounded-xl bg-[#6BEA45]/10 border border-[#6BEA45]/30 flex items-center justify-center shrink-0">
                <Disc className={`h-6 w-6 text-[#6BEA45] ${isPlaying ? 'animate-spin-slow' : ''}`} />
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#6BEA45] animate-ping" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{currentTrack.title}</span>
                  {isPlaying ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#6BEA45] text-[#0B0F0C]">
                      Playing
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#293329] text-[#A8B3A5]">
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#A8B3A5] truncate mt-0.5">{currentTrack.filename}</p>
              </div>
            </div>

            {/* Quick Play/Pause & Stop Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                onClick={() => togglePlay()}
                className={`h-9 px-4 rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-md transition-all ${
                  isPlaying
                    ? 'bg-amber-400 hover:bg-amber-500 text-[#0B0F0C]'
                    : 'bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> Play
                  </>
                )}
              </Button>
              {isPlaying && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stop()}
                  className="h-9 px-3 rounded-xl border-[#293329] hover:bg-[#1C261C] text-[#A8B3A5] hover:text-white text-xs font-bold cursor-pointer"
                  title="Stop Music"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Master Volume Slider */}
        <div className="p-3.5 rounded-2xl bg-[#111711] border border-[#293329] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-[#6BEA45] hover:text-[#58D333] transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <span>Volume</span>
            </div>
            <span className="text-xs font-mono text-[#A8B3A5]">
              {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                if (isMuted) toggleMute()
                setVolume(parseFloat(e.target.value))
              }}
              className="w-full h-1.5 bg-[#293329] rounded-lg appearance-none cursor-pointer accent-[#6BEA45]"
            />
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/40 text-red-200 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Track Selection List */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8B3A5] px-1">
            Available Tracks ({tracks.length})
          </div>

          {tracks.map((track) => {
            const isCurrent = currentTrackId === track.id
            const isThisPlaying = isCurrent && isPlaying

            return (
              <div
                key={track.id}
                onClick={() => playTrack(track.id)}
                className={`group p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                  isThisPlaying
                    ? 'border-[#6BEA45] bg-[#1C281C] shadow-[0_0_20px_rgba(107,234,69,0.2)]'
                    : isCurrent
                    ? 'border-[#6BEA45]/60 bg-[#141C14]'
                    : 'border-[#293329] bg-[#111711] hover:border-[#6BEA45]/40 hover:bg-[#161F16]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Play Button Icon Circle */}
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isThisPlaying
                        ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-[0_0_15px_rgba(107,234,69,0.4)]'
                        : isCurrent
                        ? 'bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/40'
                        : 'bg-[#1C261C] text-[#A8B3A5] group-hover:text-white group-hover:bg-[#293329]'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    )}
                  </div>

                  {/* Track Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent ? 'text-[#6BEA45]' : 'text-white group-hover:text-[#6BEA45]'
                        }`}
                      >
                        {track.title}
                      </h4>
                      {track.badge && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-black/40 text-[#A8B3A5] border border-[#293329]">
                          {track.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A8B3A5] truncate mt-0.5">{track.description}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{track.filename}</p>
                  </div>
                </div>

                {/* Animated Equalizer or Selection Check */}
                <div className="shrink-0 flex items-center gap-2">
                  {isThisPlaying ? (
                    <div className="flex items-end gap-0.5 h-4 px-1">
                      <span className="w-1 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                      <span className="w-1 bg-[#6BEA45] rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                      <span className="w-1 bg-[#6BEA45] rounded-full animate-bounce h-2" />
                    </div>
                  ) : isCurrent ? (
                    <div className="h-5 w-5 rounded-full bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center border border-[#6BEA45]/40">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#293329] text-[11px] text-[#A8B3A5] flex items-center justify-between shrink-0">
          <span>Continuous looping audio • Plays during all focus modes</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1C261C] hover:bg-[#253325] text-xs font-bold text-white transition-colors cursor-pointer border border-[#293329]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
