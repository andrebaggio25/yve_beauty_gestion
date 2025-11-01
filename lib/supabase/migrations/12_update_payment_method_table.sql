-- =====================================================
-- Migration 12: Update Payment Method Table Structure
-- =====================================================
-- Objetivo: Atualizar a estrutura da tabela payment_method
-- para incluir campos name, type, is_active, requires_approval
-- e default_account_id conforme esperado pela aplicação
-- =====================================================

-- 1. Criar tipo enum para tipos de método de pagamento
DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM (
    'bank_transfer',
    'credit_card',
    'debit_card',
    'cash',
    'pix',
    'boleto',
    'check',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar novas colunas à tabela payment_method
ALTER TABLE payment_method 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type payment_method_type,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_account_id UUID REFERENCES bank_account(id) ON DELETE SET NULL;

-- 3. Migrar dados existentes
-- Converter o campo 'code' para 'name' e 'active' para 'is_active'
UPDATE payment_method 
SET 
  name = CASE 
    WHEN code = 'wire' THEN 'Transferência Bancária'
    WHEN code = 'stripe' THEN 'Cartão de Crédito (Stripe)'
    WHEN code = 'pix' THEN 'PIX'
    WHEN code = 'cash' THEN 'Dinheiro'
    WHEN code = 'boleto' THEN 'Boleto'
    WHEN code = 'check' THEN 'Cheque'
    ELSE INITCAP(code)
  END,
  type = CASE 
    WHEN code = 'wire' THEN 'bank_transfer'::payment_method_type
    WHEN code = 'stripe' THEN 'credit_card'::payment_method_type
    WHEN code = 'pix' THEN 'pix'::payment_method_type
    WHEN code = 'cash' THEN 'cash'::payment_method_type
    WHEN code = 'boleto' THEN 'boleto'::payment_method_type
    WHEN code = 'check' THEN 'check'::payment_method_type
    ELSE 'other'::payment_method_type
  END,
  is_active = active,
  requires_approval = false
WHERE name IS NULL;

-- 4. Tornar as novas colunas obrigatórias (após migração dos dados)
ALTER TABLE payment_method 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL;

-- 5. Remover o índice único antigo baseado em code
DROP INDEX IF EXISTS uq_payment_method;

-- 6. Criar novo índice único baseado em name e branch_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_method_name 
  ON payment_method(branch_id, name);

-- 7. Criar índice para busca por tipo
CREATE INDEX IF NOT EXISTS idx_payment_method_type 
  ON payment_method(type);

-- 8. Criar índice para busca por status ativo
CREATE INDEX IF NOT EXISTS idx_payment_method_active 
  ON payment_method(is_active);

-- 9. Adicionar comentários para documentação
COMMENT ON TABLE payment_method IS 'Métodos de pagamento disponíveis para a empresa';
COMMENT ON COLUMN payment_method.name IS 'Nome descritivo do método de pagamento';
COMMENT ON COLUMN payment_method.type IS 'Tipo do método de pagamento';
COMMENT ON COLUMN payment_method.is_active IS 'Indica se o método está ativo e disponível para uso';
COMMENT ON COLUMN payment_method.requires_approval IS 'Indica se pagamentos com este método requerem aprovação';
COMMENT ON COLUMN payment_method.default_account_id IS 'Conta bancária padrão associada a este método';
COMMENT ON COLUMN payment_method.code IS 'Código legado do método (mantido para compatibilidade)';
COMMENT ON COLUMN payment_method.active IS 'Campo legado (usar is_active)';

-- 10. Opcional: Manter code e active por compatibilidade, mas deprecados
-- Você pode removê-los no futuro se não forem mais necessários
-- ALTER TABLE payment_method DROP COLUMN IF EXISTS code;
-- ALTER TABLE payment_method DROP COLUMN IF EXISTS active;

-- =====================================================
-- Verificação da estrutura final
-- =====================================================
-- A tabela payment_method agora tem:
-- - id (uuid, PK)
-- - branch_id (uuid, FK)
-- - name (text, NOT NULL)
-- - type (payment_method_type, NOT NULL)
-- - is_active (boolean, NOT NULL, default true)
-- - requires_approval (boolean, NOT NULL, default false)
-- - default_account_id (uuid, FK nullable)
-- - code (text, legado)
-- - active (boolean, legado)
-- - metadata (jsonb)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)
-- =====================================================

