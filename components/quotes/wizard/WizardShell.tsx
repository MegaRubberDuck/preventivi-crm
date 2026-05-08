'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { computeAll } from '@/actions/calculator'
import { saveQuote } from '@/actions/quotes'
import { ConvergencePanel } from '../ConvergencePanel'
import { Step1Sizing } from './Step1Sizing'
import { Step2Components } from './Step2Components'
import { Step3Staffing } from './Step3Staffing'
import { Step4Technical } from './Step4Technical'
import { Step4MAUT } from './Step4MAUT'
import type { SizingData, ComponentData, StaffingData, MAUTData, ResultSnapshot, Quote } from '@/lib/types'
import type { Client } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { calcBrooks } from '@/lib/constants'

const STEPS = [
  { id: 1, label: 'Sizing (UCP/FP)' },
  { id: 2, label: 'Componenti' },
  { id: 3, label: 'Schedule' },
  { id: 4, label: 'Tecnico' },
  { id: 5, label: 'MAUT & Pricing' },
]

const DEFAULT_SIZING: SizingData = {
  method: 'ucp',
  actorSimple: 0, actorMedium: 0, actorComplex: 0,
  ucSimple: 0, ucMedium: 0, ucComplex: 0,
  tcfVals: Array(13).fill(0),
  ecfVals: Array(8).fill(0),
  ucpProd: 20,
  fpData: Array.from({ length: 5 }, () => ({ s: 0, m: 0, c: 0 })),
  vafVals: Array(14).fill(0),
  fpProd: 10,
  fpHpm: 120,
}

const DEFAULT_STAFFING: StaffingData = {
  bVal: 1.10,
  hpmSchedule: 120,
  rateInternal: 35,
  members: [],
  extItems: [],
}

const DEFAULT_MAUT: MAUTData = {
  benefits: [],
  costoInterno: 0,
  canone: 300,
  evcNetto: 0,
  evcPeso: 0,
  captureRatio: 20,
  discountRate: 8,
}

interface Props {
  clients: Client[]
  clientsError?: string | null
  initialQuote?: Quote
  initialQuoteId?: string
  preselectedClientId?: string
}

