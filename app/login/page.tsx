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
  const [showPassword, setShowPassword] = useState(false)

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
        setError(String(result.error))
      } else if (result && 'success' in result) {
        setShowSuccess(true)
        setTimeout(() => router.push(result.redirectTo || '/'), 800)
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
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#181d26] mb-1">Accesso effettuato!</p>
          <p className="text-[12px] text-[#181d26]/50">Reindirizzamento alla dashboard...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-4 h-4 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px]">

        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo_rubberducklab.png"
            alt="Plancia MRD"
            className="h-14 w-auto mb-3"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.onerror = null
              t.src = '/logo.png'
            }}
          />
          <h1 className="text-[15px] font-semibold text-[#181d26] tracking-tight">Plancia MRD</h1>
          <p className="text-[12px] text-[#181d26]/50 mt-0.5">Accedi per continuare</p>
        </div>

        {/* Card */}
        <div
          className="bg-white border border-[#e0e2e6] rounded-[16px] p-6"
          style={{ boxShadow: 'rgba(15,48,106,0.05) 0px 0px 20px' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-[8px]">
                <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[12px] text-red-600">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full h-9 px-3 text-[13px] text-[#181d26] bg-white border border-[#e0e2e6] rounded-[8px] outline-none placeholder:text-[#181d26]/30 focus:border-[#1b61c9] transition-colors"
                placeholder="tua@email.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#181d26]/50 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full h-9 pl-3 pr-9 text-[13px] text-[#181d26] bg-white border border-[#e0e2e6] rounded-[8px] outline-none placeholder:text-[#181d26]/30 focus:border-[#1b61c9] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#181d26]/30 hover:text-[#181d26]/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 mt-1 bg-[#1b61c9] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#254fad] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: 'rgba(45,127,249,0.28) 0px 1px 3px' }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#181d26]/40 mt-4">
          Non hai un account?{' '}
          <span className="text-[#1b61c9] hover:underline cursor-pointer">
            Contatta l&apos;amministratore
          </span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-[#1b61c9] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
