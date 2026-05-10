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

export const CLIENT_TYPES = [
  { id: 'pmi',        label: 'PMI italiana' },
  { id: 'startup',    label: 'Startup' },
  { id: 'prof',       label: 'Professionista' },
  { id: 'enterprise', label: 'Enterprise' },
] as const

export const RP_TYPES = [
  {
    id: 'cl', label: 'C_L — Costo lavoro', formula: 'FTE × Loaded Rate × ore annue',
    fields: [
      { key: 'fte',  label: 'FTE',            def: 1,    unit: 'persone' },
      { key: 'rate', label: 'Loaded Rate €/h', def: 35,   unit: '€/h' },
      { key: 'ore',  label: 'Ore annue',       def: 1760, unit: 'h/anno' },
    ],
  },
  {
    id: 'cf', label: 'C_F — Attrito / qualità', formula: 'N. errori × Costo ripristino',
    fields: [
      { key: 'n', label: 'Errori/anno',      def: 60,  unit: 'eventi' },
      { key: 'c', label: 'Costo ripristino', def: 200, unit: '€/evento' },
    ],
  },
  {
    id: 'ct', label: 'C_T — Tecnologia legacy', formula: 'Licenze/manutenzione da dismettere',
    fields: [
      { key: 'v', label: 'Costo annuo', def: 2400, unit: '€/anno' },
    ],
  },
  {
    id: 'co', label: 'C_O — Costo opportunità', formula: 'Reclutamento annualizzato (una tantum / mesi × 12)',
    fields: [
      { key: 'recr', label: 'Costo una tantum', def: 8000, unit: '€' },
      { key: 'mesi', label: 'Ammortamento',     def: 24,   unit: 'mesi' },
    ],
  },
  {
    id: 'rp_a', label: 'RP Altro', formula: 'Valore annuo manuale',
    fields: [
      { key: 'v', label: 'Valore annuo', def: 0, unit: '€/anno' },
    ],
  },
] as const

