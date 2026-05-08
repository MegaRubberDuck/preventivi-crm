import Link from 'next/link'
import { listClients } from '@/actions/clients'
import { ClientRowActions } from './ClientRowActions'
import { Header } from '@/components/Header'

function fmtDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default async function ClientsPage() {
  const clients = await listClients()

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <main className="max-w-[1280px] mx-auto px-6 py-6 space-y-5">
        <div className="bg-white border border-[#e0e2e6] rounded-[16px] overflow-hidden" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e0e2e6]">
            <span className="text-[13px] font-semibold text-[#181d26]">Clienti</span>
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-[#181d26]/50">{clients.length} totali</span>
              <Link href="/clients/new" className="px-3 py-1.5 bg-[#181d26] text-white text-[12px] font-medium rounded-[6px] hover:bg-[#2a3140] transition-colors">
                Nuovo Cliente
              </Link>
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#181d26]/40">
              Nessun cliente registrato. Clicca su &quot;Nuovo Cliente&quot; per iniziare.
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e0e2e6] bg-[#f8fafc]">
                  {['Nome', 'Azienda', 'Email', 'Tel.', 'Creato', ''].map((h, i) => (
                    <th key={i} className={`text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#181d26]/50 ${h === '' ? 'w-[200px]' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, idx) => (
                  <tr key={c.id} className={`group border-b border-[#e0e2e6] hover:bg-[#f8fafc] transition-colors ${idx === clients.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-[#181d26]">
                      <Link href={`/clients/${c.id}`} className="hover:text-[#1b61c9]">
                        <div className="flex items-center gap-2">
                          {c.name}
                          {!c.is_active && <span className="px-1.5 py-0.5 rounded-[4px] bg-red-100 text-red-600 text-[10px] font-bold">INATTIVO</span>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[#181d26]/60">{c.company ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[#181d26]/60">{c.email ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[#181d26]/60">{c.phone ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[#181d26]/50">{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <ClientRowActions id={c.id} isActive={c.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
