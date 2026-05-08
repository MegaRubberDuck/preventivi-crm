'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInAction } from '@/actions/auth'
import { useAuth } from '@/context/AuthContext'

const isValidRedirect = (url: string): boolean => {
  return url.startsWith('/') && !url.startsWith('//') && !url.includes(':')
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || '/'
  const redirect = isValidRedirect(rawRedirect) ? rawRedirect : '/'
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        router.push(redirect)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [user, redirect, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.set('redirect', redirect)

    try {
      const result = await signInAction(formData)
      if (result && 'error' in result) {
        setError(result.error)
      }
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('NEXT_REDIRECT')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[20px] font-semibold text-[#181d26] mb-2">Accesso effettuato!</h2>
          <p className="text-[13px] text-[#181d26]/60">Ti reindirizziamo alla dashboard...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e0e2e6] rounded-[16px] p-8 shadow-sm" style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}>
          <div className="text-center mb-8">
            <img src="/logo_rubberducklab.png" alt="RubberDuckLab" className="h-12 w-auto mx-auto mb-4" />
            <h1 className="text-[20px] font-semibold text-[#181d26]">Accedi</h1>
            <p className="text-[13px] text-[#181d26]/60 mt-1">Inserisci le tue credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-[8px] border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-[#181d26] mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full h-10 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] outline-none focus:border-[#1b61c9] transition-colors"
                placeholder="tua@email.com"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#181d26] mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full h-10 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] outline-none focus:border-[#1b61c9] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#181d26] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#2a3140] transition-colors disabled:opacity-50"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#181d26]/60 mt-4">
          Non hai un account? <span className="text-[#1b61c9]">Contatta l&apos;amministratore</span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-[13px] text-[#181d26]/50">Caricamento...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}