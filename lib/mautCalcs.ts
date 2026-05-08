// Shared annual MAUT calculations — usable by both client components and server actions

export const MAUT_CALCS_ANNUAL: Record<string, (f: Record<string, number>) => number> = {
  ore_personale:   (f) => (f.ore ?? 0) * (f.costoOra ?? 0) * 12,
  fatturato:       (f) => (f.fattExtra ?? 0) * ((f.pctAttr ?? 0) / 100) * 12,
  errori:          (f) => (f.costoErr ?? 0) * (f.freqErr ?? 0) * ((f.pctRid ?? 0) / 100) * 12,
  churn:           (f) => (f.clientiSalvati ?? 0) * (f.ltv ?? 0) * 12,
  ttm:             (f) => (f.settimane ?? 0) * (f.margSett ?? 0),
  cac:             (f) => Math.max(0, ((f.cacAtt ?? 0) - (f.cacNew ?? 0)) * (f.volClienti ?? 0) * 12),
  formazione:      (f) => (f.oreForm ?? 0) * (f.costoHR ?? 0) * (f.assunzioni ?? 0),
  licenze:         (f) => (f.licenzeMese ?? 0) * 12,
  outsourcing:     (f) => (f.costoOut ?? 0) * ((f.pctAuto ?? 0) / 100) * 12,
  dataquality:     (f) => ((f.oreCorrezione ?? 0) * (f.costoOraRuolo ?? 0) + (f.costoDecErrate ?? 0)) * ((f.pctMiglioramento ?? 0) / 100) * 12,
  stress:          (f) => (f.giorniAssenza ?? 0) * (f.costoGiornata ?? 0) * (f.nPersone ?? 0) * ((f.pctRid ?? 0) / 100),
  compliance:      (f) => ((f.probSanzione ?? 0) / 100) * (f.importoSanzione ?? 0) * ((f.pctEliminato ?? 0) / 100),
  opportunitycost: (f) => (f.oreLiberate ?? 0) * (f.valorOraAlto ?? 0) * 12,
  scalabilita:     (f) => (f.costoRisorsa ?? 0) * ((f.probCrescita ?? 0) / 100) * 12,
  coordinamento:   (f) => (f.nPersone ?? 0) * (f.oreCoord ?? 0) * (f.costoOraMedio ?? 0) * ((f.pctRid ?? 0) / 100) * 12,
  decisioni:       (f) => (f.valDec ?? 0) * 12,
}

export function calcBenValAnnual(typeId: string, fields: Record<string, number>): number {
  const fn = MAUT_CALCS_ANNUAL[typeId]
  if (!fn) return 0
  const result = fn(fields)
  return Number.isFinite(result) ? Math.max(0, result) : 0
}
