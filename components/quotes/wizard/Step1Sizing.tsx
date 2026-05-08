'use client'

import { useState, useEffect, useRef } from 'react'
import { TCF_FACTORS, ECF_FACTORS, FP_TYPES, VAF_FACTORS } from '@/lib/constants'
import type { SizingData } from '@/lib/types'

function NumInput({ value, onChange, min = 0, className = '' }: {
  value: number; onChange: (n: number) => void; min?: number; className?: string
}) {
  const [localValue, setLocalValue] = useState(String(value))
  const isFocused = useRef(false)

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(String(value))
    }
  }, [value])

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, '')
        setLocalValue(v)
        const num = parseInt(v, 10)
        if (!isNaN(num)) {
          onChange(num)
        }
      }}
      onFocus={() => { isFocused.current = true }}
      onBlur={() => {
        isFocused.current = false
        const num = parseInt(localValue, 10)
        if (localValue === '' || isNaN(num) || num < min) {
          setLocalValue(String(min))
          onChange(min)
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur()
        }
      }}
      className={`text-center text-[13px] font-semibold border border-[#e0e2e6] rounded-[6px] px-2 py-1 bg-[#f8fafc] tabnum outline-none focus:border-[#1b61c9] focus:bg-white transition-colors ${className}`}
    />
  )
}

interface Props { value: SizingData; onChange: (d: SizingData) => void }

