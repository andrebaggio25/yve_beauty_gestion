-- =====================================================
-- Migration 13: Fix RLS Policies to Use user_profile
-- =====================================================
-- Problema: jwt_company_id() retorna NULL porque o JWT não tem company_id
-- Solução: Criar função que busca company_id do user_profile
-- =====================================================

-- 1. Criar função para obter company_id do usuário logado via user_profile
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id 
  FROM user_profile 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_user_company_id() IS 'Retorna o company_id do usuário logado através do user_profile';

-- 2. Criar função para obter branch_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT branch_id 
  FROM user_profile 
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_user_branch_id() IS 'Retorna o branch_id do usuário logado através do user_profile';

-- 3. Manter jwt_company_id() como fallback (caso seja configurado no futuro)
-- Mas criar uma função que tenta JWT primeiro, depois user_profile
CREATE OR REPLACE FUNCTION current_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    nullif((auth.jwt() ->> 'company_id'),'')::uuid,
    (SELECT company_id FROM user_profile WHERE auth_user_id = auth.uid() LIMIT 1)
  );
$$;

COMMENT ON FUNCTION current_user_company_id() IS 'Retorna company_id do JWT ou user_profile (prioriza JWT se existir)';

-- =====================================================
-- 4. RECRIAR POLICIES PARA PAYMENT_METHOD
-- =====================================================

DROP POLICY IF EXISTS all_payment_method ON payment_method;

CREATE POLICY select_payment_method ON payment_method
FOR SELECT
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = payment_method.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

CREATE POLICY insert_payment_method ON payment_method
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = payment_method.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

