export const TCF_FACTORS = [
  { label: 'Distributed system required', w: 2 },
  { label: 'Response time is important', w: 1 },
  { label: 'End user efficiency', w: 1 },
  { label: 'Complex internal processing', w: 1 },
  { label: 'Reusable code must be a focus', w: 1 },
  { label: 'Installation ease', w: 0.5 },
  { label: 'Usability', w: 0.5 },
  { label: 'Cross-platform support', w: 2 },
  { label: 'Easy to change', w: 1 },
  { label: 'Highly concurrent', w: 1 },
  { label: 'Custom security', w: 1 },
  { label: 'Dependence on third-party code', w: 1 },
  { label: 'User training required', w: 1 },
] as const

export const ECF_FACTORS = [
  { label: 'Familiarity with project domain', w: 1.5, neg: false },
  { label: 'Application experience', w: 0.5, neg: false },
  { label: 'OO programming experience', w: 1, neg: false },
  { label: 'Lead analyst capability', w: 0.5, neg: false },
  { label: 'Motivation', w: 1, neg: false },
  { label: 'Stable requirements', w: 2, neg: true },
  { label: 'Part time staff', w: 1, neg: true },
  { label: 'Difficult programming language', w: 1, neg: true },
] as const

export const FP_TYPES = [
  { name: 'External Inputs (EI)', weights: [3, 4, 6] as const },
  { name: 'External Outputs (EO)', weights: [4, 5, 7] as const },
  { name: 'External Inquiries (EQ)', weights: [3, 4, 6] as const },
  { name: 'Internal Logical Files (ILF)', weights: [7, 10, 15] as const },
  { name: 'External Interface Files (EIF)', weights: [5, 7, 10] as const },
] as const

export const VAF_FACTORS = [
  'Data communications', 'Distributed data processing', 'Performance',
  'Heavily used configuration', 'Transaction rate', 'Online data entry',
  'End-user efficiency', 'Online update', 'Complex processing', 'Reusability',
  'Installation ease', 'Operational ease', 'Multiple sites', 'Facilitate change',
] as const

export const RISK_OPTS = {
  comp: ['Bassa', 'Media', 'Alta'],
  fam:  ['Familiare', 'Parziale', 'Nuovo'],
  dep:  ['Indipendente', 'Dipendente', 'Critico'],
} as const

export const COCOMO_OPTS = {
  acap: { label: 'ACAP — Capacità', opts: ['Alta', 'Media', 'Bassa'] },
  aexp: { label: 'AEXP — Esperienza app', opts: ['Alta', 'Media', 'Bassa'] },
  cplx: { label: 'CPLX — Complessità codice', opts: ['Bassa', 'Media', 'Alta'] },
  rely: { label: 'RELY — Affidabilità', opts: ['Bassa', 'Media', 'Alta'] },
} as const

export const PHASES = ['Analisi', 'Design', 'Sviluppo', 'Integrazioni', 'Test', 'Deploy'] as const

export const STAKEHOLDERS = [
  'CEO / Imprenditore',
  'CFO / Controllo',
  'Manager operativo',
  'Team / Operatori',
  'Cliente finale',
  'IT / CTO',
] as const

export const CAPTURE_RATIO_BENCHMARKS = [
  { label: 'Automazioni / workflow',    range: '15–20%', min: 15, max: 20 },
  { label: 'Chatbot / AI assistant',   range: '20–30%', min: 20, max: 30 },
  { label: 'Web app / SaaS custom',    range: '25–35%', min: 25, max: 35 },
  { label: 'Consulenza strategica AI', range: '30–50%', min: 30, max: 50 },
  { label: 'E-commerce / siti',        range: '10–18%', min: 10, max: 18 },
  { label: 'Integrazione API / dati',  range: '15–25%', min: 15, max: 25 },
  { label: 'Piattaforma enterprise',   range: '20–40%', min: 20, max: 40 },
] as const

