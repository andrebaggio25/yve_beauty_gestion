# 🎨 Melhorias no Cadastro de Clientes

## 📋 Resumo das Implementações

### 1. 🌍 Lista Completa de Países
- **104 países** disponíveis no select de país
- Organizado por regiões geográficas
- Exibição com bandeira emoji + nome do país
- Inclui código de discagem para cada país

**Países incluídos**:
- América do Sul (10 países)
- América do Norte (3 países)
- América Central e Caribe (5 países)
- Europa Ocidental (12 países)
- Europa do Norte (5 países)
- Europa do Leste (11 países)
- Europa do Sul (3 países)
- Oceania (2 países)
- Ásia (12 países)
- Oriente Médio (2 países)
- África (5 países)

---

### 2. 📝 Identificação Fiscal Dinâmica por País

Agora o select de identificação fiscal **muda automaticamente** baseado no país selecionado!

#### Exemplos por País:

**🇧🇷 Brasil**
- CNPJ - Cadastro Nacional da Pessoa Jurídica (Empresa)
- CPF - Cadastro de Pessoa Física (Individual)

**🇺🇸 Estados Unidos**
- EIN - Employer Identification Number (Business)
- SSN - Social Security Number (Individual)

**🇪🇸 Espanha**
- NIF - Número de Identificación Fiscal (Empresa)
- NIE - Número de Identidad de Extranjero
- CIF - Código de Identificación Fiscal (Empresa)

**🇵🇹 Portugal**
- NIPC - Número de Identificação de Pessoa Coletiva (Empresa)
- NIF - Número de Identificação Fiscal (Individual)

**🇮🇪 Irlanda**
- VAT Number - Value Added Tax Number (Business)
- PPS Number - Personal Public Service Number (Individual)

**🇬🇧 Reino Unido**
- VAT Number - Value Added Tax Number (Business)
- UTR - Unique Taxpayer Reference
- NINO - National Insurance Number (Individual)

**🇫🇷 França**
- SIRET - Système d'Identification du Répertoire des Établissements (Business)
- SIREN - Système d'Identification du Répertoire des Entreprises (Business)
- TVA - Numéro de TVA Intracommunautaire

**🇮🇹 Itália**
- Partita IVA - Numero di Partita IVA (Business)
- Codice Fiscale - Codice Fiscale (Individual/Business)

**🇩🇪 Alemanha**
- USt-IdNr - Umsatzsteuer-Identifikationsnummer (VAT)
- Steuernummer - Tax Number

**🇦🇷 Argentina**
- CUIT - Clave Única de Identificación Tributaria (Business)
- CUIL - Código Único de Identificación Laboral (Individual)

**🇲🇽 México**
- RFC - Registro Federal de Contribuyentes

**🇨🇱 Chile**
- RUT - Rol Único Tributario

**🇨🇴 Colômbia**
- NIT - Número de Identificación Tributaria (Business)
- CC - Cédula de Ciudadanía (Individual)

**🇨🇦 Canadá**
- Business Number (BN)
- SIN - Social Insurance Number (Individual)

**🇦🇺 Austrália**
- ABN - Australian Business Number
- TFN - Tax File Number (Individual)

**União Europeia e outros**
- VAT Number - Value Added Tax Number (genérico)

---

### 3. 📧 Múltiplos E-mails

Agora você pode adicionar **até 5 e-mails** por cliente!

#### Funcionalidades:
- ✅ Adicionar múltiplos e-mails
- ✅ E-mail principal destacado
- ✅ Validação automática de formato
- ✅ Previne duplicatas
- ✅ Remover e-mails individualmente
- ✅ Interface intuitiva com botão "Adicionar"
- ✅ Tecla Enter para adicionar rapidamente

#### Por que múltiplos e-mails?
- 📨 **Envio automático de faturas** para vários destinatários
- 👥 **Múltiplos contatos** na mesma empresa
- 🔄 **Redundância** de comunicação
- 📊 **Relatórios** enviados para diferentes departamentos

