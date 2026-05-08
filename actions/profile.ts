'use server'

import { createServerClient } from '@/lib/supabase/server'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  updated_at: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, data: { full_name?: string }): Promise<{ success: boolean } | { error: string }> {
  const sb = await createServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user || user.id !== userId) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.full_name !== undefined) {
    updates.full_name = data.full_name
  }
   const { error } = await sb
     .from('profiles')
     .update(updates)
     .eq('id', userId)
  }
  const { error } = await sb
    .from('profiles')
    .update({ full_name: data.full_name, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}