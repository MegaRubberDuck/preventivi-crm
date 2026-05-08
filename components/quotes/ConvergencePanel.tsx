'use client'

import type { ResultSnapshot } from '@/lib/types'

const eurFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function fmt(n: number) {
  return eurFormatter.format(n)
}

function fmtH(n: number) { return `${Math.round(n)}h` }
function fmtN(n: number, dec = 1) { return n.toFixed(dec) }

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#e0e2e6] last:border-b-0">
      <span className="text-[12px] text-[#181d26]/60">{label}</span>
      <div className="text-right">
        <span className="text-[12px] font-semibold text-[#181d26] tabnum">{value}</span>
        {sub && <div className="text-[10px] text-[#181d26]/40">{sub}</div>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e0e2e6] rounded-[12px] overflow-hidden">
      <div className="px-3 py-2 border-b border-[#e0e2e6] bg-[#f8fafc]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50">{title}</span>
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  )
}

function DeltaBar({ pct }: { pct: number }) {
  const abs = Math.abs(pct)
  const isGreen = abs <= 15
  const isYellow = abs > 15 && abs <= 30
  const color = isGreen ? '#16a34a' : isYellow ? '#d97706' : '#dc2626'
  const bgColor = isGreen ? '#dcfce7' : isYellow ? '#fef3c7' : '#fee2e2'
  const label = isGreen ? 'OK' : isYellow ? 'Attenzione' : 'Divergenza alta'
  const sign = pct >= 0 ? '+' : ''

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color }}>{sign}{pct.toFixed(1)}%</span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: bgColor, color }}>{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#e0e2e6] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(Math.abs(pct) / 50 * 100, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

interface Props {
  snapshot: ResultSnapshot | null
  isPending?: boolean
}

export function ConvergencePanel({ snapshot: s, isPending }: Props) {
  if (!s) {
    return (
      <div className="space-y-3">
        <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 text-center text-[12px] text-[#181d26]/40">
          Compila il wizard per vedere le metriche
        </div>
      </div>
    )
  }

  const oreUcpStatus = s.orePerUcp >= 15 && s.orePerUcp <= 30 ? 'green' : 'amber'

  return (
    <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>

      {/* Convergence */}
      <Section title="Convergenza S1 vs S2">
        <div className="py-2 space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-[#f8fafc] rounded-[8px] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40 mb-0.5">S1 Sizing</div>
              <div className="text-[15px] font-bold text-[#181d26] tabnum">{fmtH(s.s1)}</div>
            </div>
            <div className="bg-[#f8fafc] rounded-[8px] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40 mb-0.5">S2 Componenti</div>
              <div className="text-[15px] font-bold text-[#181d26] tabnum">{fmtH(s.s2)}</div>
            </div>
          </div>
          <DeltaBar pct={s.deltaS1S2Pct} />
        </div>
      </Section>

      {/* UCP details */}
      {s.ucp > 0 && (
        <Section title="UCP">
          <MetricRow label="UAW" value={fmtN(s.uaw, 0)} />
          <MetricRow label="UUCW" value={fmtN(s.uucw, 0)} />
          <MetricRow label="TCF" value={fmtN(s.tcf, 3)} />
          <MetricRow label="ECF" value={fmtN(s.ecf, 3)} />
          <MetricRow label="UCP totali" value={fmtN(s.ucp, 1)} />
          <MetricRow
            label="Ore/UCP"
            value={fmtN(s.orePerUcp, 1)}
            sub={oreUcpStatus === 'green' ? '✓ 15–30 range OK' : '⚠ fuori range 15–30'}
          />
        </Section>
      )}

      {/* Schedule */}
      {s.pm > 0 && (
        <Section title="Schedule (Sommerville)">
          <MetricRow label="PM (person-month)" value={fmtN(s.pm, 1)} />
          <MetricRow label="TDEV" value={`${fmtN(s.tdev, 1)} mesi`} />
          <MetricRow label="Team implicito" value={`${Math.round(s.teamImplicit)} pers.`} />
          <MetricRow label="Brooks overhead" value={`${(s.brooksOverheadPct * 100).toFixed(0)}%`} />
        </Section>
      )}

      {/* MAUT + Pricing */}
      {s.mautValPonderato > 0 && (
        <Section title="MAUT & Pricing">
          <MetricRow label="MAUT annuo ponderato" value={fmt(s.mautValPonderato)} />
          <MetricRow label="Capture ratio" value={`${s.captureRatioUsed ?? 20}%`} />
          <MetricRow label="Payback (scenario B)" value={Number.isFinite(s.paybackMonths) ? `${s.paybackMonths.toFixed(1)} mesi` : '—'} />
          <MetricRow label="Netto anno 1" value={fmt(s.nettoAnno1)} />
          <MetricRow label="VAN 5 anni" value={fmt(s.vanBase5anni ?? 0)} />
          <div className="pt-2 pb-1 space-y-1.5 border-t border-[#e0e2e6] mt-1">
            <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">Scenari</div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: 'Conserv.', price: s.prezzoEssential },
                { label: 'Bilanciat.', price: s.prezzoConsigliato },
                { label: 'Aggress.', price: s.prezzoPremium },
              ].map((opt, i) => (
                <div key={opt.label} className={`rounded-[8px] px-2 py-2 ${i === 1 ? 'bg-[#1b61c9] text-white' : 'bg-[#f8fafc]'}`}>
                  <div className={`text-[9px] font-semibold uppercase mb-0.5 ${i === 1 ? 'text-white/70' : 'text-[#181d26]/40'}`}>{opt.label}</div>
                  <div className={`text-[12px] font-bold tabnum ${i === 1 ? 'text-white' : 'text-[#181d26]'}`}>{fmt(opt.price)}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

    </div>
  )
}
