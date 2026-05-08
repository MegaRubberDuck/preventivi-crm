'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const sb = await createServerClient()
  const { data: { user }, error } = await sb.auth.getUser()
  if (error) {
    console.error('Error fetching current user:', error.message)
  }
  return user
}