# 📋 Ordem de Aplicação das Migrations - Sistema de Telefone

## ⚠️ IMPORTANTE: Ordem Correta

As migrations devem ser aplicadas **nesta ordem exata** para evitar erros:

## 🔢 Ordem de Aplicação

### 1️⃣ Migration 05: Criar Tabela Employee
**Arquivo**: `lib/supabase/migrations/05_create_employee_table.sql`

**O que faz**:
- Cria a tabela `employee` com todos os campos necessários
- Inclui o campo `phone_country` desde o início
- Cria enum `contract_type`
- Adiciona índices e triggers

**Status**: ✅ Aplicar primeiro

---

### 2️⃣ Migration 06: Adicionar Funções de Validação
**Arquivo**: `lib/supabase/migrations/06_add_phone_country_fields.sql`

**O que faz**:
- Cria função `is_valid_international_phone()` para validação
- Cria função `extract_country_from_phone()` para extrair país
- Adiciona constraint de validação em `employee.phone`
- Cria índice em `employee.phone_country`
- Cria view `employee_with_formatted_phone`

**Status**: ✅ Aplicar em segundo

---

### 3️⃣ Migration 07: Adicionar Phone na Tabela Customer
**Arquivo**: `lib/supabase/migrations/07_add_phone_country_to_customer.sql`

**O que faz**:
- Adiciona campo `phone` na tabela `customer`
- Adiciona campo `phone_country` na tabela `customer`
- Adiciona campos `email`, `website`, `is_active`
- Adiciona constraint de validação usando a função criada na migration 06
- Cria índices

**Status**: ✅ Aplicar em terceiro

---

### 4️⃣ Migration 08: Atualizar Estrutura Customer
**Arquivo**: `lib/supabase/migrations/08_update_customer_table_structure.sql`

**O que faz**:
- Adiciona campos de endereço (`state_code`, `city`, `address`, `postal_code`)
- Cria enum `tax_id_type`
- Adiciona campo `tax_id_type`
- Adiciona campo `preferred_language`
- Cria índices adicionais

**Status**: ✅ Aplicar em quarto

---

### 5️⃣ Migration 09: Adicionar Múltiplos E-mails
**Arquivo**: `lib/supabase/migrations/09_add_emails_to_customer.sql`

**O que faz**:
- Adiciona campo `emails` (JSONB) para armazenar array de e-mails
- Cria função `validate_emails_array()` para validação
- Cria função `get_primary_email()` para obter e-mail principal
- Cria função `get_secondary_emails()` para obter e-mails secundários
- Cria view `customer_with_emails` para facilitar consultas
- Migra e-mail existente para o array

**Status**: ✅ Aplicar em quinto

---

### 6️⃣ Migration 10: Tax ID Type para Employee
**Arquivo**: `lib/supabase/migrations/10_add_tax_id_type_to_employee.sql`

**O que faz**:
- Adiciona campo `tax_id_type` na tabela `employee`
- Permite identificação fiscal dinâmica por país (como nos clientes)
- Suporta CPF/CNPJ, EIN/SSN, NIF, VAT, etc.

**Status**: ✅ Aplicar em sexto

---

### 7️⃣ Migration 11: Sistema de Provisões Vinculadas
**Arquivo**: `lib/supabase/migrations/11_link_provisions_to_employees.sql`

**O que faz**:
- Adiciona campo `employee_id` na tabela `provision`
- Adiciona campo `contract_value_at_time` para histórico
- Cria função `create_employee_provisions()` para criar provisões mensais
- Cria função `update_future_provisions()` para atualizar provisões futuras
- Cria função `delete_future_provisions()` para deletar provisões
- Cria trigger automático para atualizar provisões quando contrato muda
- Cria view `employee_provisions_summary` para resumos

**Status**: ✅ Aplicar em sétimo

---

### 8️⃣ Migration 12: Atualizar Estrutura Payment Method
**Arquivo**: `lib/supabase/migrations/12_update_payment_method_table.sql`

