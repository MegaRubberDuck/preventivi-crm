'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getCurrentUser } from '@/actions/user'
import { signOutAction } from '@/actions/auth'

export function Header() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getCurrentUser().then(user => {
      setUserEmail(user?.email || null)
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to fetch user:', err)
      setError(true)
      setLoading(false)
    })
  }, [])

  const isActive = (path: string) => pathname === path

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e2e6] h-12 flex items-center px-6 gap-6">
        <div className="flex items-center gap-2.5 mr-2">
          <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-7 w-auto" />
          <span className="text-[13px] font-semibold text-[#181d26] tracking-tight">Plancia MRD</span>
        </div>
        <nav className="flex items-center gap-1 text-[13px]">
          <span className="px-3 py-1.5 text-[#181d26]/70">Preventivi</span>
          <span className="px-3 py-1.5 text-[#181d26]/70">Clienti</span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-[#181d26]/50">Caricamento...</span>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e0e2e6] h-12 flex items-center px-6 gap-6">
      <div className="flex items-center gap-2.5 mr-2">
        <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-7 w-auto" />
        <span className="text-[13px] font-semibold text-[#181d26] tracking-tight">Plancia MRD</span>
      </div>
      <nav className="flex items-center gap-1 text-[13px]">
        <Link href="/" aria-current={isActive('/') ? 'page' : undefined} className={`px-3 py-1.5 rounded-[6px] transition-colors ${isActive('/') ? 'bg-[#f0f4ff] text-[#1b61c9] font-medium' : 'text-[#181d26]/70 hover:bg-[#f8fafc] hover:text-[#181d26]'}`}>Preventivi</Link>
        <Link href="/clients" aria-current={isActive('/clients') || pathname.startsWith('/clients/') ? 'page' : undefined} className={`px-3 py-1.5 rounded-[6px] transition-colors ${isActive('/clients') || pathname.startsWith('/clients/') ? 'bg-[#f0f4ff] text-[#1b61c9] font-medium' : 'text-[#181d26]/70 hover:bg-[#f8fafc] hover:text-[#181d26]'}`}>Clienti</Link>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[12px] text-[#181d26] max-w-[200px] truncate" title={userEmail ?? undefined}>
          {userEmail}
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded-[6px] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Esci
          </button>
        </form>
      </div>
    </header>
  )
}