export function WizardShell({ clients, clientsError, initialQuote, initialQuoteId, preselectedClientId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSave] = useTransition()

  const [title, setTitle] = useState(initialQuote?.title || 'Nuovo preventivo')
  const [clientId, setClientId] = useState<string | null>(initialQuote?.client_id ?? preselectedClientId ?? null)
  const [sizing, setSizing] = useState<SizingData>(initialQuote?.sizing_data ?? DEFAULT_SIZING)
  const [components, setComponents] = useState<ComponentData[]>(initialQuote?.components_data ?? [])
  const [staffing, setStaffing] = useState<StaffingData>({
    ...DEFAULT_STAFFING,
    ...(initialQuote?.staffing_data ?? {}),
  })
  const [maut, setMaut] = useState<MAUTData>({
    ...DEFAULT_MAUT,
    ...(initialQuote?.maut_data ?? {}),
  })
  const [technicalDescription, setTechnicalDescription] = useState(initialQuote?.technical_description ?? '')
  const [snapshot, setSnapshot] = useState<ResultSnapshot | null>(initialQuote?.result_snapshot ?? null)
  const [computeError, setComputeError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const recompute = useCallback((
    s: SizingData,
    c: ComponentData[],
    st: StaffingData,
    m: MAUTData
  ) => {
    startTransition(async () => {
      try {
        setComputeError(null)
        const res = await computeAll(s, c, st, m)
        setSnapshot(res)
      } catch (err) {
        setComputeError(err instanceof Error ? err.message : 'Errore di calcolo')
      }
    })
  }, [])

  useEffect(() => {
    // If loading an existing quote, sync costoInterno/canone from staffing into maut
    // using the stored s2 as the best available estimate before fresh recompute completes
    const s2 = initialQuote?.result_snapshot?.s2 ?? 0
    if (s2 > 0 && staffing.members.length > 0) {
      const n = staffing.members.length
      const overheadPct = calcBrooks(n)
      const costoBase = staffing.members.reduce((s, m) => s + s2 * ((m.pct ?? 0) / 100) * (m.rate ?? 35), 0)
      const costoConOverhead = costoBase * (1 + overheadPct / 100)
      const extItems = staffing.extItems ?? []
      const extOnce = extItems.filter((i) => i.type === 'once').reduce((s, i) => s + i.amount, 0)
      const extMonthly = extItems.filter((i) => i.type === 'monthly').reduce((s, i) => s + i.amount, 0)
      const costoTotale = Math.round(costoConOverhead + extOnce)
      const syncedMaut = { ...maut, costoInterno: costoTotale, canone: extMonthly }
      setMaut(syncedMaut)
      recompute(sizing, components, staffing, syncedMaut)
    } else {
      recompute(sizing, components, staffing, maut)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSizingChange(data: SizingData) {
    setSizing(data)
    recompute(data, components, staffing, maut)
  }

  function handleComponentsChange(data: ComponentData[]) {
    setComponents(data)
    recompute(sizing, data, staffing, maut)
  }

  function handleStaffingChange(data: StaffingData) {
    // Auto-compute staffing costs client-side so Step 4 gets up-to-date values
    const s2 = snapshot?.s2 ?? 0
    const members = data.members ?? []
    const n = members.length
    const overheadPct = calcBrooks(n)
    const costoBase = members.reduce((s, m) => s + s2 * ((m.pct ?? 0) / 100) * (m.rate ?? 35), 0)
    const costoConOverhead = costoBase * (1 + overheadPct / 100)
    const extItems = data.extItems ?? []
    const extOnce = extItems.filter((i) => i.type === 'once').reduce((s, i) => s + i.amount, 0)
    const extMonthly = extItems.filter((i) => i.type === 'monthly').reduce((s, i) => s + i.amount, 0)
    const costoTotale = Math.round(costoConOverhead + extOnce)

    const newMaut: MAUTData = { ...maut, costoInterno: costoTotale, canone: extMonthly }
    setStaffing(data)
    setMaut(newMaut)
    recompute(sizing, components, data, newMaut)
  }

  function handleMautChange(data: MAUTData) {
    setMaut(data)
    recompute(sizing, components, staffing, data)
  }

  function handleTechnicalChange(data: string) {
    setTechnicalDescription(data)
  }

  function handleSave() {
    setSaveError(null)
    startSave(async () => {
      try {
        const res = await saveQuote({
          id: initialQuote?.id ?? initialQuoteId,
          client_id: clientId,
          title,
          sizing_data: sizing,
          components_data: components,
          staffing_data: staffing,
          maut_data: maut,
          costs_data: { externalMonthly: 0 },
          technical_description: technicalDescription,
        })
        if ('error' in res) {
          setSaveError(res.error)
        } else {
          router.push(`/quotes/${res.id}`)
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
      }
    })
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Main wizard column */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="bg-white border border-[#e0e2e6] rounded-[16px] px-5 py-4" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
          <div className="flex items-center gap-3 mb-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Titolo preventivo"
              className="flex-1 text-[16px] font-semibold text-[#181d26] bg-transparent border-0 outline-none border-b border-transparent hover:border-[#e0e2e6] focus:border-[#1b61c9] transition-colors pb-0.5"
              placeholder="Titolo preventivo"
            />
            <div className="flex items-center gap-2">
              <select
                value={clientId ?? ''}
                onChange={(e) => setClientId(e.target.value || null)}
                aria-label="Seleziona cliente"
                className="text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-1.5 bg-[#f8fafc] text-[#181d26] outline-none focus:border-[#1b61c9]"
                disabled={!!clientsError}
              >
                <option value="">— Nessun cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
              {clientsError && (
                <span className="text-[12px] text-red-600">{clientsError}</span>
              )}
              <Link href="/clients/new" target="_blank" className="text-[12px] text-[#1b61c9] hover:underline whitespace-nowrap">
                + Nuovo
              </Link>
            </div>
          </div>

          {/* Step tabs */}
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                  step === s.id
                    ? 'bg-[#181d26] text-white'
                    : 'text-[#181d26]/60 hover:bg-[#f8fafc] hover:text-[#181d26]'
                }`}
              >
                <span className="opacity-50 mr-1">{s.id}.</span>{s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white border border-[#e0e2e6] rounded-[16px]" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
          {step === 1 && <Step1Sizing value={sizing} onChange={handleSizingChange} />}
          {step === 2 && <Step2Components value={components} onChange={handleComponentsChange} snapshot={snapshot} staffing={staffing} />}
          {step === 3 && <Step3Staffing value={staffing} onChange={handleStaffingChange} snapshot={snapshot} />}
          {step === 4 && <Step4Technical value={technicalDescription} onChange={handleTechnicalChange} />}
          {step === 5 && <Step4MAUT value={maut} onChange={handleMautChange} snapshot={snapshot} />}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-1.5 rounded-[12px] border border-[#e0e2e6] text-[13px] font-medium text-[#181d26] hover:bg-[#f8fafc] transition-colors"
              >
                ← Indietro
              </button>
            )}
            {step < 5 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-1.5 rounded-[12px] bg-[#181d26] text-white text-[13px] font-medium hover:bg-[#181d26]/90 transition-colors"
              >
                Avanti →
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {computeError && <span role="alert" className="text-[12px] text-red-600">{computeError}</span>}
            <button
              onClick={() => router.push('/')}
              className="px-3 py-1.5 text-[13px] text-[#181d26]/70 hover:text-[#181d26] transition-colors"
            >
              Annulla
            </button>
            {saveError && <span role="alert" className="text-[12px] text-red-600">{saveError}</span>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-1.5 rounded-[12px] bg-[#1b61c9] text-white text-[13px] font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50"
              style={{ boxShadow: 'rgba(45,127,249,0.28) 0px 1px 3px' }}
            >
              {isSaving ? 'Salvataggio...' : 'Salva preventivo'}
            </button>
          </div>
        </div>
      </div>

      {/* Convergence panel */}
      <div className="w-[280px] shrink-0 sticky top-[3.5rem] self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
        <ConvergencePanel snapshot={snapshot} isPending={isPending} />
      </div>
    </div>
  )
}
