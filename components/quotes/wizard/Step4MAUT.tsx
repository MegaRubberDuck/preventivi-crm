'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MAUT_TYPES, STAKEHOLDERS, CAPTURE_RATIO_BENCHMARKS,
  RP_TYPES, VDP_TYPES, VDN_TYPES, CLIENT_TYPES,
} from '@/lib/constants'
import { calcBenValAnnual } from '@/lib/mautCalcs'
import { calcRP, calcVDP, calcVDN } from '@/lib/evcCalcs'
import type { MAUTData, MAUTBenefit, EVCItem, ResultSnapshot } from '@/lib/types'

// ─── Formatters ───────────────────────────────────────────────────────────────

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmt  = (n: number) => eur.format(n)
const fmtA = (n: number) => eur.format(n) + '/anno'

// ─── Confidence ───────────────────────────────────────────────────────────────

const CONF_LABEL: Record<string, string> = { high: 'Alta', med: 'Media', low: 'Bassa' }
const CONF_CLS: Record<string, string> = {
  high: 'bg-green-50 text-green-700',
  med:  'bg-amber-50 text-amber-700',
  low:  'bg-red-50 text-red-600',
}

// ─── NumInput ─────────────────────────────────────────────────────────────────

function NumInput({
  value, onChange, min = 0, step = 'any', className = '',
}: {
  value: number; onChange: (n: number) => void
  min?: number; step?: string | number; className?: string
}) {
  const [local, setLocal] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => { if (!focused.current) setLocal(String(value)) }, [value])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={local}
      className={`text-[13px] border border-[#e0e2e6] rounded-[6px] px-2 py-1 bg-[#f8fafc] tabnum outline-none focus:border-[#1b61c9] focus:bg-white ${className}`}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1')
        setLocal(v)
        const n = parseFloat(v)
        if (!isNaN(n)) onChange(n)
      }}
      onFocus={() => { focused.current = true }}
      onBlur={() => {
        focused.current = false
        const n = parseFloat(local)
        if (!local || isNaN(n) || n < min) { setLocal(String(min)); onChange(min) }
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
    />
  )
}

// ─── EVC Item Card ────────────────────────────────────────────────────────────

type EVCSection = 'rp' | 'vdp' | 'vdn'

const EVC_SECTION_TYPES = {
  rp:  RP_TYPES  as unknown as ReadonlyArray<{ id: string; label: string; formula: string; fields: ReadonlyArray<{ key: string; label: string; def: number; unit: string }> }>,
  vdp: VDP_TYPES as unknown as ReadonlyArray<{ id: string; label: string; formula: string; fields: ReadonlyArray<{ key: string; label: string; def: number; unit: string }> }>,
  vdn: VDN_TYPES as unknown as ReadonlyArray<{ id: string; label: string; formula: string; fields: ReadonlyArray<{ key: string; label: string; def: number; unit: string }> }>,
}

const CALC_FN = {
  rp:  calcRP,
  vdp: calcVDP,
  vdn: calcVDN,
}

const NUM_CLS = {
  rp:  'bg-[#E1F5EE] text-[#085041]',
  vdp: 'bg-[#EEEDFE] text-[#534AB7]',
  vdn: 'bg-[#FCEBEB] text-[#791F1F]',
}

const PILL_CLS = {
  rp:  'bg-[#E1F5EE] text-[#085041]',
  vdp: 'bg-[#EEEDFE] text-[#3C3489]',
  vdn: 'bg-[#FCEBEB] text-[#791F1F]',
}

