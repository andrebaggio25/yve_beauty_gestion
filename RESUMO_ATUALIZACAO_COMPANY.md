# 📋 Resumo: Atualização da Tela de Empresa

## 🎯 Mudanças Aplicadas

### 1. ✅ Telefone no Padrão Internacional

**Antes**: Input simples de texto  
**Depois**: Componente `PhoneInputWithCountry` com:
- Seletor de país independente
- Formatação automática conforme país
- Validação E.164
- Código de país automático

**Código**:
```tsx
<PhoneInputWithCountry
  value={watch('phone') || null}
  onChange={(val) => setValue('phone', val || '')}
  phoneCountryCode={phoneCountry}
  onPhoneCountryChange={(country) => {
    setPhoneCountry(country)
    setValue('phone_country', country)
  }}
  label="Telefone"
/>
```

### 2. ✅ País e Tax ID Padrão

**Antes**: Input simples de país e Tax ID  
**Depois**: 
- Select de países com bandeiras (`COUNTRIES`)
- Tax ID com tipo dinâmico conforme país
- Tipos disponíveis mudam automaticamente

**Código**:
```tsx
// Select de País
<select {...register('country_code')}>
  {COUNTRIES.map(country => (
    <option key={country.code} value={country.code}>
      {country.flag} {country.name}
    </option>
  ))}
</select>

// Tax ID com tipo
<div className="flex gap-2">
  <select value={taxIdType} onChange={...}>
    {/* Tipos mudam conforme país */}
  </select>
  <input {...register('tax_id')} />
</div>
```

### 3. ✅ Bucket para Logo

**Problema**: Erro de bucket não encontrado  
**Solução**: 
- Alterado de `'public'` para `'company-logos'`
- Criado documento com instruções para criar o bucket

**Bucket necessário**: `company-logos`  
**Instruções**: Ver arquivo `CRIAR_BUCKET_COMPANY_LOGOS.md`

## 📁 Arquivos Modificados

1. ✅ `app/(dashboard)/settings/company/page.tsx`
   - Adicionados imports: `PhoneInputWithCountry`, `TaxIdInput`, `COUNTRIES`
   - Schema atualizado para novos campos
   - Componentes de telefone e tax ID integrados
   - Select de país com bandeiras
   - Bucket corrigido para `company-logos`

2. ✅ `lib/supabase/migrations/15_update_company_table_fields.sql` (NOVO)
   - Adiciona campos faltantes na tabela `company`
   - Adiciona `phone_country`, `tax_id_type`
   - Cria constraints de validação

3. ✅ `CRIAR_BUCKET_COMPANY_LOGOS.md` (NOVO)
   - Instruções detalhadas para criar o bucket
   - Configuração de políticas de acesso

## 🚀 Como Aplicar

### Passo 1: Aplicar Migration 15

1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Copie o conteúdo de `lib/supabase/migrations/15_update_company_table_fields.sql`
4. Cole e execute

### Passo 2: Criar Bucket `company-logos`

Siga as instruções em `CRIAR_BUCKET_COMPANY_LOGOS.md`:

1. Storage → New bucket
2. Nome: `company-logos`
3. Public: ✅
4. Configurar políticas de acesso

### Passo 3: Testar na Aplicação

1. Acesse **Configurações** → **Empresa**
2. Preencha o formulário:
   - Selecione o país (com bandeira)
   - Digite o telefone (formatação automática)
   - Selecione o tipo de Tax ID
   - Digite o Tax ID
3. Salve os dados
4. Faça upload do logo (deve funcionar agora)

## 📊 Estrutura Final

### Campos na Tabela Company

```
company
├── id (uuid, PK)
├── name (text) - Razão social
├── legal_name (text) - Razão social (alternativo)
├── trade_name (text) - Nome fantasia
├── ein (text) - EIN legado
├── tax_id (text) - CNPJ/Tax ID
├── tax_id_type (text) - Tipo: EIN, VAT, NIF, CNPJ, OTHER
├── country_code (text) - Código do país (ISO)
├── phone (text) - Telefone formato E.164
├── phone_country (text) - País do telefone
├── email (text)
├── website (text)
├── address_line1 (text)
├── address_line2 (text)
├── city (text)
├── state (text)
├── postal_code (text)
├── logo_url (text)
└── ... outros campos
```

## 🎨 Componentes Utilizados

### PhoneInputWithCountry
- Formatação internacional automática
- Validação E.164
- Preview durante digitação
- Seletor de país independente

### Tax ID com Tipo Dinâmico
- Tipos mudam conforme país:
  - BR → CNPJ, OTHER
  - US → EIN, OTHER
  - ES → VAT, NIF, OTHER
  - IE → VAT, NIF, OTHER
  - Outros → OTHER

## 🔍 Verificação

Após aplicar tudo, teste:

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'company'
ORDER BY ordinal_position;

-- Ver se bucket existe
SELECT name, public 
FROM storage.buckets 
WHERE name = 'company-logos';
```

## ⚠️ Importante

1. **Bucket deve ser criado ANTES** de testar o upload
2. **Migration 15 deve ser aplicada** para os novos campos funcionarem
3. **Campos legados** (`ein`, `name`) são mantidos para compatibilidade

## 📝 Próximos Passos

Após aplicar:
1. ✅ Testar cadastro de empresa
2. ✅ Testar upload de logo
3. ✅ Verificar formatação de telefone
4. ✅ Verificar tipos de Tax ID por país
5. ✅ Confirmar salvamento no banco

---

**Data**: 2025-11-01  
**Arquivos**: 
- `app/(dashboard)/settings/company/page.tsx` (MODIFICADO)
- `lib/supabase/migrations/15_update_company_table_fields.sql` (NOVO)
- `CRIAR_BUCKET_COMPANY_LOGOS.md` (NOVO)

