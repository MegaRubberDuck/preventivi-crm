'use client'

import { useState } from 'react'
import { verifyPassword, type CredentialWithDecryptedValue } from '@/actions/credentials'

interface Props {
  credential: CredentialWithDecryptedValue
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  api_key: 'API Key',
  password: 'Password',
  token: 'Token',
  ftp: 'FTP',
  ssh: 'SSH',
  certificate: 'Certificato',
  webhook_url: 'Webhook URL',
  other: 'Altro',
}

export function CredentialViewModal({ credential, onClose }: Props) {
  const [showValue, setShowValue] = useState(false)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handleVerifyPassword = async () => {
    if (!password) {
      setError('Inserisci la tua password')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const result = await verifyPassword(password)
      
      if (!result.valid) {
        setError(result.error || 'Password errata')
        return
      }

      setShowValue(true)
    } catch (err) {
      setError('Errore nella verifica')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-[#181d26]">Dettaglio Credenziale</h3>
          <button onClick={onClose} className="text-[#181d26]/60 hover:text-[#181d26] text-[20px]">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#181d26]/60 mb-1">Nome</label>
            <p className="text-[14px] text-[#181d26]">{credential.name}</p>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#181d26]/60 mb-1">Tipo</label>
            <p className="text-[14px] text-[#181d26]">{TYPE_LABELS[credential.credential_type] ?? credential.credential_type}</p>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#181d26]/60 mb-1">Valore</label>
            {showValue ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#f8fafc] border border-[#e0e2e6] rounded-[8px] px-3 py-2 font-mono text-[13px] text-[#181d26] overflow-hidden text-ellipsis">
                  {credential.decrypted_value}
                </div>
                <button
                  onClick={() => {
                    setShowValue(false)
                    setPassword('')
                  }}
                  className="px-3 py-2 text-[12px] text-[#64748b] hover:text-[#181d26] whitespace-nowrap"
                >
                  Nascondi
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#f8fafc] border border-[#e0e2e6] rounded-[8px] px-3 py-2 font-mono text-[13px] text-[#181d26]">
                    ••••••••••••••••
                  </div>
                </div>
                <div className="border-t border-[#e0e2e6] pt-3">
                  <p className="text-[12px] text-[#181d26]/60 mb-2">Inserisci la tua password per visualizzare la credenziale</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('')
                      }}
                      placeholder="La tua password"
                      className="flex-1 h-9 px-3 text-[13px] bg-white border border-[#e0e2e6] rounded-[8px] outline-none focus:border-[#1b61c9]"
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                    />
                    <button
                      onClick={handleVerifyPassword}
                      disabled={verifying}
                      className="px-4 h-9 bg-[#1b61c9] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#1b61c9]/90 disabled:opacity-50"
                    >
                      {verifying ? 'Verifica...' : 'Mostra'}
                    </button>
                  </div>
                  {error && (
                    <p className="text-[12px] text-red-600 mt-1">{error}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {credential.url && (
            <div>
              <label className="block text-[12px] font-medium text-[#181d26]/60 mb-1">URL</label>
              <a
                href={credential.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-[#1b61c9] hover:underline break-all"
              >
                {credential.url}
              </a>
            </div>
          )}

          {credential.expires_at && (
            <div>
              <label className="block text-[12px] font-medium text-[#181d26]/60 mb-1">Scadenza</label>
              <p className="text-[14px] text-[#181d26]">
                {new Date(credential.expires_at).toLocaleDateString('it-IT')}
                {new Date(credential.expires_at) < new Date() && (
                  <span className="ml-2 text-red-600 text-[12px]">(scaduta)</span>
                )}
              </p>
            </div>
          )}

          {credential.notes && (
            <div>
              <label className="block text-[12px] font-medium text-[#181d26]/60 mb-1">Note</label>
              <p className="text-[14px] text-[#181d26] whitespace-pre-wrap">{credential.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#e0e2e6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[12px] bg-[#181d26] text-white text-[13px] font-medium hover:bg-[#181d26]/90 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}