#### Como funciona:
1. Digite o e-mail no campo
2. Clique em "Adicionar" ou pressione Enter
3. O e-mail aparece na lista acima
4. O primeiro e-mail é marcado como "Principal"
5. Para remover, clique no ❌ ao lado do e-mail

---

## 🎨 Interface Melhorada

### Organização em Seções

O formulário agora está dividido em **4 seções** claras:

1. **Informações Básicas**
   - Nome Legal
   - Nome Fantasia
   - País
   - Idioma Preferido

2. **Identificação Fiscal**
   - Tipo de Identificação (dinâmico por país)
   - Número de Identificação

3. **Endereço**
   - Endereço completo
   - Cidade
   - Estado/Província
   - CEP/Código Postal

4. **Informações de Contato**
   - Múltiplos E-mails (novo!)
   - Telefone com país independente
   - Website

### Design Moderno
- ✅ Cards com bordas e sombras suaves
- ✅ Espaçamento adequado
- ✅ Cores consistentes
- ✅ Ícones informativos
- ✅ Mensagens de ajuda contextuais

---

## 🗄️ Estrutura de Banco de Dados

### Nova Tabela Customer (completa)

```sql
create table customer (
  id uuid primary key,
  branch_id uuid references branch(id),
  
  -- Informações básicas
  legal_name text not null,
  trade_name text,
  country_code text,
  preferred_language text default 'pt-BR',
  
  -- Identificação fiscal
  tax_id text,
  tax_id_type tax_id_type,
  
  -- Endereço
  address text,
  city text,
  state_code text,
  postal_code text,
  
  -- Contato
  phone text,
  phone_country text default 'BR',
  email text,
  emails jsonb default '[]'::jsonb, -- NOVO!
  website text,
  
  -- Metadata
  is_active boolean default true,
  addresses jsonb,
  contacts jsonb,
  default_language text,
  
  created_at timestamptz default now(),
  updated_at timestamptz
);
```

### Funções de Validação

```sql
-- Valida array de e-mails
validate_emails_array(emails_json jsonb) returns boolean

-- Obtém e-mail principal
get_primary_email(emails_json jsonb) returns text

-- Obtém e-mails secundários
get_secondary_emails(emails_json jsonb) returns jsonb
```

### View Helper

```sql
create view customer_with_emails as
select 
  c.*,
  get_primary_email(c.emails) as primary_email,
  jsonb_array_length(c.emails) - 1 as additional_emails_count
from customer c;
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`lib/utils/tax-id-types.ts`**
   - Mapeamento de tipos de identificação fiscal por país
   - Funções helper para obter tipos disponíveis
   - Descrições detalhadas de cada tipo

2. **`components/MultiEmailInput.tsx`**
   - Componente para gerenciar múltiplos e-mails
   - Validação automática
   - Interface intuitiva
   - Hook `useMultiEmail` para gerenciar estado

3. **`lib/supabase/migrations/09_add_emails_to_customer.sql`**
   - Adiciona campo `emails` (JSONB)
   - Funções de validação e helpers
   - View `customer_with_emails`

### Arquivos Modificados

1. **`components/CustomerForm.tsx`**
   - Integração com lista completa de países
   - Select dinâmico de identificação fiscal
   - Componente de múltiplos e-mails
   - Organização em seções
   - Design moderno

2. **`types/customer.ts`**
   - Adicionado campo `emails: string[]`
   - Atualizado `tax_id_type` para string (mais flexível)

3. **`modules/customers/service.ts`**
   - Suporte a múltiplos e-mails
   - Migração automática do e-mail único para array

---

## 🚀 Como Usar

### 1. Aplicar Migration 09

```sql
-- No Supabase SQL Editor
-- Cole o conteúdo de: lib/supabase/migrations/09_add_emails_to_customer.sql
```

### 2. Cadastrar Cliente com Múltiplos E-mails

```typescript
// No formulário
const handleSubmit = async (data) => {
  await createCustomer({
    legal_name: 'Acme Corp',
    country_code: 'BR',
    emails: [
      'financeiro@acme.com',    // Principal
      'contabilidade@acme.com', // Secundário
      'diretoria@acme.com'      // Secundário
    ],
    // ... outros campos
  })
}
```

### 3. Enviar Fatura para Todos os E-mails

```typescript
// Ao gerar fatura
const customer = await getCustomerById(customerId)

