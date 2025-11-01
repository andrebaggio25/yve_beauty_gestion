-- =====================================================
-- Migration 14: Fix user_profile RLS for Listing
-- =====================================================
-- Problema: A página de usuários não mostra nenhum usuário
-- Causa: As policies de user_profile podem estar muito restritivas
-- Solução: Garantir que usuários possam ver outros usuários da mesma empresa
-- =====================================================

-- 1. Remover policies existentes que podem estar causando conflito
DROP POLICY IF EXISTS select_own_profile ON user_profile;
DROP POLICY IF EXISTS select_company_profiles ON user_profile;

-- 2. Criar policy unificada para SELECT que permite:
--    a) Ver o próprio perfil (usando auth.uid())
--    b) Ver perfis de usuários da mesma empresa (usando get_user_company_id())
CREATE POLICY select_user_profiles ON user_profile
FOR SELECT
TO authenticated
USING (
  -- Pode ver o próprio perfil
  auth_user_id = auth.uid()
  OR
  -- Pode ver perfis da mesma empresa
  company_id = get_user_company_id()
);

COMMENT ON POLICY select_user_profiles ON user_profile IS 'Permite ver próprio perfil e perfis de usuários da mesma empresa';

-- 3. Verificar se as outras policies existem e estão corretas
DROP POLICY IF EXISTS insert_user_profile ON user_profile;
DROP POLICY IF EXISTS update_user_profile ON user_profile;
DROP POLICY IF EXISTS delete_user_profile ON user_profile;

CREATE POLICY insert_user_profile ON user_profile
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY update_user_profile ON user_profile
FOR UPDATE
TO authenticated
USING (
  -- Pode atualizar próprio perfil ou perfis da mesma empresa
  auth_user_id = auth.uid()
  OR
  company_id = get_user_company_id()
)
WITH CHECK (
  -- Não pode mudar para outra empresa
  company_id = get_user_company_id()
);

CREATE POLICY delete_user_profile ON user_profile
FOR DELETE
TO authenticated
USING (
  -- Só pode deletar perfis da mesma empresa (não pode deletar o próprio)
  company_id = get_user_company_id()
  AND auth_user_id != auth.uid()
);

-- =====================================================
-- 4. ADICIONAR CAMPOS FALTANTES EM USER_PROFILE
-- =====================================================

-- A interface User espera estes campos, vamos garantir que existem
ALTER TABLE user_profile 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_is_active ON user_profile(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profile_role ON user_profile(role);

-- =====================================================
-- 5. POPULAR CAMPOS DE EMAIL (se ainda não estiverem)
-- =====================================================

-- Atualizar email do user_profile com o email do auth.users
-- Isso requer uma função que busca do auth.users
CREATE OR REPLACE FUNCTION sync_user_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Quando um novo user_profile é criado, buscar email do auth.users
  IF NEW.email IS NULL AND NEW.auth_user_id IS NOT NULL THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.auth_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar email automaticamente
DROP TRIGGER IF EXISTS trg_sync_user_profile_email ON user_profile;
CREATE TRIGGER trg_sync_user_profile_email
  BEFORE INSERT OR UPDATE ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_email();

-- Atualizar emails existentes que estão NULL
UPDATE user_profile up
SET email = au.email
FROM auth.users au
WHERE up.auth_user_id = au.id
  AND up.email IS NULL;

-- =====================================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN user_profile.email IS 'Email do usuário (sincronizado de auth.users)';
COMMENT ON COLUMN user_profile.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN user_profile.role IS 'Papel do usuário no sistema (user, manager, admin)';
COMMENT ON COLUMN user_profile.is_active IS 'Indica se o usuário está ativo';
COMMENT ON COLUMN user_profile.last_sign_in_at IS 'Data/hora do último login';

COMMENT ON POLICY select_user_profiles ON user_profile IS 'Permite ver próprio perfil e perfis da mesma empresa';
COMMENT ON POLICY insert_user_profile ON user_profile IS 'Permite inserir usuários na mesma empresa';
COMMENT ON POLICY update_user_profile ON user_profile IS 'Permite atualizar próprio perfil ou perfis da mesma empresa';
COMMENT ON POLICY delete_user_profile ON user_profile IS 'Permite deletar usuários da mesma empresa (exceto próprio)';

-- =====================================================
-- 7. VERIFICAÇÃO
-- =====================================================

-- Para testar, execute como usuário autenticado:
-- SELECT * FROM user_profile; -- Deve retornar usuários da empresa

-- =====================================================
-- NOTAS
-- =====================================================
-- 
-- 1. A policy de SELECT agora usa OR para permitir ver:
--    - Próprio perfil (auth_user_id = auth.uid())
--    - Perfis da mesma empresa (company_id = get_user_company_id())
--
-- 2. Adicionados campos que a interface espera:
--    - email, full_name, role, is_active, last_sign_in_at
--
-- 3. Criado trigger para sincronizar email automaticamente
--    do auth.users para user_profile
--
-- 4. A função usa SECURITY DEFINER para poder acessar auth.users
--
-- =====================================================

