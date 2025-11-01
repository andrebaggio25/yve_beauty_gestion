-- =====================================================
-- Migration 17: Update Branch Table Fields
-- =====================================================
-- Objetivo: Adicionar campos faltantes na tabela branch
-- para suportar código, endereço completo, telefone, email e identificação fiscal
-- =====================================================

-- 1. Adicionar campos de código e identificação
ALTER TABLE branch
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS is_headquarters boolean NOT NULL DEFAULT false;

-- 2. Adicionar campos de endereço
ALTER TABLE branch
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text;

-- 3. Renomear country_code para country se necessário (manter ambos por compatibilidade)
-- Se country_code já existe, vamos usar ele como país
-- Se não, adicionar country

-- 4. Adicionar campos de contato
ALTER TABLE branch
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS phone_country text DEFAULT 'BR',
ADD COLUMN IF NOT EXISTS email text;

-- 5. Adicionar campos de identificação fiscal
ALTER TABLE branch
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS tax_id_type text;

-- 6. Renomear active para is_active para consistência
ALTER TABLE branch
ADD COLUMN IF NOT EXISTS is_active boolean;

-- Se active existe e is_active não existe, migrar dados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='branch' AND column_name='active') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name='branch' AND column_name='is_active') THEN
    ALTER TABLE branch ADD COLUMN is_active boolean;
    UPDATE branch SET is_active = active;
  END IF;
END $$;

-- 7. Criar índice único para código por empresa
CREATE UNIQUE INDEX IF NOT EXISTS uq_branch_company_code 
ON branch(company_id, code) 
WHERE code IS NOT NULL;

-- 8. Adicionar comentários
COMMENT ON COLUMN branch.code IS 'Código único da filial dentro da empresa';
COMMENT ON COLUMN branch.is_headquarters IS 'Indica se esta é a matriz/sede da empresa';
COMMENT ON COLUMN branch.address_line1 IS 'Endereço linha 1 (rua, número)';
COMMENT ON COLUMN branch.address_line2 IS 'Endereço linha 2 (complemento)';
COMMENT ON COLUMN branch.city IS 'Cidade';
COMMENT ON COLUMN branch.state IS 'Estado/Província';
COMMENT ON COLUMN branch.postal_code IS 'CEP/Código Postal';
COMMENT ON COLUMN branch.phone IS 'Telefone no formato internacional (E.164)';
COMMENT ON COLUMN branch.phone_country IS 'Código do país do telefone (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN branch.email IS 'Email de contato da filial';
COMMENT ON COLUMN branch.tax_id IS 'Identificação fiscal (CNPJ, EIN, VAT, etc)';
COMMENT ON COLUMN branch.tax_id_type IS 'Tipo de identificação fiscal (CNPJ, EIN, VAT, NIF, OTHER)';
COMMENT ON COLUMN branch.is_active IS 'Indica se a filial está ativa';

-- =====================================================
-- Verificação:
-- =====================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'branch'
-- ORDER BY ordinal_position;
-- =====================================================

