# 🗄️ Database Migrations - Yve Gestión

## 📋 Ordem de Execução

Execute as migrations **NA ORDEM NUMÉRICA** no Supabase SQL Editor:

### ✅ **01_migration_inicial.sql**
- **Status:** Já executado (criação inicial do banco)
- **Descrição:** Schema completo do sistema
- **Tabelas:** 30+ tabelas criadas
- **RLS:** Policies iniciais configuradas
- **⚠️ NÃO EXECUTAR NOVAMENTE** (já foi aplicada)

### 🔄 **02_finalization_updates.sql**
- **Status:** 🟡 Pendente de execução
- **Descrição:** Adiciona campos faltantes para finalização
- **Mudanças:**
  - 18 campos na tabela `company` (logo, payment details)
  - Campo `description` em `accounts_payable` e `accounts_receivable`
  - Campos `fx_rate_source` e `fx_rate_timestamp` para conversão USD
  - Campo `notes` na tabela `invoice`
  - 6 índices de performance
- **⚠️ EXECUTAR ANTES da #03**

### 🔐 **03_fix_all_rls_policies.sql**
- **Status:** 🔴 CRÍTICO - Pendente de execução
- **Descrição:** Corrige policies de RLS para resolver erros 406/400
- **Mudanças:**
  - Re-abilita RLS na `user_profile`
  - Simplifica policy de `company` (permite SELECT sem restrição)
  - Otimiza policies de `accounts_receivable` e `accounts_payable`
  - Usa `auth.uid()` em vez de `jwt_company_id()` para melhor performance
- **⚠️ EXECUTAR APÓS a #02**
- **✅ Resolve:** Problemas de carregamento de dados nas tabelas

### 👤 **04_create_master_user.sql**
- **Status:** ✅ Já executado
- **Descrição:** Cria usuário master (andrebaggio@yvebeauty.com)
- **⚠️ NÃO EXECUTAR NOVAMENTE** (já foi aplicada)

---

## 🚀 Como Executar

### Passo 1: Acessar Supabase Dashboard
```
https://app.supabase.com → Seu Projeto → SQL Editor
```

### Passo 2: Executar Migration #02
1. Abra o arquivo `02_finalization_updates.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor
4. Clique em **Run** ou pressione **Ctrl+Enter**
5. Aguarde confirmação: ✅ Success

### Passo 3: Executar Migration #03
1. Abra o arquivo `03_fix_all_rls_policies.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor
4. Clique em **Run**
5. Aguarde confirmação: ✅ Success

### Passo 4: Verificar
```sql
-- Verificar que os campos foram adicionados
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'company' 
AND column_name IN ('logo_url', 'legal_name', 'bank_account_holder');

-- Verificar policies de RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('company', 'accounts_receivable', 'accounts_payable')
ORDER BY tablename, policyname;
```

---

## 🔍 Troubleshooting

### ❌ Erro: "column already exists"
**Solução:** O campo já foi adicionado antes. Continue com a próxima migration.

### ❌ Erro: "policy already exists"
**Solução:** Execute primeiro:
```sql
DROP POLICY IF EXISTS nome_da_policy ON tabela;
```
Depois execute novamente a migration.

### ❌ Erro: "permission denied"
**Solução:** Verifique se está logado como **postgres** (superuser) no Supabase.

---

## 📊 Status Atual

| Migration | Status | Executar? |
|-----------|--------|-----------|
| 01_migration_inicial.sql | ✅ Completo | ❌ Não |
| 02_finalization_updates.sql | 🟡 Pendente | ✅ Sim |
| 03_fix_all_rls_policies.sql | 🔴 Crítico | ✅ Sim |
| 04_create_master_user.sql | ✅ Completo | ❌ Não |

---

## 📝 Notas Importantes

- ⚠️ **Sempre faça backup** antes de executar migrations em produção
- ✅ As migrations são **idempotentes** (podem ser executadas múltiplas vezes)
- 🔒 Migrations #02 e #03 usam `IF NOT EXISTS` / `IF EXISTS` para segurança
- 📊 Após executar #03, todas as tabelas devem carregar dados corretamente

---

**Última Atualização:** Outubro 31, 2025  
**Versão:** 2.0.0

