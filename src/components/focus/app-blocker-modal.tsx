'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert,
  Search,
  Check,
  Smartphone,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type BlockedApp,
  type AppBlockerConfig,
  PRESET_DISTRACTING_APPS,
  loadAppBlockerConfig,
  saveAppBlockerConfig,
} from '@/lib/focus/app-blocker-config'
import {
  isAndroidNative,
  getInstalledApps,
  checkAppBlockingPermission,
  requestAppBlockingPermission,
} from '@/lib/focus/android-capabilities'

interface AppBlockerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigChange?: (config: AppBlockerConfig) => void
}

export function AppBlockerModal({ isOpen, onClose, onConfigChange }: AppBlockerModalProps) {
  const [config, setConfig] = useState<AppBlockerConfig>(loadAppBlockerConfig)
  const [apps, setApps] = useState<BlockedApp[]>(PRESET_DISTRACTING_APPS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'social' | 'entertainment' | 'games'>('all')
  const [isAndroid, setIsAndroid] = useState(false)
  const [hasPermission, setHasPermission] = useState(true)
  const [isCheckingPermission, setIsCheckingPermission] = useState(false)

  // 1. Initial Load & Permission check
  useEffect(() => {
    if (!isOpen) return
    const isNative = isAndroidNative()
    setIsAndroid(isNative)
    setConfig(loadAppBlockerConfig())

    // Load available apps (installed apps on Android, curated presets on web)
    getInstalledApps().then((loadedApps) => {
      if (loadedApps && loadedApps.length > 0) {
        setApps(loadedApps)
      }
    })

    // Check Android permissions
    if (isNative) {
      setIsCheckingPermission(true)
      checkAppBlockingPermission()
        .then((res) => {
          setHasPermission(res.granted)
        })
        .finally(() => {
          setIsCheckingPermission(false)
        })
    }
  }, [isOpen])

  // 2. Filter apps by search and category
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false
      if (selectedCategory === 'all') return true
      return app.category === selectedCategory
    })
  }, [apps, searchQuery, selectedCategory])

  const selectedCount = config.selectedPackages.length

  const handleTogglePackage = (pkg: string) => {
    setConfig((prev) => {
      const isSelected = prev.selectedPackages.includes(pkg)
      const nextPackages = isSelected
        ? prev.selectedPackages.filter((p) => p !== pkg)
        : [...prev.selectedPackages, pkg]

      return {
        ...prev,
        selectedPackages: nextPackages,
      }
    })
  }

  const handleSelectAllFiltered = () => {
    const pkgsToAdd = filteredApps.map((a) => a.packageName)
    setConfig((prev) => ({
      ...prev,
      selectedPackages: Array.from(new Set([...prev.selectedPackages, ...pkgsToAdd])),
    }))
  }

  const handleClearAll = () => {
    setConfig((prev) => ({
      ...prev,
      selectedPackages: [],
    }))
  }

  const handleSelectCategoryPreset = (category: 'social' | 'entertainment' | 'games') => {
    const categoryPkgs = apps.filter((a) => a.category === category).map((a) => a.packageName)
    setConfig((prev) => ({
      ...prev,
      selectedPackages: Array.from(new Set([...prev.selectedPackages, ...categoryPkgs])),
    }))
  }

  const handleGrantPermission = async () => {
    await requestAppBlockingPermission()
    const res = await checkAppBlockingPermission()
    setHasPermission(res.granted)
  }

  const handleSave = () => {
    saveAppBlockerConfig(config)
    onConfigChange?.(config)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#161D16] border border-[#293329] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F4F7F2]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#293329] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center border border-[#6BEA45]/40 shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F4F7F2]">App Blocker</h2>
              <p className="text-xs text-[#A8B3A5]">
                Prevent access to distracting apps while studying
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#202920] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Main Enable / Disable Switch Card */}
          <div className="p-4 rounded-2xl bg-[#1C251C] border border-[#293329] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F4F7F2]">Block Distracting Apps</span>
                {config.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A8B3A5]">
                Shield your attention during active focus blocks
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={config.enabled}
              onClick={() => setConfig((p) => ({ ...p, enabled: !p.enabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                config.enabled ? 'bg-[#6BEA45]' : 'bg-[#293329]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#0B0F0C] shadow-lg ring-0 transition duration-200 ease-in-out mt-1 ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Android Permission Check Banner */}
          {isAndroid && !hasPermission && config.enabled && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-xs font-bold text-amber-300">Android Permission Required</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Usage Access is needed so NUZIGO can detect when a selected distracting app opens and redirect you back to your study session.
                </p>
                <Button
                  size="sm"
                  onClick={handleGrantPermission}
                  className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#0B0F0C] font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Grant Usage Access</span>
                </Button>
              </div>
            </div>
          )}

          {/* Web Fallback Card */}
          {!isAndroid && (
            <div className="p-3.5 rounded-2xl bg-[#1B231B] border border-[#293329] flex items-center gap-3 text-xs text-[#A8B3A5]">
              <Smartphone className="h-4 w-4 text-[#6BEA45] shrink-0" />
              <span>
                App Blocker enforces directly on the <strong>NUZIGO Android App</strong>. Your preferences are saved here.
              </span>
            </div>
          )}

          {/* Apps Selection Header & Category Chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A8B3A5]">
                Selected Apps ({selectedCount})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs font-bold text-[#6BEA45] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#293329]">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-medium text-[#A8B3A5] hover:text-white cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#6BEA45] text-[#0B0F0C]'
                    : 'bg-[#202920] text-[#A8B3A5] hover:text-white'
                }`}
              >
                All Apps
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('social')
                  handleSelectCategoryPreset('social')
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'social'
                    ? 'bg-[#6BEA45] text-[#0B0F0C]'
                    : 'bg-[#202920] text-[#A8B3A5] hover:text-white'
                }`}
              >
                📸 Social
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('entertainment')
                  handleSelectCategoryPreset('entertainment')
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'entertainment'
                    ? 'bg-[#6BEA45] text-[#0B0F0C]'
                    : 'bg-[#202920] text-[#A8B3A5] hover:text-white'
                }`}
              >
                ▶️ Streaming
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('games')
                  handleSelectCategoryPreset('games')
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'games'
                    ? 'bg-[#6BEA45] text-[#0B0F0C]'
                    : 'bg-[#202920] text-[#A8B3A5] hover:text-white'
                }`}
              >
                🎮 Games
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71806F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apps to block..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#121812] border border-[#293329] text-xs text-white placeholder-[#71806F] focus:outline-hidden focus:border-[#6BEA45]/60 transition-colors"
              />
            </div>

            {/* Apps List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 pt-1">
              {filteredApps.map((app) => {
                const isSelected = config.selectedPackages.includes(app.packageName)
                return (
                  <div
                    key={app.packageName}
                    onClick={() => handleTogglePackage(app.packageName)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F2B1F] border-[#6BEA45]/50 text-white'
                        : 'bg-[#121812] border-[#202920] text-[#A8B3A5] hover:bg-[#161D16] hover:text-[#F4F7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-[#202920] text-sm flex items-center justify-center shrink-0">
                        <span>{app.iconEmoji || '📱'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-[#F4F7F2]">{app.appName}</p>
                        <p className="text-[10px] text-[#71806F] truncate">{app.packageName}</p>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#6BEA45] border-[#6BEA45] text-[#0B0F0C]'
                          : 'border-[#374437] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                )
              })}

              {filteredApps.length === 0 && (
                <div className="p-6 text-center text-xs text-[#A8B3A5]">
                  No apps found matching &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#293329] bg-[#121812] flex items-center justify-between gap-3">
          <span className="text-xs text-[#A8B3A5]">
            {config.enabled ? (
              <span className="text-[#6BEA45] font-semibold">
                🛡️ {selectedCount} {selectedCount === 1 ? 'app' : 'apps'} will be blocked
              </span>
            ) : (
              'Blocker disabled'
            )}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-[#A8B3A5] hover:text-white hover:bg-[#202920] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-9 px-5 rounded-xl bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] font-bold text-xs shadow-md cursor-pointer"
            >
              Apply Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
