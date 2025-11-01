/**
 * Lista completa de países suportados pelo sistema
 * Organizada por região geográfica
 */

export interface Country {
  code: string
  name: string
  flag: string
  callingCode: string
  region: string
}

export const COUNTRIES: Country[] = [
  // América do Sul
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', callingCode: '+55', region: 'América do Sul' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', callingCode: '+54', region: 'América do Sul' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', callingCode: '+56', region: 'América do Sul' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴', callingCode: '+57', region: 'América do Sul' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', callingCode: '+51', region: 'América do Sul' },
  { code: 'UY', name: 'Uruguai', flag: '🇺🇾', callingCode: '+598', region: 'América do Sul' },
  { code: 'PY', name: 'Paraguai', flag: '🇵🇾', callingCode: '+595', region: 'América do Sul' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', callingCode: '+58', region: 'América do Sul' },
  { code: 'BO', name: 'Bolívia', flag: '🇧🇴', callingCode: '+591', region: 'América do Sul' },
  { code: 'EC', name: 'Equador', flag: '🇪🇨', callingCode: '+593', region: 'América do Sul' },
  
  // América do Norte
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', callingCode: '+1', region: 'América do Norte' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', callingCode: '+1', region: 'América do Norte' },
  { code: 'MX', name: 'México', flag: '🇲🇽', callingCode: '+52', region: 'América do Norte' },
  
  // América Central e Caribe
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', callingCode: '+506', region: 'América Central' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', callingCode: '+507', region: 'América Central' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', callingCode: '+502', region: 'América Central' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴', callingCode: '+1-809', region: 'Caribe' },
  { code: 'PR', name: 'Porto Rico', flag: '🇵🇷', callingCode: '+1-787', region: 'Caribe' },
  
  // Europa Ocidental
  { code: 'ES', name: 'Espanha', flag: '🇪🇸', callingCode: '+34', region: 'Europa Ocidental' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', callingCode: '+351', region: 'Europa Ocidental' },
  { code: 'FR', name: 'França', flag: '🇫🇷', callingCode: '+33', region: 'Europa Ocidental' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹', callingCode: '+39', region: 'Europa Ocidental' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪', callingCode: '+49', region: 'Europa Ocidental' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', callingCode: '+44', region: 'Europa Ocidental' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪', callingCode: '+353', region: 'Europa Ocidental' },
  { code: 'NL', name: 'Holanda', flag: '🇳🇱', callingCode: '+31', region: 'Europa Ocidental' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪', callingCode: '+32', region: 'Europa Ocidental' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭', callingCode: '+41', region: 'Europa Ocidental' },
  { code: 'AT', name: 'Áustria', flag: '🇦🇹', callingCode: '+43', region: 'Europa Ocidental' },
  { code: 'LU', name: 'Luxemburgo', flag: '🇱🇺', callingCode: '+352', region: 'Europa Ocidental' },
  
  // Europa do Norte
  { code: 'SE', name: 'Suécia', flag: '🇸🇪', callingCode: '+46', region: 'Europa do Norte' },
  { code: 'NO', name: 'Noruega', flag: '🇳🇴', callingCode: '+47', region: 'Europa do Norte' },
  { code: 'DK', name: 'Dinamarca', flag: '🇩🇰', callingCode: '+45', region: 'Europa do Norte' },
  { code: 'FI', name: 'Finlândia', flag: '🇫🇮', callingCode: '+358', region: 'Europa do Norte' },
  { code: 'IS', name: 'Islândia', flag: '🇮🇸', callingCode: '+354', region: 'Europa do Norte' },
  
  // Europa do Leste
  { code: 'PL', name: 'Polônia', flag: '🇵🇱', callingCode: '+48', region: 'Europa do Leste' },
  { code: 'CZ', name: 'República Tcheca', flag: '🇨🇿', callingCode: '+420', region: 'Europa do Leste' },
  { code: 'RO', name: 'Romênia', flag: '🇷🇴', callingCode: '+40', region: 'Europa do Leste' },
  { code: 'HU', name: 'Hungria', flag: '🇭🇺', callingCode: '+36', region: 'Europa do Leste' },
  { code: 'BG', name: 'Bulgária', flag: '🇧🇬', callingCode: '+359', region: 'Europa do Leste' },
  { code: 'SK', name: 'Eslováquia', flag: '🇸🇰', callingCode: '+421', region: 'Europa do Leste' },
  { code: 'HR', name: 'Croácia', flag: '🇭🇷', callingCode: '+385', region: 'Europa do Leste' },
  { code: 'SI', name: 'Eslovênia', flag: '🇸🇮', callingCode: '+386', region: 'Europa do Leste' },
  { code: 'EE', name: 'Estônia', flag: '🇪🇪', callingCode: '+372', region: 'Europa do Leste' },
  { code: 'LV', name: 'Letônia', flag: '🇱🇻', callingCode: '+371', region: 'Europa do Leste' },
  { code: 'LT', name: 'Lituânia', flag: '🇱🇹', callingCode: '+370', region: 'Europa do Leste' },
  
  // Europa do Sul
  { code: 'GR', name: 'Grécia', flag: '🇬🇷', callingCode: '+30', region: 'Europa do Sul' },
  { code: 'CY', name: 'Chipre', flag: '🇨🇾', callingCode: '+357', region: 'Europa do Sul' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', callingCode: '+356', region: 'Europa do Sul' },
  
  // Oceania
  { code: 'AU', name: 'Austrália', flag: '🇦🇺', callingCode: '+61', region: 'Oceania' },
  { code: 'NZ', name: 'Nova Zelândia', flag: '🇳🇿', callingCode: '+64', region: 'Oceania' },
  
  // Ásia
  { code: 'JP', name: 'Japão', flag: '🇯🇵', callingCode: '+81', region: 'Ásia' },
  { code: 'CN', name: 'China', flag: '🇨🇳', callingCode: '+86', region: 'Ásia' },
  { code: 'IN', name: 'Índia', flag: '🇮🇳', callingCode: '+91', region: 'Ásia' },
  { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷', callingCode: '+82', region: 'Ásia' },
  { code: 'SG', name: 'Singapura', flag: '🇸🇬', callingCode: '+65', region: 'Ásia' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', callingCode: '+852', region: 'Ásia' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', callingCode: '+886', region: 'Ásia' },
  { code: 'TH', name: 'Tailândia', flag: '🇹🇭', callingCode: '+66', region: 'Ásia' },
  { code: 'MY', name: 'Malásia', flag: '🇲🇾', callingCode: '+60', region: 'Ásia' },
  { code: 'ID', name: 'Indonésia', flag: '🇮🇩', callingCode: '+62', region: 'Ásia' },
  { code: 'PH', name: 'Filipinas', flag: '🇵🇭', callingCode: '+63', region: 'Ásia' },
  { code: 'VN', name: 'Vietnã', flag: '🇻🇳', callingCode: '+84', region: 'Ásia' },
  { code: 'AE', name: 'Emirados Árabes', flag: '🇦🇪', callingCode: '+971', region: 'Oriente Médio' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', callingCode: '+972', region: 'Oriente Médio' },
  
  // África
  { code: 'ZA', name: 'África do Sul', flag: '🇿🇦', callingCode: '+27', region: 'África' },
  { code: 'EG', name: 'Egito', flag: '🇪🇬', callingCode: '+20', region: 'África' },
  { code: 'MA', name: 'Marrocos', flag: '🇲🇦', callingCode: '+212', region: 'África' },
  { code: 'NG', name: 'Nigéria', flag: '🇳🇬', callingCode: '+234', region: 'África' },
  { code: 'KE', name: 'Quênia', flag: '🇰🇪', callingCode: '+254', region: 'África' },
]

/**
 * Obtém um país pelo código
 */
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code)
}

/**
 * Obtém países por região
 */
export const getCountriesByRegion = (region: string): Country[] => {
  return COUNTRIES.filter(c => c.region === region)
}

/**
 * Obtém todas as regiões únicas
 */
export const getRegions = (): string[] => {
  return Array.from(new Set(COUNTRIES.map(c => c.region)))
}

/**
 * Formata o nome do país com bandeira
 */
export const formatCountryName = (code: string): string => {
  const country = getCountryByCode(code)
  return country ? `${country.flag} ${country.name}` : code
}

/**
 * Lista simplificada para selects (código e nome com bandeira)
 */
export const getCountryOptions = () => {
  return COUNTRIES.map(c => ({
    value: c.code,
    label: `${c.flag} ${c.name}`,
  }))
}

