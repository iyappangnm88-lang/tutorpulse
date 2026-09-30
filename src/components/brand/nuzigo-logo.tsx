'use client'

import React from 'react'

interface NuzigoLogoProps {
  className?: string
  size?: number
  variant?: 'solid' | 'glyph' | 'green-glyph'
}

/**
 * Official Nuzigo N/Z Geometric Symbol
 * Uses cached static assets from /brand/ for ultra-fast load and zero bundle overhead
 */
export function NuzigoLogo({ className = 'h-6 w-6', size, variant = 'solid' }: NuzigoLogoProps) {
  const sizeStyle = size ? { width: size, height: size } : undefined

  if (variant === 'glyph') {
    return (
      <img
        src="/brand/logo-white.png"
        alt="Nuzigo"
        className={className}
        style={sizeStyle}
        loading="eager"
      />
    )
  }

  if (variant === 'green-glyph') {
    return (
      <img
        src="/brand/logo-green.png"
        alt="Nuzigo"
        className={className}
        style={sizeStyle}
        loading="eager"
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-[#55C832] p-1.5 shadow-md shadow-[#55C832]/30 ${className}`}
      style={sizeStyle}
    >
      <img
        src="/brand/logo-white.png"
        alt="Nuzigo"
        className="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  )
}
