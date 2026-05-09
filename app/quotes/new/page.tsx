import Link from 'next/link'
import { listClients } from '@/actions/clients'
import { WizardShell } from '@/components/quotes/wizard/WizardShell'

interface Props {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewQuotePage({ searchParams }: Props) {
  const params = await searchParams
  let clients: Awaited<ReturnType<typeof listClients>> = []
  let clientsError: string | null = null
  try {
    clients = await listClients()
  } catch (error) {
    console.error('Failed to fetch clients:', error instanceof Error ? error.message : String(error))
    clientsError = 'Failed to load clients'
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Topnav */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e2e6] h-12 flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-7 w-auto" />
          <span className="text-[13px] font-semibold text-[#181d26] tracking-tight">Plancia MRD</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href="/" className="text-[13px] text-[#181d26]/50 hover:text-[#181d26]">Dashboard</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-[13px] font-medium text-[#181d26]">Nuovo preventivo</span>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-6">
        <WizardShell clients={clients} clientsError={clientsError} preselectedClientId={params.clientId} />
      </main>
    </div>
  )
}
