'use client'

import React, { useState } from 'react'

interface StudentAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackBg?: string
  fallbackTextColor?: string
}

const sizeClasses: Record<NonNullable<StudentAvatarProps['size']>, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-12 w-12 text-base',
}

export function StudentAvatar({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  fallbackBg,
  fallbackTextColor,
}: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const cleanName = (name || 'Student').trim()
  const initial = cleanName.charAt(0).toUpperCase() || 'S'
  const defaultSizeClass = sizeClasses[size] || sizeClasses.md

  const hasValidImage = Boolean(avatarUrl && avatarUrl.trim() && !imageError)

  if (hasValidImage) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 ${defaultSizeClass} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl!}
          alt={cleanName}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover rounded-full"
          loading="lazy"
        />
      </div>
    )
  }

  // Graceful Fallback: Initial letter in circular container
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold select-none ${defaultSizeClass} ${
        fallbackBg || 'bg-[#55C832]/15 dark:bg-[#6BEA45]/20'
      } ${fallbackTextColor || 'text-[#318A25] dark:text-[#6BEA45]'} ${className}`}
      title={cleanName}
    >
      {initial}
    </div>
  )
}
