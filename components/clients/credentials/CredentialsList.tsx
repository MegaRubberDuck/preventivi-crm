'use client'

import { useState } from 'react'
import { deleteCredential, getClientCredentials, getCredentialById, type CredentialListItem, type CredentialType, type CredentialWithDecryptedValue } from '@/actions/credentials'
import { CredentialForm } from './CredentialForm'
import { CredentialViewModal } from './CredentialViewModal'
import { DeleteModal } from '@/components/DeleteModal'

interface Props {
  clientId: string
  initialCredentials?: CredentialListItem[]
}

const TYPE_LABELS: Record<CredentialType, string> = {
  api_key: 'API Key',
  password: 'Password',
  token: 'Token',
  ftp: 'FTP',
  ssh: 'SSH',
  certificate: 'Certificato',
  webhook_url: 'Webhook URL',
  other: 'Altro',
}

export function CredentialsList({ clientId, initialCredentials = [] }: Props) {
  const [credentials, setCredentials] = useState<CredentialListItem[]>(initialCredentials)
  const [showForm, setShowForm] = useState(false)
  const [editingCredential, setEditingCredential] = useState<CredentialListItem | null>(null)
  const [viewingCredential, setViewingCredential] = useState<CredentialWithDecryptedValue | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const data = await getClientCredentials(clientId)
      setCredentials(data)
    } catch (error) {
      console.error('Failed to load credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingCredential(null)
    loadCredentials()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeletingLoading(true)
    try {
      const result = await deleteCredential(deletingId, clientId)
      if ('success' in result) {
        setDeletingId(null)
        loadCredentials()
      } else {
        console.error('Delete failed:', result)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleView = async (id: string) => {
    const full = await getCredentialById(id)
    setViewingCredential(full)
  }

  const isExpired = (date: string | null): boolean => {
    if (!date) return false
    const d = new Date(date)
    const today = new Date()
    const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dDateOnly < todayDateOnly
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    const d = new Date(date)
    if (isExpired(date)) return `Scaduto ${d.toLocaleDateString('it-IT')}`
    return d.toLocaleDateString('it-IT')
  }

  if (loading) {
    return <div className="text-[13px] text-[#181d26]/60 py-4">Caricamento...</div>
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-[#181d26] text-white text-[12px] font-medium rounded-[6px] hover:bg-[#2a3140] transition-colors"
          >
            + Nuova Credenziale
          </button>
        </div>
      )}

      {showForm && (
        <CredentialForm
          clientId={clientId}
          credential={editingCredential || undefined}
          onCancel={() => {
            setShowForm(false)
            setEditingCredential(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {credentials.length === 0 && !showForm ? (
        <div className="text-[13px] text-[#181d26]/60 py-8 text-center">
          Nessuna credenziale associata a questo cliente
        </div>
      ) : !showForm && (
        <div className="border border-[#e0e2e6] rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-[#e0e2e6]">
              <tr>
                <th className="text-left text-[12px] font-medium text-[#181d26] px-4 py-3">Nome</th>
                <th className="text-left text-[12px] font-medium text-[#181d26] px-4 py-3">Tipo</th>
                <th className="text-left text-[12px] font-medium text-[#181d26] px-4 py-3">URL</th>
                <th className="text-left text-[12px] font-medium text-[#181d26] px-4 py-3">Scadenza</th>
                <th className="text-right text-[12px] font-medium text-[#181d26] px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((cred) => (
                <tr key={cred.id} className="border-b border-[#e0e2e6] last:border-0 hover:bg-[#fafbfc]">
                  <td className="text-[13px] text-[#181d26] px-4 py-3 font-medium">{cred.name}</td>
                  <td className="text-[13px] text-[#181d26] px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-[6px] bg-[#e8f0fe] text-[#1b61c9] text-[11px]">
                      {TYPE_LABELS[cred.credential_type]}
                    </span>
                  </td>
                  <td className="text-[13px] text-[#181d26]/70 px-4 py-3">
                    {cred.url ? (
                      <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-[#1b61c9] hover:underline truncate block max-w-[150px]">
                        {cred.url}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-[13px] text-[#181d26] px-4 py-3">
                    <span className={isExpired(cred.expires_at) ? 'text-red-600' : ''}>
                      {formatDate(cred.expires_at)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => handleView(cred.id)}
                        className="text-[12px] text-[#1b61c9] hover:underline"
                      >
                        Visualizza
                      </button>
                      <button
                        onClick={() => {
                          setEditingCredential(cred)
                          setShowForm(true)
                        }}
                        className="text-[12px] text-[#181d26]/70 hover:text-[#181d26]"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => setDeletingId(cred.id)}
                        className="text-[12px] text-red-600 hover:text-red-700"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingCredential && (
        <CredentialViewModal
          credential={viewingCredential}
          onClose={() => setViewingCredential(null)}
        />
      )}

      {deletingId && (
        <DeleteModal
          title="Elimina credenziale"
          message="Sei sicuro di voler eliminare questa credenziale? L'operazione non può essere annullata."
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
          loading={deletingLoading}
        />
      )}
    </div>
  )
}