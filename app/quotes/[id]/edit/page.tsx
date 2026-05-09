import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listClients } from '@/actions/clients'
import { getQuote } from '@/actions/quotes'
import { WizardShell } from '@/components/quotes/wizard/WizardShell'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditQuotePage({ params }: Props) {
  const { id } = await params
  const quote = await getQuote(id)
  
  if (!quote) {
    notFound()
  }
  
  const clients = await listClients()

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e2e6] h-12 flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-7 w-auto" />
          <span className="text-[13px] font-semibold text-[#181d26] tracking-tight">Plancia MRD</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href="/" className="text-[13px] text-[#181d26]/50 hover:text-[#181d26]">Dashboard</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <Link href={`/quotes/${id}`} className="text-[13px] text-[#181d26]/50 hover:text-[#181d26]">{quote.title || 'Preventivo'}</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#181d26]/30" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-[13px] font-medium text-[#181d26]">Modifica</span>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-6">
        <WizardShell 
          clients={clients} 
          initialQuote={quote}
        />
      </main>
    </div>
  )
}