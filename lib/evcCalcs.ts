// EVC (Economic Value to Customer) calculation functions — Anderson & Narus
// Mirrors exactly the formulas in the reference HTML (giammario_v8.html)

type Fields = Record<string, number>

// ─── RP — Reference Point ─────────────────────────────────────────────────────

export const RP_CALCS: Record<string, (f: Fields) => number> = {
  cl:   (f) => (f.fte ?? 0) * (f.rate ?? 35) * (f.ore ?? 1760),
  cf:   (f) => (f.n ?? 0) * (f.c ?? 0),
  ct:   (f) => f.v ?? 0,
  co:   (f) => ((f.recr ?? 0) / (f.mesi || 24)) * 12,
  rp_a: (f) => f.v ?? 0,
}

// ─── VDP — Value Differential Premium ────────────────────────────────────────

export const VDP_CALCS: Record<string, (f: Fields) => number> = {
  prod:       (f) => ((f.a ?? 0) - (f.b ?? 0)) * (f.r ?? 35) * 12,
  overhead:   (f) => ((f.a ?? 0) - (f.b ?? 0)) * (f.r ?? 50) * 12,
  terzisti:   (f) => f.v ?? 0,
  rework:     (f) => (f.n ?? 0) * (f.t ?? 0) * (f.r ?? 35) * ((f.p ?? 0) / 100) * 12,
  compliance: (f) => (f.p ?? 0) * (f.v ?? 0) * ((f.e ?? 0) / 100),
  continuity: (f) => (f.ore ?? 0) * (f.r ?? 35),
  throughput: (f) => (f.d ?? 0) * (f.m ?? 0),
  latenza:    (f) => (f.dc ?? 0) * (f.dv ?? 0) * (f.vol ?? 0),
  scalabilita:(f) => (f.c ?? 0) * (f.p ?? 0),
  knowhow:    (f) => (f.ral ?? 0) * ((f.p ?? 0) / 100),
  dataenrich: (f) => (f.ore ?? 0) * (f.r ?? 60) * 12,
  turnover:   (f) => (f.ral ?? 0) * 0.3 * (f.n ?? 0) * ((f.p ?? 0) / 100),
  onboarding: (f) => (f.ore ?? 0) * (f.r ?? 30) * (f.ass ?? 0),
  ttm:        (f) => (f.s ?? 0) * (f.m ?? 0),
  circolante: (f) => (f.cr ?? 0) * ((f.g ?? 0) / 365) * ((f.cc ?? 0) / 100),
  vdp_a:      (f) => f.v ?? 0,
}

// ─── VDN — Value Differential Negative ───────────────────────────────────────

export const VDN_CALCS: Record<string, (f: Fields) => number> = {
  api:          (f) => (f.t ?? 0) * ((f.tok ?? 0) / 1000) * (f.c ?? 0) * 12,
  hosting:      (f) => (f.m ?? 0) * 12,
  manutenzione: (f) => f.v ?? 0,
  formazione:   (f) => (f.np ?? 0) * (f.ore ?? 0) * (f.r ?? 35),
  setup:        (f) => ((f.v ?? 0) / 36) * 12,
  migrazione:   (f) => (f.ore ?? 0) * (f.r ?? 35),
  friction:     (f) => ((f.p ?? 0) / 100) * (f.ore ?? 0) * (f.r ?? 35) * (f.m ?? 0),
  vdn_a:        (f) => f.v ?? 0,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safe(v: number): number {
  return Number.isFinite(v) ? Math.max(0, v) : 0
}

export function calcRP(typeId: string, fields: Fields): number {
  return safe((RP_CALCS[typeId] ?? (() => 0))(fields))
}

export function calcVDP(typeId: string, fields: Fields): number {
  return safe((VDP_CALCS[typeId] ?? (() => 0))(fields))
}

export function calcVDN(typeId: string, fields: Fields): number {
  return safe((VDN_CALCS[typeId] ?? (() => 0))(fields))
}

/**
 * Apply confidence scenario factor to a single EVC item value.
 * Mirrors calcScen() in giammario_v8.html.
 *   low  conf: × factor  (full sensitivity)
 *   high conf: × (1 + (factor-1)*0.4)  only when optimistic
 *   med  conf: × 1  (unchanged)
 */
export function applyEVCFactor(baseVal: number, conf: 'high' | 'med' | 'low', factor: number): number {
  if (conf === 'low') return baseVal * factor
  if (conf === 'high' && factor > 1) return baseVal * (1 + (factor - 1) * 0.4)
  return baseVal
}
