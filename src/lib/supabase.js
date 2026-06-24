// Supabase Client | Creates the browser-safe client from Vite environment values
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabasePublishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'chronogame-supabase-auth'
      }
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Online accounts are not configured yet. Add the Supabase values to .env.local.')
  }

  return supabase
}