**O que faz**:
- Cria enum `payment_method_type` com tipos de pagamento
- Adiciona campos `name`, `type`, `is_active`, `requires_approval`, `default_account_id`
- Migra dados existentes de `code` para `name` e `type`
- Migra campo `active` para `is_active`
- Atualiza índices da tabela
- Mantém campos legados para compatibilidade

**Status**: ✅ Aplicar em oitavo

---

### 9️⃣ Migration 13: Corrigir RLS Policies (CRÍTICO)
**Arquivo**: `lib/supabase/migrations/13_fix_rls_policies_use_user_profile.sql`

**O que faz**:
- Cria função `get_user_company_id()` que busca company_id do user_profile
- Cria função `get_user_branch_id()` que busca branch_id do user_profile
- Recria policies de RLS para usar as novas funções
- Corrige policies de: payment_method, chart_of_accounts, branch, company, user_profile
- **ESSENCIAL**: Sem esta migration, nenhuma listagem funciona!

**Status**: 🔴 CRÍTICO - Aplicar em nono (logo após a 12)

---

## 🚀 Como Aplicar

### Passo 1: Acessar Supabase Dashboard
1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá para **SQL Editor**

### Passo 2: Aplicar Migration 05
1. Clique em **New Query**
2. Cole o conteúdo de `05_create_employee_table.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 3: Aplicar Migration 06
1. Clique em **New Query**
2. Cole o conteúdo de `06_add_phone_country_fields.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 4: Aplicar Migration 07
1. Clique em **New Query**
2. Cole o conteúdo de `07_add_phone_country_to_customer.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 5: Aplicar Migration 08
1. Clique em **New Query**
2. Cole o conteúdo de `08_update_customer_table_structure.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 6: Aplicar Migration 09
1. Clique em **New Query**
2. Cole o conteúdo de `09_add_emails_to_customer.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 7: Aplicar Migration 10
1. Clique em **New Query**
2. Cole o conteúdo de `10_add_tax_id_type_to_employee.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 8: Aplicar Migration 11
1. Clique em **New Query**
2. Cole o conteúdo de `11_link_provisions_to_employees.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 9: Aplicar Migration 12
1. Clique em **New Query**
2. Cole o conteúdo de `12_update_payment_method_table.sql`
3. Clique em **Run**
4. Verifique se não há erros

### Passo 10: Aplicar Migration 13 (CRÍTICO)
1. Clique em **New Query**
2. Cole o conteúdo de `13_fix_rls_policies_use_user_profile.sql`
3. Clique em **Run**
4. Aguarde 10-15 segundos (esta migration é maior)
5. Verifique se não há erros
6. **IMPORTANTE**: Esta migration é essencial para que as listagens funcionem!

---

## ✅ Verificação

Após aplicar todas as migrations, execute estas queries para verificar:

### Verificar Tabela Employee
```sql
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee' 
  AND column_name IN ('phone', 'phone_country', 'country_code')
ORDER BY ordinal_position;
```

**Resultado esperado**:
```
phone        | text | null | YES
phone_country| text | 'BR' | YES
country_code | text | null | YES
```

### Verificar Tabela Customer
```sql
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer' 
  AND column_name IN ('phone', 'phone_country', 'email', 'website', 'is_active')
ORDER BY ordinal_position;
```

**Resultado esperado**:
```
phone        | text    | null  | YES
phone_country| text    | 'BR'  | YES
email        | text    | null  | YES
website      | text    | null  | YES
is_active    | boolean | true  | NO
```

### Verificar Tabela Payment Method
```sql
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_method' 
  AND column_name IN ('name', 'type', 'is_active', 'requires_approval')
ORDER BY ordinal_position;
```

**Resultado esperado**:
```
name               | text                 | null  | NO
type               | payment_method_type  | null  | NO
is_active          | boolean              | true  | NO
requires_approval  | boolean              | false | NO
```

### Verificar Funções
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('is_valid_international_phone', 'extract_country_from_phone')
ORDER BY routine_name;
```

