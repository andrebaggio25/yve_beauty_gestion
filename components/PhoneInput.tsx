'use client'

import { useState, useEffect } from 'react'
import { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode } from 'libphonenumber-js'
import { Phone } from 'lucide-react'

interface PhoneInputProps {
  value: string | null
  onChange: (value: string | null) => void
  countryCode: string
  placeholder?: string
  disabled?: boolean
}

const getPlaceholderByCountry = (countryCode: string): string => {
  const placeholders: Record<string, string> = {
    'BR': '+55 11 98765-4321',
    'US': '+1 (555) 123-4567',
    'ES': '+34 612 34 56 78',
    'IE': '+353 85 123 4567',
    'PT': '+351 912 345 678',
    'FR': '+33 6 12 34 56 78',
    'IT': '+39 312 345 6789',
    'DE': '+49 151 23456789',
    'GB': '+44 7700 900123',
    'AR': '+54 9 11 2345-6789',
    'CL': '+56 9 8765 4321',
    'CO': '+57 321 234 5678',
    'MX': '+52 55 1234 5678',
    'PE': '+51 987 654 321',
  }
  return placeholders[countryCode] || '+1 234 567 8900'
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  placeholder,
  disabled = false,
}: PhoneInputProps) {
  const [error, setError] = useState<string | null>(null)
  const [displayValue, setDisplayValue] = useState(value || '')

  useEffect(() => {
    setDisplayValue(value || '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    setError(null)

    if (!inputValue) {
      onChange(null)
      setDisplayValue('')
      return
    }

    // Auto-add country code if not present
    if (!inputValue.startsWith('+')) {
      try {
        const callingCode = getCountryCallingCode(countryCode as any)
        inputValue = `+${callingCode} ${inputValue}`
      } catch (err) {
        // Country code not found, continue
      }
    }

    setDisplayValue(inputValue)

    try {
      // Try to validate and format the phone number
      if (isValidPhoneNumber(inputValue, countryCode as any)) {
        const parsed = parsePhoneNumber(inputValue, countryCode as any)
        const formatted = parsed!.formatInternational()
        onChange(formatted)
        setDisplayValue(formatted)
      } else {
        // Still allow the input for editing
        onChange(inputValue)
      }
    } catch (err) {
      // Allow input even if parsing fails
      onChange(inputValue)
    }
  }

  const handleBlur = () => {
    // Validate on blur
    if (displayValue && !isValidPhoneNumber(displayValue, countryCode as any)) {
      setError('Formato de telefone inválido para este país')
    }
  }

  const actualPlaceholder = placeholder || getPlaceholderByCountry(countryCode)

  return (
    <div className="space-y-1">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        <div className="flex items-center gap-2">
          <Phone size={16} />
          <span>Telefone</span>
        </div>
      </label>
      <input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={actualPlaceholder}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <p className="text-gray-500 text-xs mt-1">Formato internacional com código do país</p>
    </div>
  )
}
