'use server'

import { TCF_FACTORS, ECF_FACTORS, FP_TYPES } from '@/lib/constants'
import { calcBenValAnnual } from '@/lib/mautCalcs'
import type { SizingData, ComponentData, StaffingData, MAUTData, MAUTBenefit, ResultSnapshot } from '@/lib/types'

// ─── Lookup tables ────────────────────────────────────────────────────────────

const RISK_VALS = { comp: [1, 1.15, 1.35], fam: [1, 1.2, 1.4], dep: [1, 1.1, 1.3] }
const COCOMO_VALS = {
  acap: [0.85, 1.0, 1.19],
  aexp: [0.88, 1.0, 1.22],
  cplx: [0.75, 1.0, 1.30],
  rely: [0.82, 1.0, 1.26],
}

// ─── Pure math ────────────────────────────────────────────────────────────────

function roundTo100(val: number) {
  return Math.round(val / 100) * 100
}

function pert6(o: number, r: number, p: number) {
  return (o + 4 * r + p) / 6
}

const clampIndex = (v: number) => Math.floor(Math.max(0, Math.min(2, v)))

function riskMult(c: number, f: number, d: number) {
  return RISK_VALS.comp[clampIndex(c)] * RISK_VALS.fam[clampIndex(f)] * RISK_VALS.dep[clampIndex(d)]
}

function cocomoMult(ac: number, ae: number, cx: number, re: number) {
  return COCOMO_VALS.acap[clampIndex(ac)] * COCOMO_VALS.aexp[clampIndex(ae)] * COCOMO_VALS.cplx[clampIndex(cx)] * COCOMO_VALS.rely[clampIndex(re)]
}

function totalMult(c: ComponentData) {
  return riskMult(c.comp, c.fam, c.dep) * cocomoMult(c.acap, c.aexp, c.cplx, c.rely)
}

function _calcUCP(s: SizingData) {
  const uaw = s.actorSimple * 1 + s.actorMedium * 2 + s.actorComplex * 3
  const uucw = s.ucSimple * 5 + s.ucMedium * 10 + s.ucComplex * 15
  const tf = TCF_FACTORS.reduce((acc, f, i) => acc + f.w * (s.tcfVals?.[i] ?? 0), 0)
  const ef = ECF_FACTORS.reduce((acc, f, i) => acc + (f.neg ? -f.w : f.w) * (s.ecfVals?.[i] ?? 0), 0)
  const tcf = 0.6 + tf / 100
  const ecf = 1.4 + -0.03 * ef
  const ucp = (uucw + uaw) * tcf * ecf
  const effort = ucp * (s.ucpProd ?? 20)
  return { uaw, uucw, tcf, ecf, ucp, effort }
}

function _calcFP(s: SizingData) {
  let ufp = 0
  FP_TYPES.forEach((t, i) => {
    const d = s.fpData?.[i] ?? { s: 0, m: 0, c: 0 }
    ufp += d.s * t.weights[0] + d.m * t.weights[1] + d.c * t.weights[2]
  })
  const vafSum = (s.vafVals ?? []).reduce((acc, v) => acc + v, 0)
  const vaf = 0.65 + 0.01 * vafSum
  const afp = ufp * vaf
  const effort = (afp / (s.fpProd || 10)) * (s.fpHpm ?? 120)
  return { ufp, vaf, afp, effort }
}

function _calcComponents(comps: ComponentData[]) {
  return comps.reduce((s, c) => s + pert6(c.ott, c.rea, c.pes) * totalMult(c), 0)
}

function _calcSchedule(pm: number, bVal: number) {
  if (pm <= 0) return 0
  return 3 * Math.pow(pm, 0.33 + 0.2 * (bVal - 1.01))
}

function _calcBrooks(n: number) {
  const channels = (n * (n - 1)) / 2
  return Math.min(channels * 0.03, 0.8)
}

/**
 * Compute the annual MAUT value for a single scenario factor.
 *
 * factor = 0.70 → conservativo (-30% bassa confidenza)
 * factor = 1.00 → bilanciato (nominal)
 * factor = 1.20 → aggressivo (+20% bassa conf, +8% alta conf)
 *
 * Confidence adjustment (from Keeney & Raiffa):
 *   low conf:  × factor
 *   high conf (factor > 1): × (1 + (factor−1) × 0.4)
 *   med conf:  × 1 (unchanged in all scenarios)
 */
function _calcScenMAUT(benefits: MAUTBenefit[], factor: number): number {
  const totPeso = benefits.reduce((s, b) => s + b.peso, 0)
  if (totPeso === 0) return 0

  return benefits.reduce((s, b) => {
    const baseVal = calcBenValAnnual(b.typeId, b.fields)
    const conf = b.conf ?? 'med'
    let adj: number
    if (conf === 'low') {
      adj = factor
    } else if (conf === 'high' && factor > 1) {
      adj = 1 + (factor - 1) * 0.4
    } else {
      adj = 1
    }
    return s + baseVal * adj * (b.peso / totPeso)
  }, 0)
}

/**
 * Compute scenario price.
 * Blends MAUT (and optional EVC) with capture ratio, floored by costoInterno.
 */
function _calcScenPrice(
  mautAnnual: number,
  evcNetto: number,
  evcPeso: number,
  captureRatio: number,
  costoInterno: number,
  evcFactor: number,
): number {
  const evcPesoFrac = evcNetto > 0 ? evcPeso / 100 : 0
  const evcAdj = evcNetto * evcFactor
  const finalVal = evcAdj * evcPesoFrac + mautAnnual * (1 - evcPesoFrac)
  const rawPrice = finalVal * (captureRatio / 100)
  const rounded = roundTo100(rawPrice)
  return Math.max(costoInterno, rounded)
}

