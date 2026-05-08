'use client'

import { useState } from 'react'
import { saveCredential, type CredentialType } from '@/actions/credentials'

interface Props {
  clientId: string
  credential?: {
    id: string
    name: string
    credential_type: CredentialType
    url: string | null
    expires_at: string | null
    notes: string | null
  }
  onCancel: () => void
  onSaved: () => void
}

const CREDENTIAL_TYPES: { value: CredentialType; label: string }[] = [
  { value: 'api_key', label: 'API Key' },
  { value: 'password', label: 'Password' },
  { value: 'token', label: 'Token' },
  { value: 'ftp', label: 'FTP' },
  { value: 'ssh', label: 'SSH' },
  { value: 'certificate', label: 'Certificato' },
  { value: 'webhook_url', label: 'Webhook URL' },
  { value: 'other', label: 'Altro' },
]

export function CredentialForm({ clientId, credential, onCancel, onSaved }: Props) {
  const [name, setName] = useState(credential?.name || '')
  const [credentialType, setCredentialType] = useState<CredentialType>(credential?.credential_type || 'api_key')
  const [value, setValue] = useState('')
  const [url, setUrl] = useState(credential?.url || '')
  const [expiresAt, setExpiresAt] = useState(credential?.expires_at || '')
  const [notes, setNotes] = useState(credential?.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Il nome è obbligatorio')
      return
    }
    if (!value.trim() && !credential?.id) {
      setError('Il valore è obbligatorio')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await saveCredential({
        id: credential?.id,
        client_id: clientId,
        name: name.trim(),
        credential_type: credentialType,
        value: value.trim(),
        url: url.trim() || undefined,
        expires_at: expiresAt || null,
        notes: notes.trim() || undefined,
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        onSaved()
      }
    } catch (err) {
      console.error('Failed to save credential:', err)
      setError('Si è verificato un errore durante il salvataggio')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-[#e0e2e6] rounded-[12px] bg-[#fafbfc]">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-medium text-[#181d26] mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-2 bg-white text-[#181d26] outline-none focus:border-[#1b61c9]"
            placeholder="Es: API Key SendGrid"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#181d26] mb-1">Tipo</label>
          <select
            value={credentialType}
            onChange={(e) => setCredentialType(e.target.value as CredentialType)}
            className="w-full text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-2 bg-white text-[#181d26] outline-none focus:border-[#1b61c9]"
          >
            {CREDENTIAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#181d26] mb-1">Valore</label>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-2 bg-white text-[#181d26] outline-none focus:border-[#1b61c9]"
          placeholder={credential?.id ? 'Lascia vuoto per mantenere il valore attuale' : 'Inserisci il valore'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-medium text-[#181d26] mb-1">URL (opzionale)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-2 bg-white text-[#181d26] outline-none focus:border-[#1b61c9]"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[#181d26] mb-1">Scadenza (opzionale)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-2 bg-white text-[#181d26] outline-none focus:border-[#1b61c9]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-medium text-[#181d26] mb-1">Note (opzionale)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full text-[13px] border border-[#e0e2e6] rounded-[8px] px-3 py-2 bg-white text-[#181d26] outline-none focus:border-[#1b61c9] resize-none"
          placeholder="Note aggiuntive..."
        />
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[13px] text-[#181d26]/70 hover:text-[#181d26] transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 rounded-[12px] bg-[#1b61c9] text-white text-[13px] font-medium hover:bg-[#254fad] transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Salvataggio...' : credential?.id ? 'Aggiorna' : 'Salva'}
        </button>
      </div>
    </form>
  )
}