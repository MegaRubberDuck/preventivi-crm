// MAUT annual calculations — field names and formulas match exactly giammario_v8.html
// ore_pers: f.ore*f.r*12
// fatturato: f.fat*(f.p/100)*12
// errori: f.c*f.n*(f.p/100)*12
// rework: f.ore*f.r*(f.p/100)*12
// churn: f.cli*f.ltv*12
// outsourcing: f.c*(f.p/100)*12
// coordinamento: f.np*f.ore*f.r*(f.p/100)*12
// opportunity: f.ore*f.v*12
// scalabilita: f.c*f.p*12  (p is 0–1 decimal)
// compliance: f.p*f.imp*(f.e/100)  (p is 0–1 decimal)
// onboarding: f.ore*f.r*f.ass
// ttm: f.s*f.m
// circolante: f.cr*(f.g/365)*(f.cc/100)
// maut_a: f.v

export const MAUT_CALCS_ANNUAL: Record<string, (f: Record<string, number>) => number> = {
  ore_pers:      (f) => (f.ore ?? 0) * (f.r ?? 0) * 12,
  fatturato:     (f) => (f.fat ?? 0) * ((f.p ?? 0) / 100) * 12,
  errori:        (f) => (f.c ?? 0) * (f.n ?? 0) * ((f.p ?? 0) / 100) * 12,
  rework:        (f) => (f.ore ?? 0) * (f.r ?? 0) * ((f.p ?? 0) / 100) * 12,
  churn:         (f) => (f.cli ?? 0) * (f.ltv ?? 0) * 12,
  outsourcing:   (f) => (f.c ?? 0) * ((f.p ?? 0) / 100) * 12,
  coordinamento: (f) => (f.np ?? 0) * (f.ore ?? 0) * (f.r ?? 0) * ((f.p ?? 0) / 100) * 12,
  opportunity:   (f) => (f.ore ?? 0) * (f.v ?? 0) * 12,
  scalabilita:   (f) => (f.c ?? 0) * (f.p ?? 0) * 12,
  compliance:    (f) => (f.p ?? 0) * (f.imp ?? 0) * ((f.e ?? 0) / 100),
  onboarding:    (f) => (f.ore ?? 0) * (f.r ?? 0) * (f.ass ?? 0),
  ttm:           (f) => (f.s ?? 0) * (f.m ?? 0),
  circolante:    (f) => (f.cr ?? 0) * ((f.g ?? 0) / 365) * ((f.cc ?? 0) / 100),
  maut_a:        (f) => f.v ?? 0,
}

export function calcBenValAnnual(typeId: string, fields: Record<string, number>): number {
  const fn = MAUT_CALCS_ANNUAL[typeId]
  if (!fn) return 0
  const result = fn(fields)
  return Number.isFinite(result) ? Math.max(0, result) : 0
}
