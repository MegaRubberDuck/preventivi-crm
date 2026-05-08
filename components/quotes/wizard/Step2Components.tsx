'use client'

import { useState } from 'react'
import { PHASES } from '@/lib/constants'
import type { ComponentData, ResultSnapshot, StaffingData } from '@/lib/types'

function pert6(o: number, r: number, p: number) { return (o + 4 * r + p) / 6 }

const RISK_VALS = { comp: [1, 1.15, 1.35], fam: [1, 1.2, 1.4], dep: [1, 1.1, 1.3] }
const COCOMO_VALS = { acap: [0.85, 1.0, 1.19], aexp: [0.88, 1.0, 1.22], cplx: [0.75, 1.0, 1.30], rely: [0.82, 1.0, 1.26] }

function totalMult(c: ComponentData) {
  return RISK_VALS.comp[c.comp] * RISK_VALS.fam[c.fam] * RISK_VALS.dep[c.dep] *
    COCOMO_VALS.acap[c.acap] * COCOMO_VALS.aexp[c.aexp] * COCOMO_VALS.cplx[c.cplx] * COCOMO_VALS.rely[c.rely]
}

function newComp(): ComponentData {
  return {
    id: crypto.randomUUID(), name: 'Nuovo componente',
    ott: 8, rea: 16, pes: 40,
    comp: 1, fam: 1, dep: 0,
    acap: 1, aexp: 1, cplx: 1, rely: 1,
    phases: ['Sviluppo'],
    excluded: false,
  }
}

