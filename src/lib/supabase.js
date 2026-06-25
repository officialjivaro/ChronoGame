// Supabase Client | Creates the browser-safe Jivaro Games client from Vite environment values
import { createClient } from '@supabase/supabase-js'
import {
  JIVARO_GAMES_AUTH_STORAGE_KEY,
  JIVARO_GAMES_LEGACY_AUTH_STORAGE_KEYS
} from '../config/platform.js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabasePublishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()
const AUTH_STORAGE_SUFFIXES = Object.freeze(['', '-code-verifier', '-user'])

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

function migrateLegacyAuthStorage() {
  if (typeof window === 'undefined') return

  try {
    const storage = window.localStorage

    JIVARO_GAMES_LEGACY_AUTH_STORAGE_KEYS.forEach((legacyKey) => {
      AUTH_STORAGE_SUFFIXES.forEach((suffix) => {
        const sourceKey = `${legacyKey}${suffix}`
        const targetKey = `${JIVARO_GAMES_AUTH_STORAGE_KEY}${suffix}`
        const sourceValue = storage.getItem(sourceKey)

        if (storage.getItem(targetKey) === null && sourceValue !== null) {
          storage.setItem(targetKey, sourceValue)
        }
      })
    })

    // Remove stale game-specific copies once the shared session has been copied.
    if (storage.getItem(JIVARO_GAMES_AUTH_STORAGE_KEY) !== null) {
      JIVARO_GAMES_LEGACY_AUTH_STORAGE_KEYS.forEach((legacyKey) => {
        AUTH_STORAGE_SUFFIXES.forEach((suffix) => {
          storage.removeItem(`${legacyKey}${suffix}`)
        })
      })
    }
  } catch {
    // Browsers can deny localStorage in restricted contexts. Supabase will handle
    // the unavailable storage through its normal client behavior.
  }
}

if (isSupabaseConfigured) {
  migrateLegacyAuthStorage()
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: JIVARO_GAMES_AUTH_STORAGE_KEY
      }
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Jivaro Games accounts are not configured yet. Add the Supabase values to .env.local.')
  }

  return supabase
}