function EVCItemCard({
  item, idx, section,
  onChange, onRemove, onTypeChange,
}: {
  item: EVCItem; idx: number; section: EVCSection
  onChange: (patch: Partial<EVCItem>) => void
  onRemove: () => void
  onTypeChange: (typeId: string) => void
}) {
  const types   = EVC_SECTION_TYPES[section]
  const calcFn  = CALC_FN[section]
  const t       = types.find((x) => x.id === item.typeId) ?? types[0]
  const val     = calcFn(item.typeId, item.fields)

  return (
    <div className="border border-[#e0e2e6] rounded-[12px] overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f8fafc]">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${NUM_CLS[section]}`}>{idx + 1}</div>
        <input
          type="text"
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 text-[13px] font-semibold text-[#181d26] bg-transparent border-0 outline-none"
        />
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${CONF_CLS[item.conf]}`}>
          Conf. {CONF_LABEL[item.conf]}
        </span>
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center text-[#181d26]/30 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
        >×</button>
      </div>

      {/* body */}
      <div className="px-4 py-3 space-y-2">
        {/* type + confidence */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#f8fafc] rounded-[8px] p-2 col-span-2">
            <label className="text-[11px] text-[#888] block mb-1">Tipo</label>
            <select
              value={item.typeId}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
            >
              {types.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </div>
          <div className="bg-[#f8fafc] rounded-[8px] p-2">
            <label className="text-[11px] text-[#888] block mb-1">Confidenza</label>
            <select
              value={item.conf}
              onChange={(e) => onChange({ conf: e.target.value as EVCItem['conf'] })}
              className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
            >
              <option value="high">Alta — dato certo</option>
              <option value="med">Media — stima ragionata</option>
              <option value="low">Bassa — ipotesi</option>
            </select>
          </div>
        </div>

        {/* formula */}
        <div className="text-[11px] font-mono text-[#181d26]/50 bg-[#f8fafc] border border-[#e0e2e6] rounded-[6px] px-3 py-1.5">
          {t.formula}
        </div>

        {/* fields grid */}
        <div className={`grid gap-2 ${t.fields.length <= 2 ? 'grid-cols-2' : t.fields.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {t.fields.map((f) => (
            <div key={f.key} className="bg-[#f8fafc] rounded-[8px] p-2">
              <label className="text-[11px] text-[#888] block mb-1">{f.label}</label>
              <NumInput
                value={item.fields[f.key] ?? f.def}
                onChange={(n) => onChange({ fields: { ...item.fields, [f.key]: n } })}
                className="w-full"
              />
              <div className="text-[10px] text-[#bbb] mt-0.5">{f.unit}</div>
            </div>
          ))}
        </div>

        {/* value pill */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#e0e2e6]">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${PILL_CLS[section]}`}>
            {section === 'vdn' ? '−' : ''}{fmtA(val)}
          </span>
          <span className="text-[10px] text-[#181d26]/30">{section.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Scenario detail ──────────────────────────────────────────────────────────

function computeScenDetail(price: number, combinedVal: number, canone: number, disc: number) {
  const canoneAnnual = canone * 12
  const annCF = combinedVal + canoneAnnual
  const payback = combinedVal > 0 ? price / (combinedVal / 12) : Infinity
  const roi1 = combinedVal - price
  const roi3 = combinedVal * 3 - price
  const roi5 = combinedVal * 5 - price
  const roiPct = price > 0 ? Math.round((combinedVal / price - 1) * 100) : 0
  const rows: { year: number; annualVal: number; canoneAnnual: number; annCF: number; cfD: number; vanCum: number }[] = []
  let vanCum = -price
  for (let y = 1; y <= 5; y++) {
    const cfD = annCF / Math.pow(1 + disc / 100, y)
    vanCum += cfD
    rows.push({ year: y, annualVal: combinedVal, canoneAnnual, annCF, cfD, vanCum })
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

  // ── Effective capture ratio (crAltro overrides slider) ─────────────────────
  const effectiveCR = (v.crAltro ?? 0) > 0 ? (v.crAltro ?? 20) : (v.captureRatio ?? 20)

  // ── EVC CRUD ──────────────────────────────────────────────────────────────

  function makeEVCItem(section: EVCSection): EVCItem {
    const types = EVC_SECTION_TYPES[section]
    const t = types[0]
    const fields: Record<string, number> = {}
    t.fields.forEach((f) => { fields[f.key] = f.def })
    return { id: crypto.randomUUID(), name: t.label, typeId: t.id, fields, conf: 'med' }
  }

  function addEVCItem(section: EVCSection) {
    const item = makeEVCItem(section)
    if (section === 'rp')  set({ rpItems:  [...(v.rpItems  ?? []), item] })
    if (section === 'vdp') set({ vdpItems: [...(v.vdpItems ?? []), item] })
    if (section === 'vdn') set({ vdnItems: [...(v.vdnItems ?? []), item] })
  }

  function updateEVCItem(section: EVCSection, id: string, patch: Partial<EVCItem>) {
    const key = section === 'rp' ? 'rpItems' : section === 'vdp' ? 'vdpItems' : 'vdnItems'
    const items = (v[key] ?? []) as EVCItem[]
    set({ [key]: items.map((i) => i.id === id ? { ...i, ...patch } : i) })
  }

  function changeEVCType(section: EVCSection, id: string, typeId: string) {
    const types = EVC_SECTION_TYPES[section]
    const t = types.find((x) => x.id === typeId) ?? types[0]
    const fields: Record<string, number> = {}
    t.fields.forEach((f) => { fields[f.key] = f.def })
    updateEVCItem(section, id, { typeId, name: t.label, fields })
  }

  function removeEVCItem(section: EVCSection, id: string) {
    const key = section === 'rp' ? 'rpItems' : section === 'vdp' ? 'vdpItems' : 'vdnItems'
    const items = (v[key] ?? []) as EVCItem[]
    set({ [key]: items.filter((i) => i.id !== id) })
  }

  // ── MAUT CRUD ────────────────────────────────────────────────────────────

  function addBenefit() {
    const t = MAUT_TYPES[0]
    const fields: Record<string, number> = {}
    t.fields.forEach((f) => { fields[f.key] = f.def })
    set({
      benefits: [...v.benefits, {
        id: crypto.randomUUID(), name: t.label, typeId: t.id,
        fields, peso: 0, conf: 'med', stake: STAKEHOLDERS[2],
      }],
    })
  }

  function updateBenefit(id: string, patch: Partial<MAUTBenefit>) {
    set({ benefits: v.benefits.map((b) => b.id === id ? { ...b, ...patch } : b) })
  }

  function changeMautType(id: string, typeId: string) {
    const t = MAUT_TYPES.find((t) => t.id === typeId)
    if (!t) return
    const fields: Record<string, number> = {}
    t.fields.forEach((f) => { fields[f.key] = f.def })
    set({ benefits: v.benefits.map((b) => b.id === id ? { ...b, typeId, name: t.label, fields } : b) })
  }

  function removeBenefit(id: string) {
    set({ benefits: v.benefits.filter((b) => b.id !== id) })
  }

  // ── Derived — EVC ─────────────────────────────────────────────────────────

  const rpItems  = v.rpItems  ?? []
  const vdpItems = v.vdpItems ?? []
  const vdnItems = v.vdnItems ?? []

  const totalRP  = rpItems.reduce((s, i)  => s + calcRP(i.typeId, i.fields),  0)
  const totalVDP = vdpItems.reduce((s, i) => s + calcVDP(i.typeId, i.fields), 0)
  const totalVDN = vdnItems.reduce((s, i) => s + calcVDN(i.typeId, i.fields), 0)
  const evcLordo = totalRP + totalVDP
  const evcNetto = Math.max(0, evcLordo - totalVDN)

  // Use snapshot values when available (server-computed), else local
  const evcRP   = snapshot?.evcRP   ?? totalRP
  const evcVDP  = snapshot?.evcVDP  ?? totalVDP
  const evcVDN  = snapshot?.evcVDN  ?? totalVDN
  const evcCalc = snapshot?.evcNettoCalc ?? evcNetto

  // ── Derived — MAUT ────────────────────────────────────────────────────────

  const totPeso  = v.benefits.reduce((s, b) => s + b.peso, 0)
  const pesoOk   = Math.abs(totPeso - 100) < 1
  const mautBase = snapshot?.mautValBase ?? 0

  const deltaEvc = mautBase > 0 && evcCalc > 0
    ? Math.round(((mautBase - evcCalc) / evcCalc) * 100)
    : null

  // ── Benchmark selection ───────────────────────────────────────────────────

  function selectBench(i: number) {
    const b = CAPTURE_RATIO_BENCHMARKS[i]
    const mid = Math.round((b.min + b.max) / 2)
    setSelBench(i)
    set({ captureRatio: mid, crAltro: 0 })
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  const alerts: { type: 'error' | 'warn'; msg: string }[] = []
  if (snapshot) {
    const ci = v.costoInterno ?? 0
    if (ci > 0 && snapshot.prezzoConsigliato <= ci) {
      alerts.push({ type: 'error', msg: `⚠ PREZZO SOTTO IL FLOOR: lo scenario base (${fmt(snapshot.prezzoConsigliato)}) è ≤ al costo interno (${fmt(ci)}). Stai vendendo in perdita o a pareggio.` })
    }
  }
  if (effectiveCR > 50) {
    alerts.push({ type: 'warn', msg: `⚠ CAPTURE RATIO ELEVATO (${effectiveCR}%). Catturare oltre il 50% del valore generato aumenta il rischio di rifiuto. Range sano: 15–35%.` })
  }
  if (snapshot && Number.isFinite(snapshot.paybackMonths) && snapshot.paybackMonths > 18) {
    alerts.push({ type: 'warn', msg: `⚠ PAYBACK LUNGO (${snapshot.paybackMonths.toFixed(1)} mesi). Oltre 18 mesi è difficile da far accettare — considera di rinegoziare lo scope o ridurre il prezzo.` })
  }
  if (mautBase > 0 && evcCalc > 0 && Math.abs(deltaEvc ?? 0) > 50) {
    alerts.push({ type: 'warn', msg: `⚠ DIVERGENZA EVC/MAUT (${Math.abs(deltaEvc ?? 0)}%). Verifica doppi conteggi o pesi MAUT distorti.` })
  }

  // ── Scenario data ────────────────────────────────────────────────────────
  // combinedVal = calcFinal() * factor (mirrors buildScenDetail in giammario_v8.html)
  // calcFinal() = finalValCombinedBase = evcNetto*ew + mautBase*(1-ew)

  const finalValCombinedBase = snapshot?.finalValCombinedBase ?? 0

  const scenarios = [
    {
      id: 'a' as const, label: 'A — Conservativo',
      price: snapshot?.prezzoEssential ?? 0,
      factor: 0.70,
      combinedVal: finalValCombinedBase * 0.70,
      desc: '−30% voci bassa conf · per clienti con dati incerti',
      cls: 'border-amber-300 bg-amber-50', activeCls: 'border-amber-500 ring-2 ring-amber-300', labelCls: 'text-amber-800',
      sdCls: 'bg-amber-50/40 border-amber-300',
    },
    {
      id: 'b' as const, label: 'B — Bilanciato (target)',
      price: snapshot?.prezzoConsigliato ?? 0,
      factor: 1.00,
      combinedVal: finalValCombinedBase * 1.00,
      desc: 'Valori nominali · prezzo da presentare in proposta',
      cls: 'border-emerald-300 bg-emerald-50', activeCls: 'border-emerald-600 ring-2 ring-emerald-300', labelCls: 'text-emerald-800',
      sdCls: 'bg-emerald-50/40 border-emerald-300',
    },
    {
      id: 'c' as const, label: 'C — Aggressivo',
      price: snapshot?.prezzoPremium ?? 0,
      factor: 1.20,
      combinedVal: finalValCombinedBase * 1.20,
      desc: '+20% voci alta conf · se cliente porta documentazione',
      cls: 'border-indigo-300 bg-indigo-50', activeCls: 'border-indigo-600 ring-2 ring-indigo-300', labelCls: 'text-indigo-800',
      sdCls: 'bg-indigo-50/40 border-indigo-300',
    },
  ]

  const activeScenData = scenarios.find((s) => s.id === activeScen) ?? scenarios[1]
  const scenDetail = snapshot
    ? computeScenDetail(activeScenData.price, activeScenData.combinedVal, v.canone ?? 0, v.discountRate ?? 8)
    : null

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-6">

      {/* ══════════════════════════ DATI DI INPUT ═══════════════════════════ */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#888] mb-3">Dati di input</div>
        <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 space-y-3">

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Costo interno (floor)</label>
            <NumInput value={v.costoInterno} onChange={(n) => set({ costoInterno: n })} className="w-28" />
            <span className="text-[12px] text-[#999]">€ — prezzo invalicabile</span>
            {snapshot && snapshot.costoTotaleInterno > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5 font-medium">
                da Step 3: {fmt(snapshot.costoTotaleInterno)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Tipo cliente</label>
            <select
              value={v.tipoCliente ?? 'pmi'}
              onChange={(e) => set({ tipoCliente: e.target.value })}
              className="text-[13px] border border-[#e0e2e6] rounded-[8px] px-2 py-1 bg-white outline-none focus:border-[#1b61c9]"
            >
              {CLIENT_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Loaded Rate default</label>
            <NumInput value={v.loadedRate ?? 35} onChange={(n) => set({ loadedRate: n })} className="w-28" />
            <span className="text-[12px] text-[#999]">€/h</span>
          </div>
          <p className="text-[11px] text-[#aaa] -mt-1 pl-[195px]">
            Costo orario reale del dipendente del cliente (stipendio + contributi + overhead). Default €35/h = operatore PMI (~RAL 28k€). Manager: €50–70/h · Quadro: €80–100/h · Junior: €20–25/h.
          </p>

          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Tasso di sconto (VAN)</label>
            <select
              value={v.discountRate ?? 8}
              onChange={(e) => set({ discountRate: parseFloat(e.target.value) })}
              className="text-[13px] border border-[#e0e2e6] rounded-[8px] px-2 py-1 bg-white outline-none focus:border-[#1b61c9]"
            >
              <option value={5}>5% — Enterprise / grande azienda (costo capitale basso)</option>
              <option value={8}>8% — PMI consolidata (default Italia)</option>
              <option value={12}>12% — PMI con crescita attiva</option>
              <option value={18}>18% — Startup early stage</option>
              <option value={25}>25% — Startup pre-revenue / alto rischio</option>
            </select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Canone manutenzione</label>
            <NumInput value={v.canone ?? 0} onChange={(n) => set({ canone: n })} className="w-28" />
            <span className="text-[12px] text-[#999]">€/mese</span>
            {snapshot && snapshot.extMonthly > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5 font-medium">
                da Step 3: {fmt(snapshot.extMonthly)}/mese
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e0e2e6]" />

      {/* ════════════════════ SESSIONE A — EVC ══════════════════════════════ */}
      <div>
        <div className="flex items-start gap-3 bg-[#E1F5EE] border border-[#9FE1CB] rounded-[12px] px-4 py-3 mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#085041]">Sessione A — EVC (Economic Value to Customer)</div>
            <div className="text-[12px] text-[#0F6E56]">Formula: EVC Netto = (RP + VDP) − VDN · Anderson &amp; Narus</div>
          </div>
        </div>

        {/* ── RP ── */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] bg-[#f0ede8] rounded-[8px] px-3 py-1.5 mb-2">
          RP — Reference Point (Status Quo baseline)
        </div>
        <p className="text-[12px] text-[#085041] border-l-2 border-[#5DCAA5] bg-[#E1F5EE] rounded-r-[8px] pl-3 pr-3 py-2 mb-3">
          Quanto vale — in costi — la situazione attuale del cliente. Somma di tutto ciò che paga oggi con il processo manuale/legacy.
        </p>

        <div className="space-y-3 mb-3">
          {rpItems.map((item, idx) => (
            <EVCItemCard
              key={item.id} item={item} idx={idx} section="rp"
              onChange={(patch) => updateEVCItem('rp', item.id, patch)}
              onRemove={() => removeEVCItem('rp', item.id)}
              onTypeChange={(typeId) => changeEVCType('rp', item.id, typeId)}
            />
          ))}
        </div>
        <button
          onClick={() => addEVCItem('rp')}
          className="text-[12px] px-3 py-1.5 border border-[#9FE1CB] rounded-[8px] text-[#085041] hover:bg-[#E1F5EE] transition-colors mb-3"
        >
          + aggiungi voce RP
        </button>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#f8fafc] rounded-[8px] p-3">
            <div className="text-[11px] text-[#888] mb-1">RP totale annuale</div>
            <div className="text-[15px] font-semibold text-[#085041] tabnum">{fmtA(evcRP)}</div>
          </div>
        </div>

        {/* ── VDP ── */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] bg-[#f0ede8] rounded-[8px] px-3 py-1.5 mb-2">
          VDP — Value Differential Premium (Benefici AI)
        </div>
        <p className="text-[12px] text-[#085041] border-l-2 border-[#5DCAA5] bg-[#E1F5EE] rounded-r-[8px] pl-3 pr-3 py-2 mb-3">
          Valore aggiuntivo che la soluzione porta rispetto alla baseline. Ogni voce ha formula dedicata.
        </p>

        <div className="space-y-3 mb-3">
          {vdpItems.map((item, idx) => (
            <EVCItemCard
              key={item.id} item={item} idx={idx} section="vdp"
              onChange={(patch) => updateEVCItem('vdp', item.id, patch)}
              onRemove={() => removeEVCItem('vdp', item.id)}
              onTypeChange={(typeId) => changeEVCType('vdp', item.id, typeId)}
            />
          ))}
        </div>
        <button
          onClick={() => addEVCItem('vdp')}
          className="text-[12px] px-3 py-1.5 border border-[#9FE1CB] rounded-[8px] text-[#085041] hover:bg-[#E1F5EE] transition-colors mb-3"
        >
          + aggiungi voce VDP
        </button>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#f8fafc] rounded-[8px] p-3">
            <div className="text-[11px] text-[#888] mb-1">VDP totale annuale</div>
            <div className="text-[15px] font-semibold text-[#085041] tabnum">{fmtA(evcVDP)}</div>
          </div>
        </div>

        {/* ── VDN ── */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] bg-[#f0ede8] rounded-[8px] px-3 py-1.5 mb-2">
          VDN — Costi Indotti (da sottrarre)
        </div>
        <p className="text-[12px] text-[#085041] border-l-2 border-[#5DCAA5] bg-[#E1F5EE] rounded-r-[8px] pl-3 pr-3 py-2 mb-3">
          Costi che il cliente sostiene adottando la soluzione. Sottratti dall&apos;EVC lordo.
        </p>

        <div className="space-y-3 mb-3">
          {vdnItems.map((item, idx) => (
            <EVCItemCard
              key={item.id} item={item} idx={idx} section="vdn"
              onChange={(patch) => updateEVCItem('vdn', item.id, patch)}
              onRemove={() => removeEVCItem('vdn', item.id)}
              onTypeChange={(typeId) => changeEVCType('vdn', item.id, typeId)}
            />
          ))}
        </div>
        <button
          onClick={() => addEVCItem('vdn')}
          className="text-[12px] px-3 py-1.5 border border-[#FCEBEB] text-[#791F1F] rounded-[8px] hover:bg-[#FCEBEB] transition-colors mb-3"
        >
          + aggiungi voce VDN
        </button>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#f8fafc] rounded-[8px] p-3">
            <div className="text-[11px] text-[#888] mb-1">VDN totale annuale</div>
            <div className="text-[15px] font-semibold text-red-700 tabnum">−{fmtA(evcVDN)}</div>
          </div>
        </div>

        {/* ── EVC riepilogo table ── */}
        {(rpItems.length > 0 || vdpItems.length > 0 || vdnItems.length > 0) && (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Tabella EVC riepilogativa</div>
            <div className="bg-white border border-[#e0e2e6] rounded-[12px] overflow-hidden mb-3">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-[#888] border-b border-[#e0e2e6] text-[11px]">Variabile</th>
                    <th className="text-left px-3 py-2 font-semibold text-[#888] border-b border-[#e0e2e6] text-[11px]">Sezione</th>
                    <th className="text-right px-3 py-2 font-semibold text-[#888] border-b border-[#e0e2e6] text-[11px]">Valore Annuo</th>
                  </tr>
                </thead>
                <tbody>
                  {rpItems.map((i) => (
                    <tr key={i.id} className="border-b border-[#f0ede8]">
                      <td className="px-3 py-2 text-[#1a1a1a]">{i.name}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#E1F5EE] text-[#085041]">RP</span></td>
                      <td className="px-3 py-2 text-right tabnum">{fmtA(calcRP(i.typeId, i.fields))}</td>
                    </tr>
                  ))}
                  {rpItems.length > 0 && (
                    <tr className="bg-[#f8fafc] font-medium border-b border-[#e0e2e6]">
                      <td className="px-3 py-2" colSpan={2}>Totale RP</td>
                      <td className="px-3 py-2 text-right tabnum">{fmtA(evcRP)}</td>
                    </tr>
                  )}
                  {vdpItems.map((i) => (
                    <tr key={i.id} className="border-b border-[#f0ede8]">
                      <td className="px-3 py-2 text-[#1a1a1a]">{i.name}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EEEDFE] text-[#3C3489]">VDP</span></td>
                      <td className="px-3 py-2 text-right tabnum">{fmtA(calcVDP(i.typeId, i.fields))}</td>
                    </tr>
                  ))}
                  {vdpItems.length > 0 && (
                    <tr className="bg-[#f8fafc] font-medium border-b border-[#e0e2e6]">
                      <td className="px-3 py-2" colSpan={2}>Totale VDP</td>
                      <td className="px-3 py-2 text-right tabnum">{fmtA(evcVDP)}</td>
                    </tr>
                  )}
                  {vdnItems.map((i) => (
                    <tr key={i.id} className="border-b border-[#f0ede8]">
                      <td className="px-3 py-2 text-[#1a1a1a]">{i.name}</td>
                      <td className="px-3 py-2"><span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FCEBEB] text-[#791F1F]">VDN</span></td>
                      <td className="px-3 py-2 text-right tabnum">−{fmtA(calcVDN(i.typeId, i.fields))}</td>
                    </tr>
                  ))}
                  {vdnItems.length > 0 && (
                    <tr className="bg-[#f8fafc] font-medium border-b border-[#e0e2e6]">
                      <td className="px-3 py-2" colSpan={2}>Totale VDN</td>
                      <td className="px-3 py-2 text-right tabnum">−{fmtA(evcVDN)}</td>
                    </tr>
                  )}
                  <tr className="bg-[#E1F5EE]">
                    <td className="px-3 py-2 font-semibold text-[#085041]" colSpan={2}>EVC Lordo (RP + VDP)</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#085041] tabnum">{fmtA(evcRP + evcVDP)}</td>
                  </tr>
                  <tr className="bg-[#E1F5EE] border-t border-[#9FE1CB]">
                    <td className="px-3 py-2 font-semibold text-[#085041]" colSpan={2}>EVC Netto (− VDN)</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#085041] tabnum">{fmtA(evcCalc)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* EVC metrics */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[
                { label: 'RP annuale',        value: fmtA(evcRP),          cls: 'text-[#085041]' },
                { label: 'VDP annuale',       value: fmtA(evcVDP),         cls: 'text-[#085041]' },
                { label: 'VDN annuale',       value: fmtA(evcVDN),         cls: 'text-red-700' },
                { label: 'EVC netto annuale', value: fmtA(evcCalc),        cls: 'text-[#534AB7]' },
              ].map((m) => (
                <div key={m.label} className="bg-[#f8fafc] rounded-[8px] p-3">
                  <div className="text-[11px] text-[#888] mb-1">{m.label}</div>
                  <div className={`text-[14px] font-semibold tabnum ${m.cls}`}>{m.value}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-px bg-[#e0e2e6]" />

      {/* ════════════════════ SESSIONE B — MAUT ═════════════════════════════ */}
      <div>
        <div className="flex items-start gap-3 bg-[#EEEDFE] border border-[#AFA9EC] rounded-[12px] px-4 py-3 mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#3C3489]">Sessione B — MAUT (Multi-Attribute Utility Theory)</div>
            <div className="text-[12px] text-[#534AB7]">V_MAUT = Σ(valore_i × peso_i / tot_pesi) · Keeney &amp; Raiffa · Σpesi = 100%</div>
          </div>
        </div>
        <p className="text-[12px] text-[#555] border-l-2 border-[#AFA9EC] pl-3 mb-4">
          Ogni beneficio produce un valore <strong>annuo</strong>. Assegna stakeholder, peso e confidenza.
          Il Δ vs EVC è il check di coerenza tra i due metodi.
        </p>

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

            return (
              <div key={b.id} className="border border-[#e0e2e6] rounded-[12px] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-[#f8fafc]">
                  <div className="w-5 h-5 rounded-full bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => updateBenefit(b.id, { name: e.target.value })}
                    className="flex-1 text-[13px] font-semibold text-[#181d26] bg-transparent border-0 outline-none"
                  />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${CONF_CLS[conf]}`}>Conf. {CONF_LABEL[conf]}</span>
                  <button
                    onClick={() => removeBenefit(b.id)}
                    className="w-5 h-5 flex items-center justify-center text-[#181d26]/30 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                  >×</button>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#f8fafc] rounded-[8px] p-2">
                      <label className="text-[11px] text-[#888] block mb-1">Tipo</label>
                      <select
                        value={b.typeId}
                        onChange={(e) => changeMautType(b.id, e.target.value)}
                        className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        {MAUT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="bg-[#f8fafc] rounded-[8px] p-2">
                      <label className="text-[11px] text-[#888] block mb-1">Stakeholder</label>
                      <select
                        value={b.stake ?? STAKEHOLDERS[2]}
                        onChange={(e) => updateBenefit(b.id, { stake: e.target.value })}
                        className="w-full text-[12px] border border-[#e0e2e6] rounded-[6px] px-1.5 py-1 bg-white outline-none focus:border-[#1b61c9]"
                      >
                        {STAKEHOLDERS.map((s) => <option key={s} value={s}>{s}</option>)}
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

                  {t && (
                    <div className="text-[11px] font-mono text-[#181d26]/50 bg-[#f8fafc] border border-[#e0e2e6] rounded-[6px] px-3 py-1.5">
                      {t.formula}
                    </div>
                  )}

                  {t && (
                    <div className={`grid gap-2 ${t.fields.length <= 2 ? 'grid-cols-2' : t.fields.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                      {t.fields.map((f) => (
                        <div key={f.key} className="bg-[#f8fafc] rounded-[8px] p-2">
                          <label className="text-[11px] text-[#888] block mb-1">{f.label}</label>
                          <NumInput
                            value={b.fields[f.key] ?? f.def}
                            onChange={(n) => updateBenefit(b.id, { fields: { ...b.fields, [f.key]: n } })}
                            className="w-full"
                          />
                          <div className="text-[10px] text-[#bbb] mt-0.5">{f.unit}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t border-[#e0e2e6]">
                    <label className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-[#181d26]">Peso MAUT</span>
                      <NumInput
                        value={b.peso}
                        onChange={(n) => updateBenefit(b.id, { peso: n })}
                        className="w-14 text-center"
                      />
                      <span className="text-[12px] text-[#181d26]/50">%</span>
                    </label>
                    <span className="text-[12px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold tabnum">{fmtA(valAnnual)}</span>
                    <span className="text-[12px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold tabnum">contrib. {fmtA(Math.round(contrib))}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={addBenefit}
          className="mt-3 text-[12px] px-3 py-1.5 border border-[#AFA9EC] rounded-[8px] text-[#534AB7] hover:bg-[#EEEDFE] transition-colors"
        >
          + Aggiungi beneficio
        </button>

        {/* MAUT metrics */}
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
            <div className="text-[11px] text-[#888] mb-1">Δ vs EVC netto</div>
            <div className={`text-[15px] font-semibold tabnum ${deltaEvc === null ? 'text-[#181d26]/30' : Math.abs(deltaEvc) <= 20 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {deltaEvc === null ? '—' : `${deltaEvc > 0 ? '+' : ''}${deltaEvc}% ${Math.abs(deltaEvc) <= 20 ? '✓' : '⚠'}`}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e0e2e6]" />

      {/* ════════════════════ SESSIONE C — PRICING ══════════════════════════ */}
      <div>
        <div className="flex items-start gap-3 bg-[#E6F1FB] border border-[#85B7EB] rounded-[12px] px-4 py-3 mb-4">
          <div>
            <div className="text-[14px] font-semibold text-[#0C447C]">Sessione C — Pricing Strategico</div>
            <div className="text-[12px] text-[#185FA5]">Sintesi EVC + MAUT · Capture Ratio · VAN 5 anni · Tre scenari · ROI cliente</div>
          </div>
        </div>

        {/* Riepilogo tecnico Step 3 */}
        {snapshot && snapshot.costoTotaleInterno > 0 && (
          <div className="bg-[#f0f4ff] border border-[#c7d2fe] rounded-[12px] p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-[#4338CA] uppercase tracking-[0.05em]">📋 Riepilogo tecnico (da Step 3)</span>
              <span className="text-[10px] bg-[#4F46E5] text-white px-2 py-0.5 rounded-full">precompilato</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {[
                { label: 'Costo lavoro con overhead',  value: fmt(snapshot.costoConOverhead),       show: snapshot.costoConOverhead > 0 },
                { label: 'Costi esterni una tantum',   value: `+${fmt(snapshot.extOnce)}`,          show: snapshot.extOnce > 0 },
                { label: 'Costi ricorrenti (canone)',  value: `${fmt(snapshot.extMonthly)}/mese`,   show: snapshot.extMonthly > 0 },
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

        {/* EVC vs MAUT weight slider */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Ponderazione EVC vs MAUT</div>
        <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Peso EVC nel valore finale</label>
            <input
              type="range"
              min={0} max={100} step={10}
              value={v.evcPeso ?? 50}
              onChange={(e) => set({ evcPeso: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[14px] font-semibold text-[#181d26] min-w-[40px] text-right tabnum">{v.evcPeso ?? 50}%</span>
          </div>
          <p className="text-[11px] text-[#aaa] mt-1">
            CFO/imprenditore → EVC alto · Manager operativo → MAUT alto · Default 50% = media equa
          </p>
        </div>

        {/* Capture ratio benchmarks */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Capture Ratio (% valore catturato come prezzo)</div>
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

        <div className="bg-white border border-[#e0e2e6] rounded-[12px] p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Override manuale</label>
            <input
              type="range"
              min={5} max={50} step={1}
              value={v.captureRatio ?? 20}
              onChange={(e) => { setSelBench(null); set({ captureRatio: parseInt(e.target.value), crAltro: 0 }) }}
              className="flex-1"
            />
            <span className="text-[14px] font-semibold text-[#181d26] min-w-[40px] text-right tabnum">{v.captureRatio ?? 20}%</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13px] text-[#555] min-w-[195px] shrink-0">Capture Ratio Altro (override preciso)</label>
            <NumInput
              value={v.crAltro ?? 0}
              onChange={(n) => { setSelBench(null); set({ crAltro: n }) }}
              className="w-24"
            />
            <span className="text-[12px] text-[#999]">% (0 = usa slider)</span>
          </div>
          <p className="text-[11px] text-[#aaa]">Range sano: 15–35% · sopra il 50% aumenta il rischio di rifiuto</p>
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
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Scenari — clicca per espandere il dettaglio</div>
        <p className="text-[12px] text-[#0C447C] bg-[#E6F1FB] border border-[#85B7EB] rounded-[8px] px-3 py-2 mb-3">
          Conservativo: −30% voci bassa confidenza · Base: valori nominali · Ottimistico: +20% voci alta confidenza.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveScen(sc.id)}
              className={`rounded-[12px] p-4 border text-left transition-all ${sc.cls} ${activeScen === sc.id ? sc.activeCls : ''}`}
            >
              <div className={`text-[11px] font-semibold uppercase tracking-[0.05em] mb-1 ${sc.labelCls}`}>{sc.label}</div>
              <div className="text-[22px] font-semibold text-[#1a1a1a] tabnum">{fmt(sc.price)}</div>
              <div className={`text-[12px] mt-0.5 ${sc.labelCls}`}>+ {fmt(v.canone ?? 0)}/mese</div>
              <div className={`text-[11px] mt-2 ${sc.labelCls}`}>{sc.desc}</div>
            </button>
          ))}
        </div>

        {/* Scenario detail */}
        {snapshot && scenDetail && activeScenData.price > 0 && (
          <div className={`rounded-[12px] p-4 mb-4 border ${activeScenData.sdCls}`}>
            <div className="text-[13px] font-semibold text-[#1a1a1a] mb-3">Dettaglio scenario {activeScenData.label}</div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Prezzo',               value: fmt(activeScenData.price) },
                { label: 'Payback',              value: Number.isFinite(scenDetail.payback) ? `${scenDetail.payback.toFixed(1)} mesi` : '—' },
                { label: 'ROI anno 1',           value: fmt(scenDetail.roi1) },
                { label: 'ROI anno 3',           value: fmt(scenDetail.roi3) },
                { label: 'ROI anno 5',           value: fmt(scenDetail.roi5) },
                { label: 'ROI % investimento',   value: `${scenDetail.roiPct}%/anno` },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-[8px] p-2">
                  <div className="text-[11px] text-[#888] mb-0.5">{m.label}</div>
                  <div className="text-[13px] font-semibold text-[#181d26] tabnum">{m.value}</div>
                </div>
              ))}
            </div>

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
                      <td className="px-2 py-1.5">Anno {row.year}</td>
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

        {/* Tre opzioni */}
        {snapshot && snapshot.prezzoConsigliato > 0 && (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888] mb-2">Tre opzioni da presentare al cliente</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: 'Essenziale', price: snapshot.prezzoEssential, canone: snapshot.canoneEssential,
                  desc: 'Core · scope ridotto',
                  cls: 'bg-[#f8fafc] border-[#e0e2e6]', priceCls: 'text-[#181d26]', labelCls: 'text-[#181d26]/40',
                },
                {
                  label: 'Consigliato', price: snapshot.prezzoConsigliato, canone: snapshot.canoneConsigliato,
                  desc: 'Scope completo · valore nominale',
                  cls: 'bg-[#1b61c9] border-[#1b61c9]', priceCls: 'text-white', labelCls: 'text-white/70',
                },
                {
                  label: 'Premium', price: snapshot.prezzoPremium, canone: snapshot.canonePremium,
                  desc: 'Scope esteso · SLA · priorità assoluta',
                  cls: 'bg-[#f8fafc] border-[#e0e2e6]', priceCls: 'text-[#181d26]', labelCls: 'text-[#181d26]/40',
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
              { label: 'Costo interno (floor)',         value: fmt(v.costoInterno) },
              ...(evcCalc > 0 ? [{ label: 'EVC netto annuale',             value: fmtA(evcCalc) }] : []),
              { label: 'MAUT ponderato annuale',        value: fmtA(mautBase) },
              ...(finalValCombinedBase > 0 ? [{ label: 'Valore finale combinato/anno', value: fmtA(finalValCombinedBase) }] : []),
              { label: 'Capture ratio applicato',       value: `${effectiveCR}%` },
              { label: 'Scenario A — Conservativo',     value: fmt(snapshot.prezzoEssential) },
              { label: 'Scenario B — Bilanciato (target)', value: fmt(snapshot.prezzoConsigliato) },
              { label: 'Scenario C — Aggressivo',       value: fmt(snapshot.prezzoPremium) },
              { label: 'Canone manutenzione',           value: `${fmt(v.canone ?? 0)}/mese` },
              { label: 'Payback stimato',               value: Number.isFinite(snapshot.paybackMonths) ? `${snapshot.paybackMonths.toFixed(1)} mesi` : '—' },
              { label: `VAN 5 anni (tasso ${v.discountRate ?? 8}%)`, value: fmt(snapshot.vanBase5anni ?? 0) },
              { label: 'Prezzo consigliato',            value: `${fmt(snapshot.prezzoConsigliato)} + ${fmt(v.canone ?? 0)}/mese` },
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
