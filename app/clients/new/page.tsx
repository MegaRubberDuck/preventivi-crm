'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveClient } from '@/actions/clients'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError('Il nome è obbligatorio.')
      setLoading(false)
      return
    }

    try {
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== '')
      )

      const res = await saveClient(payload as unknown as Parameters<typeof saveClient>[0])

      if ('error' in res) {
        setError(res.error)
        setLoading(false)
      } else {
        router.push('/clients')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Si è verificato un errore inaspettato.')
      } else {
        setError('Si è verificato un errore inaspettato.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e2e6] h-12 flex items-center px-6 gap-6">
        <div className="flex items-center gap-2.5 mr-2">
          <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-7 w-auto" />
          <span className="text-[13px] font-semibold text-[#181d26] tracking-tight">Plancia MRD</span>
        </div>
        <nav className="flex items-center gap-1 text-[13px]">
          <Link href="/" className="px-3 py-1.5 rounded-[6px] text-[#181d26]/70 hover:bg-[#f8fafc] hover:text-[#181d26] transition-colors">Preventivi</Link>
          <Link href="/clients" className="px-3 py-1.5 rounded-[6px] text-[#181d26]/70 hover:bg-[#f8fafc] hover:text-[#181d26] transition-colors">Clienti</Link>
        </nav>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-semibold text-[#181d26] tracking-tight">Nuovo Cliente</h1>
            <p className="text-[13px] text-[#181d26]/60 mt-1">Aggiungi un nuovo cliente al tuo database.</p>
          </div>
          <Link href="/clients" className="px-3 py-1.5 text-[13px] text-[#181d26]/70 hover:text-[#181d26] transition-colors">Annulla</Link>
        </div>

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
                  <label htmlFor="name" className="text-[12px] font-medium text-[#181d26]">Nome Completo *</label>
                  <input 
                    required 
                    id="name"
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
              {loading ? 'Salvataggio...' : 'Salva Cliente'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
