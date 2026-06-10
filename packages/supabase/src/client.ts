import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function configureSupabase(url: string, anonKey: string) {
  const configured =
    Boolean(url && anonKey) &&
    !url.includes('YOUR_PROJECT') &&
    anonKey !== 'your-anon-key' &&
    !anonKey.endsWith('.mock-local-dev-key')

  supabase = configured ? createClient(url, anonKey) : null
}

export function getSupabase(): SupabaseClient | null {
  return supabase
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}
