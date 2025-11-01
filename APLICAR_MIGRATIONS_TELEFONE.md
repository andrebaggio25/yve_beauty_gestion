# Aplicar Migrations de Telefone Internacional

Este documento contém as instruções para aplicar as migrations que adicionam suporte completo a telefones internacionais no sistema.

## 📋 O que foi implementado

### 1. **Componente PhoneInputWithCountry**
- Seleção independente do país do telefone
- Formatação automática baseada no país selecionado
- Validação em tempo real usando `libphonenumber-js`
- Armazenamento no formato E.164 (ex: `+5511987654321`)
- Preview do número formatado durante a digitação

### 2. **Campos de Banco de Dados**
- `phone_country` adicionado nas tabelas `employee` e `customer`
- Validação de formato internacional (E.164)
- Índices para melhor performance
- Funções helper para validação e extração de país

### 3. **Integração com WhatsApp**
- Números armazenados no formato correto para APIs
- Validação rigorosa de formato internacional
- Suporte a mais de 100 países

## 🚀 Passo a Passo para Aplicar

### Passo 1: Instalar Dependência (se ainda não instalada)

```bash
npm install libphonenumber-js
```

### Passo 2: Aplicar Migration 06 (Phone Country Fields)

Acesse o Supabase Dashboard:
1. Vá para o SQL Editor
2. Crie uma nova query
3. Cole o conteúdo do arquivo: `lib/supabase/migrations/06_add_phone_country_fields.sql`
4. Execute a query

**Conteúdo da Migration 06:**

```sql
-- =========================
-- ADICIONA CAMPOS PHONE_COUNTRY NAS TABELAS
-- =========================

-- Tabela employee: adiciona phone_country
alter table employee 
  add column if not exists phone_country text default 'BR';

comment on column employee.phone_country is 'Código do país do telefone (pode ser diferente do country_code)';

-- Tabela customer: adiciona phone_country para contacts
-- Como contacts é JSONB, não precisamos adicionar coluna, mas vamos documentar a estrutura esperada
comment on column customer.contacts is 'Array de contatos em JSONB. Estrutura: [{name, email, phone, phone_country, role}]';

-- Índice para melhorar performance em buscas por país do telefone
create index if not exists idx_employee_phone_country on employee(phone_country) where phone is not null;

-- Função para validar formato de telefone internacional
create or replace function is_valid_international_phone(phone_number text)
returns boolean
language plpgsql
immutable
as $$
begin
  -- Verifica se começa com + e tem entre 8 e 15 dígitos
  return phone_number ~ '^\+[1-9]\d{7,14}$';
end;
$$;

comment on function is_valid_international_phone is 'Valida se um número de telefone está no formato internacional E.164';

-- Constraint para garantir formato internacional nos telefones
alter table employee
  drop constraint if exists employee_phone_format_check;

alter table employee
  add constraint employee_phone_format_check
  check (phone is null or is_valid_international_phone(phone));

-- Atualiza telefones existentes que não estejam no formato correto
-- (Apenas para dados de teste - em produção, fazer manualmente)
update employee
set phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g')
where phone is not null 
  and not is_valid_international_phone(phone)
  and phone_country = 'BR';

-- Função helper para extrair código do país de um telefone
create or replace function extract_country_from_phone(phone_number text)
returns text
language plpgsql
immutable
as $$
declare
  calling_code text;
begin
  if phone_number is null or not phone_number ~ '^\+' then
    return null;
  end if;
  
  -- Extrai os primeiros dígitos após o +
  calling_code := substring(phone_number from '^\+(\d{1,4})');
  
  -- Mapeia códigos comuns para países
  case calling_code
    when '1' then return 'US';
    when '44' then return 'GB';
    when '33' then return 'FR';
    when '34' then return 'ES';
    when '39' then return 'IT';
    when '49' then return 'DE';
    when '351' then return 'PT';
    when '353' then return 'IE';
    when '52' then return 'MX';
    when '54' then return 'AR';
    when '55' then return 'BR';
    when '56' then return 'CL';
    when '57' then return 'CO';
    when '58' then return 'VE';
    else return null;
  end case;
end;
$$;

comment on function extract_country_from_phone is 'Tenta extrair o código do país de um número de telefone internacional';

-- View helper para mostrar telefones formatados
create or replace view employee_with_formatted_phone as
select 
  e.*,
  case 
    when e.phone is not null then e.phone
    else null
  end as phone_formatted,
  case
    when e.phone is not null then extract_country_from_phone(e.phone)
    else e.phone_country
  end as phone_country_detected
from employee e;

comment on view employee_with_formatted_phone is 'View que inclui telefone formatado e país detectado';
```

