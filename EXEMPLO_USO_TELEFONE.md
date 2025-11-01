# 📱 Exemplos de Uso - Sistema de Telefone Internacional

## 🎯 Guia Rápido de Uso

### 1. Uso Básico no Formulário

```tsx
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry'

function EmployeeForm() {
  const [phone, setPhone] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState('BR')

  return (
    <PhoneInputWithCountry
      value={phone}
      onChange={setPhone}
      phoneCountryCode={phoneCountry}
      onPhoneCountryChange={setPhoneCountry}
      label="Telefone"
      required
    />
  )
}
```

### 2. Uso com React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry'

function EmployeeForm() {
  const { register, setValue, watch } = useForm()
  const [phoneCountry, setPhoneCountry] = useState('BR')

  return (
    <PhoneInputWithCountry
      value={watch('phone')}
      onChange={(val) => setValue('phone', val)}
      phoneCountryCode={phoneCountry}
      onPhoneCountryChange={(country) => {
        setPhoneCountry(country)
        setValue('phone_country', country)
      }}
      label="Telefone"
      required
    />
  )
}
```

### 3. Uso com Hook Personalizado

```tsx
import { usePhoneWithCountry } from '@/components/PhoneInputWithCountry'

function EmployeeForm() {
  const { phone, setPhone, phoneCountry, setPhoneCountry } = 
    usePhoneWithCountry(null, 'BR')

  return (
    <PhoneInputWithCountry
      value={phone}
      onChange={setPhone}
      phoneCountryCode={phoneCountry}
      onPhoneCountryChange={setPhoneCountry}
      label="Telefone"
    />
  )
}
```

## 🌍 Exemplos por País

### Brasil 🇧🇷

**Input do Usuário:**
```
País: BR
Número: 11987654321
```

**Armazenado no Banco:**
```
phone: "+5511987654321"
phone_country: "BR"
```

**Exibido na Tela:**
```
+55 11 98765-4321
```

### Estados Unidos 🇺🇸

**Input do Usuário:**
```
País: US
Número: 2345678900
```

**Armazenado no Banco:**
```
phone: "+12345678900"
phone_country: "US"
```

**Exibido na Tela:**
```
+1 234 567 8900
```

### Espanha 🇪🇸

**Input do Usuário:**
```
País: ES
Número: 612345678
```

**Armazenado no Banco:**
```
phone: "+34612345678"
phone_country: "ES"
```

**Exibido na Tela:**
```
+34 612 34 56 78
```

### Portugal 🇵🇹

**Input do Usuário:**
```
País: PT
Número: 912345678
```

**Armazenado no Banco:**
```
phone: "+351912345678"
phone_country: "PT"
```

**Exibido na Tela:**
```
+351 912 345 678
```

### Irlanda 🇮🇪

**Input do Usuário:**
```
País: IE
Número: 851234567
```

**Armazenado no Banco:**
```
phone: "+353851234567"
phone_country: "IE"
```

**Exibido na Tela:**
```
+353 85 123 4567
```

## 📊 Exibição em Tabelas

### Exemplo 1: Lista de Funcionários

```tsx
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'

