'use client'

import { useState, useEffect } from 'react'
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js'
import { Phone } from 'lucide-react'
import { COUNTRIES, getCountryByCode } from '@/lib/utils/countries'

interface PhoneInputWithCountryProps {
  value: string | null
  onChange: (value: string | null) => void
  phoneCountryCode?: string
  onPhoneCountryChange?: (countryCode: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Componente de input de telefone com seleção independente de país
 * Formata automaticamente o número conforme o país selecionado
 * Armazena o número no formato internacional completo (E.164)
 */
export function PhoneInputWithCountry({
  value,
  onChange,
  phoneCountryCode = 'BR',
  onPhoneCountryChange,
  label = 'Telefone',
  placeholder,
  disabled = false,
  required = false,
}: PhoneInputWithCountryProps) {
  const [localCountry, setLocalCountry] = useState(phoneCountryCode)
  const [displayValue, setDisplayValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Sincroniza o país local com o prop
  useEffect(() => {
    setLocalCountry(phoneCountryCode)
  }, [phoneCountryCode])

  // Formata o valor inicial quando o componente monta ou o valor muda
  useEffect(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value)
        if (parsed) {
          // Se o número já está formatado, use-o
          setDisplayValue(parsed.formatInternational())
          // Atualiza o país se for diferente
          if (parsed.country && parsed.country !== localCountry) {
            setLocalCountry(parsed.country)
            onPhoneCountryChange?.(parsed.country)
          }
        } else {
          setDisplayValue(value)
        }
      } catch {
        setDisplayValue(value)
      }
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleCountryChange = (newCountry: string) => {
    setLocalCountry(newCountry)
    onPhoneCountryChange?.(newCountry)
    setError(null)

    // Se já tem um número, tenta reformatá-lo com o novo país
    if (displayValue) {
      handlePhoneChange(displayValue, newCountry)
    }
  }

  const handlePhoneChange = (inputValue: string, country: string = localCountry) => {
    setError(null)

    if (!inputValue) {
      setDisplayValue('')
      onChange(null)
      return
    }

    try {
      // Remove tudo exceto números e o sinal de +
      let cleanValue = inputValue.replace(/[^\d+]/g, '')

      // Se não começa com +, adiciona o código do país
      if (!cleanValue.startsWith('+')) {
        const countryData = getCountryByCode(country)
        if (countryData) {
          cleanValue = `${countryData.callingCode}${cleanValue}`
        }
      }

      // Usa AsYouType para formatação em tempo real
      const formatter = new AsYouType(country as any)
      const formatted = formatter.input(cleanValue)
      
      setDisplayValue(formatted)

      // Tenta validar e obter o número completo
      if (isValidPhoneNumber(cleanValue, country as any)) {
        const parsed = parsePhoneNumber(cleanValue, country as any)
        if (parsed) {
          // Armazena no formato E.164 (ex: +5511987654321)
          onChange(parsed.number)
        } else {
          onChange(cleanValue)
        }
      } else {
        // Ainda permite a edição, mas não valida
        onChange(cleanValue)
      }
    } catch (err) {
      setDisplayValue(inputValue)
      onChange(inputValue)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    
    // Valida ao sair do campo
    if (displayValue && !isValidPhoneNumber(displayValue, localCountry as any)) {
      setError('Número de telefone inválido para este país')
    } else {
      setError(null)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setError(null)
  }

  const getPlaceholder = () => {
    if (placeholder) return placeholder
    
    const country = getCountryByCode(localCountry)
    if (country) {
      // Retorna apenas o número sem o código do país no placeholder
      const examples: Record<string, string> = {
        'BR': '(11) 98765-4321',
        'US': '(555) 123-4567',
        'ES': '612 34 56 78',
        'IE': '85 123 4567',
        'PT': '912 345 678',
        'FR': '6 12 34 56 78',
        'IT': '312 345 6789',
        'DE': '151 23456789',
        'GB': '7700 900123',
        'AR': '11 2345-6789',
        'MX': '55 1234 5678',
      }
      return examples[localCountry] || '123456789'
    }
    return 'Digite o número'
  }

  const selectedCountry = getCountryByCode(localCountry)

  return (
    <div className="space-y-1">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        <div className="flex items-center gap-2">
          <Phone size={16} />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
      </label>
      
      <div className="flex gap-2">
        {/* Seletor de País */}
        <select
          value={localCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Selecione o país do telefone"
        >
          {COUNTRIES.map(country => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>

        {/* Input de Telefone */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
            {selectedCountry?.callingCode}
          </div>
          <input
            type="tel"
            value={displayValue.replace(selectedCountry?.callingCode || '', '').trim()}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={`w-full pl-16 pr-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : isFocused
                ? 'border-blue-500 focus:ring-blue-500'
                : 'border-gray-300 focus:ring-blue-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      {/* Mensagens de ajuda e erro */}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
      {!error && !isFocused && (
        <p className="text-gray-500 text-xs mt-1">
          Formato: {selectedCountry?.callingCode} + número local
        </p>
      )}
      {!error && isFocused && displayValue && (
        <p className="text-blue-600 text-xs mt-1">
          Será salvo como: {displayValue}
        </p>
      )}
    </div>
  )
}

/**
 * Hook para gerenciar estado de telefone com país
 */
export function usePhoneWithCountry(initialPhone?: string | null, initialCountry: string = 'BR') {
  const [phone, setPhone] = useState<string | null>(initialPhone || null)
  const [phoneCountry, setPhoneCountry] = useState<string>(initialCountry)

  useEffect(() => {
    if (initialPhone) {
      try {
        const parsed = parsePhoneNumber(initialPhone)
        if (parsed && parsed.country) {
          setPhoneCountry(parsed.country)
        }
      } catch {
        // Mantém o país inicial
      }
    }
  }, [initialPhone])

  return {
    phone,
    setPhone,
    phoneCountry,
    setPhoneCountry,
  }
}

/**
 * Formata um número de telefone para exibição
 */
export function formatPhoneForDisplay(phone: string | null): string {
  if (!phone) return '-'
  
  try {
    const parsed = parsePhoneNumber(phone)
    if (parsed) {
      return parsed.formatInternational()
    }
  } catch {
    // Se falhar, retorna o número original
  }
  
  return phone
}

/**
 * Valida se um número de telefone é válido
 */
export function validatePhone(phone: string | null, country?: string): boolean {
  if (!phone) return false
  
  try {
    return isValidPhoneNumber(phone, country as any)
  } catch {
    return false
  }
}

