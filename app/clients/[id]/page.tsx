'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { saveClient, getClient } from '@/actions/clients'
import { getClientQuotes, deleteQuote, updateQuoteStatus } from '@/actions/quotes'
import { getClientCredentials } from '@/actions/credentials'
import { CredentialsList } from '@/components/clients/credentials/CredentialsList'
import { Header } from '@/components/Header'
import type { Quote, QuoteStatus } from '@/lib/types'

function fmtDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-600',
    won: 'bg-green-100 text-green-600',
    lost: 'bg-red-100 text-red-600',
  }
  const labels = { draft: 'Bozza', sent: 'Inviato', won: 'Vinto', lost: 'Perso' }
  return <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold ${styles[status]}`}>{labels[status]}</span>
}

function DeleteModal({ onConfirm, onCancel, loading = false }: { onConfirm: () => void, onCancel: () => void, loading?: boolean }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, loading])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={loading ? undefined : onCancel} role="presentation">
      <div className="bg-white rounded-[16px] p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <h3 id="delete-modal-title" className="text-[16px] font-semibold text-[#181d26] mb-2">Conferma Eliminazione</h3>
        <p className="text-[13px] text-[#181d26]/70 mb-6">
          Sei sicuro di voler eliminare questo preventivo? L&apos;azione è irreversibile.
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            autoFocus
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-[#181d26] bg-[#f8fafc] border border-[#e0e2e6] rounded-[8px] hover:bg-[#f0f4ff] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 rounded-[8px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const editParam = searchParams.get('edit')

  const [showForm, setShowForm] = useState(editParam === '1')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'quotes' | 'credentials'>('quotes')

  const [clientData, setClientData] = useState<Awaited<ReturnType<typeof getClient>>>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [credentials, setCredentials] = useState<Awaited<ReturnType<typeof getClientCredentials>>>([])
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    vat_number: '',
    fiscal_code: '',
    sdi_code: '',
    address: '',
    city: '',
    zip_code: '',
    country: 'Italia',
    website: '',
    client_type: 'company' as 'company' | 'private',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const c = await getClient(id)
        if (c) {
          setClientData(c)
          setFormData({
            name: c.name || '',
            company: c.company || '',
            email: c.email || '',
            phone: c.phone || '',
            vat_number: c.vat_number || '',
            fiscal_code: c.fiscal_code || '',
            sdi_code: c.sdi_code || '',
            address: c.address || '',
            city: c.city || '',
            zip_code: c.zip_code || '',
            country: c.country || 'Italia',
            website: c.website || '',
            client_type: c.client_type || 'company',
            notes: c.notes || '',
          })
        } else {
          setError('Cliente non trovato.')
        }
      } catch (err) {
        setError('Errore durante il caricamento del cliente.')
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (id) {
      setQuotesLoading(true)
      getClientQuotes(id).then((q) => {
        setQuotes(q)
      }).catch(() => {
      }).finally(() => {
        setQuotesLoading(false)
      })
    }
  }, [id])

  useEffect(() => {
    if (id) {
      getClientCredentials(id).then(setCredentials).catch(() => {
        // Handle error or leave credentials empty
      })
    }
  }, [id])

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    try {
      await updateQuoteStatus(quoteId, status)
      const q = await getClientQuotes(id)
      setQuotes(q)
    } catch {
      setError('Errore durante l\'aggiornamento dello stato.')
    }
  }

  const handleDeleteQuote = async () => {
    if (!deleteQuoteId) return
    setDeletingLoading(true)
    try {
      await deleteQuote(deleteQuoteId)
      const q = await getClientQuotes(id)
      setQuotes(q)
      setDeleteQuoteId(null)
    } catch {
      setDeleteQuoteId(null)
      setError('Errore durante l\'eliminazione del preventivo.')
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const payload = {
        ...formData,
        id,
      }
      const cleanedPayload = {
        ...Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== '')
        ),
        id,
      } as Record<string, unknown>

      const nameValue = cleanedPayload.name
      if (typeof nameValue !== 'string' || !nameValue.trim()) {
        setError('Il nome è obbligatorio.')
        setLoading(false)
        return
      }

      const res = await saveClient(cleanedPayload as { name: string } & Partial<Omit<typeof formData, 'name'>> & { id: string })

      if ('error' in res) {
        setError(res.error)
        setLoading(false)
      } else {
        router.push('/clients')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Si è verificato un errore inaspettato.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {deleteQuoteId && (
        <DeleteModal 
          onConfirm={handleDeleteQuote} 
          onCancel={() => setDeleteQuoteId(null)} 
          loading={deletingLoading}
        />
      )}
      <Header />

      <main className="max-w-[800px] mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-semibold text-[#181d26] tracking-tight">{clientData?.name || 'Cliente'}</h1>
            <p className="text-[13px] text-[#181d26]/60 mt-1">{clientData?.company || clientData?.email}</p>
          </div>
          <Link href="/clients" className="px-3 py-1.5 text-[13px] text-[#181d26]/70 hover:text-[#181d26] transition-colors">Annulla</Link>
        </div>

        {fetching ? (
          <div className="bg-white border border-[#e0e2e6] rounded-[16px] p-16 text-center text-[13px] text-[#181d26]/50">
            Caricamento dati in corso...
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="bg-white border border-[#e0e2e6] rounded-[16px] overflow-hidden" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
            <div className="p-6 space-y-8">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-[8px] border border-red-100">
                  {error}
                </div>
              )}

              {/* General Info */}
              <section>
                <h2 className="text-[14px] font-semibold text-[#181d26] mb-4">Informazioni Generali</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Tipo Cliente</label>
                    <select 
                      name="client_type" 
                      value={formData.client_type} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors"
                    >
                      <option value="company">Azienda</option>
                      <option value="private">Privato</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Nome Completo *</label>
                    <input 
                      required 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                      placeholder="Mario Rossi" 
                    />
                  </div>
                  {formData.client_type === 'company' && (
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[12px] font-medium text-[#181d26]">Nome Azienda / Ragione Sociale</label>
                      <input 
                        name="company" 
                        value={formData.company} 
                        onChange={handleChange}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                        placeholder="Es. Mario Rossi S.r.l." 
                      />
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-[#e0e2e6]" />

              {/* Dati Fiscali */}
              <section>
                <h2 className="text-[14px] font-semibold text-[#181d26] mb-4">Dati Fiscali</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Partita IVA</label>
                    <input 
                      name="vat_number" 
                      value={formData.vat_number} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Codice Fiscale</label>
                    <input 
                      name="fiscal_code" 
                      value={formData.fiscal_code} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  {formData.client_type === 'company' && (
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-[12px] font-medium text-[#181d26]">Codice SDI / PEC</label>
                      <input 
                        name="sdi_code" 
                        value={formData.sdi_code} 
                        onChange={handleChange}
                        className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                      />
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-[#e0e2e6]" />

              {/* Contatti & Sede */}
              <section>
                <h2 className="text-[14px] font-semibold text-[#181d26] mb-4">Contatti e Sede</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Telefono</label>
                    <input 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[12px] font-medium text-[#181d26]">Indirizzo (Via e Numero)</label>
                    <input 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Città</label>
                    <input 
                      name="city" 
                      value={formData.city} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">CAP</label>
                    <input 
                      name="zip_code" 
                      value={formData.zip_code} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Paese</label>
                    <input 
                      name="country" 
                      value={formData.country} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-[12px] font-medium text-[#181d26]">Sito Web</label>
                    <input 
                      name="website" 
                      value={formData.website} 
                      onChange={handleChange}
                      className="w-full h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors" 
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </section>

              <hr className="border-[#e0e2e6]" />

              {/* Note */}
              <section>
                <h2 className="text-[14px] font-semibold text-[#181d26] mb-4">Note interne</h2>
                <div className="space-y-1.5">
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange}
                    className="w-full min-h-[80px] p-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] focus:outline-none focus:border-[#181d26] transition-colors resize-y" 
                    placeholder="Note aggiuntive..." 
                  />
                </div>
              </section>

            </div>
            <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e0e2e6] flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 bg-[#1b61c9] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#154ca3] transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white border border-[#e0e2e6] rounded-[16px] overflow-hidden" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
            <div className="flex items-center gap-1 px-5 py-3.5 border-b border-[#e0e2e6]" role="tablist">
              <button
                onClick={() => setActiveTab('quotes')}
                role="tab"
                aria-selected={activeTab === 'quotes'}
                className={`px-4 py-2 text-[13px] font-medium rounded-[8px] transition-colors ${
                  activeTab === 'quotes'
                    ? 'bg-[#181d26] text-white'
                    : 'text-[#181d26]/70 hover:text-[#181d26] hover:bg-[#f8fafc]'
                }`}
              >
                Preventivi
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                role="tab"
                aria-selected={activeTab === 'credentials'}
                className={`px-4 py-2 text-[13px] font-medium rounded-[8px] transition-colors ${
                  activeTab === 'credentials'
                    ? 'bg-[#181d26] text-white'
                    : 'text-[#181d26]/70 hover:text-[#181d26] hover:bg-[#f8fafc]'
                }`}
              >
                Credenziali
              </button>
            </div>

            {activeTab === 'quotes' && (
              <>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e0e2e6]">
                  <span className="text-[13px] font-semibold text-[#181d26]">Preventivi Associati</span>
                  <Link href={`/quotes/new?clientId=${id}`} className="px-3 py-1.5 bg-[#181d26] text-white text-[12px] font-medium rounded-[6px] hover:bg-[#2a3140] transition-colors">
                    + Nuovo Preventivo
                  </Link>
                </div>
                {quotes.length === 0 ? (
                  <div className="py-16 text-center text-[13px] text-[#181d26]/40">
                    Nessun preventivo associato a questo cliente.
                  </div>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e0e2e6] bg-[#f8fafc]">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/50">Titolo</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/50 w-24">Stato</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/50 w-28">Creato</th>
                        <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/50 w-32">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr key={q.id} className="border-b border-[#e0e2e6] hover:bg-[#f8fafc] transition-colors">
                          <td className="px-4 py-2.5 font-medium text-[#181d26]">{q.title || 'Preventivo senza titolo'}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={q.status} /></td>
                          <td className="px-4 py-2.5 text-[#181d26]/50">{fmtDate(q.created_at)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={q.status}
                                onChange={(e) => handleStatusChange(q.id, e.target.value as QuoteStatus)}
                                className="text-[11px] px-2 py-1 border border-[#e0e2e6] rounded-[4px] bg-white"
                              >
                                <option value="draft">Bozza</option>
                                <option value="sent">Inviato</option>
                                <option value="won">Vinto</option>
                                <option value="lost">Perso</option>
                              </select>
                              <Link href={`/quotes/${q.id}`} className="text-[12px] text-[#1b61c9] hover:underline font-medium">Modifica</Link>
                              <button onClick={() => setDeleteQuoteId(q.id)} className="text-[12px] text-red-600 hover:text-red-700 font-medium">Elimina</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {activeTab === 'credentials' && (
              <div className="p-5">
                <CredentialsList clientId={id} initialCredentials={credentials} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