export function Step1Sizing({ value: v, onChange }: Props) {
  const set = (patch: Partial<SizingData>) => onChange({ ...v, ...patch })

  function setTcf(i: number, val: number) {
    const arr = [...v.tcfVals]; arr[i] = val; set({ tcfVals: arr })
  }
  function setEcf(i: number, val: number) {
    const arr = [...v.ecfVals]; arr[i] = val; set({ ecfVals: arr })
  }
  function setFp(typeIdx: number, key: 's' | 'm' | 'c', val: number) {
    const arr = v.fpData.map((d, i) => i === typeIdx ? { ...d, [key]: val } : d)
    set({ fpData: arr })
  }
  function setVaf(i: number, val: number) {
    const arr = [...v.vafVals]; arr[i] = val; set({ vafVals: arr })
  }

  return (
    <div className="p-5 space-y-5">
      {/* Method toggle */}
      <div className="flex gap-1 p-0.5 bg-[#f8fafc] border border-[#e0e2e6] rounded-[10px] w-fit">
        {(['ucp', 'fp'] as const).map((m) => (
          <button
            key={m}
            onClick={() => set({ method: m })}
            className={`px-4 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors ${
              v.method === m ? 'bg-white text-[#181d26] shadow-sm' : 'text-[#181d26]/50 hover:text-[#181d26]'
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {v.method === 'ucp' ? (
        <div className="space-y-5">
          {/* Actors */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Attori (UAW)</h3>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: 'Semplici ×1', key: 'actorSimple', hint: 'sistema/API' },
                  { label: 'Medi ×2', key: 'actorMedium', hint: 'protocollo' },
                  { label: 'Complessi ×3', key: 'actorComplex', hint: 'utente GUI' },
                ] as const
              ).map(({ label, key, hint }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#181d26]">{label}</span>
                  <NumInput value={v[key]} onChange={(n) => set({ [key]: n })} />
                  <span className="text-[11px] text-[#181d26]/40">{hint}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Use Cases */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Use Cases (UUCW)</h3>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: 'Semplici ×5', key: 'ucSimple' },
                  { label: 'Medi ×10', key: 'ucMedium' },
                  { label: 'Complessi ×15', key: 'ucComplex' },
                ] as const
              ).map(({ label, key }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-[#181d26]">{label}</span>
                  <NumInput value={v[key]} onChange={(n) => set({ [key]: n })} />
                </label>
              ))}
            </div>
          </section>

          {/* TCF */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Technical Complexity Factors (0–5)</h3>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#e0e2e6]">
                  <th className="text-left py-1.5 font-semibold text-[#181d26]/50 w-6">#</th>
                  <th className="text-left py-1.5 font-semibold text-[#181d26]/50">Fattore</th>
                  <th className="text-center py-1.5 font-semibold text-[#181d26]/50 w-12">Peso</th>
                  <th className="text-center py-1.5 font-semibold text-[#181d26]/50 w-16">Val.</th>
                </tr>
              </thead>
              <tbody>
                {TCF_FACTORS.map((f, i) => (
                  <tr key={i} className="border-b border-[#e0e2e6]/60 last:border-b-0">
                    <td className="py-1 text-[#181d26]/30">{i + 1}</td>
                    <td className="py-1 text-[#181d26]/80">{f.label}</td>
                    <td className="py-1 text-center text-[#181d26]/50">{f.w}</td>
                    <td className="py-1 text-center">
                      <NumInput value={v.tcfVals[i] ?? 0} onChange={(n) => setTcf(i, Math.min(5, Math.max(0, n)))} min={0} className="w-12" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ECF */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Environmental Complexity Factors (0–5)</h3>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#e0e2e6]">
                  <th className="text-left py-1.5 font-semibold text-[#181d26]/50 w-6">#</th>
                  <th className="text-left py-1.5 font-semibold text-[#181d26]/50">Fattore</th>
                  <th className="text-center py-1.5 font-semibold text-[#181d26]/50 w-12">Peso</th>
                  <th className="text-center py-1.5 font-semibold text-[#181d26]/50 w-8">Dir.</th>
                  <th className="text-center py-1.5 font-semibold text-[#181d26]/50 w-16">Val.</th>
                </tr>
              </thead>
              <tbody>
                {ECF_FACTORS.map((f, i) => (
                  <tr key={i} className="border-b border-[#e0e2e6]/60 last:border-b-0">
                    <td className="py-1 text-[#181d26]/30">{i + 1}</td>
                    <td className="py-1 text-[#181d26]/80">{f.label}</td>
                    <td className="py-1 text-center text-[#181d26]/50">{f.w}</td>
                    <td className={`py-1 text-center text-[11px] font-bold ${f.neg ? 'text-red-500' : 'text-green-600'}`}>{f.neg ? '−' : '+'}</td>
                    <td className="py-1 text-center">
                      <NumInput value={v.ecfVals[i] ?? 0} onChange={(n) => setEcf(i, Math.min(5, Math.max(0, n)))} min={0} className="w-12" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* PROD */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Produttività (PROD)</h3>
            <select
              value={v.ucpProd}
              onChange={(e) => set({ ucpProd: Number(e.target.value) })}
              className="text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-1.5 bg-[#f8fafc] text-[#181d26] outline-none focus:border-[#1b61c9]"
            >
              <option value={15}>15 h/UCP — team esperto</option>
              <option value={20}>20 h/UCP — nominale</option>
              <option value={28}>28 h/UCP — Karner standard</option>
            </select>
          </section>
        </div>
      ) : (
        <div className="space-y-5">
          {/* FP grid */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">Function Points</h3>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#e0e2e6]">
                  <th className="text-left py-1.5 font-semibold text-[#181d26]/50">Tipo</th>
                  {['Semplici', 'Medi', 'Complessi'].map((h) => (
                    <th key={h} className="text-center py-1.5 font-semibold text-[#181d26]/50 w-20">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FP_TYPES.map((t, i) => (
                  <tr key={i} className="border-b border-[#e0e2e6]/60 last:border-b-0">
                    <td className="py-1.5 text-[#181d26]/80">{t.name}</td>
                    {(['s', 'm', 'c'] as const).map((k) => (
                      <td key={k} className="py-1.5 text-center">
                        <NumInput value={v.fpData[i]?.[k] ?? 0} onChange={(n) => setFp(i, k, n)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* VAF */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-2">VAF — 14 caratteristiche generali (0–5)</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {VAF_FACTORS.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[#181d26]/70 truncate">{f}</span>
                  <NumInput value={v.vafVals[i] ?? 0} onChange={(n) => setVaf(i, Math.min(5, Math.max(0, n)))} min={0} className="w-12 shrink-0" />
                </div>
              ))}
            </div>
          </section>

          {/* FP params */}
          <section className="flex gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#181d26]">FP/mese</span>
              <NumInput value={v.fpProd} onChange={(n) => set({ fpProd: n })} min={1} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#181d26]">Ore/mese</span>
              <NumInput value={v.fpHpm} onChange={(n) => set({ fpHpm: n })} min={1} />
            </label>
          </section>
        </div>
      )}
    </div>
  )
}
