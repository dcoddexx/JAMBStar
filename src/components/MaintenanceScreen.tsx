// src/components/MaintenanceScreen.tsx
// Responsive full-page or card overlay displayed during scheduled system maintenance

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { type SystemSettings, fetchSystemSettings } from '../services/systemSettings'

export interface MaintenanceScreenProps {
  settings?: SystemSettings | null
  onStatusRefreshed?: (fresh: SystemSettings) => void
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  settings,
  onStatusRefreshed,
}) => {
  const [checking, setChecking] = useState<boolean>(false)
  const [timeLeftString, setTimeLeftString] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState<boolean>(false)

  // Live countdown timer toward scheduled auto-off
  useEffect(() => {
    if (!settings?.maintenance_auto_off_at) {
      setTimeLeftString(null)
      return
    }

    const calculateRemaining = () => {
      const targetTime = new Date(settings.maintenance_auto_off_at!).getTime()
      const now = new Date().getTime()
      const diffMs = targetTime - now

      if (diffMs <= 0) {
        setTimeLeftString('Completing maintenance now...')
        setIsExpired(true)
        return
      }

      const totalSec = Math.floor(diffMs / 1000)
      const hours = Math.floor(totalSec / 3600)
      const minutes = Math.floor((totalSec % 3600) / 60)
      const seconds = totalSec % 60

      if (hours > 0) {
        setTimeLeftString(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeLeftString(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeftString(`${seconds}s`)
      }
    }

    calculateRemaining()
    const timerInterval = setInterval(calculateRemaining, 1000)

    return () => clearInterval(timerInterval)
  }, [settings?.maintenance_auto_off_at])

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const fresh = await fetchSystemSettings()
      if (onStatusRefreshed) {
        onStatusRefreshed(fresh)
      } else if (!fresh.is_maintenance) {
        window.location.reload()
      }
    } finally {
      setChecking(false)
    }
  }

  const messageText =
    settings?.maintenance_message ||
    'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.'

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden text-center p-6 sm:p-8 space-y-6 mx-auto">
        {/* Maintenance Graphic / Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-4xl shadow-inner">
          <span className="animate-pulse">🛠️</span>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Title and Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            <span>🔴</span>
            <span>Maintenance In Progress</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            JAMBStar Under Scheduled Maintenance
          </h1>
        </div>

        {/* Custom Message Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            System Notice:
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {messageText}
          </p>
        </div>

        {/* Countdown Timer (if scheduled) */}
        {settings?.maintenance_auto_off_at && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Estimated Completion:
            </span>
            <div className="text-lg sm:text-xl font-mono font-black text-emerald-900">
              {timeLeftString || 'Calculating...'}
            </div>
            {isExpired && (
              <p className="text-[11px] text-emerald-700">
                Scheduled downtime complete. Click below to verify access.
              </p>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Checking Status...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Check System Status</span>
              </>
            )}
          </button>

          <Link
            to="/admin"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Staff Portal Sign In →
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          Your saved mock exam scores and account data remain completely secure.
        </p>
      </div>
    </div>
  )
}
