# 🔐 Criar Políticas de Acesso para company-logos

## 🎯 Objetivo

Criar as 4 políticas de acesso necessárias para o bucket `company-logos` funcionar corretamente.

## ⚠️ Por Que Manualmente?

As políticas de `storage.objects` requerem permissões especiais que não estão disponíveis via SQL normal no Supabase. Elas precisam ser criadas via Dashboard ou usando a `service_role` key.

## 🚀 Como Criar Via Dashboard (Recomendado)

### Passo 1: Acessar Storage

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique no bucket **company-logos**

### Passo 2: Acessar Policies

1. Clique na aba **Policies** (ao lado de Files)
2. Você verá uma lista vazia ou com policies existentes

### Passo 3: Criar Policy 1 - INSERT (Upload)

1. Clique no botão **New Policy**
2. Selecione **For full customization**
3. Preencha:
   - **Policy name**: `Allow authenticated company logo uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'company-logos'
     ```
4. Clique em **Review**
5. Clique em **Save policy**

### Passo 4: Criar Policy 2 - SELECT (Read)

1. Clique em **New Policy** novamente
2. Selecione **For full customization**
3. Preencha:
   - **Policy name**: `Allow public company logo reads`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`, `authenticated` (selecione ambos)
   - **USING expression**:
     ```sql
     bucket_id = 'company-logos'
     ```
4. Clique em **Review**
5. Clique em **Save policy**

### Passo 5: Criar Policy 3 - UPDATE

1. Clique em **New Policy**
2. Selecione **For full customization**
3. Preencha:
   - **Policy name**: `Allow authenticated company logo updates`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     bucket_id = 'company-logos'
     ```
   - **WITH CHECK expression**:
     ```sql
     bucket_id = 'company-logos'
     ```
4. Clique em **Review**
5. Clique em **Save policy**

### Passo 6: Criar Policy 4 - DELETE

1. Clique em **New Policy**
2. Selecione **For full customization**
3. Preencha:
   - **Policy name**: `Allow authenticated company logo deletes`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     bucket_id = 'company-logos'
     ```
4. Clique em **Review**
5. Clique em **Save policy**

## ✅ Verificação

Após criar todas as 4 policies:

1. **Verifique na lista**:
   - Você deve ver 4 policies listadas
   - Cada uma com o nome correspondente

2. **Teste na aplicação**:
   - Acesse **Configurações** → **Empresa**
   - Salve os dados da empresa
   - Faça upload de um logo
   - Deve funcionar sem erro!

## 📋 Resumo das Policies

| Policy | Operation | Roles | Expression |
|--------|-----------|-------|------------|
| Allow authenticated company logo uploads | INSERT | authenticated | `bucket_id = 'company-logos'` |
| Allow public company logo reads | SELECT | public, authenticated | `bucket_id = 'company-logos'` |
| Allow authenticated company logo updates | UPDATE | authenticated | `bucket_id = 'company-logos'` |
| Allow authenticated company logo deletes | DELETE | authenticated | `bucket_id = 'company-logos'` |

## 🔧 Alternativa: Via SQL com service_role

Se você tem acesso à `service_role` key do Supabase, pode executar este SQL (use com cuidado, esta key tem acesso total):

```sql
-- IMPORTANTE: Execute isso apenas se tiver a service_role key
-- E use com MUITO cuidado, pois esta key tem acesso total!

-- Policy INSERT
CREATE POLICY "Allow authenticated company logo uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Policy SELECT
CREATE POLICY "Allow public company logo reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Policy UPDATE
CREATE POLICY "Allow authenticated company logo updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos')
WITH CHECK (bucket_id = 'company-logos');

-- Policy DELETE
CREATE POLICY "Allow authenticated company logo deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');
```

**⚠️ ATENÇÃO**: Não compartilhe a `service_role` key. Ela deve ser usada apenas em ambientes seguros.

## 🎯 Método Mais Simples (Recomendado)

Se você já tem o bucket criado, a forma mais fácil é usar o template do Supabase:

1. Vá em **Storage** → company-logos → **Policies**
2. Clique em **New Policy**
3. Use o template **"Give users access to own folder"** como base
4. Modifique para usar `bucket_id = 'company-logos'` em vez de `(bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`

Ou use as configurações detalhadas acima.

---

**Data**: 2025-11-01  
**Bucket**: `company-logos`  
**Status**: Policies devem ser criadas manualmente

