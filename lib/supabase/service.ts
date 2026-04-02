import { createClient } from '@supabase/supabase-js'

// Client service role — UNIQUEMENT dans Server Actions et Cron Jobs
// Ne jamais exposer côté client
export const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
