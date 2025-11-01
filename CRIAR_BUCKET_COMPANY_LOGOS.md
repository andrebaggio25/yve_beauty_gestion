# 📦 Criar Bucket para Logos da Empresa

## 🎯 Objetivo

Criar o bucket `company-logos` no Supabase Storage para armazenar os logos das empresas.

## 🚀 Como Criar - Passo a Passo

### ✅ Passo 1: Aplicar Migration 16 (Cria o Bucket)

A **Migration 16** cria apenas o bucket. As políticas devem ser criadas manualmente:

1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo de `lib/supabase/migrations/16_create_storage_policies_company_logos.sql`
5. Cole e clique em **Run**
6. ✅ O bucket será criado

### ✅ Passo 2: Criar Políticas Manualmente (OBRIGATÓRIO)

**⚠️ IMPORTANTE**: As políticas NÃO podem ser criadas via SQL normal.  
Elas devem ser criadas manualmente via Dashboard.

**Siga as instruções detalhadas em**: `CRIAR_POLICIES_COMPANY_LOGOS.md`

**Resumo rápido**:
1. Vá em **Storage** → **company-logos** → **Policies**
2. Clique em **New Policy** (4 vezes)
3. Crie as 4 policies conforme descrito no documento

### 🎯 Método Manual (Alternativa)

Se preferir criar manualmente:

### Passo 1: Acessar Storage

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

### Passo 2: Criar Novo Bucket

1. Clique no botão **New bucket**
2. Preencha os dados:
   - **Name**: `company-logos` (exatamente este nome)
   - **Public bucket**: ✅ Marque esta opção (para URLs públicas)
   - **File size limit**: `2097152` (2MB)
   - **Allowed MIME types**: `image/png,image/jpeg,image/jpg,image/svg+xml,image/webp`

3. Clique em **Create bucket**

### Passo 3: Configurar Políticas (Policies)

Após criar o bucket, você precisa configurar as políticas de acesso:

#### 3.1. Policy para Upload (INSERT)

1. Vá na aba **Policies** do bucket `company-logos`
2. Clique em **New Policy**
3. Selecione **For full customization**
4. Configure:

**Policy Name**: `Allow authenticated users to upload company logos`

**Allowed operation**: `INSERT`

**Target roles**: `authenticated`

**Policy definition** (SQL):
```sql
(bucket_id = 'company-logos'::text) AND (auth.role() = 'authenticated'::text)
```

**Check expression** (opcional):
```sql
true
```

#### 3.2. Policy para Leitura (SELECT)

**Policy Name**: `Allow public read access to company logos`

**Allowed operation**: `SELECT`

**Target roles**: `authenticated`, `anon` (público)

**Policy definition**:
```sql
bucket_id = 'company-logos'::text
```

#### 3.3. Policy para Atualização (UPDATE)

**Policy Name**: `Allow authenticated users to update company logos`

**Allowed operation**: `UPDATE`

**Target roles**: `authenticated`

**Policy definition**:
```sql
(bucket_id = 'company-logos'::text) AND (auth.role() = 'authenticated'::text)
```

#### 3.4. Policy para Deleção (DELETE)

**Policy Name**: `Allow authenticated users to delete company logos`

**Allowed operation**: `DELETE`

**Target roles**: `authenticated`

**Policy definition**:
```sql
(bucket_id = 'company-logos'::text) AND (auth.role() = 'authenticated'::text)
```

## 🔐 Alternativa: Via SQL

Se preferir criar via SQL Editor:

```sql
-- Criar o bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Política para INSERT (upload)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Política para SELECT (leitura pública)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Política para UPDATE
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos')
WITH CHECK (bucket_id = 'company-logos');

-- Política para DELETE
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');
```

## ⚠️ IMPORTANTE: Corrigir o Path no Código

O código foi corrigido para não duplicar o nome do bucket no path:

**Antes** (❌ Errado):
```typescript
const filePath = `company-logos/${fileName}` // Duplica o bucket
```

**Depois** (✅ Correto):
```typescript
const filePath = fileName // Apenas o nome do arquivo
```

O `.from('company-logos')` já especifica o bucket!

## ✅ Verificação

Após criar o bucket e aplicar as políticas:

1. **Verificar o bucket**:
   - Vá em **Storage** → **company-logos**
   - Deve aparecer na lista

2. **Verificar as policies**:
   - Vá em **Storage** → **company-logos** → **Policies**
   - Devem aparecer 4 policies (INSERT, SELECT, UPDATE, DELETE)

3. **Teste na Aplicação**:
   - Acesse **Configurações** → **Empresa**
   - Salve os dados primeiro
   - Tente fazer upload de um logo
   - Deve funcionar sem erro de RLS

## 📝 Notas Importantes

### Limites Recomendados

- **Tamanho máximo**: 2MB (2097152 bytes)
- **Tipos permitidos**: PNG, JPG, JPEG, SVG, WebP
- **Resolução recomendada**: 200x200px a 500x500px

### Estrutura de Arquivos

Os logos serão salvos com o seguinte padrão:
```
company-logos/
  └── {company_id}-logo.{ext}
```

Exemplo: `company-logos/123e4567-e89b-12d3-a456-426614174000-logo.png`

### URL Pública

Após o upload, a URL será gerada automaticamente:
```
https://{project}.supabase.co/storage/v1/object/public/company-logos/{company_id}-logo.{ext}
```

## 🔧 Troubleshooting

### Erro: "Bucket not found"

**Solução**: O bucket ainda não foi criado. Siga os passos acima.

### Erro: "new row violates row-level security policy"

**Solução**: As policies de INSERT não foram criadas. Configure as policies conforme passo 3.

### Erro: "File size exceeds limit"

**Solução**: O arquivo é maior que 2MB. Comprima a imagem antes de fazer upload.

### Erro: "MIME type not allowed"

**Solução**: Configure os tipos MIME permitidos no bucket ou remova a restrição.

## 📚 Referências

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

**Data**: 2025-11-01  
**Bucket**: `company-logos`  
**Tipo**: Público (Public bucket)  
**Status**: Pronto para criar