### Passo 3: Aplicar Migration 07 (Customer Phone Country)

Acesse o Supabase Dashboard:
1. Vá para o SQL Editor
2. Crie uma nova query
3. Cole o conteúdo do arquivo: `lib/supabase/migrations/07_add_phone_country_to_customer.sql`
4. Execute a query

**Conteúdo da Migration 07:**

```sql
-- =========================
-- ADICIONA PHONE_COUNTRY NA TABELA CUSTOMER
-- =========================

-- Adiciona phone_country na tabela customer
alter table customer 
  add column if not exists phone_country text default 'BR';

comment on column customer.phone_country is 'Código do país do telefone principal (pode ser diferente do country_code)';

-- Constraint para garantir formato internacional nos telefones do customer
alter table customer
  drop constraint if exists customer_phone_format_check;

alter table customer
  add constraint customer_phone_format_check
  check (phone is null or is_valid_international_phone(phone));

-- Índice para melhorar performance
create index if not exists idx_customer_phone_country on customer(phone_country) where phone is not null;

-- Atualiza telefones existentes que não estejam no formato correto
-- (Apenas para dados de teste - em produção, fazer manualmente)
update customer
set phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g')
where phone is not null 
  and not is_valid_international_phone(phone)
  and phone_country = 'BR';
```

### Passo 4: Atualizar Migration 05 (Employee Table)

Se você ainda não aplicou a migration 05, use a versão atualizada que já inclui o campo `phone_country`.

Se já aplicou, execute apenas este comando adicional:

```sql
alter table employee 
  add column if not exists phone_country text default 'BR';
```

## ✅ Verificação

Após aplicar as migrations, execute estas queries para verificar:

```sql
-- Verificar estrutura da tabela employee
select column_name, data_type, column_default 
from information_schema.columns 
where table_name = 'employee' 
  and column_name in ('phone', 'phone_country', 'country_code');

-- Verificar estrutura da tabela customer
select column_name, data_type, column_default 
from information_schema.columns 
where table_name = 'customer' 
  and column_name in ('phone', 'phone_country', 'country_code');

-- Testar função de validação
select is_valid_international_phone('+5511987654321') as valid_br,
       is_valid_international_phone('+1234567890') as valid_us,
       is_valid_international_phone('11987654321') as invalid;

-- Testar função de extração de país
select extract_country_from_phone('+5511987654321') as country_br,
       extract_country_from_phone('+1234567890') as country_us,
       extract_country_from_phone('+34612345678') as country_es;
```

Resultados esperados:
- `employee` e `customer` devem ter os campos `phone`, `phone_country` e `country_code`
- `is_valid_international_phone` deve retornar `true` para números válidos no formato E.164
- `extract_country_from_phone` deve retornar o código do país correto

## 📱 Como Usar o Novo Componente

### No código TypeScript/React:

```tsx
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry'

function MyForm() {
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

### Formatação para exibição:

```tsx
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'

// Em uma tabela ou lista
<td>{formatPhoneForDisplay(employee.phone)}</td>
```

### Validação:

```tsx
import { validatePhone } from '@/components/PhoneInputWithCountry'

