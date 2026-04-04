import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Static client (no user context — avoid for data queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authenticated client that passes a Clerk session JWT so Supabase RLS works
export function getAuthClient(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}
