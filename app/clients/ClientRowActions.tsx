'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { deleteClient, toggleActiveClient } from '@/actions/clients'

function DeleteModal({ onConfirm, onCancel, loading = false, error }: { onConfirm: () => void, onCancel: () => void, loading?: boolean, error?: string | null }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, loading])

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={loading ? undefined : onCancel} role="presentation">
      <div 
        ref={dialogRef}
        className="bg-white rounded-[16px] p-6 max-w-sm w-full mx-4 shadow-xl" 
        onClick={(e) => e.stopPropagation()} 
        role="alertdialog" 
        aria-modal="true" 
        aria-labelledby="delete-modal-title"
        tabIndex={-1}
      >
        <h3 id="delete-modal-title" className="text-[16px] font-semibold text-[#181d26] mb-2">Conferma Eliminazione</h3>
        <p className="text-[13px] text-[#181d26]/70 mb-4">
          Sei sicuro di voler eliminare questo cliente? L&apos;azione è irreversibile.
        </p>
        {error && (
          <p role="alert" className="text-[13px] text-red-600 mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            disabled={loading}
            autoFocus
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

export function ClientRowActions({ id, isActive }: { id: string, isActive: boolean }) {
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  const handleCancel = useCallback(() => {
    setShowDeleteModal(false)
    setDeleteError(null)
    deleteButtonRef.current?.focus()
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    try {
      await toggleActiveClient(id, !isActive)
    } catch (error) {
      console.error('Failed to toggle client status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setLoading(true)
    setDeleteError(null)
    try {
      const result = await deleteClient(id)
      if (result.error) {
        setDeleteError('Impossibile eliminare il cliente. Riprova.')
        deleteButtonRef.current?.focus()
        return
      }
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to delete client:', error)
      setDeleteError('Impossibile eliminare il cliente. Riprova.')
      deleteButtonRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
      {showDeleteModal && (
        <DeleteModal 
          onConfirm={handleDelete} 
          onCancel={handleCancel}
          loading={loading}
          error={deleteError}
        />
      )}
      <button 
        onClick={handleToggle}
        disabled={loading}
        className={`text-[12px] font-medium transition-colors ${isActive ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600'}`}
        title={isActive ? 'Disattiva cliente' : 'Attiva cliente'}
      >
        {isActive ? 'Disattiva' : 'Attiva'}
      </button>
      <div className="w-[1px] h-3 bg-[#e0e2e6]" />
      <Link href={`/clients/${id}?edit=1`} className="text-[12px] text-[#1b61c9] hover:underline font-medium">
        Modifica
      </Link>
      <div className="w-[1px] h-3 bg-[#e0e2e6]" />
      <button ref={deleteButtonRef} onClick={() => setShowDeleteModal(true)} disabled={loading} className="text-[12px] text-red-600 hover:text-red-700 hover:underline font-medium">
        Elimina
      </button>
    </div>
  )
}