CREATE POLICY update_payment_method ON payment_method
FOR UPDATE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = payment_method.branch_id 
    AND b.company_id = get_user_company_id()
  )
)
WITH CHECK (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = payment_method.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

CREATE POLICY delete_payment_method ON payment_method
FOR DELETE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = payment_method.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

-- =====================================================
-- 5. RECRIAR POLICIES PARA CHART_OF_ACCOUNTS
-- =====================================================

DROP POLICY IF EXISTS all_coa ON chart_of_accounts;

CREATE POLICY select_coa ON chart_of_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = chart_of_accounts.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

CREATE POLICY insert_coa ON chart_of_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = chart_of_accounts.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

CREATE POLICY update_coa ON chart_of_accounts
FOR UPDATE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = chart_of_accounts.branch_id 
    AND b.company_id = get_user_company_id()
  )
)
WITH CHECK (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = chart_of_accounts.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

CREATE POLICY delete_coa ON chart_of_accounts
FOR DELETE
TO authenticated
USING (
  EXISTS(
    SELECT 1 FROM branch b 
    WHERE b.id = chart_of_accounts.branch_id 
    AND b.company_id = get_user_company_id()
  )
);

-- =====================================================
-- 6. RECRIAR POLICIES PARA BRANCH
-- =====================================================

DROP POLICY IF EXISTS all_branch ON branch;

CREATE POLICY select_branch ON branch
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

CREATE POLICY insert_branch ON branch
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY update_branch ON branch
FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY delete_branch ON branch
FOR DELETE
TO authenticated
USING (company_id = get_user_company_id());

-- =====================================================
-- 7. RECRIAR POLICIES PARA COMPANY
-- =====================================================

DROP POLICY IF EXISTS sel_company ON company;
DROP POLICY IF EXISTS upd_company ON company;
DROP POLICY IF EXISTS select_company ON company;
DROP POLICY IF EXISTS update_company ON company;

CREATE POLICY select_company ON company
FOR SELECT
TO authenticated
USING (id = get_user_company_id());

CREATE POLICY update_company ON company
FOR UPDATE
TO authenticated
USING (id = get_user_company_id())
WITH CHECK (id = get_user_company_id());

-- =====================================================
-- 8. RECRIAR POLICIES PARA USER_PROFILE
-- =====================================================

-- Remover todas as policies existentes
DROP POLICY IF EXISTS all_user_profile ON user_profile;
DROP POLICY IF EXISTS select_own_profile ON user_profile;
DROP POLICY IF EXISTS select_company_profiles ON user_profile;
DROP POLICY IF EXISTS insert_user_profile ON user_profile;
DROP POLICY IF EXISTS update_user_profile ON user_profile;
DROP POLICY IF EXISTS delete_user_profile ON user_profile;

-- Permitir que usuários vejam seu próprio perfil
CREATE POLICY select_own_profile ON user_profile
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Permitir que usuários da mesma empresa vejam outros perfis
CREATE POLICY select_company_profiles ON user_profile
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

CREATE POLICY insert_user_profile ON user_profile
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY update_user_profile ON user_profile
FOR UPDATE
TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY delete_user_profile ON user_profile
FOR DELETE
TO authenticated
USING (company_id = get_user_company_id());

-- =====================================================
-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY select_payment_method ON payment_method IS 'Permite SELECT de métodos de pagamento da mesma empresa';
COMMENT ON POLICY insert_payment_method ON payment_method IS 'Permite INSERT de métodos de pagamento na mesma empresa';
COMMENT ON POLICY update_payment_method ON payment_method IS 'Permite UPDATE de métodos de pagamento da mesma empresa';
COMMENT ON POLICY delete_payment_method ON payment_method IS 'Permite DELETE de métodos de pagamento da mesma empresa';

COMMENT ON POLICY select_coa ON chart_of_accounts IS 'Permite SELECT de contas contábeis da mesma empresa';
COMMENT ON POLICY insert_coa ON chart_of_accounts IS 'Permite INSERT de contas contábeis na mesma empresa';
COMMENT ON POLICY update_coa ON chart_of_accounts IS 'Permite UPDATE de contas contábeis da mesma empresa';
COMMENT ON POLICY delete_coa ON chart_of_accounts IS 'Permite DELETE de contas contábeis da mesma empresa';

COMMENT ON POLICY select_branch ON branch IS 'Permite SELECT de filiais da mesma empresa';
COMMENT ON POLICY insert_branch ON branch IS 'Permite INSERT de filiais na mesma empresa';
COMMENT ON POLICY update_branch ON branch IS 'Permite UPDATE de filiais da mesma empresa';
COMMENT ON POLICY delete_branch ON branch IS 'Permite DELETE de filiais da mesma empresa';

COMMENT ON POLICY select_company ON company IS 'Permite SELECT apenas da própria empresa';
COMMENT ON POLICY update_company ON company IS 'Permite UPDATE apenas da própria empresa';

COMMENT ON POLICY select_own_profile ON user_profile IS 'Permite usuário ver seu próprio perfil';
COMMENT ON POLICY select_company_profiles ON user_profile IS 'Permite ver perfis de usuários da mesma empresa';

-- =====================================================
-- 10. VERIFICAÇÃO
-- =====================================================

-- Para testar, execute estas queries como usuário autenticado:

-- SELECT get_user_company_id(); -- Deve retornar o company_id do usuário
-- SELECT get_user_branch_id(); -- Deve retornar o branch_id do usuário
-- SELECT * FROM payment_method; -- Deve retornar os métodos da empresa
-- SELECT * FROM chart_of_accounts; -- Deve retornar as contas da empresa
-- SELECT * FROM branch; -- Deve retornar as filiais da empresa
-- SELECT * FROM company; -- Deve retornar apenas a empresa do usuário

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. SECURITY DEFINER: As funções usam SECURITY DEFINER para poder
--    acessar user_profile mesmo que o usuário não tenha permissão direta
--    (necessário para evitar deadlock de RLS)
--
-- 2. STABLE: Marca as funções como STABLE para permitir otimização
--    pelo PostgreSQL (o resultado não muda durante uma transação)
--
-- 3. Por que não usar JWT: O Supabase não adiciona company_id ao JWT
--    automaticamente. Seria necessário configurar um webhook ou
--    usar custom claims, o que é mais complexo.
--
-- 4. Performance: As funções fazem uma query adicional, mas são
--    otimizadas pelo PostgreSQL e o resultado é cacheado durante
--    a transação.
--
-- =====================================================


