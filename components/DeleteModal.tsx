'use client'

import { useEffect, useId } from 'react'

interface Props {
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function DeleteModal({ title = 'Conferma Eliminazione', message, onConfirm, onCancel, loading = false }: Props) {
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, loading])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={loading ? undefined : onCancel} role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-white rounded-[16px] p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-[16px] font-semibold text-[#181d26] mb-2">{title}</h3>
        <p id={descId} className="text-[13px] text-[#181d26]/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            autoFocus
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-[#181d26] bg-[#f8fafc] border border-[#e0e2e6] rounded-[8px] hover:bg-[#f0f4ff] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annulla
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 rounded-[8px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  )
}