function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>País</th>
          <th>Telefone</th>
        </tr>
      </thead>
      <tbody>
        {employees.map(emp => (
          <tr key={emp.id}>
            <td>{emp.first_name} {emp.last_name}</td>
            <td>{emp.country_code}</td>
            <td>{formatPhoneForDisplay(emp.phone)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

**Resultado:**
```
┌─────────────┬──────┬─────────────────────┐
│ Nome        │ País │ Telefone            │
├─────────────┼──────┼─────────────────────┤
│ João Silva  │ BR   │ +55 11 98765-4321   │
│ Maria Santos│ US   │ +1 234 567 8900     │
│ Pedro Costa │ ES   │ +34 612 34 56 78    │
└─────────────┴──────┴─────────────────────┘
```

### Exemplo 2: Card de Funcionário

```tsx
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'
import { getCountryByCode } from '@/lib/utils/countries'

function EmployeeCard({ employee }: { employee: Employee }) {
  const country = getCountryByCode(employee.country_code)
  const phoneCountry = getCountryByCode(employee.phone_country)

  return (
    <div className="card">
      <h3>{employee.first_name} {employee.last_name}</h3>
      <div className="info">
        <span>País: {country?.flag} {country?.name}</span>
        <span>
          Telefone: {phoneCountry?.flag} {formatPhoneForDisplay(employee.phone)}
        </span>
      </div>
    </div>
  )
}
```

**Resultado:**
```
┌─────────────────────────────────────┐
│ João Silva                          │
│                                     │
│ País: 🇧🇷 Brasil                    │
│ Telefone: 🇧🇷 +55 11 98765-4321     │
└─────────────────────────────────────┘
```

## 🔍 Validação de Telefones

### Exemplo 1: Validação Simples

```tsx
import { validatePhone } from '@/components/PhoneInputWithCountry'

// Válidos
validatePhone('+5511987654321', 'BR')  // ✅ true
validatePhone('+12345678900', 'US')    // ✅ true
validatePhone('+34612345678', 'ES')    // ✅ true

// Inválidos
validatePhone('11987654321', 'BR')     // ❌ false (falta +55)
validatePhone('+55119876', 'BR')       // ❌ false (muito curto)
validatePhone('+551198765432199', 'BR') // ❌ false (muito longo)
```

### Exemplo 2: Validação em Formulário

```tsx
import { validatePhone } from '@/components/PhoneInputWithCountry'

function EmployeeForm() {
  const [phone, setPhone] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState('BR')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (phone && !validatePhone(phone, phoneCountry)) {
      setError('Número de telefone inválido')
      return
    }
    
    // Prosseguir com o envio
    submitForm({ phone, phone_country: phoneCountry })
  }

  return (
    <form onSubmit={handleSubmit}>
      <PhoneInputWithCountry
        value={phone}
        onChange={setPhone}
        phoneCountryCode={phoneCountry}
        onPhoneCountryChange={setPhoneCountry}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Salvar</button>
    </form>
  )
}
```

## 📱 Integração com WhatsApp

### Exemplo 1: Enviar Mensagem Simples

```tsx
import { Employee } from '@/types/employee'

async function sendWhatsAppMessage(
  employee: Employee, 
  message: string
) {
  // O telefone já está no formato E.164: "+5511987654321"
  const phoneNumber = employee.phone.replace('+', '')
  
  const response = await fetch('https://api.whatsapp.com/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    })
  })

  return response.json()
}

// Uso
await sendWhatsAppMessage(
  employee, 
  'Olá! Seu pagamento foi processado com sucesso.'
)
```

### Exemplo 2: Enviar Notificação de Pagamento

```tsx
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'

async function notifyPayment(employee: Employee, amount: number) {
  const message = `
Olá ${employee.first_name}!

Seu pagamento foi processado:
💰 Valor: ${amount.toFixed(2)} USD
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Obrigado!
  `.trim()

  console.log(`Enviando para: ${formatPhoneForDisplay(employee.phone)}`)
  
  await sendWhatsAppMessage(employee, message)
}

// Uso
await notifyPayment(employee, 1500.00)
```

### Exemplo 3: Verificar se Número é WhatsApp

```tsx
async function checkWhatsAppNumber(phone: string) {
  const phoneNumber = phone.replace('+', '')
  
  const response = await fetch(
    `https://api.whatsapp.com/v1/contacts/${phoneNumber}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
      }
    }
  )

  const data = await response.json()
  return data.contacts?.[0]?.wa_id !== undefined
}

// Uso
const hasWhatsApp = await checkWhatsAppNumber(employee.phone)
if (hasWhatsApp) {
  console.log('✅ Número tem WhatsApp')
} else {
  console.log('❌ Número não tem WhatsApp')
}
```

## 📄 Geração de Faturas

### Exemplo 1: Dados do Cliente na Fatura

```tsx
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'
import { getCountryByCode } from '@/lib/utils/countries'

function generateInvoiceData(customer: Customer) {
  const country = getCountryByCode(customer.country_code)
  
  return {
    customer: {
      name: customer.legal_name,
      taxId: customer.tax_id,
      address: customer.address,
      city: customer.city,
      country: country?.name,
      phone: formatPhoneForDisplay(customer.phone),
      email: customer.email
    }
  }
}

// Resultado no PDF:
/*
Cliente: Acme Corp
CNPJ: 12.345.678/0001-90
Endereço: Rua das Flores, 123
Cidade: São Paulo - SP
País: Brasil
Telefone: +55 11 98765-4321
Email: contato@acme.com
*/
```

### Exemplo 2: Template de Fatura HTML

```tsx
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'

function InvoiceTemplate({ customer, invoice }: Props) {
  return (
    <div className="invoice">
      <header>
        <h1>Fatura #{invoice.number}</h1>
      </header>
      
      <section className="customer-info">
        <h2>Cliente</h2>
        <p><strong>{customer.legal_name}</strong></p>
        <p>{customer.address}</p>
        <p>{customer.city}, {customer.country_code}</p>
        <p>Tel: {formatPhoneForDisplay(customer.phone)}</p>
        <p>Email: {customer.email}</p>
      </section>
      
      <section className="items">
        {/* ... itens da fatura ... */}
      </section>
    </div>
  )
}
```

## 🔄 Conversão e Formatação

### Exemplo 1: Converter Números Antigos

```typescript
import { parsePhoneNumber } from 'libphonenumber-js'

// Converter número brasileiro antigo para E.164
function convertBrazilianPhone(oldPhone: string): string {
  // Remove tudo exceto números
  const digits = oldPhone.replace(/\D/g, '')
  
  // Adiciona +55 se não tiver
  if (!digits.startsWith('55')) {
    return `+55${digits}`
  }
  
  return `+${digits}`
}

// Exemplos
convertBrazilianPhone('(11) 98765-4321')  // "+5511987654321"
convertBrazilianPhone('11987654321')      // "+5511987654321"
convertBrazilianPhone('5511987654321')    // "+5511987654321"
```

### Exemplo 2: Detectar País do Telefone

```typescript
import { parsePhoneNumber } from 'libphonenumber-js'

