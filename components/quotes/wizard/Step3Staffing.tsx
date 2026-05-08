'use client'

import { useState, useEffect, useRef } from 'react'
import type { StaffingData, ResultSnapshot } from '@/lib/types'
import { calcBrooks } from '@/lib/constants'

// ─── NumInput ─────────────────────────────────────────────────────────────────

function NumInput({ value, onChange, min = 0, max, allowDecimal = false, className = '' }: {
  value: number; onChange: (n: number) => void; min?: number; max?: number
  allowDecimal?: boolean; className?: string
}) {
  const [local, setLocal] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setLocal(String(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={local}
      onChange={(e) => {
        let v = e.target.value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '')
        if (allowDecimal) {
          const p = v.split('.'); if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
        }
        if (max !== undefined) { const n = parseFloat(v); if (!isNaN(n) && n > max) v = String(max) }
        setLocal(v)
        const n = parseFloat(v)
        if (!isNaN(n)) onChange(Math.max(min, n))
      }}
      onFocus={() => { focused.current = true }}
      onBlur={() => {
        focused.current = false
        const n = parseFloat(local)
        if (local === '' || local === '.' || isNaN(n) || n < min) { setLocal(String(min)); onChange(min) }
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      className={`text-[13px] font-semibold border border-[#e0e2e6] rounded-[6px] px-2 py-1 bg-[#f8fafc] tabnum outline-none focus:border-[#1b61c9] focus:bg-white transition-colors ${className}`}
    />
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtH(n: number) { return `${Math.round(n)}h` }
const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
function fmtE(n: number) { return eur.format(n) }

// ─── Phase distribution (fixed industry standard) ─────────────────────────────

const PHASE_DIST = [
  { name: 'Analisi',  pct: 10, color: '#EEEDFE', text: '#534AB7' },
  { name: 'Design',   pct: 20, color: '#E6F1FB', text: '#0C447C' },
  { name: 'Sviluppo', pct: 40, color: '#ECFDF5', text: '#065F46' },
  { name: 'Test',     pct: 20, color: '#FFFBEB', text: '#92400E' },
  { name: 'Deploy',   pct: 10, color: '#FFF1F2', text: '#9F1239' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value: StaffingData
  onChange: (d: StaffingData) => void
  snapshot: ResultSnapshot | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step3Staffing({ value: v, onChange, snapshot }: Props) {
  const set = (patch: Partial<StaffingData>) => onChange({ ...v, ...patch })

  const pm      = snapshot?.pm ?? 0
  const tdev    = snapshot?.tdev ?? 0
  const totOre  = snapshot?.s2 ?? 0
  const teamOpt = tdev > 0 ? pm / tdev : 0

  // ── Team CRUD ──────────────────────────────────────────────────────────────

  function addMember() {
    set({ members: [...v.members, { id: crypto.randomUUID(), role: 'Collaboratore', rate: 35, pct: 50 }] })
  }
  function updateMember(id: string, patch: Partial<StaffingData['members'][0]>) {
    set({ members: v.members.map((m) => m.id === id ? { ...m, ...patch } : m) })
  }
  function removeMember(id: string) {
    set({ members: v.members.filter((m) => m.id !== id) })
  }

  // ── Ext items CRUD ─────────────────────────────────────────────────────────

  const extItems = v.extItems ?? []
  function addExtItem() {
    set({ extItems: [...extItems, { id: crypto.randomUUID(), name: 'Voce esterna', amount: 0, type: 'once' }] })
  }
  function updateExtItem(id: string, patch: Partial<StaffingData['extItems'][0]>) {
    set({ extItems: extItems.map((i) => i.id === id ? { ...i, ...patch } : i) })
  }
  function removeExtItem(id: string) {
    set({ extItems: extItems.filter((i) => i.id !== id) })
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const n          = v.members.length
  const canali     = n > 0 ? (n * (n - 1)) / 2 : 0
  const overheadPct = calcBrooks(n)
  const costoBase  = v.members.reduce((s, m) => s + totOre * (m.pct / 100) * m.rate, 0)
  const costoConOverhead = costoBase * (1 + overheadPct / 100)
  const extOnce    = extItems.filter((i) => i.type === 'once').reduce((s, i) => s + i.amount, 0)
  const extMonthly = extItems.filter((i) => i.type === 'monthly').reduce((s, i) => s + i.amount, 0)
  const costoTotale = costoConOverhead + extOnce

  const pctTot  = v.members.reduce((s, m) => s + m.pct, 0)
  const teamWarn = pctTot > 100 ? `Somma % supera 100% (${pctTot}%)` :
    (teamOpt > 0 && n > teamOpt * 2 ? `Team sovradimensionato (${n} vs ${teamOpt.toFixed(1)} ottimali)` : '')

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-5">

      {/* ═══════════════════════════════════════ PARAMETRI SCHEDULE */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-3">Parametri schedule</h3>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[#181d26]">Esponente B (COCOMO)</span>
            <select
              value={v.bVal}
              onChange={(e) => set({ bVal: Number(e.target.value) })}
              className="text-[13px] border border-[#e0e2e6] rounded-[8px] px-2 py-1.5 bg-[#f8fafc] text-[#181d26] outline-none focus:border-[#1b61c9]"
            >
              <option value={1.01}>1.01 — Early prototyping</option>
              <option value={1.10}>1.10 — Standard (semi-detached)</option>
              <option value={1.24}>1.24 — Complesso (embedded)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[#181d26]">Ore/mese (HPM)</span>
            <NumInput value={v.hpmSchedule} onChange={(n) => set({ hpmSchedule: n })} min={40} className="w-full" />
          </label>
        </div>
      </section>

      {/* Schedule output */}
      {pm > 0 && (
        <section className="bg-[#f8fafc] border border-[#e0e2e6] rounded-[10px] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/40 mb-3">Schedule (TDEV Sommerville)</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-[8px] px-3 py-2 border border-[#e0e2e6]">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">Person-Month</div>
              <div className="text-[16px] font-bold text-[#181d26] tabnum">{pm.toFixed(1)} PM</div>
            </div>
            <div className="bg-white rounded-[8px] px-3 py-2 border border-[#e0e2e6]">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">TDEV</div>
              <div className="text-[16px] font-bold text-teal-600 tabnum">{tdev.toFixed(1)} mesi</div>
            </div>
            <div className="bg-white rounded-[8px] px-3 py-2 border border-[#e0e2e6]">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">Personale ottimale</div>
              <div className="text-[16px] font-bold text-[#181d26] tabnum">{teamOpt.toFixed(1)} pers.</div>
            </div>
          </div>
        </section>
      )}

      <div className="h-px bg-[#e0e2e6]" />

      {/* ═══════════════════════════════════════ TEAM E TARIFFE */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-3">Team e Tariffe</h3>

        {teamWarn && (
          <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2 mb-3">
            {teamWarn}
          </div>
        )}

        <table className="w-full text-[12px] mb-3">
          <thead>
            <tr className="border-b border-[#e0e2e6]">
              <th className="text-left py-2 font-semibold text-[#181d26]/40">Ruolo</th>
              <th className="text-center py-2 font-semibold text-[#181d26]/40 w-20">€/h</th>
              <th className="text-center py-2 font-semibold text-[#181d26]/40 w-20">% tempo</th>
              <th className="text-center py-2 font-semibold text-[#181d26]/40 w-20">Ore</th>
              <th className="text-right py-2 font-semibold text-[#181d26]/40 w-24">Costo</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {v.members.map((m) => {
              const oreAss = totOre * (m.pct / 100)
              const costo  = oreAss * m.rate
              return (
                <tr key={m.id} className="border-b border-[#e0e2e6]/60 last:border-b-0">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={m.role}
                      onChange={(e) => updateMember(m.id, { role: e.target.value })}
                      className="w-full text-[13px] px-2 py-1 border border-[#e0e2e6] rounded-[6px] bg-[#f8fafc] outline-none focus:border-[#1b61c9] focus:bg-white"
                    />
                  </td>
                  <td className="py-2">
                    <NumInput value={m.rate} onChange={(n) => updateMember(m.id, { rate: n })} min={1} className="w-full text-center" />
                  </td>
                  <td className="py-2">
                    <div className="flex items-center justify-center gap-1">
                      <NumInput value={m.pct} onChange={(n) => updateMember(m.id, { pct: n })} min={0} max={100} className="w-14 text-center" />
                      <span className="text-[11px] text-[#181d26]/50">%</span>
                    </div>
                  </td>
                  <td className="py-2 text-center text-[#181d26]/60 tabnum">{fmtH(oreAss)}</td>
                  <td className="py-2 text-right font-semibold text-[#181d26] tabnum">{fmtE(costo)}</td>
                  <td className="py-2">
                    <button
                      onClick={() => removeMember(m.id)}
                      aria-label={`Rimuovi ${m.role}`}
                      className="w-6 h-6 flex items-center justify-center text-[#181d26]/30 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <button
          onClick={addMember}
          className="w-full py-2 text-[12px] font-medium border border-dashed border-[#e0e2e6] rounded-[8px] text-[#181d26]/60 hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors mb-4"
        >
          + Aggiungi figura al team
        </button>

        {pm > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#f8fafc] rounded-[8px] px-3 py-2 border border-[#e0e2e6]">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">Dimensione team</div>
              <div className="text-[16px] font-bold text-[#181d26] tabnum">{n}</div>
            </div>
            <div className="bg-[#f8fafc] rounded-[8px] px-3 py-2 border border-[#e0e2e6]">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">Overhead coord.</div>
              <div className={`text-[16px] font-bold tabnum ${overheadPct > 9 ? 'text-amber-600' : 'text-[#181d26]'}`}>
                {canali} canali (+{overheadPct}%)
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-[8px] px-3 py-2 border border-[#e0e2e6]">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40">Costo lavoro base</div>
              <div className="text-[16px] font-bold text-[#1b61c9] tabnum">{fmtE(costoBase)}</div>
            </div>
          </div>
        )}
      </section>

      <div className="h-px bg-[#e0e2e6]" />

      {/* ═══════════════════════════════════════ DISTRIBUZIONE FASI */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-3">Distribuzione Fasi</h3>

        {totOre > 0 ? (
          <>
            {/* Phase bar */}
            <div className="flex h-7 rounded-[8px] overflow-hidden mb-3 border border-[#e0e2e6]">
              {PHASE_DIST.map((p) => (
                <div
                  key={p.name}
                  style={{ width: `${p.pct}%`, background: p.color }}
                  className="flex items-center justify-center text-[10px] font-semibold overflow-hidden"
                >
                  <span style={{ color: p.text }}>{p.name}</span>
                </div>
              ))}
            </div>

            {/* Phase breakdown */}
            <div className="flex flex-wrap gap-3">
              {PHASE_DIST.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-[12px] text-[#181d26]/70">
                  <span
                    className="inline-block w-3 h-3 rounded-[3px] border border-[#e0e2e6]"
                    style={{ background: p.color }}
                  />
                  <strong className="text-[#181d26]">{p.name}</strong>
                  <span className="tabnum">{fmtH(totOre * p.pct / 100)}</span>
                  <span className="text-[#181d26]/40">({p.pct}%)</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-[#181d26]/40 italic">
            Completa i componenti nello Step 2 per vedere la distribuzione delle ore per fase.
          </p>
        )}
      </section>

      <div className="h-px bg-[#e0e2e6]" />

      {/* ═══════════════════════════════════════ COSTI ESTERNI */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Costi Esterni — Conversione in Euro</h3>
        <p className="text-[12px] text-[#181d26]/60 bg-[#f0f4ff] border-l-2 border-[#1b61c9] px-3 py-2 rounded-r-[6px] mb-4">
          I costi esterni (server, licenze API, tools) si aggiungono direttamente al totale fatturabile.
          Una tantum → sommati al floor price · Ricorrenti → diventano il canone in MAUT & Pricing.
        </p>

        {/* Column headers */}
        {extItems.length > 0 && (
          <div className="grid grid-cols-[1fr_100px_130px_32px] gap-2 px-1 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/40">Voce esterna</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/40">Costo (€)</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/40">Tipo</span>
            <span />
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          {extItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_100px_130px_32px] gap-2 items-center">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateExtItem(item.id, { name: e.target.value })}
                className="text-[13px] px-2 py-1.5 border border-[#e0e2e6] rounded-[6px] bg-[#f8fafc] outline-none focus:border-[#1b61c9] focus:bg-white w-full"
              />
              <NumInput
                value={item.amount}
                onChange={(n) => updateExtItem(item.id, { amount: n })}
                min={0}
                className="w-full text-right"
              />
              <select
                value={item.type}
                onChange={(e) => updateExtItem(item.id, { type: e.target.value as 'once' | 'monthly' })}
                className="text-[12px] border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
              >
                <option value="once">Una tantum</option>
                <option value="monthly">Ricorrente/mese</option>
              </select>
              <button
                onClick={() => removeExtItem(item.id)}
                className="w-8 h-8 flex items-center justify-center text-[#181d26]/30 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >×</button>
            </div>
          ))}
        </div>

        <button
          onClick={addExtItem}
          className="mt-3 w-full py-2 text-[12px] font-medium border border-dashed border-[#e0e2e6] rounded-[8px] text-[#181d26]/60 hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
        >
          + Aggiungi voce esterna
        </button>

        {/* Computed totals */}
        {extItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#f8fafc] border border-[#e0e2e6] rounded-[8px] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40 mb-0.5">Una tantum (totale)</div>
              <div className="text-[16px] font-bold text-[#181d26] tabnum">{fmtE(extOnce)}</div>
            </div>
            <div className="bg-[#f8fafc] border border-[#e0e2e6] rounded-[8px] px-3 py-2">
              <div className="text-[10px] font-semibold uppercase text-[#181d26]/40 mb-0.5">Ricorrenti (totale)</div>
              <div className="text-[16px] font-bold text-[#181d26] tabnum">{fmtE(extMonthly)}/mese</div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════ SUMMARY PROGETTO */}
      {(costoBase > 0 || extOnce > 0 || extMonthly > 0) && (
        <>
          <div className="h-px bg-[#e0e2e6]" />
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-3">Summary Progetto</h3>
            <div className="bg-gradient-to-br from-[#1b61c9] to-[#3730A3] rounded-[14px] p-4 text-white space-y-0">

              {[
                { label: 'Ore totali processate', value: fmtH(totOre), show: totOre > 0 },
                { label: 'Costo base del team',   value: fmtE(costoBase), show: costoBase > 0 },
                { label: `Overhead coordinamento (+${overheadPct}%)`, value: `+${fmtE(costoConOverhead - costoBase)}`, show: overheadPct > 0 },
                { label: 'Costi esterni una tantum', value: `+${fmtE(extOnce)}`, show: extOnce > 0 },
              ].filter((r) => r.show).map((r) => (
                <div key={r.label} className="flex justify-between text-[12.5px] py-1.5 border-b border-white/10 text-white/75">
                  <span>{r.label}</span>
                  <span className="font-semibold tabnum">{r.value}</span>
                </div>
              ))}

              <div className="flex justify-between text-[18px] font-bold pt-3 mt-1">
                <span>Costo Interno Totale</span>
                <span className="tabnum">{fmtE(costoTotale)}</span>
              </div>

              {extMonthly > 0 && (
                <div className="flex justify-between text-[12.5px] pt-2 text-white/75">
                  <span>Costi ricorrenti</span>
                  <span className="font-semibold tabnum">{fmtE(extMonthly)}/mese</span>
                </div>
              )}

              <p className="text-[11px] text-white/50 pt-3 mt-1 border-t border-white/10">
                Questi valori vengono trasferiti automaticamente in Step 4 — MAUT &amp; Pricing come floor price e canone.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
