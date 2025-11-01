'use client'

import { useState } from 'react'
import { Mail, Plus, X } from 'lucide-react'

interface MultiEmailInputProps {
  emails: string[]
  onChange: (emails: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  maxEmails?: number
}

/**
 * Componente para gerenciar múltiplos endereços de e-mail
 * Útil para envio automático de faturas para vários destinatários
 */
export function MultiEmailInput({
  emails,
  onChange,
  label = 'E-mails',
  placeholder = 'exemplo@email.com',
  disabled = false,
  required = false,
  maxEmails = 5,
}: MultiEmailInputProps) {
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddEmail = () => {
    setError(null)

    if (!newEmail.trim()) {
      setError('Digite um e-mail')
      return
    }

    if (!validateEmail(newEmail)) {
      setError('E-mail inválido')
      return
    }

    if (emails.includes(newEmail.toLowerCase())) {
      setError('Este e-mail já foi adicionado')
      return
    }

    if (emails.length >= maxEmails) {
      setError(`Máximo de ${maxEmails} e-mails permitidos`)
      return
    }

    onChange([...emails, newEmail.toLowerCase()])
    setNewEmail('')
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    onChange(emails.filter(email => email !== emailToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddEmail()
    }
  }

  const isPrimary = (index: number) => index === 0

  return (
    <div className="space-y-2">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        <div className="flex items-center gap-2">
          <Mail size={16} />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
      </label>

      {/* Lista de e-mails adicionados */}
      {emails.length > 0 && (
        <div className="space-y-2 mb-3">
          {emails.map((email, index) => (
            <div
              key={email}
              className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 flex-1">
                <Mail size={14} className="text-blue-600" />
                <span className="text-sm text-gray-900">{email}</span>
                {isPrimary(index) && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    Principal
                  </span>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Remover e-mail"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input para adicionar novo e-mail */}
      {emails.length < maxEmails && !disabled && (
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value)
                setError(null)
              }}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={handleAddEmail}
            disabled={disabled || !newEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Adicionar e-mail"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      )}

      {/* Mensagens de erro e ajuda */}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      
      {!error && emails.length === 0 && (
        <p className="text-gray-500 text-xs mt-1">
          {required ? 'Adicione pelo menos um e-mail' : 'Nenhum e-mail adicionado'}
        </p>
      )}
      
      {!error && emails.length > 0 && emails.length < maxEmails && (
        <p className="text-gray-500 text-xs mt-1">
          {isPrimary(0) && 'O primeiro e-mail é o principal. '}
          Você pode adicionar até {maxEmails - emails.length} e-mail(s) adicional(is).
        </p>
      )}
      
      {emails.length >= maxEmails && (
        <p className="text-orange-600 text-xs mt-1">
          Limite de {maxEmails} e-mails atingido
        </p>
      )}
    </div>
  )
}

/**
 * Hook para gerenciar estado de múltiplos e-mails
 */
export function useMultiEmail(initialEmails: string[] = []) {
  const [emails, setEmails] = useState<string[]>(initialEmails)

  const addEmail = (email: string) => {
    if (!emails.includes(email.toLowerCase())) {
      setEmails([...emails, email.toLowerCase()])
    }
  }

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const clearEmails = () => {
    setEmails([])
  }

  const getPrimaryEmail = () => {
    return emails[0] || null
  }

  const getSecondaryEmails = () => {
    return emails.slice(1)
  }

  return {
    emails,
    setEmails,
    addEmail,
    removeEmail,
    clearEmails,
    getPrimaryEmail,
    getSecondaryEmails,
  }
}