function detectPhoneCountry(phone: string): string | null {
  try {
    const parsed = parsePhoneNumber(phone)
    return parsed?.country || null
  } catch {
    return null
  }
}

// Exemplos
detectPhoneCountry('+5511987654321')  // "BR"
detectPhoneCountry('+12345678900')    // "US"
detectPhoneCountry('+34612345678')    // "ES"
```

### Exemplo 3: Formatar para Diferentes Estilos

```typescript
import { parsePhoneNumber } from 'libphonenumber-js'

function formatPhone(phone: string, style: 'international' | 'national' | 'e164') {
  try {
    const parsed = parsePhoneNumber(phone)
    
    switch (style) {
      case 'international':
        return parsed.formatInternational()  // "+55 11 98765-4321"
      case 'national':
        return parsed.formatNational()       // "(11) 98765-4321"
      case 'e164':
        return parsed.format('E.164')        // "+5511987654321"
      default:
        return phone
    }
  } catch {
    return phone
  }
}

// Exemplos
formatPhone('+5511987654321', 'international')  // "+55 11 98765-4321"
formatPhone('+5511987654321', 'national')       // "(11) 98765-4321"
formatPhone('+5511987654321', 'e164')           // "+5511987654321"
```

## 🎨 Customização do Componente

### Exemplo 1: Componente com Placeholder Customizado

```tsx
<PhoneInputWithCountry
  value={phone}
  onChange={setPhone}
  phoneCountryCode={phoneCountry}
  onPhoneCountryChange={setPhoneCountry}
  label="Telefone Celular"
  placeholder="Digite seu número"
  required
/>
```

### Exemplo 2: Componente Desabilitado

```tsx
<PhoneInputWithCountry
  value={phone}
  onChange={setPhone}
  phoneCountryCode={phoneCountry}
  onPhoneCountryChange={setPhoneCountry}
  label="Telefone"
  disabled={true}
/>
```

### Exemplo 3: Componente com Valor Inicial

```tsx
function EditEmployeeForm({ employee }: { employee: Employee }) {
  const [phone, setPhone] = useState(employee.phone)
  const [phoneCountry, setPhoneCountry] = useState(employee.phone_country)

  return (
    <PhoneInputWithCountry
      value={phone}
      onChange={setPhone}
      phoneCountryCode={phoneCountry}
      onPhoneCountryChange={setPhoneCountry}
      label="Telefone"
    />
  )
}
```

## 🧪 Testes

### Exemplo 1: Teste de Validação

```typescript
import { validatePhone } from '@/components/PhoneInputWithCountry'

describe('Phone Validation', () => {
  test('validates Brazilian phone', () => {
    expect(validatePhone('+5511987654321', 'BR')).toBe(true)
    expect(validatePhone('11987654321', 'BR')).toBe(false)
  })

  test('validates US phone', () => {
    expect(validatePhone('+12345678900', 'US')).toBe(true)
    expect(validatePhone('2345678900', 'US')).toBe(false)
  })

  test('validates Spanish phone', () => {
    expect(validatePhone('+34612345678', 'ES')).toBe(true)
    expect(validatePhone('612345678', 'ES')).toBe(false)
  })
})
```

### Exemplo 2: Teste de Formatação

```typescript
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'

describe('Phone Formatting', () => {
  test('formats Brazilian phone', () => {
    expect(formatPhoneForDisplay('+5511987654321'))
      .toBe('+55 11 98765-4321')
  })

  test('formats US phone', () => {
    expect(formatPhoneForDisplay('+12345678900'))
      .toBe('+1 234 567 8900')
  })

  test('handles null phone', () => {
    expect(formatPhoneForDisplay(null)).toBe('-')
  })
})
```

## 📚 Recursos Adicionais

### Funções Utilitárias Disponíveis

```typescript
// Formatar para exibição
formatPhoneForDisplay(phone: string | null): string

// Validar número
validatePhone(phone: string | null, country?: string): boolean

// Hook para gerenciar estado
usePhoneWithCountry(initialPhone?: string | null, initialCountry: string = 'BR')

// Obter país por código
getCountryByCode(code: string): Country | undefined

// Obter países por região
getCountriesByRegion(region: string): Country[]

// Obter todas as regiões
getRegions(): string[]

// Formatar nome do país com bandeira
formatCountryName(code: string): string

// Obter opções para select
getCountryOptions(): Array<{ value: string, label: string }>
```

### Interfaces TypeScript

```typescript
interface Country {
  code: string
  name: string
  flag: string
  callingCode: string
  region: string
}

interface Employee {
  phone: string | null
  phone_country: string
  country_code: string
  // ... outros campos
}

interface Customer {
  phone: string | null
  phone_country: string
  country_code: string
  // ... outros campos
}
```

---

**Data de Criação**: 2025-11-01  
**Versão**: 1.0.0  
**Autor**: Sistema de Gestão Yve Beauty

