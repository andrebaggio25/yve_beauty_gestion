/**
 * Tipos de identificação fiscal por país
 * Cada país tem seus próprios tipos de documentos fiscais
 */

export interface TaxIdOption {
  value: string
  label: string
  description: string
  mask?: string // Máscara de formatação (opcional)
}

export interface CountryTaxIds {
  country: string
  taxIds: TaxIdOption[]
}

/**
 * Mapeamento de tipos de identificação fiscal por país
 */
export const TAX_ID_TYPES_BY_COUNTRY: Record<string, TaxIdOption[]> = {
  // Brasil
  BR: [
    { 
      value: 'CNPJ', 
      label: 'CNPJ', 
      description: 'Cadastro Nacional da Pessoa Jurídica (Empresa)',
      mask: '99.999.999/9999-99'
    },
    { 
      value: 'CPF', 
      label: 'CPF', 
      description: 'Cadastro de Pessoa Física (Individual)',
      mask: '999.999.999-99'
    },
  ],
  
  // Estados Unidos
  US: [
    { 
      value: 'EIN', 
      label: 'EIN', 
      description: 'Employer Identification Number (Business)',
      mask: '99-9999999'
    },
    { 
      value: 'SSN', 
      label: 'SSN', 
      description: 'Social Security Number (Individual)',
      mask: '999-99-9999'
    },
  ],
  
  // Espanha
  ES: [
    { 
      value: 'NIF', 
      label: 'NIF', 
      description: 'Número de Identificación Fiscal (Empresa)',
    },
    { 
      value: 'NIE', 
      label: 'NIE', 
      description: 'Número de Identidad de Extranjero',
    },
    { 
      value: 'CIF', 
      label: 'CIF', 
      description: 'Código de Identificación Fiscal (Empresa)',
    },
  ],
  
  // Portugal
  PT: [
    { 
      value: 'NIPC', 
      label: 'NIPC', 
      description: 'Número de Identificação de Pessoa Coletiva (Empresa)',
    },
    { 
      value: 'NIF', 
      label: 'NIF', 
      description: 'Número de Identificação Fiscal (Individual)',
    },
  ],
  
  // Irlanda
  IE: [
    { 
      value: 'VAT', 
      label: 'VAT Number', 
      description: 'Value Added Tax Number (Business)',
    },
    { 
      value: 'PPS', 
      label: 'PPS Number', 
      description: 'Personal Public Service Number (Individual)',
    },
  ],
  
  // Reino Unido
  GB: [
    { 
      value: 'VAT', 
      label: 'VAT Number', 
      description: 'Value Added Tax Number (Business)',
    },
    { 
      value: 'UTR', 
      label: 'UTR', 
      description: 'Unique Taxpayer Reference',
    },
    { 
      value: 'NINO', 
      label: 'NINO', 
      description: 'National Insurance Number (Individual)',
    },
  ],
  
  // França
  FR: [
    { 
      value: 'SIRET', 
      label: 'SIRET', 
      description: 'Système d\'Identification du Répertoire des Établissements (Business)',
    },
    { 
      value: 'SIREN', 
      label: 'SIREN', 
      description: 'Système d\'Identification du Répertoire des Entreprises (Business)',
    },
    { 
      value: 'TVA', 
      label: 'TVA', 
      description: 'Numéro de TVA Intracommunautaire',
    },
  ],
  
  // Itália
  IT: [
    { 
      value: 'VAT', 
      label: 'Partita IVA', 
      description: 'Numero di Partita IVA (Business)',
    },
    { 
      value: 'CF', 
      label: 'Codice Fiscale', 
      description: 'Codice Fiscale (Individual/Business)',
    },
  ],
  
  // Alemanha
  DE: [
    { 
      value: 'VAT', 
      label: 'USt-IdNr', 
      description: 'Umsatzsteuer-Identifikationsnummer (VAT)',
    },
    { 
      value: 'STEUERNUMMER', 
      label: 'Steuernummer', 
      description: 'Tax Number',
    },
  ],
  
  // Argentina
  AR: [
    { 
      value: 'CUIT', 
      label: 'CUIT', 
      description: 'Clave Única de Identificación Tributaria (Business)',
    },
    { 
      value: 'CUIL', 
      label: 'CUIL', 
      description: 'Código Único de Identificación Laboral (Individual)',
    },
  ],
  
  // México
  MX: [
    { 
      value: 'RFC', 
      label: 'RFC', 
      description: 'Registro Federal de Contribuyentes',
    },
  ],
  
  // Chile
  CL: [
    { 
      value: 'RUT', 
      label: 'RUT', 
      description: 'Rol Único Tributario',
    },
  ],
  
  // Colômbia
  CO: [
    { 
      value: 'NIT', 
      label: 'NIT', 
      description: 'Número de Identificación Tributaria (Business)',
    },
    { 
      value: 'CC', 
      label: 'CC', 
      description: 'Cédula de Ciudadanía (Individual)',
    },
  ],
  
  // Canadá
  CA: [
    { 
      value: 'BN', 
      label: 'Business Number', 
      description: 'Business Number (BN)',
    },
    { 
      value: 'SIN', 
      label: 'SIN', 
      description: 'Social Insurance Number (Individual)',
    },
  ],
  
  // Austrália
  AU: [
    { 
      value: 'ABN', 
      label: 'ABN', 
      description: 'Australian Business Number',
    },
    { 
      value: 'TFN', 
      label: 'TFN', 
      description: 'Tax File Number (Individual)',
    },
  ],
  
  // Países com VAT genérico (União Europeia e outros)
  AT: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  BE: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  BG: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  HR: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  CY: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  CZ: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  DK: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  EE: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  FI: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  GR: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  HU: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  IS: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  LV: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  LT: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  LU: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  MT: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  NL: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  NO: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  PL: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  RO: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  SK: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  SI: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  SE: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
  CH: [{ value: 'VAT', label: 'VAT Number', description: 'Value Added Tax Number' }],
}

/**
 * Obtém os tipos de identificação fiscal para um país
 */
export const getTaxIdTypesByCountry = (countryCode: string): TaxIdOption[] => {
  return TAX_ID_TYPES_BY_COUNTRY[countryCode] || [
    { value: 'OTHER', label: 'Tax ID', description: 'Tax Identification Number' }
  ]
}

/**
 * Verifica se um país tem tipos de identificação fiscal específicos
 */
export const hasSpecificTaxIdTypes = (countryCode: string): boolean => {
  return countryCode in TAX_ID_TYPES_BY_COUNTRY
}

/**
 * Obtém o label de um tipo de identificação fiscal
 */
export const getTaxIdTypeLabel = (countryCode: string, taxIdType: string): string => {
  const types = getTaxIdTypesByCountry(countryCode)
  const type = types.find(t => t.value === taxIdType)
  return type?.label || taxIdType
}

/**
 * Obtém a descrição de um tipo de identificação fiscal
 */
export const getTaxIdTypeDescription = (countryCode: string, taxIdType: string): string => {
  const types = getTaxIdTypesByCountry(countryCode)
  const type = types.find(t => t.value === taxIdType)
  return type?.description || ''
}

