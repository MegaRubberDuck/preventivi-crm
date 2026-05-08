'use client'

import { useState } from 'react'

interface Props {
  value: string
  onChange: (d: string) => void
}

export function Step4Technical({ value, onChange }: Props) {
  return (
    <div className="p-5 space-y-4">
      <div>
        <div className="text-[13px] font-semibold text-[#181d26] mb-2">Descrizione tecnica del progetto</div>
        <div className="text-[12px] text-[#181d26]/50 mb-3">
          Inserisci una descrizione tecnica dettagliata delle componenti e dell'architettura del progetto. 
          Questa sezione verrà inclusa nel preventivo per fornire al cliente una panoramica completa dello scope tecnico.
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Esempio:

Architettura del sistema:
- Backend: Node.js con Express
- Database: PostgreSQL
- Frontend: Next.js

Componenti principali:
1. Modulo autenticazione JWT
2. API REST per gestione clienti
3. Dashboard admin in React

Tecnologie:
- Node.js v20
- PostgreSQL 15
- React 18`}
          className="w-full h-[400px] text-[13px] font-mono text-[#181d26] border border-[#e0e2e6] rounded-[12px] p-4 bg-white resize-none outline-none focus:border-[#1b61c9]"
        />
        <div className="text-[11px] text-[#181d26]/40 mt-1 text-right">
          {value.length} caratteri
        </div>
      </div>
    </div>
  )
}