function MultBadge({ mult }: { mult: number }) {
  const color = mult < 1.3 ? 'bg-green-50 text-green-700' : mult < 1.8 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
  return <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold tabnum ${color}`}>×{mult.toFixed(2)}</span>
}

interface Props {
  value: ComponentData[]
  onChange: (d: ComponentData[]) => void
  snapshot: ResultSnapshot | null
  staffing: StaffingData
}

export function Step2Components({ value: comps, onChange, snapshot, staffing }: Props) {
  const [openIdxs, setOpenIdxs] = useState<Set<number>>(new Set<number>())

  function toggleOpen(idx: number) {
    const next = new Set(openIdxs)
    if (next.has(idx)) {
      next.delete(idx)
    } else {
      next.add(idx)
    }
    setOpenIdxs(next)
  }

  function update(idx: number, patch: Partial<ComponentData>) {
    onChange(comps.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  function remove(idx: number) {
    onChange(comps.filter((_, i) => i !== idx))
    const next = new Set<number>()
    for (const i of openIdxs) {
      if (i < idx) next.add(i)
      else if (i > idx) next.add(i - 1)
      // i === idx is dropped
    }
    setOpenIdxs(next)
  }

  const activeComps = comps.filter((c) => !c.excluded)
  const activeCompsTotal = activeComps.reduce((s, c) => s + pert6(c.ott, c.rea, c.pes) * totalMult(c), 0)
  const total = comps.reduce((s, c) => s + pert6(c.ott, c.rea, c.pes) * totalMult(c), 0)
  const rate = staffing.rateInternal ?? 35
  const totalPrice = activeCompsTotal * rate

  return (
    <div className="p-5 space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-[#181d26]">{comps.length} componenti</span>
          {comps.filter((c) => c.excluded).length > 0 && (
            <span className="text-[12px] text-[#f59e0b]">({comps.filter((c) => c.excluded).length} escluso)</span>
          )}
          <span className="text-[12px] text-[#181d26]/50 tabnum">
            Totale adj: <strong className="text-[#181d26]">{Math.round(activeCompsTotal)}h</strong>
            {activeCompsTotal !== total && (
              <span> ({Math.round(total)}h)</span>
            )}
          </span>
          <span className="text-[12px] text-[#10b981] tabnum font-medium">
            €{(totalPrice).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <button
          onClick={() => { onChange([...comps, newComp()]); toggleOpen(comps.length) }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1b61c9] text-white text-[12px] font-medium rounded-[8px] hover:bg-[#254fad] transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Aggiungi
        </button>
      </div>

      {comps.length === 0 && (
        <div className="py-8 text-center text-[13px] text-[#181d26]/40 border border-dashed border-[#e0e2e6] rounded-[12px]">
          Nessun componente — aggiungi il primo
        </div>
      )}

      {comps.map((c, idx) => {
        const pertH = pert6(c.ott, c.rea, c.pes)
        const mult = totalMult(c)
        const adjH = pertH * mult
        const isOpen = openIdxs.has(idx)
        const compPrice = adjH * rate

        return (
          <div key={c.id} className={`border border-[#e0e2e6] rounded-[12px] overflow-hidden ${c.excluded ? 'opacity-50' : ''}`}>
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#f8fafc] transition-colors"
              onClick={() => toggleOpen(idx)}
            >
              <input
                type="checkbox"
                checked={!!c.excluded}
                onChange={(e) => { e.stopPropagation(); update(idx, { excluded: e.target.checked }) }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-[#e0e2e6] text-[#1b61c9] focus:ring-[#1b61c9]"
              />
              <div className="w-6 h-6 rounded-full bg-[#181d26] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{idx + 1}</div>
              <input
                type="text"
                value={c.name}
                onChange={(e) => { e.stopPropagation(); update(idx, { name: e.target.value }) }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-[13px] font-semibold text-[#181d26] bg-transparent border-0 outline-none"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-[#181d26]/50 tabnum">{pertH.toFixed(1)}h → <strong className="text-[#181d26]">{adjH.toFixed(1)}h</strong></span>
                <span className="text-[12px] text-[#10b981] tabnum font-medium">€{Math.round(compPrice).toLocaleString('it-IT')}</span>
                <MultBadge mult={mult} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); remove(idx) }}
                className="w-6 h-6 rounded flex items-center justify-center text-[#181d26]/30 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                ×
              </button>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 transition-transform text-[#181d26]/40 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {/* Body */}
            {isOpen && (
              <div className="border-t border-[#e0e2e6] px-4 py-4 space-y-4 bg-[#fafafa]">
                {/* PERT */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/40 mb-2">PERT 6-point (ore)</div>
                  <div className="grid grid-cols-3 gap-3">
                    {([['ott', 'Ottimistica'], ['rea', 'Realistica'], ['pes', 'Pessimistica']] as const).map(([key, label]) => (
                      <label key={key} className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-[#181d26]/60">{label}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={String(c[key])}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, '')
                            const num = parseFloat(v)
                            if (!isNaN(num) && num >= 0) update(idx, { [key]: num })
                          }}
                          onBlur={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, '')
                            const num = parseFloat(v)
                            if (isNaN(num) || v === '' || num < 0) update(idx, { [key]: 0 })
                          }}
                          className="w-full text-[13px] font-semibold border border-[#e0e2e6] rounded-[6px] px-2 py-1 bg-white tabnum outline-none focus:border-[#1b61c9]"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-[#181d26]/50">
                    PERT E = <strong>{pertH.toFixed(1)}h</strong> · SD = {(((c.pes - c.ott) / 6)).toFixed(1)}h
                  </div>
                </div>

                {/* Risk */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/40 mb-2">Fattori di rischio esterni</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">Complessità</div>
                      <select
                        value={c.comp}
                        onChange={(e) => update(idx, { comp: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Bassa ×1.00</option>
                        <option value={1}>Media ×1.15</option>
                        <option value={2}>Alta ×1.35</option>
                      </select>
                      <div className="text-[10px] text-[#181d26]/40 mt-0.5">Software semplice vs complesso</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">Familiarità</div>
                      <select
                        value={c.fam}
                        onChange={(e) => update(idx, { fam: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Familiare ×1.00</option>
                        <option value={1}>Parziale ×1.20</option>
                        <option value={2}>Nuovo ×1.40</option>
                      </select>
                      <div className="text-[10px] text-[#181d26]/40 mt-0.5">Tecnologie note vs nuove</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">Dipendenze</div>
                      <select
                        value={c.dep}
                        onChange={(e) => update(idx, { dep: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Indipendente ×1.00</option>
                        <option value={1}>Dipendente ×1.10</option>
                        <option value={2}>Critico ×1.30</option>
                      </select>
                      <div className="text-[10px] text-[#181d26]/40 mt-0.5">Dipendenze esterne</div>
                    </div>
                  </div>
                </div>

                {/* COCOMO */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/40 mb-2">Cost driver COCOMO II</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">ACAP — Capacità team</div>
                      <select
                        value={c.acap}
                        onChange={(e) => update(idx, { acap: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Alta ×0.85</option>
                        <option value={1}>Media ×1.00</option>
                        <option value={2}>Bassa ×1.19</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">AEXP — Esperienza app</div>
                      <select
                        value={c.aexp}
                        onChange={(e) => update(idx, { aexp: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Alta ×0.88</option>
                        <option value={1}>Media ×1.00</option>
                        <option value={2}>Bassa ×1.22</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">CPLX — Complessità codice</div>
                      <select
                        value={c.cplx}
                        onChange={(e) => update(idx, { cplx: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Bassa ×0.75</option>
                        <option value={1}>Media ×1.00</option>
                        <option value={2}>Alta ×1.30</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-[#181d26]/60 mb-1">RELY — Affidabilità</div>
                      <select
                        value={c.rely}
                        onChange={(e) => update(idx, { rely: Number(e.target.value) as 0|1|2 })}
                        className="w-full text-[12px] font-medium border border-[#e0e2e6] rounded-[6px] px-2 py-1.5 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value={0}>Bassa ×0.82</option>
                        <option value={1}>Media ×1.00</option>
                        <option value={2}>Alta ×1.26</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Phases */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/40 mb-2">Fasi</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PHASES.map((ph) => {
                      const active = c.phases.includes(ph)
                      return (
                        <button
                          key={ph}
                          onClick={() => update(idx, { phases: active ? c.phases.filter((p) => p !== ph) : [...c.phases, ph] })}
                          className={`px-3 py-1 text-[11px] font-medium rounded-[6px] transition-colors border ${
                            active ? 'bg-[#181d26] text-white border-[#181d26]' : 'bg-white text-[#181d26]/60 border-[#e0e2e6] hover:border-[#181d26]'
                          }`}
                        >
                          {ph}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