/** Compute NPV over 5 years from the client's perspective. */
function _calcVAN(price: number, annualVal: number, canoneAnnual: number, discountRate: number): number {
  const annCF = annualVal + canoneAnnual
  let van = -price
  for (let y = 1; y <= 5; y++) {
    van += annCF / Math.pow(1 + discountRate / 100, y)
  }
  return van
}

// ─── Main server action ───────────────────────────────────────────────────────

export async function computeAll(
  sizing: SizingData | null,
  components: ComponentData[],
  staffing: StaffingData | null,
  maut: MAUTData | null,
): Promise<ResultSnapshot> {
  const ucpRes = sizing ? _calcUCP(sizing) : { uaw: 0, uucw: 0, tcf: 0, ecf: 0, ucp: 0, effort: 0 }
  const fpRes  = sizing ? _calcFP(sizing)  : { ufp: 0, vaf: 0, afp: 0, effort: 0 }

  const s1 = sizing?.method === 'fp' ? fpRes.effort : ucpRes.effort
  const s2 = _calcComponents(components)

  const hpm   = staffing?.hpmSchedule ?? 120
  const bVal  = staffing?.bVal ?? 1.10
  const pm    = hpm > 0 ? s2 / hpm : 0
  const tdev  = _calcSchedule(pm, bVal)
  const teamImplicitRaw = tdev > 0 ? pm / tdev : 0
  const teamImplicit = teamImplicitRaw - Math.floor(teamImplicitRaw) > 0.3 ? Math.ceil(teamImplicitRaw) : Math.floor(teamImplicitRaw)
  const brooksOverheadPct = _calcBrooks(staffing?.members?.length ?? Math.ceil(teamImplicit))

  let mautValPonderato = 0, mautTotPeso = 0
  let mautValConservativo = 0, mautValBase = 0, mautValAggressivo = 0
  let prezzoEssential = 0, prezzoConsigliato = 0, prezzoPremium = 0
  let canoneEssential = 0, canoneConsigliato = 0, canonePremium = 0
  let paybackMonths = 0, nettoAnno1 = 0
  let captureRatioUsed = 20, vanBase5anni = 0

  if (maut) {
    const benefits = maut.benefits ?? []
    mautTotPeso = benefits.reduce((s, b) => s + b.peso, 0)

    // Annual MAUT values per scenario
    mautValConservativo = _calcScenMAUT(benefits, 0.70)
    mautValBase         = _calcScenMAUT(benefits, 1.00)
    mautValAggressivo   = _calcScenMAUT(benefits, 1.20)
    mautValPonderato    = mautValBase

    const ci  = maut.costoInterno ?? 0
    const can = maut.canone ?? 0
    const cr  = maut.captureRatio ?? 20
    const evc = maut.evcNetto ?? 0
    const ew  = maut.evcPeso ?? 0
    const disc = maut.discountRate ?? 8
    captureRatioUsed = cr

    // Scenario prices: A=conservativo, B=bilanciato, C=aggressivo
    prezzoEssential   = _calcScenPrice(mautValConservativo, evc, ew, cr, ci, 0.70)
    prezzoConsigliato = _calcScenPrice(mautValBase,         evc, ew, cr, ci, 1.00)
    prezzoPremium     = _calcScenPrice(mautValAggressivo,   evc, ew, cr, ci, 1.20)

    canoneEssential   = Math.round(can * 0.6)
    canoneConsigliato = can
    canonePremium     = Math.round(can * 1.5)

    if (mautValBase > 0) {
      paybackMonths = prezzoConsigliato / (mautValBase / 12)
      nettoAnno1    = mautValBase - prezzoConsigliato
    }

    vanBase5anni = _calcVAN(prezzoConsigliato, mautValBase, can * 12, disc)
  }

  const deltaS1S2Pct = s1 > 0 ? ((s2 - s1) / s1) * 100 : 0
  const orePerUcp    = ucpRes.ucp > 0 ? s2 / ucpRes.ucp : 0

  const n = staffing?.members?.length ?? 0
  const canali = n > 0 ? (n * (n - 1)) / 2 : 0
  const overheadPct = Math.min(canali * 3, 80)
  const costoBase = (staffing?.members ?? []).reduce((s, m) => s + s2 * ((m.pct ?? 0) / 100) * (m.rate ?? 35), 0)
  const costoConOverhead = costoBase * (1 + overheadPct / 100)

  const extItems = staffing?.extItems ?? []
  const extOnce = extItems.filter((i) => i.type === 'once').reduce((s, i) => s + i.amount, 0)
  const extMonthly = extItems.filter((i) => i.type === 'monthly').reduce((s, i) => s + i.amount, 0)
  const costoTotaleInterno = costoConOverhead + extOnce

  return {
    uaw: ucpRes.uaw, uucw: ucpRes.uucw, tcf: ucpRes.tcf, ecf: ucpRes.ecf,
    ucp: ucpRes.ucp, ucpEffort: ucpRes.effort,
    ufp: fpRes.ufp, vaf: fpRes.vaf, afp: fpRes.afp, fpEffort: fpRes.effort,
    compAdjTotal: s2, pm, tdev, teamImplicit, brooksOverheadPct,
    costoBase, costoConOverhead, extOnce, extMonthly, costoTotaleInterno,
    mautValPonderato, mautTotPeso,
    mautValConservativo, mautValBase, mautValAggressivo,
    prezzoEssential, prezzoConsigliato, prezzoPremium,
    canoneEssential, canoneConsigliato, canonePremium,
    paybackMonths, nettoAnno1,
    captureRatioUsed, vanBase5anni,
    s1, s2, deltaS1S2Pct, orePerUcp,
  }
}
