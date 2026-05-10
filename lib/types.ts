export interface Client {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
  vat_number: string | null
  fiscal_code: string | null
  sdi_code: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  country: string | null
  website: string | null
  client_type: 'company' | 'private'
  is_active: boolean
  logo_url: string | null
  created_at: string
  updated_at: string
}

export type QuoteStatus = 'draft' | 'sent' | 'won' | 'lost'

/** Sizing estimation data using UCP (Use Case Points) or FP (Function Points) methods */
export interface SizingData {
  method: 'ucp' | 'fp'
  // UCP (Use Case Points)
  actorSimple: number
  actorMedium: number
  actorComplex: number
  ucSimple: number
  ucMedium: number
  ucComplex: number
  /** Technical Complexity Factor values */
  tcfVals: number[]
  /** Environmental Complexity Factor values */
  ecfVals: number[]
  /** UCP productivity factor (hours per UCP) */
  ucpProd: number
  // FP (Function Points)
  /** Function point data: s=simple, m=medium, c=complex counts */
  fpData: Array<{ s: number; m: number; c: number }>
  vafVals: number[]
  fpProd: number
  fpHpm: number
}

export interface ComponentData {
  id: string
  name: string
  ott: number
  rea: number
  pes: number
  comp: 0 | 1 | 2
  fam: 0 | 1 | 2
  dep: 0 | 1 | 2
  acap: 0 | 1 | 2
  aexp: 0 | 1 | 2
  cplx: 0 | 1 | 2
  rely: 0 | 1 | 2
  phases: string[]
  excluded?: boolean
}

export interface StaffingData {
  teamSize?: number
  bVal: number
  hpmSchedule: number
  rateInternal: number
  members: Array<{
    id: string
    role: string
    rate: number
    pct: number
  }>
  extItems: Array<{
    id: string
    name: string
    amount: number
    type: 'once' | 'monthly'
  }>
}

export interface MAUTBenefit {
  id: string
  name: string
  typeId: string
  fields: Record<string, number>
  peso: number
  conf: 'high' | 'med' | 'low'
  stake: string
}

export interface EVCItem {
  id: string
  name: string
  typeId: string
  fields: Record<string, number>
  conf: 'high' | 'med' | 'low'
}

export interface MAUTData {
  benefits: MAUTBenefit[]
  costoInterno: number
  canone: number
  evcNetto: number       // legacy manual EVC — kept for backward compat
  evcPeso: number        // 0–100: weight of EVC vs MAUT in final blend
  captureRatio: number
  discountRate: number
  multiplier?: number
  // EVC (Sessione A)
  rpItems?: EVCItem[]
  vdpItems?: EVCItem[]
  vdnItems?: EVCItem[]
  tipoCliente?: string
  loadedRate?: number    // default €/h used when creating new items
  crAltro?: number       // manual CR override (0 = use captureRatio slider)
}

export interface ResultSnapshot {
  uaw: number
  uucw: number
  tcf: number
  ecf: number
  ucp: number
  ucpEffort: number
  ufp: number
  vaf: number
  afp: number
  fpEffort: number
  compAdjTotal: number
  pm: number
  tdev: number
  teamImplicit: number
  brooksOverheadPct: number
  costoBase: number
  costoConOverhead: number
  extOnce: number
  extMonthly: number
  costoTotaleInterno: number
  // EVC (Sessione A) computed totals
  evcRP: number
  evcVDP: number
  evcVDN: number
  evcNettoCalc: number
  // calcFinal() equivalent = evcNetto*evcPeso + mautBase*(1-evcPeso) — used in buildScenDetail
  finalValCombinedBase: number
  // MAUT annual weighted value (base scenario)
  mautValPonderato: number
  mautTotPeso: number
  // Scenario annual combined values (before capture ratio)
  mautValConservativo: number
  mautValBase: number
  mautValAggressivo: number
  // Scenario prices: A=conservativo, B=bilanciato, C=aggressivo
  prezzoEssential: number
  prezzoConsigliato: number
  prezzoPremium: number
  canoneEssential: number
  canoneConsigliato: number
  canonePremium: number
  paybackMonths: number
  nettoAnno1: number
  captureRatioUsed: number
  vanBase5anni: number
  s1: number
  s2: number
  deltaS1S2Pct: number
  orePerUcp: number
}

export interface Quote {
  id: string
  client_id: string | null
  status: QuoteStatus
  title: string
  sizing_data: SizingData | null
  components_data: ComponentData[] | null
  staffing_data: StaffingData | null
  costs_data: { externalMonthly: number } | null
  maut_data: MAUTData | null
  technical_description: string | null
  result_snapshot: ResultSnapshot | null
  created_at: string
  updated_at: string
  client?: Client
}
