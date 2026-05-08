'use client'

import { useState, useEffect, useRef } from 'react'
import { MAUT_TYPES, STAKEHOLDERS, CAPTURE_RATIO_BENCHMARKS } from '@/lib/constants'
import { calcBenValAnnual } from '@/lib/mautCalcs'
import type { MAUTData, MAUTBenefit, ResultSnapshot } from '@/lib/types'

// ─── Shared NumInput ──────────────────────────────────────────────────────────

function NumInput({ value, onChange, min = 0, className = '', allowDecimal = false }: {
  value: number; onChange: (n: number) => void; min?: number; className?: string; allowDecimal?: boolean
}) {
  const [local, setLocal] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setLocal(String(value))
  }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={local}
      className={`text-[13px] font-semibold border border-[#e0e2e6] rounded-[6px] px-2 py-1 bg-[#f8fafc] tabnum outline-none focus:border-[#1b61c9] focus:bg-white ${className}`}
      onChange={(e) => {
        let v = e.target.value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '')
        if (allowDecimal) {
          const p = v.split('.')
          if (p.length > 2) v = p[0] + '.' + p.slice(1).join('')
        }
        setLocal(v)
        const n = parseFloat(v)
        if (!isNaN(n)) onChange(n)
      }}
      onFocus={() => { focused.current = true }}
      onBlur={() => {
        focused.current = false
        const n = parseFloat(local)
        if (local === '' || local === '.' || isNaN(n) || n < min) { setLocal(String(min)); onChange(min) }
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
    />
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmt = (n: number) => eur.format(n)
const fmtA = (n: number) => eur.format(n) + '/anno'

// ─── Confidence helpers ───────────────────────────────────────────────────────

const CONF_LABEL: Record<string, string> = { high: 'Alta', med: 'Media', low: 'Bassa' }
const CONF_CLS: Record<string, string> = {
  high: 'bg-green-50 text-green-700',
  med:  'bg-amber-50 text-amber-700',
  low:  'bg-red-50 text-red-600',
}

// ─── CAT colors ───────────────────────────────────────────────────────────────

const CAT_CLS: Record<string, string> = {
  saving:    'bg-emerald-50 text-emerald-700',
  revenue:   'bg-purple-50 text-purple-700',
  risk:      'bg-amber-50 text-amber-700',
  strategic: 'bg-blue-50 text-blue-700',
}
const CAT_LABEL: Record<string, string> = {
  saving: 'Risparmio', revenue: 'Ricavo', risk: 'Rischio', strategic: 'Strategico',
}

// ─── Scenario detail computation ──────────────────────────────────────────────

function computeScenDetail(price: number, annualVal: number, canone: number, discountRate: number) {
  const canoneAnnual = canone * 12
  const annCF = annualVal + canoneAnnual
  const payback = annualVal > 0 ? price / (annualVal / 12) : Infinity
  const roi1 = annualVal - price
  const roi3 = annualVal * 3 - price
  const roi5 = annualVal * 5 - price
  const roiPct = price > 0 ? Math.round((annualVal / price - 1) * 100) : 0
  const rows: { year: number; annualVal: number; canoneAnnual: number; annCF: number; cfD: number; vanCum: number }[] = []
  let vanCum = -price
  for (let y = 1; y <= 5; y++) {
    const cfD = annCF / Math.pow(1 + discountRate / 100, y)
    vanCum += cfD
    rows.push({ year: y, annualVal, canoneAnnual, annCF, cfD, vanCum })
  }
  return { payback, roi1, roi3, roi5, roiPct, rows, vanFinal: vanCum }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value: MAUTData
  onChange: (d: MAUTData) => void
  snapshot: ResultSnapshot | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step4MAUT({ value: v, onChange, snapshot }: Props) {
  const [activeScen, setActiveScen] = useState<'a' | 'b' | 'c'>('b')
  const [selBench, setSelBench] = useState<number | null>(null)

  const set = (patch: Partial<MAUTData>) => onChange({ ...v, ...patch })

  // ── Benefit CRUD ─────────────────────────────────────────────────────────────

  function addBenefit() {
    const t = MAUT_TYPES[0]
    const fields: Record<string, number> = {}
    t.fields.forEach((f) => { fields[f.key] = f.def })
    set({
      benefits: [...v.benefits, {
        id: crypto.randomUUID(),
        name: t.label,
        typeId: t.id,
        fields,
        peso: 0,
        conf: 'med',
        stake: STAKEHOLDERS[2],
      }],
    })
  }

  function updateBenefit(id: string, patch: Partial<MAUTBenefit>) {
    set({ benefits: v.benefits.map((b) => b.id === id ? { ...b, ...patch } : b) })
  }

  function changeType(id: string, typeId: string) {
    const t = MAUT_TYPES.find((t) => t.id === typeId)
    if (!t) return
    const fields: Record<string, number> = {}
    t.fields.forEach((f) => { fields[f.key] = f.def })
    set({ benefits: v.benefits.map((b) => b.id === id ? { ...b, typeId, name: t.label, fields } : b) })
  }

  function updateField(id: string, key: string, val: number) {
    set({ benefits: v.benefits.map((b) => b.id === id ? { ...b, fields: { ...b.fields, [key]: val } } : b) })
  }

  function removeBenefit(id: string) {
    set({ benefits: v.benefits.filter((b) => b.id !== id) })
  }

  // ── Derived values ────────────────────────────────────────────────────────────

  const totPeso = v.benefits.reduce((s, b) => s + b.peso, 0)
  const pesoOk = Math.abs(totPeso - 100) < 1
  const mautBase = snapshot?.mautValBase ?? 0
  const evcNetto = v.evcNetto ?? 0
  const delta = mautBase > 0 && evcNetto > 0
    ? Math.round(((mautBase - evcNetto) / evcNetto) * 100)
    : null

  // ── Benchmark selection ────────────────────────────────────────────────────────

  function selectBench(i: number) {
    const b = CAPTURE_RATIO_BENCHMARKS[i]
    const mid = Math.round((b.min + b.max) / 2)
    setSelBench(i)
    set({ captureRatio: mid })
  }

  // ── Alerts ────────────────────────────────────────────────────────────────────

  const alerts: { type: 'error' | 'warn'; msg: string }[] = []
  if (snapshot) {
    if (v.costoInterno > 0 && snapshot.prezzoConsigliato <= v.costoInterno) {
      alerts.push({ type: 'error', msg: `⚠ PREZZO SOTTO IL FLOOR: lo scenario base (${fmt(snapshot.prezzoConsigliato)}) è ≤ al costo interno (${fmt(v.costoInterno)}). Stai vendendo in perdita o a pareggio.` })
    }
  }
  if ((v.captureRatio ?? 20) > 50) {
    alerts.push({ type: 'warn', msg: `⚠ CAPTURE RATIO ELEVATO (${v.captureRatio}%). Catturare oltre il 50% del valore generato aumenta il rischio di rifiuto. Range sano: 15–35%.` })
  }
  if (snapshot && Number.isFinite(snapshot.paybackMonths) && snapshot.paybackMonths > 18) {
    alerts.push({ type: 'warn', msg: `⚠ PAYBACK LUNGO (${snapshot.paybackMonths.toFixed(1)} mesi). Oltre 18 mesi è difficile da far accettare — considera di rinegoziare lo scope o ridurre il prezzo.` })
  }
  if (mautBase > 0 && evcNetto > 0 && Math.abs(delta ?? 0) > 50) {
    alerts.push({ type: 'warn', msg: `⚠ DIVERGENZA EVC/MAUT (${Math.abs(delta ?? 0)}%). Verifica doppi conteggi o pesi MAUT distorti.` })
  }

  // ── Scenario data ─────────────────────────────────────────────────────────────

  const scenarios = [
    {
      id: 'a' as const,
      label: 'A — Conservativo',
      price: snapshot?.prezzoEssential ?? 0,
      annualVal: snapshot?.mautValConservativo ?? 0,
      desc: '−30% voci bassa conf · per clienti con dati incerti',
      cls: 'border-amber-300 bg-amber-50',
      activeCls: 'border-amber-500 ring-2 ring-amber-300',
      labelCls: 'text-amber-800',
    },
    {
      id: 'b' as const,
      label: 'B — Bilanciato (target)',
      price: snapshot?.prezzoConsigliato ?? 0,
      annualVal: snapshot?.mautValBase ?? 0,
      desc: 'Valori nominali · prezzo da presentare in proposta',
      cls: 'border-emerald-300 bg-emerald-50',
      activeCls: 'border-emerald-600 ring-2 ring-emerald-300',
      labelCls: 'text-emerald-800',
    },
    {
      id: 'c' as const,
      label: 'C — Aggressivo',
      price: snapshot?.prezzoPremium ?? 0,
      annualVal: snapshot?.mautValAggressivo ?? 0,
      desc: '+20% voci alta conf · se cliente porta documentazione',
      cls: 'border-indigo-300 bg-indigo-50',
      activeCls: 'border-indigo-600 ring-2 ring-indigo-300',
      labelCls: 'text-indigo-800',
    },
  ]

  const activeScenData = scenarios.find((s) => s.id === activeScen) ?? scenarios[1]
  const scenDetail = snapshot
    ? computeScenDetail(activeScenData.price, activeScenData.annualVal, v.canone ?? 0, v.discountRate ?? 8)
    : null

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-6">

      {/* ═══════════════════════════════════════════════════════ SESSIONE B — MAUT */}
      <div>
        {/* Section header */}
        <div className="flex items-start gap-3 bg-[#EEEDFE] border border-[#AFA9EC] rounded-[12px] px-4 py-3 mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#3C3489]">Sessione B — MAUT</div>
            <div className="text-[12px] text-[#534AB7]">V_MAUT = Σ(valore_i × peso_i / tot_pesi) · Keeney &amp; Raiffa · Σpesi = 100%</div>
          </div>
        </div>

        <p className="text-[12px] text-[#555] border-l-2 border-[#AFA9EC] pl-3 mb-4">
          Ogni beneficio produce un valore <strong>annuo</strong>. Assegna stakeholder, peso e confidenza.
          Il Δ vs EVC (opzionale) è il check di coerenza tra i due metodi.
        </p>

        {/* Benefits list */}
        {v.benefits.length === 0 && (
          <p className="text-[12px] text-[#181d26]/40 italic py-4 text-center border border-dashed border-[#e0e2e6] rounded-[10px] mb-3">
            Nessun beneficio — aggiungi i vettori di valore per il cliente
          </p>
        )}

        <div className="space-y-3">
          {v.benefits.map((b, idx) => {
            const t = MAUT_TYPES.find((t) => t.id === b.typeId)
            const valAnnual = calcBenValAnnual(b.typeId, b.fields)
            const contrib = totPeso > 0 ? valAnnual * (b.peso / totPeso) : 0
            const conf = b.conf ?? 'med'
            const stake = b.stake ?? STAKEHOLDERS[2]

            return (
              <div key={b.id} className="border border-[#e0e2e6] rounded-[12px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc]">
                  <div className="w-5 h-5 rounded-full bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => updateBenefit(b.id, { name: e.target.value })}
                    className="flex-1 text-[13px] font-semibold text-[#181d26] bg-transparent border-0 outline-none"
                  />
                  {t && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${CAT_CLS[t.cat]}`}>{CAT_LABEL[t.cat]}</span>}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${CONF_CLS[conf]}`}>Conf. {CONF_LABEL[conf]}</span>
                  <button
                    onClick={() => removeBenefit(b.id)}
                    className="w-5 h-5 flex items-center justify-center text-[#181d26]/30 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                  >×</button>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-3">
                  {/* Row 1: type / stakeholder / confidence */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#f8fafc] rounded-[8px] p-2">
                      <label className="text-[11px] text-[#888] block mb-1">Tipo</label>
                      <select
                        value={b.typeId}
                        onChange={(e) => changeType(b.id, e.target.value)}
                        className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        {MAUT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-[#f8fafc] rounded-[8px] p-2">
                      <label className="text-[11px] text-[#888] block mb-1">Stakeholder</label>
                      <select
                        value={stake}
                        onChange={(e) => updateBenefit(b.id, { stake: e.target.value })}
                        className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        {STAKEHOLDERS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-[#f8fafc] rounded-[8px] p-2">
                      <label className="text-[11px] text-[#888] block mb-1">Confidenza</label>
                      <select
                        value={conf}
                        onChange={(e) => updateBenefit(b.id, { conf: e.target.value as 'high' | 'med' | 'low' })}
                        className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        <option value="high">Alta — dato certo</option>
                        <option value="med">Media — stima ragionata</option>
                        <option value="low">Bassa — ipotesi</option>
                      </select>
                    </div>
                  </div>

                  {/* Formula */}
                  {t && (
                    <div className="text-[11px] font-mono text-[#181d26]/50 bg-[#f8fafc] border border-[#e0e2e6] rounded-[6px] px-3 py-2">
                      {t.formula}
                    </div>
                  )}

                  {/* Fields */}
                  {t && (
                    <div className="grid grid-cols-2 gap-2">
                      {t.fields.map((f) => (
                        <label key={f.key} className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium text-[#181d26]/60">{f.label}</span>
                          <div className="flex items-center gap-1">
                            <NumInput
                              value={b.fields[f.key] ?? f.def}
                              onChange={(n) => updateField(b.id, f.key, n)}
                              min={0}
                              allowDecimal
                              className="flex-1"
                            />
                            <span className="text-[10px] text-[#181d26]/40 shrink-0">{f.unit}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Peso + annual value + contribution */}
                  <div className="flex items-center gap-4 pt-2 border-t border-[#e0e2e6]">
                    <label className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-[#181d26]">Peso MAUT</span>
                      <NumInput
                        value={b.peso}
                        onChange={(n) => updateBenefit(b.id, { peso: n })}
                        min={0}
                        className="w-14 text-center"
                      />
                      <span className="text-[12px] text-[#181d26]/50">%</span>
                    </label>
                    <span className="text-[12px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold tabnum">
                      {fmtA(valAnnual)}
                    </span>
                    <span className="text-[12px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold tabnum">
                      contrib. {fmtA(Math.round(contrib))}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add button */}
        <button
          onClick={addBenefit}
          className="mt-3 text-[12px] px-3 py-1.5 border border-[#AFA9EC] rounded-[8px] text-[#534AB7] hover:bg-[#EEEDFE] transition-colors"
        >
          + Aggiungi beneficio
        </button>

        {/* MAUT summary metrics */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-[#f8fafc] rounded-[8px] p-3">
            <div className="text-[11px] text-[#888] mb-1">MAUT annuo ponderato</div>
            <div className="text-[15px] font-semibold text-[#534AB7] tabnum">{fmtA(mautBase)}</div>
          </div>
          <div className={`rounded-[8px] p-3 ${pesoOk ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className="text-[11px] text-[#888] mb-1">Σ pesi</div>
            <div className={`text-[15px] font-semibold tabnum ${pesoOk ? 'text-green-700' : 'text-amber-700'}`}>
              {totPeso}% {pesoOk ? '✓' : '⚠'}
            </div>
          </div>
          <div className="bg-[#f8fafc] rounded-[8px] p-3">
            <div className="text-[11px] text-[#888] mb-1">Δ vs EVC</div>
            <div className={`text-[15px] font-semibold tabnum ${delta === null ? 'text-[#181d26]/30' : Math.abs(delta) <= 20 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}% ${Math.abs(delta) <= 20 ? '✓' : '⚠'}`}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e0e2e6]" />

      {/* ═══════════════════════════════════════════════════ SESSIONE C — PRICING */}
      <div>
        {/* Section header */}
        <div className="flex items-start gap-3 bg-[#E6F1FB] border border-[#85B7EB] rounded-[12px] px-4 py-3 mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#0C447C]">Sessione C — Pricing Strategico</div>
            <div className="text-[12px] text-[#185FA5]">Capture Ratio · VAN 5 anni · Tre scenari · ROI cliente</div>
          </div>
        </div>

        {/* Step 3 cost summary — auto-populated */}
        {snapshot && snapshot.costoTotaleInterno > 0 && (
          <div className="bg-[#f0f4ff] border border-[#c7d2fe] rounded-[12px] p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-[#4338CA] uppercase tracking-[0.05em]">📋 Riepilogo tecnico (da Step 3)</span>
              <span className="text-[10px] bg-[#4F46E5] text-white px-2 py-0.5 rounded-full">precompilato automaticamente</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {[
                { label: 'Costo lavoro con overhead', value: fmt(snapshot.costoConOverhead), show: snapshot.costoConOverhead > 0 },
                { label: 'Costi esterni una tantum',  value: `+${fmt(snapshot.extOnce)}`,   show: snapshot.extOnce > 0 },
                { label: 'Costi ricorrenti (canone)', value: `${fmt(snapshot.extMonthly)}/mese`, show: snapshot.extMonthly > 0 },
              ].filter((r) => r.show).map((r) => (
                <div key={r.label} className="flex justify-between gap-2 text-[#3730A3]">
                  <span className="text-[#4338CA]/70">{r.label}</span>
                  <span className="font-semibold tabnum">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[13px] font-bold text-[#3730A3] pt-2 mt-2 border-t border-[#c7d2fe]">
              <span>Costo Interno Totale → Floor price</span>
              <span className="tabnum">{fmt(snapshot.costoTotaleInterno)}</span>
            </div>
          </div>
        )}

        {/* Input parameters */}
        <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[200px] shrink-0">Costo interno (floor)</label>
            <NumInput value={v.costoInterno} onChange={(n) => set({ costoInterno: n })} min={0} className="w-28" />
            <span className="text-[12px] text-[#999]">€ — prezzo invalicabile</span>
            {snapshot && snapshot.costoTotaleInterno > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5 font-medium">
                da Step 3: {fmt(snapshot.costoTotaleInterno)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[200px] shrink-0">Canone manutenzione</label>
            <NumInput value={v.canone ?? 0} onChange={(n) => set({ canone: n })} min={0} className="w-28" />
            <span className="text-[12px] text-[#999]">€/mese</span>
            {snapshot && snapshot.extMonthly > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5 font-medium">
                da Step 3: {fmt(snapshot.extMonthly)}/mese
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[#555] min-w-[200px] shrink-0">Tasso di sconto (VAN)</label>
            <select
              value={v.discountRate ?? 8}
              onChange={(e) => set({ discountRate: parseFloat(e.target.value) })}
              className="text-[13px] border border-[#e0e2e6] rounded-[8px] px-2 py-1 bg-white outline-none focus:border-[#1b61c9]"
            >
              <option value={5}>5% — Enterprise / grande azienda</option>
              <option value={8}>8% — PMI consolidata (default)</option>
              <option value={12}>12% — PMI con crescita attiva</option>
              <option value={18}>18% — Startup early stage</option>
              <option value={25}>25% — Startup pre-revenue</option>
            </select>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[200px] shrink-0">EVC netto annuo <span className="text-[#aaa]">(opzionale)</span></label>
            <NumInput value={v.evcNetto ?? 0} onChange={(n) => set({ evcNetto: n })} min={0} className="w-28" />
            <span className="text-[12px] text-[#999]">€/anno · 0 = non disponibile, usa solo MAUT</span>
          </div>
        </div>

        {/* EVC vs MAUT blend — shown only if EVC is provided */}
        {(v.evcNetto ?? 0) > 0 && (
          <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 mb-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-3">Ponderazione EVC vs MAUT</h4>
            <div className="flex items-center gap-3">
              <label className="text-[13px] text-[#555] min-w-[200px] shrink-0">Peso EVC nel valore finale</label>
              <input
                type="range"
                min={0} max={100} step={10}
                value={v.evcPeso ?? 0}
                onChange={(e) => set({ evcPeso: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-[14px] font-semibold text-[#181d26] min-w-[40px] text-right tabnum">{v.evcPeso ?? 0}%</span>
            </div>
            <p className="text-[11px] text-[#aaa] mt-1">CFO/imprenditore → EVC alto · Manager operativo → MAUT alto · Default 0% = solo MAUT</p>
          </div>
        )}

        {/* Capture ratio benchmarks */}
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Capture Ratio (% valore catturato come prezzo)</h4>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {CAPTURE_RATIO_BENCHMARKS.map((b, i) => (
            <button
              key={i}
              onClick={() => selectBench(i)}
              className={`rounded-[8px] p-2 border text-left transition-colors ${selBench === i ? 'border-[#378ADD] bg-[#E6F1FB]' : 'border-[#e0e2e6] bg-white hover:bg-[#f8fafc]'}`}
            >
              <div className="text-[11px] text-[#888] mb-0.5">{b.label}</div>
              <div className="text-[13px] font-semibold text-[#181d26]">{b.range}</div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[#555] min-w-[200px] shrink-0">Override manuale</label>
            <input
              type="range"
              min={5} max={50} step={1}
              value={v.captureRatio ?? 20}
              onChange={(e) => { setSelBench(null); set({ captureRatio: parseInt(e.target.value) }) }}
              className="flex-1"
            />
            <span className="text-[14px] font-semibold text-[#181d26] min-w-[40px] text-right tabnum">{v.captureRatio ?? 20}%</span>
          </div>
          <p className="text-[11px] text-[#aaa] mt-1">Range sano: 15–35% · sopra il 50% aumenta il rischio di rifiuto</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-4">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`text-[12px] font-medium px-4 py-2 rounded-[8px] ${
                  a.type === 'error'
                    ? 'bg-[#FCEBEB] text-[#791F1F] border border-[#F09595]'
                    : 'bg-[#FAEEDA] text-[#633806] border border-[#EF9F27]'
                }`}
              >
                {a.msg}
              </div>
            ))}
          </div>
        )}

        {/* Scenario cards */}
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Scenari — clicca per espandere il dettaglio</h4>
        <p className="text-[12px] text-[#0C447C] bg-[#E6F1FB] border border-[#85B7EB] rounded-[8px] px-3 py-2 mb-3">
          Conservativo: −30% voci bassa confidenza · Base: valori nominali · Ottimistico: +20% voci alta confidenza
        </p>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScen(sc.id)}
              className={`rounded-[12px] p-4 border text-left transition-all ${sc.cls} ${activeScen === sc.id ? sc.activeCls : 'border-opacity-60'}`}
            >
              <div className={`text-[11px] font-semibold uppercase tracking-[0.05em] mb-1 ${sc.labelCls}`}>{sc.label}</div>
              <div className="text-[22px] font-semibold text-[#1a1a1a] tabnum">{fmt(sc.price)}</div>
              <div className={`text-[12px] mt-0.5 ${sc.labelCls}`}>+ {fmt(v.canone ?? 0)}/mese</div>
              <div className={`text-[11px] mt-2 ${sc.labelCls}`}>{sc.desc}</div>
            </button>
          ))}
        </div>

        {/* Scenario detail — expandable */}
        {snapshot && scenDetail && activeScenData.price > 0 && (
          <div className={`rounded-[12px] p-4 mb-4 border ${
            activeScen === 'a' ? 'bg-amber-50/30 border-amber-300' :
            activeScen === 'b' ? 'bg-emerald-50/30 border-emerald-300' :
                                 'bg-indigo-50/30 border-indigo-300'
          }`}>
            <div className="text-[13px] font-semibold text-[#1a1a1a] mb-3">Dettaglio scenario {activeScenData.label}</div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Prezzo', value: fmt(activeScenData.price) },
                { label: 'Payback', value: Number.isFinite(scenDetail.payback) ? `${scenDetail.payback.toFixed(1)} mesi` : '—' },
                { label: 'ROI anno 1', value: fmt(scenDetail.roi1) },
                { label: 'ROI anno 3', value: fmt(scenDetail.roi3) },
                { label: 'ROI anno 5', value: fmt(scenDetail.roi5) },
                { label: 'ROI % investimento', value: `${scenDetail.roiPct}%/anno` },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-[8px] p-2 border border-white/60">
                  <div className="text-[11px] text-[#888] mb-0.5">{m.label}</div>
                  <div className="text-[13px] font-semibold text-[#181d26] tabnum">{m.value}</div>
                </div>
              ))}
            </div>

            {/* VAN table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr>
                    {['Anno', 'Valore cliente', 'Canone', 'CF totale', 'CF scontato', 'VAN cumulativo'].map((h) => (
                      <th key={h} className="text-left px-2 py-1.5 font-semibold text-[#888] border-b border-[#e0e2e6] text-[11px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenDetail.rows.map((row) => (
                    <tr key={row.year} className="border-b border-[#f0ede8] last:border-b-0">
                      <td className="px-2 py-1.5 text-[#1a1a1a]">Anno {row.year}</td>
                      <td className="px-2 py-1.5 tabnum">{fmtA(row.annualVal)}</td>
                      <td className="px-2 py-1.5 tabnum">{fmt(row.canoneAnnual)}</td>
                      <td className="px-2 py-1.5 tabnum">{fmtA(row.annCF)}</td>
                      <td className="px-2 py-1.5 tabnum">{fmtA(row.cfD)}</td>
                      <td className={`px-2 py-1.5 font-semibold tabnum ${row.vanCum >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {fmt(row.vanCum)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[12px] text-[#666] mt-2">
              VAN 5 anni (tasso {v.discountRate ?? 8}%): <strong className="tabnum">{fmt(scenDetail.vanFinal)}</strong>
            </div>
          </div>
        )}

        {/* Tre opzioni da presentare al cliente */}
        {snapshot && snapshot.prezzoConsigliato > 0 && (
          <>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Tre opzioni da presentare al cliente</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: 'Essenziale',
                  price: snapshot.prezzoEssential,
                  canone: snapshot.canoneEssential,
                  desc: 'Core · scope ridotto',
                  cls: 'bg-[#f8fafc] border-[#e0e2e6]',
                  priceCls: 'text-[#181d26]',
                  labelCls: 'text-[#181d26]/40',
                },
                {
                  label: 'Consigliato',
                  price: snapshot.prezzoConsigliato,
                  canone: snapshot.canoneConsigliato,
                  desc: 'Scope completo · valore nominale',
                  cls: 'bg-[#1b61c9] border-[#1b61c9]',
                  priceCls: 'text-white',
                  labelCls: 'text-white/70',
                },
                {
                  label: 'Premium',
                  price: snapshot.prezzoPremium,
                  canone: snapshot.canonePremium,
                  desc: 'Scope esteso · SLA · priorità assoluta',
                  cls: 'bg-[#f8fafc] border-[#e0e2e6]',
                  priceCls: 'text-[#181d26]',
                  labelCls: 'text-[#181d26]/40',
                },
              ].map((opt, i) => (
                <div key={opt.label} className={`rounded-[12px] px-4 py-4 text-center border ${opt.cls} ${i === 1 ? 'ring-2 ring-[#1b61c9]/30' : ''}`}>
                  <div className={`text-[10px] font-semibold uppercase mb-1 ${opt.labelCls}`}>{opt.label}</div>
                  <div className={`text-[22px] font-bold tabnum mb-0.5 ${opt.priceCls}`}>{fmt(opt.price)}</div>
                  <div className={`text-[12px] ${opt.labelCls}`}>+ {fmt(opt.canone)}/mese</div>
                  <div className={`text-[11px] mt-2 ${opt.labelCls}`}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Summary box */}
        {snapshot && snapshot.prezzoConsigliato > 0 && (
          <div className="bg-[#EEEDFE] rounded-[12px] p-4 space-y-1.5">
            {[
              { label: 'Costo interno (floor)', value: fmt(v.costoInterno) },
              ...(evcNetto > 0 ? [{ label: 'EVC netto annuo', value: fmtA(evcNetto) }] : []),
              { label: 'MAUT annuo ponderato', value: fmtA(snapshot.mautValBase ?? 0) },
              { label: 'Capture ratio applicato', value: `${snapshot.captureRatioUsed ?? 20}%` },
              { label: 'Scenario A — Conservativo', value: fmt(snapshot.prezzoEssential) },
              { label: 'Scenario B — Bilanciato (target)', value: fmt(snapshot.prezzoConsigliato) },
              { label: 'Scenario C — Aggressivo', value: fmt(snapshot.prezzoPremium) },
              { label: 'Canone manutenzione', value: `${fmt(v.canone ?? 0)}/mese` },
              { label: 'Payback stimato', value: Number.isFinite(snapshot.paybackMonths) ? `${snapshot.paybackMonths.toFixed(1)} mesi` : '—' },
              { label: `VAN 5 anni (tasso ${v.discountRate ?? 8}%)`, value: fmt(snapshot.vanBase5anni ?? 0) },
              { label: 'Prezzo consigliato', value: `${fmt(snapshot.prezzoConsigliato)} + ${fmt(v.canone ?? 0)}/mese` },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between text-[13px] text-[#534AB7] pb-1.5 ${i < arr.length - 1 ? 'border-b border-[#AFA9EC]' : 'font-bold text-[15px] text-[#3C3489] pt-2'}`}
              >
                <span>{row.label}</span>
                <span className="font-semibold tabnum">{row.value}</span>
              </div>
            ))}
            <p className="text-[11px] text-[#534AB7] pt-1 italic">
              Nota: la stima si basa su dati forniti dal cliente — rivalutazione a 6 mesi raccomandata.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