// Enviar para todos os e-mails
for (const email of customer.emails) {
  await sendInvoiceEmail(invoice, email)
}

// Ou apenas para o principal
const primaryEmail = customer.emails[0]
await sendInvoiceEmail(invoice, primaryEmail)
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Cliente Brasileiro

```typescript
{
  legal_name: 'Empresa Brasileira Ltda',
  trade_name: 'Empresa BR',
  country_code: 'BR',
  tax_id_type: 'CNPJ',
  tax_id: '12.345.678/0001-90',
  emails: [
    'financeiro@empresa.com.br',
    'contabilidade@empresa.com.br'
  ],
  phone: '+5511987654321',
  phone_country: 'BR',
  preferred_language: 'pt-BR'
}
```

### Exemplo 2: Cliente Americano

```typescript
{
  legal_name: 'American Company Inc',
  country_code: 'US',
  tax_id_type: 'EIN',
  tax_id: '12-3456789',
  emails: [
    'accounting@company.com',
    'finance@company.com',
    'cfo@company.com'
  ],
  phone: '+12345678900',
  phone_country: 'US',
  preferred_language: 'en-US'
}
```

### Exemplo 3: Cliente Espanhol

```typescript
{
  legal_name: 'Empresa Española S.L.',
  country_code: 'ES',
  tax_id_type: 'NIF',
  tax_id: 'B12345678',
  emails: [
    'administracion@empresa.es',
    'contabilidad@empresa.es'
  ],
  phone: '+34612345678',
  phone_country: 'ES',
  preferred_language: 'es-ES'
}
```

---

## 🎯 Benefícios

### Para o Usuário
- ✅ **Mais flexibilidade** ao cadastrar clientes
- ✅ **Interface intuitiva** e fácil de usar
- ✅ **Menos erros** com validação automática
- ✅ **Mais profissional** com tipos de documentos corretos por país

### Para o Sistema
- ✅ **Envio automático** de faturas para múltiplos destinatários
- ✅ **Dados mais precisos** com validação por país
- ✅ **Melhor organização** com campos estruturados
- ✅ **Preparado para crescimento** internacional

### Para o Futuro
- ✅ **Integração com APIs** de envio de e-mail
- ✅ **Automação** de comunicações
- ✅ **Relatórios** enviados automaticamente
- ✅ **Notificações** para múltiplos contatos

---

## 🔍 Validações Implementadas

### E-mails
- ✅ Formato válido de e-mail
- ✅ Sem duplicatas
- ✅ Limite de 5 e-mails
- ✅ Pelo menos 1 e-mail obrigatório

### Identificação Fiscal
- ✅ Tipos disponíveis baseados no país
- ✅ Descrição clara de cada tipo
- ✅ Atualização automática ao mudar país

### Telefone
- ✅ Formato internacional E.164
- ✅ País do telefone independente do país da empresa
- ✅ Validação em tempo real

---

## 📊 Estatísticas

- **104 países** suportados
- **50+ tipos** de identificação fiscal
- **5 e-mails** por cliente
- **3 idiomas** suportados (pt-BR, es-ES, en-US)
- **4 seções** organizadas no formulário

---

## 🔜 Próximos Passos

1. ✅ Aplicar Migration 09
2. ✅ Testar cadastro de clientes
3. ✅ Verificar validações
4. 🔜 Implementar envio automático de faturas
5. 🔜 Adicionar templates de e-mail
6. 🔜 Dashboard de comunicações

---

**Data de Criação**: 2025-11-01  
**Versão**: 2.0.0  
**Autor**: Sistema de Gestão Yve Beauty