**Resultado esperado**:
```
extract_country_from_phone     | FUNCTION
is_valid_international_phone   | FUNCTION
```

### Testar Validação
```sql
SELECT 
  is_valid_international_phone('+5511987654321') AS valid_br,
  is_valid_international_phone('+1234567890') AS valid_us,
  is_valid_international_phone('11987654321') AS invalid;
```

**Resultado esperado**:
```
valid_br | valid_us | invalid
---------|----------|--------
true     | true     | false
```

---

## 🐛 Troubleshooting

### Erro: "relation employee already exists"
**Solução**: A tabela já existe. Pule a migration 05 ou delete a tabela primeiro:
```sql
DROP TABLE IF EXISTS employee CASCADE;
```

### Erro: "function is_valid_international_phone already exists"
**Solução**: A função já existe. Pule a migration 06 ou delete a função primeiro:
```sql
DROP FUNCTION IF EXISTS is_valid_international_phone(text);
DROP FUNCTION IF EXISTS extract_country_from_phone(text);
```

### Erro: "column phone does not exist"
**Solução**: Certifique-se de aplicar a migration 07 que adiciona o campo `phone` antes de tentar usá-lo.

### Erro: "type tax_id_type already exists"
**Solução**: O enum já existe. A migration usa `IF NOT EXISTS`, então isso não deve acontecer. Se acontecer, ignore o erro.

---

## 📊 Resumo das Mudanças

### Tabela Employee
**Campos adicionados**:
- `phone_country` (text, default 'BR')

**Constraints**:
- `employee_phone_format_check`: Valida formato E.164

**Índices**:
- `idx_employee_phone_country`: Melhora busca por país

### Tabela Customer
**Campos adicionados**:
- `phone` (text)
- `phone_country` (text, default 'BR')
- `email` (text)
- `website` (text)
- `is_active` (boolean, default true)
- `state_code` (text)
- `city` (text)
- `address` (text)
- `postal_code` (text)
- `tax_id_type` (enum)
- `preferred_language` (text, default 'pt-BR')

**Constraints**:
- `customer_phone_format_check`: Valida formato E.164
- `customer_preferred_language_check`: Valida idioma

**Índices**:
- `idx_customer_phone_country`: Melhora busca por país do telefone
- `idx_customer_email`: Melhora busca por email
- `idx_customer_active`: Melhora busca por status ativo
- `idx_customer_country`: Melhora busca por país
- `idx_customer_state`: Melhora busca por estado
- `idx_customer_city`: Melhora busca por cidade
- `idx_customer_tax_id`: Melhora busca por tax_id

### Funções Criadas
1. **`is_valid_international_phone(text)`**
   - Valida se um número está no formato E.164
   - Retorna: boolean

2. **`extract_country_from_phone(text)`**
   - Extrai o código do país de um número E.164
   - Retorna: text (código do país) ou null

### Views Criadas
1. **`employee_with_formatted_phone`**
   - Mostra employees com telefone formatado
   - Inclui país detectado automaticamente

---

## 📝 Notas Importantes

1. **Ordem é crucial**: As migrations devem ser aplicadas na ordem especificada
2. **Backup**: Sempre faça backup antes de aplicar migrations em produção
3. **Testes**: Teste em ambiente de desenvolvimento primeiro
4. **Dados existentes**: As migrations incluem comandos para converter dados existentes
5. **Rollback**: Se algo der errado, você pode reverter usando as queries de troubleshooting

---

## 🎯 Próximos Passos

Após aplicar todas as migrations:

1. ✅ Verificar estrutura das tabelas
2. ✅ Testar funções de validação
3. ✅ Testar cadastro de funcionários
4. ✅ Testar cadastro de clientes
5. ✅ Verificar exibição de telefones nas listagens
6. 🔜 Implementar integração com WhatsApp

---

**Data de Criação**: 2025-11-01  
**Versão**: 1.0.0  
**Autor**: Sistema de Gestão Yve Beauty