export const VDP_TYPES = [
  {
    id: 'prod', label: 'Recupero Produttività', formula: '(Ore manuali − Ore AI) × Loaded Rate × 12',
    fields: [
      { key: 'a', label: 'Ore manuali/mese',  def: 40, unit: 'h/mese' },
      { key: 'b', label: 'Ore AI/mese',        def: 5,  unit: 'h/mese' },
      { key: 'r', label: 'Loaded Rate',         def: 35, unit: '€/h' },
    ],
  },
  {
    id: 'overhead', label: 'Riduzione Overhead Gestionale', formula: '(Supervisione AS-IS − TO-BE) × Rate Manager × 12',
    fields: [
      { key: 'a', label: 'Ore supervisione/mese AS-IS', def: 10, unit: 'h' },
      { key: 'b', label: 'Ore supervisione/mese TO-BE', def: 2,  unit: 'h' },
      { key: 'r', label: 'Rate Manager €/h',            def: 50, unit: '€/h' },
    ],
  },
  {
    id: 'terzisti', label: 'Eliminazione Costi Terzisti', formula: 'Risparmio outsourcing annuo',
    fields: [
      { key: 'v', label: 'Costo terzisti/anno', def: 12000, unit: '€/anno' },
    ],
  },
  {
    id: 'rework', label: 'Abbattimento Rework', formula: 'Errori/mese × Ore/errore × Loaded Rate × % riduzione × 12',
    fields: [
      { key: 'n', label: 'Errori/mese',    def: 10,  unit: 'eventi' },
      { key: 't', label: 'Ore/errore',     def: 1.5, unit: 'h' },
      { key: 'r', label: 'Loaded Rate',    def: 35,  unit: '€/h' },
      { key: 'p', label: '% riduzione',    def: 80,  unit: '%' },
    ],
  },
  {
    id: 'compliance', label: 'Compliance & Risk Avoidance', formula: 'Prob. sanzione × Valore × % rischio eliminato',
    fields: [
      { key: 'p', label: 'Prob. sanzione/anno (0–1)', def: 0.15,  unit: '0–1' },
      { key: 'v', label: 'Valore sanzione',           def: 10000, unit: '€' },
      { key: 'e', label: '% rischio eliminato',       def: 80,    unit: '%' },
    ],
  },
  {
    id: 'continuity', label: 'Business Continuity 24/7', formula: 'Ore indisponibilità umana/anno × Loaded Rate',
    fields: [
      { key: 'ore', label: 'Ore indisponibilità/anno', def: 480, unit: 'h/anno' },
      { key: 'r',   label: 'Loaded Rate',              def: 35,  unit: '€/h' },
    ],
  },
  {
    id: 'throughput', label: 'Incremento Throughput', formula: 'Δ unità/anno × Margine unitario',
    fields: [
      { key: 'd', label: 'Δ unità/anno',       def: 50,  unit: 'unità' },
      { key: 'm', label: 'Margine unitario',   def: 200, unit: '€/unità' },
    ],
  },
  {
    id: 'latenza', label: 'Riduzione Latenza / Conversione', formula: 'Δ% conversione × Valore deal × Volume lead/anno',
    fields: [
      { key: 'dc',  label: 'Δ conversione (es. 0.02)', def: 0.02, unit: 'decimale' },
      { key: 'dv',  label: 'Valore medio deal',         def: 2000, unit: '€' },
      { key: 'vol', label: 'Lead/anno',                 def: 200,  unit: 'lead' },
    ],
  },
  {
    id: 'scalabilita', label: 'Scalabilità Marginale', formula: 'Costo assunzione evitata × probabilità crescita',
    fields: [
      { key: 'c', label: 'Costo assunzione',        def: 30000, unit: '€' },
      { key: 'p', label: 'Probabilità crescita (0–1)', def: 0.7, unit: '0–1' },
    ],
  },
  {
    id: 'knowhow', label: 'Codificazione Know-how', formula: 'RAL personale key × % know-how codificato',
    fields: [
      { key: 'ral', label: 'RAL personale key',      def: 35000, unit: '€/anno' },
      { key: 'p',   label: '% know-how codificato', def: 60,    unit: '%' },
    ],
  },
  {
    id: 'dataenrich', label: 'Data Enrichment & Insights', formula: 'Ore analisi evitate/mese × Rate analista × 12',
    fields: [
      { key: 'ore', label: 'Ore analisi/mese', def: 8,  unit: 'h/mese' },
      { key: 'r',   label: 'Rate analista',    def: 60, unit: '€/h' },
    ],
  },
  {
    id: 'turnover', label: 'Riduzione Turnover', formula: 'RAL × 30% × N. persone × % riduzione turnover',
    fields: [
      { key: 'ral', label: 'RAL media',             def: 28000, unit: '€/anno' },
      { key: 'n',   label: 'Persone a rischio',     def: 2,     unit: 'persone' },
      { key: 'p',   label: '% riduzione turnover',  def: 40,    unit: '%' },
    ],
  },
  {
    id: 'onboarding', label: 'Riduzione Onboarding', formula: 'Ore risparmiate × Costo HR × Assunzioni/anno',
    fields: [
      { key: 'ore', label: 'Ore risparmiate/persona', def: 16, unit: 'h' },
      { key: 'r',   label: 'Costo orario HR',         def: 30, unit: '€/h' },
      { key: 'ass', label: 'Assunzioni/anno',          def: 3,  unit: 'persone' },
    ],
  },
  {
    id: 'ttm', label: 'Accelerazione Time-to-Market', formula: 'Settimane risparmiate × Margine operativo/sett.',
    fields: [
      { key: 's', label: 'Settimane risparmiate', def: 4,    unit: 'settimane' },
      { key: 'm', label: 'Margine/settimana',     def: 1500, unit: '€/sett' },
    ],
  },
  {
    id: 'circolante', label: 'Riduzione Capitale Circolante', formula: 'Crediti medi × (giorni risparmiati/365) × costo capitale',
    fields: [
      { key: 'cr', label: 'Crediti medi',          def: 50000, unit: '€' },
      { key: 'g',  label: 'Giorni risparmiati',    def: 10,    unit: 'giorni' },
      { key: 'cc', label: 'Costo capitale %',      def: 8,     unit: '%' },
    ],
  },
  {
    id: 'vdp_a', label: 'VDP Altro', formula: 'Valore annuo manuale',
    fields: [
      { key: 'v', label: 'Valore annuo', def: 0, unit: '€/anno' },
    ],
  },
] as const

