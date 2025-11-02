'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'

type TaxIdType = 'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'

interface TaxIdInputProps {
  value: string | null
  onChange: (value: string | null) => void
  taxIdType: TaxIdType
  onTaxIdTypeChange: (type: TaxIdType) => void
  countryCode: string
  disabled?: boolean
}

const TAX_ID_PATTERNS: Record<string, Record<TaxIdType, RegExp>> = {
  'US': {
    'EIN': /^\d{2}-\d{7}$/,
    'VAT': /^$/,
    'NIF': /^$/,
    'CNPJ': /^$/,
    'OTHER': /.*/,
  },
  'BR': {
    'EIN': /^$/,
    'VAT': /^$/,
    'NIF': /^$/,
    'CNPJ': /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    'OTHER': /.*/,
  },
  'ES': {
    'EIN': /^$/,
    'VAT': /^[A-Z]{1}\d{7}[A-Z0-9]{1}$/,
    'NIF': /^[0-9]{8}[A-Z]$/,
    'CNPJ': /^$/,
    'OTHER': /.*/,
  },
  'IE': {
    'EIN': /^$/,
    'VAT': /^IE\d{9}$/,
    'NIF': /^[0-9]{7}[A-Z]{1}$/,
    'CNPJ': /^$/,
    'OTHER': /.*/,
  },
}

const TAX_ID_TYPES: Record<string, TaxIdType[]> = {
  'US': ['EIN', 'OTHER'],
  'BR': ['CNPJ', 'OTHER'],
  'ES': ['VAT', 'NIF', 'OTHER'],
  'IE': ['VAT', 'NIF', 'OTHER'],
  'OTHER': ['OTHER'],
}

export function TaxIdInput({
  value,
  onChange,
  taxIdType,
  onTaxIdTypeChange,
  countryCode,
  disabled = false,
}: TaxIdInputProps) {
  const [error, setError] = useState<string | null>(null)

  const getAvailableTypes = (): TaxIdType[] => {
    return TAX_ID_TYPES[countryCode] || TAX_ID_TYPES['OTHER']
  }

  const validateTaxId = (input: string, type: TaxIdType): boolean => {
    if (!input) return true
    const patterns = TAX_ID_PATTERNS[countryCode] || TAX_ID_PATTERNS['OTHER']
    const pattern = patterns[type]
    return pattern ? pattern.test(input) : true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setError(null)

    if (!inputValue) {
      onChange(null)
      return
    }

    if (validateTaxId(inputValue, taxIdType)) {
      onChange(inputValue)
    } else {
      setError(`Formato de ${taxIdType} inválido para ${countryCode}`)
      onChange(inputValue)
    }
  }

  const availableTypes = getAvailableTypes()

  return (
    <div className="space-y-2">
      <label className="block text-gray-600 text-sm font-medium">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-gray-500" />
          <span>Identificação Fiscal</span>
        </div>
      </label>

      <div className="flex gap-2">
        <select
          value={taxIdType}
          onChange={(e) => {
            onTaxIdTypeChange(e.target.value as TaxIdType)
            setError(null)
          }}
          disabled={disabled || availableTypes.length === 1}
          className={`px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={value || ''}
          onChange={handleChange}
          placeholder={`Ex: ${countryCode === 'US' ? '12-3456789' : 'XX.XXX.XXX/XXXX-XX'}`}
          disabled={disabled}
          className={`flex-1 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-600 focus:ring-red-500'
              : 'focus:ring-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
