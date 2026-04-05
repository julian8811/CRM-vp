import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return false
  const t = url.trim()
  if (!t || t === 'undefined' || t === 'null') return false
  try {
    const u = new URL(t)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

function isValidAnonKey(key) {
  if (!key || typeof key !== 'string') return false
  const t = key.trim()
  return t.length > 20 && t !== 'undefined' && t !== 'null'
}

const supabaseUrl = isValidSupabaseUrl(rawUrl) ? rawUrl.trim() : ''
const supabaseAnonKey = isValidAnonKey(rawKey) ? rawKey.trim() : ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (Vercel: Environment Variables).'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey)
