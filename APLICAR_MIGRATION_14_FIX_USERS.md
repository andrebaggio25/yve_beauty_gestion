# Migration 14: Corrigir Listagem de Usuários

## 🐛 Problema

A página de **Usuários** não mostra nenhum usuário, mesmo tendo 1 usuário ativo no sistema.

## 🔍 Causa

1. As policies de RLS em `user_profile` estão muito restritivas
2. Faltam campos na tabela `user_profile` que a interface espera
3. O campo `email` não está sendo sincronizado de `auth.users`

## ✅ Solução

A **Migration 14** corrige:

1. ✅ Recria policies de RLS para permitir ver usuários da mesma empresa
2. ✅ Adiciona campos faltantes: `email`, `full_name`, `role`, `is_active`, `last_sign_in_at`
3. ✅ Cria trigger para sincronizar `email` automaticamente de `auth.users`
4. ✅ Atualiza emails existentes que estão NULL

## 🚀 Como Aplicar

### Via Supabase Dashboard

1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo de `lib/supabase/migrations/14_fix_user_profile_rls_for_listing.sql`
5. Cole no editor
6. Clique em **Run**
7. Aguarde a execução
8. Deve aparecer: ✅ **"Success. No rows returned"**

## ✅ O Que a Migration Faz

### 1. Corrige Policies de RLS

```sql
-- Policy unificada que permite:
-- a) Ver o próprio perfil
-- b) Ver perfis de usuários da mesma empresa
CREATE POLICY select_user_profiles ON user_profile
FOR SELECT USING (
  auth_user_id = auth.uid() OR company_id = get_user_company_id()
);
```

### 2. Adiciona Campos Faltantes

```sql
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS:
- email TEXT
- full_name TEXT
- role TEXT DEFAULT 'user'
- is_active BOOLEAN DEFAULT true
- last_sign_in_at TIMESTAMPTZ
```

### 3. Sincroniza Email Automaticamente

```sql
-- Cria trigger que busca email de auth.users
CREATE TRIGGER trg_sync_user_profile_email
  BEFORE INSERT OR UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_email();
```

### 4. Atualiza Emails Existentes

```sql
-- Popula emails que estão NULL
UPDATE user_profile up
SET email = au.email
FROM auth.users au
WHERE up.auth_user_id = au.id AND up.email IS NULL;
```

## 🧪 Verificação

Após aplicar a migration, execute no SQL Editor:

```sql
-- Deve retornar o usuário com email preenchido
SELECT 
  id,
  auth_user_id,
  email,
  full_name,
  role,
  is_active,
  company_id,
  branch_id
FROM user_profile;
```

## 🎯 Teste na Aplicação

1. Recarregue a página de **Usuários** (`/settings/users`)
2. Deve aparecer:
   - ✅ **Total de Usuários**: 1
   - ✅ **Usuários Ativos**: 1
   - ✅ Seu usuário na tabela com email e informações

## 📊 Estrutura Final da Tabela

Após a migration, `user_profile` terá:

```
user_profile
├── id (uuid, PK)
├── auth_user_id (uuid, FK para auth.users)
├── company_id (uuid, FK)
├── branch_id (uuid, FK)
├── email (text) ← NOVO
├── full_name (text) ← NOVO
├── role (text, default 'user') ← NOVO
├── is_active (boolean, default true) ← NOVO
├── last_sign_in_at (timestamptz) ← NOVO
├── preferred_locale (text)
├── is_master (boolean)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

## 🎨 Correções Visuais Aplicadas

Além da migration, foram corrigidas as cores das tabelas:

### Métodos de Pagamento
- ✅ Header: `bg-gray-50` (era `bg-slate-700`)
- ✅ Badges ativos: `bg-green-100 text-green-700` (era `bg-green-900 text-green-200`)
- ✅ Badges inativos: `bg-gray-100 text-gray-600` (era `bg-slate-700 text-gray-600`)
- ✅ Hover: `hover:bg-gray-50` (era `hover:bg-gray-100`)

### Moedas
- ✅ Badges ativos: `bg-green-100 text-green-700` (era `bg-green-900 text-green-200`)
- ✅ Badges inativos: `bg-gray-100 text-gray-600` (era `bg-slate-700 text-gray-600`)

## ⚠️ Notas Importantes

### 1. SECURITY DEFINER

A função `sync_user_profile_email()` usa `SECURITY DEFINER` para poder acessar `auth.users` (que é uma tabela protegida do Supabase).

### 2. Trigger Automático

O trigger sincroniza o email automaticamente sempre que:
- Um novo `user_profile` é criado
- Um `user_profile` é atualizado

### 3. Campos Opcionais

Os campos `full_name` e `last_sign_in_at` podem ficar NULL se não estiverem disponíveis.

### 4. Role Padrão

Novos usuários recebem `role = 'user'` por padrão. Você pode mudar para:
- `'user'` - Usuário comum
- `'manager'` - Gerente
- `'admin'` - Administrador

## 🔄 Próximos Passos

Após aplicar a migration:

1. [ ] Aplicar a Migration 14
2. [ ] Verificar que o email foi sincronizado
3. [ ] Recarregar a página de Usuários
4. [ ] Confirmar que o usuário aparece
5. [ ] Verificar as cores das tabelas de Métodos de Pagamento e Moedas

---

**Data**: 2025-11-01  
**Versão da Migration**: 14  
**Status**: Pronta para aplicar  
**Prioridade**: 🟡 Alta (funcionalidade importante)

