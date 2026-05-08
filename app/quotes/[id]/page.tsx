import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getQuote } from '@/actions/quotes'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

const eurFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function fmt(n: number) {
  return eurFormatter.format(n)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-[16px] overflow-hidden" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
      <div className="px-5 py-3 border-b border-[#e0e2e6] bg-[#f8fafc]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50">{title}</span>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function MetricGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((m) => (
        <div key={m.label} className="bg-[#f8fafc] border border-[#e0e2e6] rounded-[10px] px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/40 mb-1">{m.label}</div>
          <div className="text-[18px] font-bold text-[#181d26] tabnum">{m.value}</div>
        </div>
      ))}
    </div>
  )
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const q = await getQuote(id)
  if (!q) notFound()

  const s = q.result_snapshot

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Topnav */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e2e6] h-12 flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-7 w-auto" />
          <span className="text-[13px] font-semibold text-[#181d26] tracking-tight">MRD Preventivi</span>
        </div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-4">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30"><polyline points="9 18 15 12 9 6"/></svg>
          <Link href="/" className="text-[13px] text-[#181d26]/50 hover:text-[#181d26]">Dashboard</Link>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30"><polyline points="9 18 15 12 9 6"/></svg>
          <span aria-current="page" className="text-[13px] font-medium text-[#181d26] truncate max-w-[300px]">{q.title}</span>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_COLORS[q.status]}`}>
            {STATUS_LABELS[q.status]}
          </span>
          <Link
            href={`/quotes/${id}/edit`}
            className="px-4 py-1.5 bg-[#1b61c9] text-white text-[12px] font-medium rounded-[10px] hover:bg-[#254fad] transition-colors"
            style={{ boxShadow: 'rgba(45,127,249,0.28) 0px 1px 3px' }}
          >
            Modifica
          </Link>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="bg-white border border-[#e0e2e6] rounded-[16px] px-6 py-5" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
          <h1 className="text-[20px] font-bold text-[#181d26] mb-1">{q.title}</h1>
          {q.client ? (
            <p className="text-[13px] text-[#181d26]/60">
              {q.client.name}
              {q.client.company ? ` · ${q.client.company}` : ''}
            </p>
          ) : null}
        </div>

        {s ? (
          <>
            {/* Sizing */}
            <Section title="Sizing">
              <MetricGrid items={[
                { label: 'UCP totali', value: s.ucp > 0 ? s.ucp.toFixed(1) : '—' },
                { label: 'Effort sizing (S1)', value: `${Math.round(s.s1)}h` },
                { label: 'Effort componenti (S2)', value: `${Math.round(s.s2)}h` },
              ]} />
              {s.s1 > 0 && (() => {
                const delta = s.deltaS1S2Pct ?? 0
                const absDelta = Math.abs(delta)
                const color = absDelta <= 15 ? 'text-green-700' : absDelta <= 30 ? 'text-amber-700' : 'text-red-600'
                return (
                  <div className="mt-3 text-[13px] text-[#181d26]/60">
                    Delta S1→S2: <strong className={color}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</strong>
                  </div>
                )
              })()}
            </Section>

            {/* Schedule */}
            {s.pm > 0 && (
              <Section title="Schedule (TDEV Sommerville)">
                <MetricGrid items={[
                  { label: 'Person-Month', value: `${s.pm.toFixed(1)} PM` },
                  { label: 'TDEV', value: `${s.tdev.toFixed(1)} mesi` },
                  { label: 'Team implicito', value: `${Math.round(s.teamImplicit)} pers.` },
                ]} />
              </Section>
            )}

            {/* Pricing */}
            {s.prezzoConsigliato > 0 && (
              <Section title="Goldilocks Pricing">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Essenziale', price: s.prezzoEssential, canone: s.canoneEssential, rec: false },
                    { label: 'Consigliato', price: s.prezzoConsigliato, canone: s.canoneConsigliato, rec: true },
                    { label: 'Premium', price: s.prezzoPremium, canone: s.canonePremium, rec: false },
                  ].map((opt) => (
                    <div key={opt.label} className={`rounded-[12px] px-4 py-4 border ${opt.rec ? 'bg-[#1b61c9] border-[#1b61c9]' : 'bg-white border-[#e0e2e6]'} relative`}>
                      {opt.rec && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#181d26] text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                          Consigliato
                        </div>
                      )}
                      <div className={`text-[11px] font-semibold uppercase tracking-[0.05em] mb-2 ${opt.rec ? 'text-white/70' : 'text-[#181d26]/50'}`}>{opt.label}</div>
                      <div className={`text-[24px] font-bold tabnum mb-1 ${opt.rec ? 'text-white' : 'text-[#181d26]'}`}>{fmt(opt.price)}</div>
                      <div className={`text-[12px] ${opt.rec ? 'text-white/70' : 'text-[#181d26]/50'}`}>+ {fmt(opt.canone)}/mese</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ROI */}
            {s.mautValPonderato > 0 && (
              <Section title="ROI & MAUT">
                <MetricGrid items={[
                  { label: 'Costo totale interno', value: fmt(s.costoTotaleInterno ?? s.costoConOverhead) },
                  { label: 'Costi ricorrenti', value: s.extMonthly > 0 ? `${fmt(s.extMonthly)}/mese` : '—' },
                  { label: 'MAUT annuo ponderato', value: fmt(s.mautValPonderato) },
                  { label: 'Capture ratio', value: `${s.captureRatioUsed ?? 20}%` },
                  { label: 'Payback (scenario B)', value: Number.isFinite(s.paybackMonths) ? `${s.paybackMonths.toFixed(1)} mesi` : '—' },
                  { label: 'VAN 5 anni', value: fmt(s.vanBase5anni ?? 0) },
                ]} />
              </Section>
            )}
          </>
        ) : (
          <div className="bg-white border border-[#e0e2e6] rounded-[16px] px-6 py-10 text-center text-[13px] text-[#181d26]/40">
            Nessun calcolo salvato — <Link href={`/quotes/${id}/edit`} className="text-[#1b61c9] underline">modifica il preventivo</Link> per generare le stime.
          </div>
        )}
      </main>
    </div>
  )
}