export const MAUT_TYPES = [
  {
    id: 'ore_personale', label: 'Risparmio ore personale', cat: 'saving',
    formula: 'ore/mese × costo orario × 12',
    fields: [
      { key: 'ore', label: 'Ore risparmiate/mese', def: 20, unit: 'h/mese' },
      { key: 'costoOra', label: 'Costo orario del ruolo', def: 20, unit: '€/h' },
    ],
  },
  {
    id: 'fatturato', label: 'Aumento fatturato', cat: 'revenue',
    formula: 'fatturato extra/mese × % attribuibile × 12',
    fields: [
      { key: 'fattExtra', label: 'Fatturato extra stimato', def: 3000, unit: '€/mese' },
      { key: 'pctAttr', label: '% attribuibile', def: 40, unit: '%' },
    ],
  },
  {
    id: 'errori', label: 'Riduzione errori', cat: 'saving',
    formula: 'costo errore × freq/mese × % riduzione × 12',
    fields: [
      { key: 'costoErr', label: 'Costo medio per errore', def: 300, unit: '€/evento' },
      { key: 'freqErr', label: 'Frequenza errori/mese', def: 5, unit: 'eventi/mese' },
      { key: 'pctRid', label: '% riduzione', def: 80, unit: '%' },
    ],
  },
  {
    id: 'churn', label: 'Riduzione churn', cat: 'revenue',
    formula: 'clienti salvati/mese × LTV × 12',
    fields: [
      { key: 'clientiSalvati', label: 'Clienti salvati/mese', def: 2, unit: 'clienti/mese' },
      { key: 'ltv', label: 'LTV medio cliente', def: 800, unit: '€/cliente' },
    ],
  },
  {
    id: 'ttm', label: 'Accelerazione time-to-market', cat: 'strategic',
    formula: 'settimane risparmiate × margine/settimana',
    fields: [
      { key: 'settimane', label: 'Settimane risparmiate', def: 4, unit: 'settimane' },
      { key: 'margSett', label: 'Margine operativo/sett', def: 500, unit: '€/sett' },
    ],
  },
  {
    id: 'cac', label: 'Riduzione CAC', cat: 'revenue',
    formula: '(CAC attuale − CAC post) × clienti/mese × 12',
    fields: [
      { key: 'cacAtt', label: 'CAC attuale', def: 200, unit: '€/cliente' },
      { key: 'cacNew', label: 'CAC post-soluzione', def: 120, unit: '€/cliente' },
      { key: 'volClienti', label: 'Nuovi clienti/mese', def: 10, unit: 'clienti/mese' },
    ],
  },
  {
    id: 'formazione', label: 'Riduzione costi formazione', cat: 'saving',
    formula: 'ore form. × costo HR × assunzioni/anno',
    fields: [
      { key: 'oreForm', label: 'Ore formazione risparmiate', def: 16, unit: 'h/risorsa' },
      { key: 'costoHR', label: 'Costo orario HR/tutor', def: 25, unit: '€/h' },
      { key: 'assunzioni', label: 'Assunzioni previste/anno', def: 4, unit: 'persone/anno' },
    ],
  },
  {
    id: 'licenze', label: 'Riduzione licenze software', cat: 'saving',
    formula: 'costo licenze eliminate/mese × 12',
    fields: [
      { key: 'licenzeMese', label: 'Costo licenze eliminate', def: 200, unit: '€/mese' },
    ],
  },
  {
    id: 'outsourcing', label: 'Riduzione outsourcing', cat: 'saving',
    formula: 'costo fornitore × % attività automatizzate × 12',
    fields: [
      { key: 'costoOut', label: 'Costo fornitore esterno', def: 1500, unit: '€/mese' },
      { key: 'pctAuto', label: '% attività automatizzate', def: 60, unit: '%' },
    ],
  },
  {
    id: 'dataquality', label: 'Miglioramento data quality', cat: 'strategic',
    formula: '(ore correz. × costo + dec. errate) × % miglioramento × 12',
    fields: [
      { key: 'oreCorrezione', label: 'Ore/mese correzione dati', def: 8, unit: 'h/mese' },
      { key: 'costoOraRuolo', label: 'Costo orario del ruolo', def: 25, unit: '€/h' },
      { key: 'costoDecErrate', label: 'Costo decisioni errate/mese', def: 300, unit: '€/mese' },
      { key: 'pctMiglioramento', label: '% miglioramento atteso', def: 70, unit: '%' },
    ],
  },
  {
    id: 'stress', label: 'Riduzione stress operativo', cat: 'saving',
    formula: 'giorni assenza/anno × costo giornata × persone × % rid.',
    fields: [
      { key: 'giorniAssenza', label: 'Giorni assenza/anno stimati', def: 6, unit: 'giorni/anno' },
      { key: 'costoGiornata', label: 'Costo giornata lavorativa', def: 150, unit: '€/giorno' },
      { key: 'nPersone', label: 'Persone coinvolte', def: 3, unit: 'persone' },
      { key: 'pctRid', label: '% riduzione attesa', def: 50, unit: '%' },
    ],
  },
  {
    id: 'compliance', label: 'Compliance / rischio legale', cat: 'risk',
    formula: 'prob. sanzione × importo × % eliminato',
    fields: [
      { key: 'probSanzione', label: 'Probabilità sanzione/anno', def: 15, unit: '%' },
      { key: 'importoSanzione', label: 'Importo medio sanzione', def: 5000, unit: '€' },
      { key: 'pctEliminato', label: '% rischio eliminato', def: 80, unit: '%' },
    ],
  },
  {
    id: 'opportunitycost', label: 'Opportunity cost liberato', cat: 'strategic',
    formula: 'ore liberate/mese × valore ora × 12',
    fields: [
      { key: 'oreLiberate', label: 'Ore liberate/mese', def: 15, unit: 'h/mese' },
      { key: 'valorOraAlto', label: 'Valore ora ad alto valore', def: 60, unit: '€/h' },
    ],
  },
  {
    id: 'scalabilita', label: 'Scalabilità (avoided cost)', cat: 'strategic',
    formula: 'costo risorsa evitata/mese × prob. crescita × 12',
    fields: [
      { key: 'costoRisorsa', label: 'Costo risorsa evitata', def: 2000, unit: '€/mese' },
      { key: 'probCrescita', label: 'Probabilità crescita 12 mesi', def: 70, unit: '%' },
    ],
  },
  {
    id: 'coordinamento', label: 'Riduzione coordinamento', cat: 'saving',
    formula: 'persone × ore coord./mese × costo orario × % rid. × 12',
    fields: [
      { key: 'nPersone', label: 'Persone nel processo', def: 4, unit: 'persone' },
      { key: 'oreCoord', label: 'Ore coord./mese per persona', def: 3, unit: 'h/mese/pers.' },
      { key: 'costoOraMedio', label: 'Costo orario medio', def: 22, unit: '€/h' },
      { key: 'pctRid', label: '% riduzione attesa', def: 60, unit: '%' },
    ],
  },
  {
    id: 'decisioni', label: 'Qualità decisionale', cat: 'strategic',
    formula: 'valore mensile stimato × 12',
    fields: [
      { key: 'valDec', label: 'Valore mensile stimato', def: 500, unit: '€/mese' },
    ],
  },
] as const

export type MautTypeId = typeof MAUT_TYPES[number]['id']

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  won: 'Vinto',
  lost: 'Perso',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-700',
  won: 'bg-green-50 text-green-700',
  lost: 'bg-red-50 text-red-600',
}

export function calcBrooks(teamSize: number): number {
  const channels = teamSize > 0 ? (teamSize * (teamSize - 1)) / 2 : 0
  return Math.min(channels * 3, 80)
}
