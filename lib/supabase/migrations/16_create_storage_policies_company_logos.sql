-- =====================================================
-- Migration 16: Create Storage Bucket for company-logos
-- =====================================================
-- Objetivo: Criar o bucket company-logos para armazenar logos
-- NOTA: As políticas devem ser criadas manualmente via Dashboard
--       ou usando service_role key (veja instruções abaixo)
-- =====================================================

-- 1. Criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true, -- Bucket público para URLs públicas
  2097152, -- 2MB limite
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

-- =====================================================
-- IMPORTANTE: Criar Políticas Manualmente
-- =====================================================
-- 
-- As políticas de storage.objects requerem permissões especiais.
-- Você precisa criá-las manualmente via Dashboard ou usando service_role.
--
-- MÉTODO 1: Via Dashboard (Recomendado)
-- 1. Acesse Storage → company-logos → Policies
-- 2. Clique em "New Policy"
-- 3. Use as configurações abaixo para cada policy
--
-- MÉTODO 2: Via SQL com service_role (Avançado)
-- Execute o SQL abaixo usando a service_role key do Supabase:
--
-- =====================================================
-- POLÍTICAS A CRIAR MANUALMENTE
-- =====================================================
--
-- POLICY 1: INSERT (Upload)
-- Name: "Allow authenticated company logo uploads"
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition: 
--   (bucket_id = 'company-logos')
-- Check expression:
--   (bucket_id = 'company-logos')
--
-- POLICY 2: SELECT (Read)
-- Name: "Allow public company logo reads"
-- Operation: SELECT
-- Target roles: public, authenticated
-- Policy definition:
--   (bucket_id = 'company-logos')
--
-- POLICY 3: UPDATE
-- Name: "Allow authenticated company logo updates"
-- Operation: UPDATE
-- Target roles: authenticated
-- Policy definition:
--   (bucket_id = 'company-logos')
-- Check expression:
--   (bucket_id = 'company-logos')
--
-- POLICY 4: DELETE
-- Name: "Allow authenticated company logo deletes"
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition:
--   (bucket_id = 'company-logos')
--
-- =====================================================

-- =====================================================
-- Verificação
-- =====================================================
-- Execute estas queries para verificar:

-- Ver se o bucket existe
-- SELECT name, public, file_size_limit 
-- FROM storage.buckets 
-- WHERE name = 'company-logos';

-- Ver as policies criadas
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'objects' 
--   AND policyname LIKE '%company logo%';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. Bucket Público: O bucket está marcado como público (public = true)
--    Isso permite que as URLs geradas sejam acessíveis publicamente
--
-- 2. Políticas Simples: As políticas são simples para facilitar o uso
--    Qualquer usuário autenticado pode fazer upload/update/delete
--    Qualquer pessoa (incluindo não autenticados) pode ler
--
-- 3. Se precisar de mais segurança, você pode:
--    - Adicionar verificação de company_id nos arquivos
--    - Restringir DELETE apenas para usuários específicos
--    - Adicionar validação de tamanho adicional
--
-- 4. Limite de tamanho: 2MB (2097152 bytes)
--    Tipos permitidos: PNG, JPEG, JPG, SVG, WebP
--
-- =====================================================

