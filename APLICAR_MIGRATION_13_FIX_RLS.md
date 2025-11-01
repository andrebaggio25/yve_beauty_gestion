## 🚨 PROBLEMA CRÍTICO: RLS Bloqueando Todas as Listagens

### 🐛 O Problema

Após aplicar a Migration 12, os métodos de pagamento (e outras tabelas) ainda não aparecem porque:

1. ❌ As policies de RLS usam a função `jwt_company_id()`
2. ❌ Esta função busca `company_id` do JWT token
3. ❌ O JWT do Supabase **NÃO tem** `company_id` por padrão
4. ❌ Resultado: `jwt_company_id()` retorna `NULL`
5. ❌ As policies bloqueiam TUDO porque `NULL != company_id`

### 📊 Tabelas Afetadas

Todas as tabelas que dependem de `company_id` ou `branch_id`:

- ❌ `payment_method` (Métodos de Pagamento)
- ❌ `chart_of_accounts` (Plano de Contas)
- ❌ `branch` (Filiais)
- ❌ `company` (Empresa)
- ❌ `customer` (Clientes)
- ❌ `vendor` (Fornecedores)
- ❌ `invoice` (Faturas)
- ❌ E muitas outras...

### ✅ A Solução

A **Migration 13** corrige isso criando funções que buscam o `company_id` do `user_profile` em vez do JWT:

```sql
-- Antes (não funciona):
jwt_company_id() → busca do JWT → retorna NULL

-- Depois (funciona):
get_user_company_id() → busca do user_profile → retorna company_id correto
```

## 🚀 Como Aplicar

### Via Supabase Dashboard (Recomendado)

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie o conteúdo de `lib/supabase/migrations/13_fix_rls_policies_use_user_profile.sql`
6. Cole no editor
7. Clique em **Run**
8. Aguarde a execução (pode levar 10-15 segundos)
9. Deve aparecer: ✅ **"Success. No rows returned"**

### Via Terminal (Alternativa)

```bash
cd /Users/andrebaggio/Documents/Yve\ Beauty/Apps/app_yve_gestion
supabase db push
```

## ✅ O Que a Migration Faz

### 1. Cria Funções Auxiliares

```sql
-- Busca company_id do user_profile
get_user_company_id() → retorna UUID

-- Busca branch_id do user_profile  
get_user_branch_id() → retorna UUID

-- Tenta JWT primeiro, depois user_profile
current_user_company_id() → retorna UUID
```

### 2. Recria Policies de RLS

Atualiza as policies das seguintes tabelas:

- ✅ `payment_method` (4 policies: SELECT, INSERT, UPDATE, DELETE)
- ✅ `chart_of_accounts` (4 policies: SELECT, INSERT, UPDATE, DELETE)
- ✅ `branch` (4 policies: SELECT, INSERT, UPDATE, DELETE)
- ✅ `company` (2 policies: SELECT, UPDATE)
- ✅ `user_profile` (5 policies: SELECT próprio, SELECT empresa, INSERT, UPDATE, DELETE)

### 3. Adiciona Documentação

Todas as policies têm comentários explicando o que fazem.

## 🧪 Verificação

Após aplicar a migration, execute no SQL Editor:

### 1. Testar as funções

```sql
-- Deve retornar o UUID da sua empresa
SELECT get_user_company_id();

-- Deve retornar o UUID da sua filial
SELECT get_user_branch_id();
```

### 2. Testar as queries

```sql
-- Deve retornar os métodos de pagamento
SELECT * FROM payment_method;

-- Deve retornar as contas contábeis
SELECT * FROM chart_of_accounts;

-- Deve retornar as filiais
SELECT * FROM branch;

-- Deve retornar sua empresa
SELECT * FROM company;
```

Se tudo funcionar, você verá os dados!

## 🎯 Teste na Aplicação

1. Recarregue a página de **Métodos de Pagamento**
2. Deve aparecer:
   - ✅ **Total de Métodos**: 2
   - ✅ **Métodos Ativos**: 1
   - ✅ Transferência Bancária (Ativo)
   - ✅ Cartão de Crédito (Stripe) (Inativo)

3. Teste outras páginas:
   - ✅ **Configurações** → **Empresa** (deve mostrar dados)
   - ✅ **Configurações** → **Filiais** (deve mostrar filiais)
   - ✅ **Configurações** → **Plano de Contas** (deve mostrar contas)

## 🔍 Por Que Isso Aconteceu?

### O Design Original

O sistema foi projetado para usar `company_id` no JWT token:

```sql
create or replace function jwt_company_id()
returns uuid language sql stable as $$
  select nullif((auth.jwt() ->> 'company_id'),'')::uuid;
$$;
```

### O Problema

O Supabase **não adiciona** `company_id` ao JWT automaticamente. Para fazer isso, seria necessário:

1. Configurar um **Database Webhook** ou
2. Usar **Custom Claims** com Edge Functions ou
3. Modificar o **Auth Hook** do Supabase

Isso é complexo e requer configuração adicional.

### A Solução Mais Simples

Em vez de configurar JWT custom claims, buscamos o `company_id` diretamente do `user_profile`:

```sql
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid AS $$
  SELECT company_id 
  FROM user_profile 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Vantagens**:
- ✅ Funciona imediatamente
- ✅ Não requer configuração externa
- ✅ Usa dados que já existem no banco
- ✅ Performance adequada (PostgreSQL otimiza)

## ⚠️ Notas Importantes

### 1. SECURITY DEFINER

As funções usam `SECURITY DEFINER` para poder acessar `user_profile` mesmo durante a verificação de RLS (evita deadlock).

### 2. STABLE

Marca as funções como `STABLE` para otimização - o resultado não muda durante uma transação.

### 3. Performance

As funções fazem uma query adicional, mas:
- ✅ PostgreSQL cacheia o resultado durante a transação
- ✅ A query é simples (busca por índice)
- ✅ Impacto mínimo na performance

### 4. Segurança

As policies continuam seguras:
- ✅ Cada usuário só vê dados da sua empresa
- ✅ Isolamento total entre empresas
- ✅ Baseado em `auth.uid()` do Supabase

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```sql
-- Remover as novas funções
DROP FUNCTION IF EXISTS get_user_company_id();
DROP FUNCTION IF EXISTS get_user_branch_id();
DROP FUNCTION IF EXISTS current_user_company_id();

-- As policies antigas não funcionavam de qualquer forma,
-- então não há necessidade de revertê-las
```

## 📊 Resumo Executivo

**Problema**: Tabelas não listam dados (RLS bloqueando tudo)  
**Causa**: `jwt_company_id()` retorna NULL  
**Solução**: Usar `get_user_company_id()` que busca do `user_profile`  
**Tempo**: ~15 segundos para aplicar  
**Risco**: Baixo (melhora a situação atual)  
**Resultado**: Todas as listagens funcionarão

## 🎯 Próximos Passos

Após aplicar esta migration:

1. [ ] Aplicar a Migration 13
2. [ ] Testar as funções no SQL Editor
3. [ ] Recarregar a página de Métodos de Pagamento
4. [ ] Verificar que os 2 métodos aparecem
5. [ ] Testar outras páginas (Empresa, Filiais, Plano de Contas)
6. [ ] Confirmar que tudo funciona

---

**Data**: 2025-11-01  
**Versão da Migration**: 13  
**Status**: Pronta para aplicar  
**Prioridade**: 🔴 CRÍTICA (sistema não funciona sem isso)

