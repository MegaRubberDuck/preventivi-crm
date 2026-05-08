'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { encrypt, decrypt } from '@/lib/encryption'

export type CredentialType = 'api_key' | 'password' | 'token' | 'ftp' | 'ssh' | 'certificate' | 'webhook_url' | 'other'

export interface CredentialListItem {
  id: string
  client_id: string
  name: string
  credential_type: CredentialType
  url: string | null
  expires_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Credential extends CredentialListItem {
  encrypted_value: string
}

export interface CredentialWithDecryptedValue extends CredentialListItem {
  encrypted_value: string
  decrypted_value: string
}

export interface SaveCredentialPayload {
  id?: string
  client_id: string
  name: string
  credential_type: CredentialType
  value: string
  url?: string
  expires_at?: string | null
  notes?: string | null
}

export async function getClientCredentials(clientId: string): Promise<CredentialListItem[]> {
  const sb = await createServerClient()

  const { data: { user } } = await sb.auth.getUser()
  if (!user) {
    console.error('Unauthorized: No authenticated user')
    return []
  }

  const { data, error } = await sb
    .from('client_credentials')
    .select('id, client_id, name, credential_type, url, expires_at, notes, created_at, updated_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching credentials:', error)
    return []
  }

  return data || []
}

export async function getCredentialById(id: string): Promise<CredentialWithDecryptedValue | null> {
  if (!id) return null

  const sb = await createServerClient()
  
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const { data, error } = await sb
    .from('client_credentials')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error) return null
  if (!data) return null

  try {
    const decrypted = decrypt(data.encrypted_value)
    return { ...data, encrypted_value: '[REDACTED]', decrypted_value: decrypted }
  } catch (e) {
    return { ...data, encrypted_value: '[REDACTED]', decrypted_value: '[Decryption failed]' }
  }
}

export async function saveCredential(payload: SaveCredentialPayload): Promise<{ id: string } | { error: string }> {
  const sb = await createServerClient()

  let encrypted_value: string
  try {
    encrypted_value = encrypt(payload.value)
  } catch (e) {
    console.error('Error encrypting credential:', e)
    return { error: 'Failed to encrypt credential value' }
  }

  const row = {
    client_id: payload.client_id,
    name: payload.name,
    credential_type: payload.credential_type,
    encrypted_value,
    url: payload.url ?? null,
    expires_at: payload.expires_at ?? null,
    notes: payload.notes ?? null,
  }

  if (payload.id) {
    const { error } = await sb
      .from('client_credentials')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .eq('client_id', payload.client_id)

    if (error) return { error: error.message }
    revalidatePath(`/clients/${payload.client_id}`)
    return { id: payload.id }
  } else {
    const { data, error } = await sb
      .from('client_credentials')
      .insert(row)
      .select('id')
      .single()
    
    if (error) return { error: error.message }
    revalidatePath(`/clients/${payload.client_id}`)
    return { id: data.id }
  }
}

export async function deleteCredential(id: string, clientId: string): Promise<{ success: boolean } | { error: string }> {
  const sb = await createServerClient()
  const { error } = await sb
    .from('client_credentials')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

/**
 * Verifies a user's password by attempting to sign in.
 * Note: signInWithPassword refreshes session tokens and updates last_sign_in_at.
 * Supabase does not provide a pure password verification method without side effects.
 */
export async function verifyPassword(password: string): Promise<{ valid: boolean; error?: string }> {
  const sb = await createServerClient()
  
  const { data: { user }, error: userError } = await sb.auth.getUser()
  
  if (userError || !user?.email) {
    return { valid: false, error: 'Invalid session' }
  }

  const { error: signInError } = await sb.auth.signInWithPassword({
    email: user.email,
    password: password,
  })

  if (signInError) {
    return { valid: false, error: 'Incorrect password' }
  }

  return { valid: true }
}