# 📋 Aplicar Migration 17 - Atualizar Tabela Branch

## 🎯 Objetivo

Adicionar campos faltantes na tabela `branch` para suportar:
- Código da filial
- Endereço completo (linha 1, linha 2, cidade, estado, CEP)
- Telefone com país independente
- Email
- Identificação fiscal (tax_id, tax_id_type)
- Flag de matriz (is_headquarters)
- Campo is_active (renomeado de active)

## 🚀 Como Aplicar

1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo de `lib/supabase/migrations/17_update_branch_table_fields.sql`
5. Cole e clique em **Run**
6. ✅ Deve aparecer: "Success. No rows returned"

## ✅ Verificação

Após aplicar, execute esta query para verificar os novos campos:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'branch'
ORDER BY ordinal_position;
```

Você deve ver os seguintes campos adicionados:
- `code` (text)
- `is_headquarters` (boolean)
- `address_line1` (text)
- `address_line2` (text)
- `city` (text)
- `state` (text)
- `postal_code` (text)
- `phone` (text)
- `phone_country` (text)
- `email` (text)
- `tax_id` (text)
- `tax_id_type` (text)
- `is_active` (boolean)

## 📝 Observações

- Os campos são opcionais (nullable), exceto `is_headquarters` e `is_active` que têm defaults
- O índice único `uq_branch_company_code` garante que não haverá códigos duplicados por empresa
- A migration é idempotente (pode ser executada múltiplas vezes)

---

**Data**: 2025-11-01  
**Migration**: 17  
**Status**: Pronto para aplicar

