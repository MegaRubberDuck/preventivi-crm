'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Client } from '@/lib/types'

const DEFAULT_COUNTRY = 'Italy'

export interface SaveClientPayload {
  id?: string
  name: string
  company?: string
  email?: string
  phone?: string
  notes?: string
  vat_number?: string
  fiscal_code?: string
  sdi_code?: string
  address?: string
  city?: string
  zip_code?: string
  country?: string
  website?: string
  client_type?: 'company' | 'private'
  is_active?: boolean
  logo_url?: string
}

export async function saveClient(payload: SaveClientPayload): Promise<{ id: string } | { error: string }> {
  const sb = await createServerClient()
  const row = {
    name:        payload.name,
    company:     payload.company ?? null,
    email:       payload.email ?? null,
    phone:       payload.phone ?? null,
    notes:       payload.notes ?? null,
    vat_number:  payload.vat_number ?? null,
    fiscal_code: payload.fiscal_code ?? null,
    sdi_code:    payload.sdi_code ?? null,
    address:     payload.address ?? null,
    city:        payload.city ?? null,
    zip_code:    payload.zip_code ?? null,
    country:     payload.country ?? DEFAULT_COUNTRY,
    website:     payload.website ?? null,
    client_type: payload.client_type ?? 'company',
    is_active:   payload.is_active ?? true,
    logo_url:    payload.logo_url ?? null,
  }
  if (payload.id) {
    const { data, error } = await sb.from('clients').update(row).eq('id', payload.id).select('id').single()
    if (error) {
      if (error.code === 'PGRST116') return { error: 'Client not found' }
      console.error('Failed to update client:', error.message)
      return { error: error.message }
    }
    revalidatePath('/clients')
    return { id: data.id }
  }
  const { data, error } = await sb.from('clients').insert(row).select('id').single()
  if (error) {
    console.error('Failed to insert client:', error.message)
    return { error: error.message }
  }
  revalidatePath('/clients')
  return { id: data.id }
}

export async function listClients(): Promise<Client[]> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('clients').select('*').order('name')
  if (error) {
    console.error('Failed to list clients:', error.message)
    return []
  }
  if (!data) return []
  return data as Client[]
}

export async function getClient(id: string): Promise<Client | null> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('clients').select('*').eq('id', id).single()
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Failed to get client:', error.message)
    }
    return null
  }
  if (!data) return null
  return data as Client
}

export async function deleteClient(id: string): Promise<{ error?: string }> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('clients').delete().eq('id', id).select('id').single()
  if (error) {
    if (error.code === 'PGRST116') return { error: 'Client not found' }
    console.error('Failed to delete client:', error.message)
    return { error: error.message }
  }
  if (!data) return { error: 'Client not found' }
  revalidatePath('/clients')
  return {}
}

export async function toggleActiveClient(id: string, is_active: boolean): Promise<{ error?: string }> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('clients').update({ is_active }).eq('id', id).select('id').single()
  if (error) {
    if (error.code === 'PGRST116') return { error: 'Client not found' }
    console.error('Failed to toggle client active status:', error.message)
    return { error: error.message }
  }
  if (!data) return { error: 'Client not found' }
  revalidatePath('/clients')
  return {}
}