const isValid = validatePhone('+5511987654321', 'BR') // true
```

## 🔧 Funções Utilitárias Disponíveis

### 1. `formatPhoneForDisplay(phone: string | null): string`
Formata um número para exibição no formato internacional.

```tsx
formatPhoneForDisplay('+5511987654321') // "+55 11 98765-4321"
formatPhoneForDisplay('+1234567890')    // "+1 234 567 890"
```

### 2. `validatePhone(phone: string | null, country?: string): boolean`
Valida se um número é válido para o país especificado.

```tsx
validatePhone('+5511987654321', 'BR')  // true
validatePhone('11987654321', 'BR')     // false (falta +55)
```

### 3. `usePhoneWithCountry(initialPhone?: string | null, initialCountry: string = 'BR')`
Hook para gerenciar estado de telefone com país.

```tsx
const { phone, setPhone, phoneCountry, setPhoneCountry } = usePhoneWithCountry(
  employee.phone,
  employee.phone_country
)
```

## 🌍 Países Suportados

O sistema agora suporta mais de 100 países, incluindo:

- **América do Sul**: Brasil, Argentina, Chile, Colômbia, Peru, etc.
- **América do Norte**: EUA, Canadá, México
- **Europa**: Espanha, Portugal, França, Alemanha, Reino Unido, Irlanda, etc.
- **Ásia**: Japão, China, Índia, Singapura, etc.
- **Oceania**: Austrália, Nova Zelândia
- **África**: África do Sul, Egito, Marrocos, etc.

Cada país tem:
- Código do país (ex: BR, US, ES)
- Nome em português
- Bandeira emoji
- Código de discagem (ex: +55, +1, +34)
- Região geográfica

## 📊 Estrutura de Dados

### Formato de Armazenamento (E.164)
```
+[código do país][número local]
Exemplos:
- Brasil: +5511987654321
- EUA: +1234567890
- Espanha: +34612345678
```

### Formato de Exibição (Internacional)
```
+[código] [formatação local]
Exemplos:
- Brasil: +55 11 98765-4321
- EUA: +1 234 567 890
- Espanha: +34 612 34 56 78
```

## 🔗 Integração com WhatsApp

Os números agora estão no formato correto para APIs do WhatsApp:

```typescript
// Exemplo de uso com WhatsApp Business API
const sendWhatsApp = async (employee: Employee, message: string) => {
  const phone = employee.phone // Já está no formato E.164
  
  await fetch('https://api.whatsapp.com/send', {
    method: 'POST',
    body: JSON.stringify({
      phone: phone.replace('+', ''), // Remove o + para a API
      message: message
    })
  })
}
```

## 📄 Geração de Faturas

Os telefones serão exibidos corretamente formatados nas faturas:

```typescript
import { formatPhoneForDisplay } from '@/components/PhoneInputWithCountry'

// No template de fatura
const invoiceData = {
  customer: {
    name: customer.legal_name,
    phone: formatPhoneForDisplay(customer.phone), // "+55 11 98765-4321"
    country: customer.country_code
  }
}
```

## ⚠️ Notas Importantes

1. **Dados Existentes**: As migrations incluem comandos para converter telefones brasileiros existentes para o formato E.164. Se você tem dados de outros países, ajuste manualmente.

2. **Validação Rigorosa**: Após aplicar as migrations, todos os telefones devem estar no formato E.164. Telefones inválidos serão rejeitados.

3. **País vs. País do Telefone**: 
   - `country_code`: País da pessoa/empresa
   - `phone_country`: País do número de telefone
   - Estes podem ser diferentes (ex: brasileiro morando nos EUA com número americano)

4. **Performance**: Os índices criados melhoram a performance de buscas por país do telefone.

## 🐛 Troubleshooting

### Erro: "violates check constraint employee_phone_format_check"
**Solução**: O número não está no formato E.164. Certifique-se de que começa com `+` seguido do código do país.

### Telefone não está sendo formatado corretamente
**Solução**: Verifique se o `phone_country` está correto. O componente usa este campo para determinar a formatação.

### Números antigos não estão no formato correto
**Solução**: Execute manualmente a conversão:
```sql
-- Para números brasileiros
update employee
set phone = '+55' || regexp_replace(phone, '[^\d]', '', 'g')
where phone is not null 
  and not phone ~ '^\+'
  and phone_country = 'BR';
```

## ✨ Próximos Passos

1. ✅ Aplicar as migrations
2. ✅ Testar o cadastro de novos funcionários
3. ✅ Testar o cadastro de novos clientes
4. ✅ Verificar a exibição de telefones nas listagens
5. ✅ Testar a geração de faturas com telefones formatados
6. 🔜 Implementar integração com WhatsApp Business API
7. 🔜 Adicionar envio de notificações por WhatsApp

---

**Data de Criação**: 2025-11-01
**Versão do Sistema**: 1.0.0
**Autor**: Sistema de Gestão Yve Beauty

