import Link from 'next/link'
import { listQuotes } from '@/actions/quotes'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { Header } from '@/components/Header'
import type { Quote } from '@/lib/types'

const eurFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function fmt(n: number) {
  return eurFormatter.format(n)
}

function fmtDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })
}

function DeltaBadge({ pct }: { pct: number }) {
  const abs = Math.abs(pct)
  const color = abs <= 15 ? 'bg-green-50 text-green-700' : abs <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
  const sign = pct >= 0 ? '+' : ''
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tabnum ${color}`}>
      {sign}{pct.toFixed(1)}%
    </span>
  )
}

export default async function DashboardPage() {
  let quotes: Quote[] = []
  try {
    quotes = await listQuotes()
  } catch (err) {
    console.error('Failed to load quotes:', err)
  }

  const total = quotes.length
  const won   = quotes.filter((q) => q.status === 'won').length
  const draft  = quotes.filter((q) => q.status === 'draft').length
  const sent   = quotes.filter((q) => q.status === 'sent').length

  const stats = [
    { label: 'Totale preventivi', value: total },
    { label: 'Bozze', value: draft },
    { label: 'Inviati', value: sent },
    { label: 'Vinti', value: won },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <main className="max-w-[1280px] mx-auto px-6 py-6 space-y-5">
        <div className="flex justify-end">
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#1b61c9] text-white text-[13px] font-medium rounded-[12px] hover:bg-[#254fad] transition-colors"
            style={{ boxShadow: 'rgba(45,127,249,0.28) 0px 1px 3px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuovo preventivo
          </Link>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-[#e0e2e6] rounded-[16px] px-5 py-4" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#181d26]/50 mb-1">{s.label}</div>
              <div className="text-[28px] font-bold text-[#181d26] tabnum leading-none">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quotes table */}
        <div className="bg-white border border-[#e0e2e6] rounded-[16px] overflow-hidden" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e0e2e6]">
            <span className="text-[13px] font-semibold text-[#181d26]">Preventivi</span>
            <span className="text-[12px] text-[#181d26]/50">{total} totali</span>
          </div>

          {quotes.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#181d26]/40">
              Nessun preventivo — <Link href="/quotes/new" className="text-[#1b61c9] underline">crea il primo</Link>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e0e2e6] bg-[#f8fafc]">
                  {['Titolo', 'Cliente', 'Stato', 'S1 (sizing)', 'S2 (comp.)', 'Delta', 'Prezzo', 'Data'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/50 whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q: Quote, idx: number) => {
                  const snap = q.result_snapshot
                  return (
                    <tr key={q.id} className={`border-b border-[#e0e2e6] hover:bg-[#f8fafc] transition-colors ${idx === quotes.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-4 py-2.5">
                        <Link href={`/quotes/${q.id}`} className="font-medium text-[#181d26] hover:text-[#1b61c9]">
                          {q.title || 'Senza titolo'}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[#181d26]/70">
                        {q.client?.name ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_COLORS[q.status]}`}>
                          {STATUS_LABELS[q.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabnum text-[#181d26]/70">
                        {snap ? `${Math.round(snap.s1)}h` : '—'}
                      </td>
                      <td className="px-4 py-2.5 tabnum text-[#181d26]/70">
                        {snap ? `${Math.round(snap.s2)}h` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {snap && snap.s1 > 0 && typeof snap.deltaS1S2Pct === 'number' ? <DeltaBadge pct={snap.deltaS1S2Pct} /> : <span className="text-[#181d26]/30">—</span>}
                      </td>
                      <td className="px-4 py-2.5 tabnum font-medium">
                        {snap?.prezzoConsigliato != null ? fmt(snap.prezzoConsigliato) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[#181d26]/50 whitespace-nowrap">
                        {fmtDate(q.created_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/quotes/${q.id}`} className="text-[#1b61c9] text-[12px] hover:underline">Apri</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
