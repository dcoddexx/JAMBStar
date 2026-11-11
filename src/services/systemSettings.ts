// src/services/systemSettings.ts
// Handles system-wide configuration, maintenance mode, and automated expiration

import { supabase } from '../lib/supabase'

export interface SystemSettings {
  id: string
  is_maintenance: boolean
  maintenance_message: string
  maintenance_auto_off_at: string | null
  updated_at: string
}

export const DEFAULT_MAINTENANCE_MESSAGE =
  'We are currently performing scheduled system updates to improve your JAMBStar CBT practice experience. Please check back shortly.'

/**
 * Fetches the current system settings from Supabase.
 * If scheduled maintenance has passed its auto-off timestamp, automatically deactivates
 * maintenance mode in Supabase and returns the restored state.
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
        maintenance_auto_off_at: null,
        updated_at: new Date().toISOString(),
      }
    }

    if (!data) {
      return {
        id: 'global',
        is_maintenance: false,
        maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
        maintenance_auto_off_at: null,
        updated_at: new Date().toISOString(),
      }
    }

    // Auto-off expiration check
    if (
      data.is_maintenance &&
      data.maintenance_auto_off_at &&
      new Date().getTime() > new Date(data.maintenance_auto_off_at).getTime()
    ) {
      console.info('Maintenance auto-off threshold elapsed. Auto-disabling maintenance mode.')
      // Fire-and-forget background update to restore normal status in Supabase
      ;(async () => {
        try {
          const { error: resetErr } = await supabase
            .from('system_settings')
            .update({
              is_maintenance: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', 'global')
          if (resetErr) {
            console.warn('Failed to reset maintenance mode in Supabase:', resetErr.message)
          }
        } catch (e: unknown) {
          console.warn('Error resetting maintenance mode:', e)
        }
      })()

      return {
        ...data,
        is_maintenance: false,
      }
    }

    return data as SystemSettings
  } catch (err) {
    console.warn('Unexpected error in fetchSystemSettings:', err)
    return {
      id: 'global',
      is_maintenance: false,
      maintenance_message: DEFAULT_MAINTENANCE_MESSAGE,
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
