'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/'

  const isValidRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.includes('\\') && !redirectTo.includes(':')
  const safeRedirectTo = isValidRedirect ? redirectTo : '/'

  if (!email || !password) {
    return { error: 'Email e password sono obbligatori' }
  }

  const sb = await createServerClient()
  
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data?.session) {
    return { error: 'Login failed - no session created' }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: safeRedirectTo }
}

export async function signOutAction() {
  const sb = await createServerClient()
  const { error } = await sb.auth.signOut()
  if (error) {
    console.error('Sign out failed:', error.message)
  }
  redirect('/login')
}