'use server'

import { createServerClient } from '@/lib/supabase/server'
import { computeAll } from './calculator'
import type { Quote, SizingData, ComponentData, StaffingData, MAUTData, QuoteStatus } from '@/lib/types'

export interface SaveQuotePayload {
  id?: string
  client_id?: string | null
  title: string
  sizing_data?: SizingData | null
  components_data?: ComponentData[] | null
  staffing_data?: StaffingData | null
  costs_data?: { externalMonthly: number } | null
  maut_data?: MAUTData | null
}

export async function saveQuote(payload: SaveQuotePayload): Promise<{ id: string } | { error: string }> {
  const sb = await createServerClient()

  const snapshot = await computeAll(
    payload.sizing_data ?? null,
    payload.components_data ?? [],
    payload.staffing_data ?? null,
    payload.maut_data ?? null,
  )

  const row = {
    client_id:       payload.client_id ?? null,
    title:           payload.title,
    sizing_data:     payload.sizing_data ?? null,
    components_data: payload.components_data ?? null,
    staffing_data:   payload.staffing_data ?? null,
    costs_data:      payload.costs_data ?? null,
    maut_data:       payload.maut_data ?? null,
    result_snapshot: snapshot,
  }

  if (payload.id) {
    const { data, error } = await sb.from('quotes').update(row).eq('id', payload.id).select('id').single()
    if (error) return { error: error.message }
    if (!data) return { error: 'Quote not found' }
    return { id: data.id }
  }

  const { data, error } = await sb.from('quotes').insert({ ...row, status: 'draft' }).select('id').single()
  if (error) return { error: error.message }
  return { id: data.id }
}

export async function listQuotes(page = 1, pageSize = 50): Promise<Quote[]> {
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1)
  const safePageSize = Math.min(Math.max(1, Number.isFinite(pageSize) ? pageSize : 50), 100)
  const sb = await createServerClient()
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1
  const { data, error } = await sb
    .from('quotes')
    .select('*, client:clients(id,name,company)')
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error || !data) return []
  return data as Quote[]
}

export async function getQuote(id: string): Promise<Quote | null> {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('quotes')
    .select('*, client:clients(id,name,company,email,phone)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data as Quote
}

const VALID_STATUSES: QuoteStatus[] = ['draft', 'sent', 'won', 'lost']

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<{ error?: string }> {
  if (!VALID_STATUSES.includes(status)) {
    return { error: 'Invalid status' }
  }
  const sb = await createServerClient()
  const { data, error } = await sb.from('quotes').update({ status }).eq('id', id).select('id').single()
  if (error) return { error: error.message }
  if (!data) return { error: 'Quote not found' }
  return {}
}

export async function deleteQuote(id: string): Promise<{ error?: string }> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('quotes').delete().eq('id', id).select('id').single()
  if (error) return { error: error.message }
  if (!data) return { error: 'Quote not found' }
  return {}
}

export async function getClientQuotes(clientId: string): Promise<Quote[]> {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('quotes')
    .select('*, client:clients(id,name,company)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Quote[]
}
