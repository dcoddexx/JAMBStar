// src/services/systemSettings.ts
// Handles system-wide configuration, dual scheduled maintenance mode (Auto-ON & Auto-OFF), and local timezone helpers

import { supabase } from '../lib/supabase'

export interface SystemSettings {
  id: string
  is_maintenance: boolean
  maintenance_message: string
  maintenance_auto_on_at: string | null
  maintenance_auto_off_at: string | null
  updated_at: string
}

export const DEFAULT_MAINTENANCE_MESSAGE =
  'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.'

/**
 * Formats a Date object to local ISO string (YYYY-MM-DDTHH:mm) suitable for datetime-local inputs,
 * preventing any UTC conversion offset bugs.
 */
export const toLocalISOString = (d: Date): string => {
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

/**
 * Converts any UTC ISO string from database into local datetime-local input string.
 */
export const isoToLocalInputValue = (isoString?: string | null): string => {
  if (!isoString) return ''
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  return toLocalISOString(d)
}

/**
 * Fetches the current system settings from Supabase.
 * Evaluates both Auto-ON (maintenance_auto_on_at) and Auto-OFF (maintenance_auto_off_at)
 * scheduled windows to compute the live maintenance status accurately.
 */
export const fetchSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle()

    if (error) {
      console.warn('Could not fetch system settings from database:', error.message)
      return {
        id: 'global',
        is_maintenance: false,
        maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
        maintenance_auto_on_at: null,
        maintenance_auto_off_at: null,
        updated_at: new Date().toISOString(),
      }
    }

    if (!data) {
      return {
        id: 'global',
        is_maintenance: false,
        maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
        maintenance_auto_on_at: null,
        maintenance_auto_off_at: null,
        updated_at: new Date().toISOString(),
      }
    }

    const now = Date.now()
    const autoOnTime = data.maintenance_auto_on_at ? new Date(data.maintenance_auto_on_at).getTime() : null
    const autoOffTime = data.maintenance_auto_off_at ? new Date(data.maintenance_auto_off_at).getTime() : null

    let effectiveMaintenance = Boolean(data.is_maintenance)

    // 1. Dual window evaluation: Auto-ON check
    // If auto_on_at is reached AND (auto_off_at not reached or absent), maintenance activates
    if (autoOnTime !== null && now >= autoOnTime && (autoOffTime === null || now < autoOffTime)) {
      effectiveMaintenance = true
    }

    // 2. Dual window evaluation: Auto-OFF check
    // If auto_off_at is reached, maintenance deactivates
    if (autoOffTime !== null && now >= autoOffTime) {
      effectiveMaintenance = false
    }

    // 3. Background sync if effective state changed from database record
    if (effectiveMaintenance !== data.is_maintenance) {
      ;(async () => {
        try {
          const { error: syncErr } = await supabase
            .from('system_settings')
            .update({
              is_maintenance: effectiveMaintenance,
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'global')
          if (syncErr) {
            console.warn('Failed to sync scheduled maintenance state in Supabase:', syncErr.message)
          }
        } catch (e: unknown) {
          console.warn('Error syncing scheduled maintenance state:', e)
        }
      })()
    }

    return {
      ...data,
      is_maintenance: effectiveMaintenance,
    } as SystemSettings
  } catch (err) {
    console.warn('Unexpected error in fetchSystemSettings:', err)
    return {
      id: 'global',
      is_maintenance: false,
      maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
      maintenance_auto_on_at: null,
      maintenance_auto_off_at: null,
      updated_at: new Date().toISOString(),
    }
  }
}

/**
 * Updates global system settings in Supabase.
 */
export const updateSystemSettings = async (
  updates: Partial<Omit<SystemSettings, 'id'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 'global',
        ...updates,
        updated_at: new Date().toISOString(),
      })

    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    const e = err as Error
    return {
      success: false,
      error: e.message || 'Failed to update system settings in database.',
    }
  }
}
