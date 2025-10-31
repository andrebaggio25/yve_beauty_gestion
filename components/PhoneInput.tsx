'use client'

import { useState } from 'react'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import { Phone } from 'lucide-react'

interface PhoneInputProps {
  value: string | null
  onChange: (value: string | null) => void
  countryCode: string
  placeholder?: string
  disabled?: boolean
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  placeholder = '+55 11 98765-4321',
  disabled = false,
}: PhoneInputProps) {
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setError(null)

    if (!inputValue) {
      onChange(null)
      return
    }

    try {
      // Try to validate the phone number with the provided country code
      if (isValidPhoneNumber(inputValue, countryCode as any)) {
        const parsed = parsePhoneNumber(inputValue, countryCode as any)
        const formatted = parsed!.formatInternational()
        onChange(formatted)
      } else {
        // Still allow the input, but mark as potentially invalid
        onChange(inputValue)
        setError('Formato de telefone inválido para este país')
      }
    } catch (err) {
      onChange(inputValue)
      setError('Formato de telefone inválido')
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-slate-300 text-sm font-medium">
        <div className="flex items-center gap-2 mb-2">
          <Phone size={16} />
          <span>Telefone</span>
        </div>
      </label>
      <input
        type="tel"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-600 focus:ring-red-500'
            : 'border-slate-700 focus:ring-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