export const VDN_TYPES = [
  {
    id: 'api', label: 'Consumo API / Token', formula: 'Task/mese × Token/task × Costo/1K × 12',
    fields: [
      { key: 't',   label: 'Task/mese',     def: 1000,  unit: 'task' },
      { key: 'tok', label: 'Token/task',    def: 500,   unit: 'token' },
      { key: 'c',   label: 'Costo/1K token', def: 0.002, unit: '€' },
    ],
  },
  {
    id: 'hosting', label: 'Hosting / Cloud', formula: 'Costo mensile × 12',
    fields: [
      { key: 'm', label: 'Costo mensile', def: 50, unit: '€/mese' },
    ],
  },
  {
    id: 'manutenzione', label: 'Manutenzione SLA', formula: 'Canone annuo supporto',
    fields: [
      { key: 'v', label: 'Canone annuo', def: 4800, unit: '€/anno' },
    ],
  },
  {
    id: 'formazione', label: 'Formazione cliente', formula: 'N. persone × Ore × Loaded Rate',
    fields: [
      { key: 'np',  label: 'N. persone',   def: 3,  unit: 'persone' },
      { key: 'ore', label: 'Ore/persona',  def: 8,  unit: 'h' },
      { key: 'r',   label: 'Loaded Rate',  def: 35, unit: '€/h' },
    ],
  },
  {
    id: 'setup', label: 'Integrazione & Setup', formula: 'Costo una tantum / 36 × 12',
    fields: [
      { key: 'v', label: 'Costo una tantum', def: 500, unit: '€' },
    ],
  },
  {
    id: 'migrazione', label: 'Migrazione Dati', formula: 'Ore migrazione × Costo risorsa',
    fields: [
      { key: 'ore', label: 'Ore migrazione', def: 10, unit: 'h' },
      { key: 'r',   label: 'Costo risorsa', def: 35, unit: '€/h' },
    ],
  },
  {
    id: 'friction', label: 'Costo Cambiamento', formula: '% perdita efficienza × Ore/mese × Loaded Rate × mesi transizione',
    fields: [
      { key: 'p',   label: '% perdita efficienza', def: 20,  unit: '%' },
      { key: 'ore', label: 'Ore lavoro/mese',      def: 160, unit: 'h' },
      { key: 'r',   label: 'Loaded Rate',           def: 35,  unit: '€/h' },
      { key: 'm',   label: 'Mesi transizione',      def: 2,   unit: 'mesi' },
    ],
  },
  {
    id: 'vdn_a', label: 'VDN Altro', formula: 'Valore annuo manuale',
    fields: [
      { key: 'v', label: 'Valore annuo', def: 0, unit: '€/anno' },
    ],
  },
] as const

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

