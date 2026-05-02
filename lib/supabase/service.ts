import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase bypassant les RLS (Rôle Service)
 */
export const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    // Fail-safe for build time
    return createClient('https://placeholder.supabase.co', 'placeholder')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const serviceClient = getServiceClient()
