# 📋 Aplicar Migration 18 - Corrigir RLS do Audit Log

## 🎯 Objetivo

Corrigir políticas RLS da tabela `audit_log` para permitir INSERT pelo trigger `audit_row_change()`.
Este erro ocorre quando o trigger tenta inserir logs de auditoria mas a política RLS bloqueia.

## 🚀 Como Aplicar

1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo de `lib/supabase/migrations/18_fix_audit_log_rls.sql`
5. Cole e clique em **Run**
6. ✅ Deve aparecer: "Success. No rows returned"

## ✅ Verificação

Após aplicar, execute esta query para verificar as políticas:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'audit_log';
```

Você deve ver:
- `sel_audit` - SELECT para authenticated
- `insert_audit` - INSERT para authenticated

## 🔍 Problema Resolvido

**Antes**: Erro `42501: new row violates row-level security policy for table "audit_log"`

**Depois**: Trigger `audit_row_change()` pode inserir logs normalmente

## 📝 Observações

- As políticas foram simplificadas para melhor performance
- A validação de segurança está nas outras tabelas (branch, company, etc)
- Usuários autenticados podem inserir logs (necessário para o trigger)
- SELECT permite ver todos os logs (filtragem pode ser feita na aplicação se necessário)

---

**Data**: 2025-11-01  
**Migration**: 18  
**Status**: Pronto para aplicar