// MAUT types — IDs, field names and defaults match exactly giammario_v8.html
export const MAUT_TYPES = [
  {
    id: 'ore_pers', label: 'Risparmio ore personale', cat: 'saving',
    formula: 'ore/mese × costo orario × 12',
    fields: [
      { key: 'ore', label: 'Ore/mese',     def: 20, unit: 'h' },
      { key: 'r',   label: 'Costo orario', def: 25, unit: '€/h' },
    ],
  },
  {
    id: 'fatturato', label: 'Aumento fatturato', cat: 'revenue',
    formula: 'fatturato extra/mese × % attribuibile × 12',
    fields: [
      { key: 'fat', label: 'Fatturato extra/mese', def: 3000, unit: '€' },
      { key: 'p',   label: '% attribuibile',       def: 40,   unit: '%' },
    ],
  },
  {
    id: 'errori', label: 'Riduzione errori/ops', cat: 'saving',
    formula: 'costo errore × errori/mese × % riduzione × 12',
    fields: [
      { key: 'c', label: 'Costo errore',  def: 300, unit: '€' },
      { key: 'n', label: 'Errori/mese',   def: 5,   unit: 'eventi' },
      { key: 'p', label: '% riduzione',   def: 80,  unit: '%' },
    ],
  },
  {
    id: 'rework', label: 'Abbattimento rework', cat: 'saving',
    formula: 'ore rework/mese × costo orario × % riduzione × 12',
    fields: [
      { key: 'ore', label: 'Ore rework/mese', def: 8,  unit: 'h' },
      { key: 'r',   label: 'Costo orario',    def: 30, unit: '€/h' },
      { key: 'p',   label: '% riduzione',     def: 75, unit: '%' },
    ],
  },
  {
    id: 'churn', label: 'Riduzione churn', cat: 'revenue',
    formula: 'clienti salvati/mese × LTV × 12',
    fields: [
      { key: 'cli', label: 'Clienti salvati/mese', def: 2,   unit: 'clienti' },
      { key: 'ltv', label: 'LTV medio',            def: 800, unit: '€' },
    ],
  },
  {
    id: 'outsourcing', label: 'Riduzione outsourcing', cat: 'saving',
    formula: 'costo fornitore/mese × % automatizzata × 12',
    fields: [
      { key: 'c', label: 'Costo fornitore/mese', def: 1500, unit: '€' },
      { key: 'p', label: '% automatizzata',      def: 60,   unit: '%' },
    ],
  },
  {
    id: 'coordinamento', label: 'Riduzione coordinamento', cat: 'saving',
    formula: 'persone × ore/mese/persona × costo orario × % riduzione × 12',
    fields: [
      { key: 'np',  label: 'Persone',            def: 4,  unit: 'persone' },
      { key: 'ore', label: 'Ore/mese/persona',   def: 3,  unit: 'h' },
      { key: 'r',   label: 'Costo orario',       def: 22, unit: '€/h' },
      { key: 'p',   label: '% riduzione',        def: 60, unit: '%' },
    ],
  },
  {
    id: 'opportunity', label: 'Opportunity cost', cat: 'strategic',
    formula: 'ore liberate/mese × valore orario × 12',
    fields: [
      { key: 'ore', label: 'Ore liberate/mese',        def: 15, unit: 'h' },
      { key: 'v',   label: 'Valore orario alto valore', def: 60, unit: '€/h' },
    ],
  },
  {
    id: 'scalabilita', label: 'Valore scalabilità', cat: 'strategic',
    formula: 'costo risorsa evitata/mese × prob. crescita × 12',
    fields: [
      { key: 'c', label: 'Costo risorsa evitata/mese', def: 2000, unit: '€' },
      { key: 'p', label: 'Prob. crescita (0–1)',       def: 0.7,  unit: '0–1' },
    ],
  },
  {
    id: 'compliance', label: 'Compliance / rischio', cat: 'risk',
    formula: 'prob. sanzione × importo × % eliminato',
    fields: [
      { key: 'p',   label: 'Prob. sanzione (0–1)', def: 0.15, unit: '0–1' },
      { key: 'imp', label: 'Importo sanzione',     def: 5000, unit: '€' },
      { key: 'e',   label: '% eliminato',          def: 80,   unit: '%' },
    ],
  },
  {
    id: 'onboarding', label: 'Riduzione onboarding', cat: 'saving',
    formula: 'ore risparmiate/persona × costo HR × assunzioni/anno',
    fields: [
      { key: 'ore', label: 'Ore risparmiate/persona', def: 16, unit: 'h' },
      { key: 'r',   label: 'Costo orario HR',         def: 30, unit: '€/h' },
      { key: 'ass', label: 'Assunzioni/anno',          def: 3,  unit: 'persone' },
    ],
  },
  {
    id: 'ttm', label: 'Accelerazione time-to-market', cat: 'strategic',
    formula: 'settimane risparmiate × margine/settimana',
    fields: [
      { key: 's', label: 'Settimane risparmiate', def: 4,    unit: 'sett.' },
      { key: 'm', label: 'Margine/settimana',     def: 1500, unit: '€/sett' },
    ],
  },
  {
    id: 'circolante', label: 'Riduzione capitale circolante', cat: 'strategic',
    formula: 'crediti medi × (giorni risparmiati/365) × costo capitale',
    fields: [
      { key: 'cr', label: 'Crediti medi',       def: 50000, unit: '€' },
      { key: 'g',  label: 'Giorni risparmiati', def: 10,    unit: 'giorni' },
      { key: 'cc', label: 'Costo capitale %',   def: 8,     unit: '%' },
    ],
  },
  {
    id: 'maut_a', label: 'Altro', cat: 'strategic',
    formula: 'valore annuo manuale',
    fields: [
      { key: 'v', label: 'Valore annuo', def: 0, unit: '€/anno' },
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
