'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  Check,
  X,
  Smartphone,
  Info,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  loadAppBlockerConfig,
  saveAppBlockerConfig,
  type AppBlockerConfig,
  type BlockedApp,
  PRESET_DISTRACTING_APPS,
} from '@/lib/focus/app-blocker-config'
import {
  isAndroidNative,
  checkUsageAccessPermission,
  requestUsageAccessPermission,
  getInstalledApps,
} from '@/lib/focus/android-capabilities'

interface AppBlockerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigChange?: (config: AppBlockerConfig) => void
}

const CATEGORIES = ['All', 'Social', 'Entertainment', 'Games', 'Other']

export function AppBlockerModal({ isOpen, onClose, onConfigChange }: AppBlockerModalProps) {
  const [config, setConfig] = useState<AppBlockerConfig>(loadAppBlockerConfig)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isAndroid, setIsAndroid] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [installedApps, setInstalledApps] = useState<BlockedApp[]>([])
  const [loadingApps, setLoadingApps] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const current = loadAppBlockerConfig()
    setConfig(current)

    const android = isAndroidNative()
    setIsAndroid(android)

    if (android) {
      checkUsageAccessPermission().then((status) => {
        setHasPermission(status.granted)
      })

      setLoadingApps(true)
      getInstalledApps()
        .then((apps: BlockedApp[]) => {
          if (apps && apps.length > 0) {
            setInstalledApps(apps)
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingApps(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedCount = config.selectedPackages.length

  const handleToggleApp = (packageName: string) => {
    const isSelected = config.selectedPackages.includes(packageName)
    const nextPackages = isSelected
      ? config.selectedPackages.filter((p) => p !== packageName)
      : [...config.selectedPackages, packageName]

    const nextConfig: AppBlockerConfig = {
      ...config,
      selectedPackages: nextPackages,
    }

    setConfig(nextConfig)
    saveAppBlockerConfig(nextConfig)
    onConfigChange?.(nextConfig)
  }

  const handleToggleGlobal = (enabled: boolean) => {
    const nextConfig: AppBlockerConfig = {
      ...config,
      enabled,
    }
    setConfig(nextConfig)
    saveAppBlockerConfig(nextConfig)
    onConfigChange?.(nextConfig)
  }

  const handleSelectAllDefaults = () => {
    const defaultPkgs = PRESET_DISTRACTING_APPS.map((a: BlockedApp) => a.packageName)
    const nextConfig: AppBlockerConfig = {
      ...config,
      selectedPackages: defaultPkgs,
    }
    setConfig(nextConfig)
    saveAppBlockerConfig(nextConfig)
    onConfigChange?.(nextConfig)
  }

  const handleClearAll = () => {
    const nextConfig: AppBlockerConfig = {
      ...config,
      selectedPackages: [],
    }
    setConfig(nextConfig)
    saveAppBlockerConfig(nextConfig)
    onConfigChange?.(nextConfig)
  }

  const appSource = installedApps.length > 0 ? installedApps : PRESET_DISTRACTING_APPS

  const displayedApps = appSource.filter((app: BlockedApp) => {
    const matchesSearch =
      app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      activeCategory === 'All' ||
      (app.category && app.category.toLowerCase() === activeCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Android Bottom Sheet Container */}
      <div className="relative z-10 bg-[#161D16] border-t border-x border-[#293329] text-[#F4F7F2] w-full max-w-xl rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Bottom Sheet Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-[#293329] rounded-full" />
        </div>

        {/* Header with Dynamic Count Indicator */}
        <div className="px-6 py-4 border-b border-[#293329] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#6BEA45]/20 text-[#6BEA45] flex items-center justify-center border border-[#6BEA45]/40 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">Blocked Apps</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-[#6BEA45]/20 text-[#6BEA45] border border-[#6BEA45]/40 shadow-xs">
                  ( {selectedCount} )
                </span>
              </div>
              <p className="text-xs text-[#A8B3A5]">
                {selectedCount > 0
                  ? `${selectedCount} distracting ${selectedCount === 1 ? 'app' : 'apps'} selected`
                  : 'Shield your Focus session from interruptions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-[#1C261C] text-[#A8B3A5] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#293329]"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Activation Banner / Toggle */}
          <div className="p-4 rounded-2xl bg-[#0B0F0C] border border-[#293329] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                  config.enabled ? 'bg-[#6BEA45]/20 text-[#6BEA45]' : 'bg-[#1C261C] text-[#A8B3A5]'
                }`}
              >
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Enable Distraction Blocking
                </span>
                <span className="text-[11px] text-[#A8B3A5]">
                  {config.enabled
                    ? 'Active during Focus sessions'
                    : 'Turn on to prevent app switching'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleGlobal(!config.enabled)}
              className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer focus:outline-hidden ${
                config.enabled ? 'bg-[#6BEA45]' : 'bg-[#293329]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Android Usage Stats Permission Alert (if on Android without permission) */}
          {isAndroid && !hasPermission && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-200">Android Permission Needed</h4>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed mt-0.5">
                    Enable Usage Access so NUZIGO can detect and shield chosen apps.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => requestUsageAccessPermission()}
                className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shrink-0 min-h-[36px] rounded-xl px-3 cursor-pointer"
              >
                Grant
              </Button>
            </div>
          )}

          {/* Web Mode Disclaimer */}
          {!isAndroid && (
            <div className="p-3.5 rounded-2xl bg-[#0B0F0C] border border-[#293329] flex items-center gap-2.5 text-xs text-[#A8B3A5]">
              <Smartphone className="h-4 w-4 text-[#6BEA45] shrink-0" />
              <span>
                App Blocking operates natively on the <strong>NUZIGO Android App</strong>. Your selected preferences sync across devices.
              </span>
            </div>
          )}

          {/* Search Bar & Fast Actions */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#A8B3A5]" />
              <input
                type="text"
                placeholder="Search distracting apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl bg-[#0B0F0C] border border-[#293329] text-xs text-white placeholder:text-[#A8B3A5]/60 focus:border-[#6BEA45] focus:outline-hidden transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[34px] ${
                    activeCategory === cat
                      ? 'bg-[#6BEA45] text-[#0B0F0C] shadow-xs'
                      : 'bg-[#1C261C] border border-[#293329] text-[#A8B3A5] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* App List (Comfortable Touch Targets, Min 52px Per Row) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#A8B3A5] px-1">
              <span>Installed & Popular Apps</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllDefaults}
                  className="text-[11px] text-[#6BEA45] hover:underline cursor-pointer font-bold"
                >
                  Select Defaults
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {displayedApps.map((app: BlockedApp) => {
                const isSelected = config.selectedPackages.includes(app.packageName)
                return (
                  <div
                    key={app.packageName}
                    onClick={() => handleToggleApp(app.packageName)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none min-h-[52px] ${
                      isSelected
                        ? 'bg-[#1C261C] border-[#6BEA45]/50 shadow-xs'
                        : 'bg-[#0B0F0C] border-[#293329] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-[#161D16] border border-[#293329] flex items-center justify-center text-lg shrink-0">
                        {app.iconEmoji || '📱'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {app.appName}
                        </span>
                        <span className="text-[10px] text-[#A8B3A5] block truncate font-mono">
                          {app.packageName}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ml-3 ${
                        isSelected
                          ? 'bg-[#6BEA45] text-[#0B0F0C]'
                          : 'border-2 border-[#293329] bg-[#161D16]'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sheet Footer Actions */}
        <div className="p-4 border-t border-[#293329] bg-[#0B0F0C] flex items-center justify-between gap-3">
          <div className="text-xs text-[#A8B3A5] pl-2">
            <span>{selectedCount} apps selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold border-[#293329] bg-[#161D16] text-[#A8B3A5] hover:text-white cursor-pointer min-h-[44px] px-5"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-bold bg-[#6BEA45] hover:bg-[#58D333] text-[#0B0F0C] px-6 shadow-[0_0_20px_rgba(107,234,69,0.3)] cursor-pointer min-h-[44px]"
            >
              Done ( {selectedCount} )
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
